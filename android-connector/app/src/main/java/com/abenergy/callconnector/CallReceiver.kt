package com.abenergy.callconnector

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class CallReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "CallReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val prefs = context.getSharedPreferences("ab_energy_prefs", Context.MODE_PRIVATE)
        val isTrackingEnabled = prefs.getBoolean("tracking_enabled", false)

        if (!isTrackingEnabled) {
            Log.d(TAG, "Tracking disabled in preferences; skipping broadcast")
            return
        }

        if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val stateStr = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            Log.d(TAG, "ACTION_PHONE_STATE_CHANGED: state=$stateStr")

            // When call ends or goes idle, sync the call
            if (stateStr == TelephonyManager.EXTRA_STATE_IDLE) {
                Log.d(TAG, "Call ended (IDLE). Triggering sync via goAsync...")

                val pendingResult = goAsync()
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        // Wait 2.5 seconds for Telephony provider / CallLog to finalize duration & write record
                        delay(2500)
                        CallMonitorService.syncRecentCalls(context, limit = 3)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error in async call sync", e)
                    } finally {
                        pendingResult.finish()
                    }
                }
            }
        }
    }
}
