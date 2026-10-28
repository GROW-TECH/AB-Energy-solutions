package com.abenergy.callconnector

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.database.ContentObserver
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.CallLog
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class CallMonitorService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private var callLogObserver: ContentObserver? = null
    private var lastSyncTimestamp: Long = 0

    companion object {
        private const val TAG = "CallMonitorService"
        private const val CHANNEL_ID = "ab_call_monitor_channel"
        private const val NOTIFICATION_ID = 2001

        fun start(context: Context) = startService(context)
        fun stop(context: Context) = stopService(context)

        fun startService(context: Context) {
            val intent = Intent(context, CallMonitorService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.startForegroundService(context, intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, CallMonitorService::class.java)
            context.stopService(intent)
        }

        fun syncRecentCalls(
            context: Context,
            limit: Int = 5,
            forceResync: Boolean = false,
            onComplete: ((Int) -> Unit)? = null
        ) {
            val prefs = context.getSharedPreferences("ab_energy_prefs", Context.MODE_PRIVATE)
            val serverUrl = prefs.getString("server_url", "") ?: ""
            val employeePhone = prefs.getString("employee_phone", "") ?: ""

            if (serverUrl.isEmpty() || employeePhone.isEmpty()) {
                Log.w(TAG, "Cannot sync: serverUrl or employeePhone missing")
                onComplete?.invoke(0)
                return
            }

            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.READ_CALL_LOG)
                != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "READ_CALL_LOG permission not granted")
                onComplete?.invoke(0)
                return
            }

            CoroutineScope(Dispatchers.IO).launch {
                var syncedCount = 0
                var cursor: Cursor? = null
                try {
                    cursor = context.contentResolver.query(
                        CallLog.Calls.CONTENT_URI,
                        arrayOf(
                            CallLog.Calls._ID,
                            CallLog.Calls.NUMBER,
                            CallLog.Calls.TYPE,
                            CallLog.Calls.DATE,
                            CallLog.Calls.DURATION
                        ),
                        null,
                        null,
                        "${CallLog.Calls.DATE} DESC"
                    )

                    val syncedCallIds = prefs.getStringSet("synced_call_ids", mutableSetOf()) ?: mutableSetOf()
                    val newSyncedIds = HashSet(syncedCallIds)

                    var processed = 0
                    if (cursor != null && cursor.moveToFirst()) {
                        do {
                            val id = cursor.getString(cursor.getColumnIndexOrThrow(CallLog.Calls._ID))
                            val number = cursor.getString(cursor.getColumnIndexOrThrow(CallLog.Calls.NUMBER))
                            val type = cursor.getInt(cursor.getColumnIndexOrThrow(CallLog.Calls.TYPE))
                            val dateMillis = cursor.getLong(cursor.getColumnIndexOrThrow(CallLog.Calls.DATE))
                            val duration = cursor.getLong(cursor.getColumnIndexOrThrow(CallLog.Calls.DURATION))

                            // Avoid duplicate syncs unless forceResync is true
                            if (forceResync || !newSyncedIds.contains(id)) {
                                val callTypeStr = when (type) {
                                    CallLog.Calls.INCOMING_TYPE -> "INCOMING"
                                    CallLog.Calls.OUTGOING_TYPE -> "OUTGOING"
                                    CallLog.Calls.MISSED_TYPE -> "MISSED"
                                    CallLog.Calls.REJECTED_TYPE -> "REJECTED"
                                    else -> "OUTGOING"
                                }

                                val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
                                sdf.timeZone = TimeZone.getTimeZone("UTC")
                                val callTimeIso = sdf.format(Date(dateMillis))

                                Log.i(TAG, "Syncing Call ID=$id, Phone=$number, Type=$callTypeStr, Duration=$duration")

                                val (success, msg) = CrmApiClient.syncCallBlocking(
                                    serverUrl,
                                    employeePhone,
                                    number,
                                    callTypeStr,
                                    duration,
                                    callTimeIso
                                )

                                Log.d(TAG, "Result for call $id: success=$success ($msg)")

                                if (success) {
                                    newSyncedIds.add(id)
                                    syncedCount++
                                }
                            }

                            processed++
                        } while (cursor.moveToNext() && processed < limit)
                    }

                    // Keep set pruned to last 100 IDs
                    val prunedSet = if (newSyncedIds.size > 100) {
                        newSyncedIds.toList().takeLast(100).toSet()
                    } else {
                        newSyncedIds
                    }
                    prefs.edit().putStringSet("synced_call_ids", prunedSet).apply()

                } catch (e: Exception) {
                    Log.e(TAG, "Error in syncRecentCalls", e)
                } finally {
                    cursor?.close()
                    onComplete?.invoke(syncedCount)
                }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startAsForeground()
        registerCallLogObserver()
        Log.i(TAG, "CallMonitorService started")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterCallLogObserver()
        Log.i(TAG, "CallMonitorService stopped")
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun registerCallLogObserver() {
        if (callLogObserver == null) {
            callLogObserver = object : ContentObserver(Handler(Looper.getMainLooper())) {
                override fun onChange(selfChange: Boolean, uri: Uri?) {
                    super.onChange(selfChange, uri)
                    val now = System.currentTimeMillis()
                    // Debounce rapid changes
                    if (now - lastSyncTimestamp > 1500) {
                        lastSyncTimestamp = now
                        Log.d(TAG, "CallLog content changed! Triggering sync...")
                        serviceScope.launch {
                            delay(1200) // Small wait for telephony provider to finalize duration
                            syncRecentCalls(applicationContext, limit = 3)
                        }
                    }
                }
            }
            try {
                contentResolver.registerContentObserver(
                    CallLog.Calls.CONTENT_URI,
                    true,
                    callLogObserver!!
                )
                Log.d(TAG, "CallLog ContentObserver registered successfully")
            } catch (e: SecurityException) {
                Log.e(TAG, "SecurityException registering CallLog ContentObserver", e)
            }
        }
    }

    private fun unregisterCallLogObserver() {
        callLogObserver?.let {
            contentResolver.unregisterContentObserver(it)
            callLogObserver = null
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "AB Energy Call Tracking Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors employee outgoing and incoming calls to sync with CRM"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun startAsForeground() {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AB Energy Call Tracker")
            .setContentText("Actively monitoring SIM calls • Live CRM Sync")
            .setSmallIcon(android.R.drawable.stat_sys_phone_call)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
            } else {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
            }
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }
}
