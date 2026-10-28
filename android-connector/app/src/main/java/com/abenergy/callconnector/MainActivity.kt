package com.abenergy.callconnector

import android.Manifest
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class MainActivity : AppCompatActivity() {

    private lateinit var prefs: SharedPreferences
    private lateinit var tvStatus: TextView
    private lateinit var tvStatusDesc: TextView
    private lateinit var etServerUrl: EditText
    private lateinit var etEmployeePhone: EditText
    private lateinit var btnToggleTracking: Button
    private lateinit var btnTestCall: Button

    private val PERMISSION_REQUEST_CODE = 1001

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = getSharedPreferences("ab_energy_prefs", Context.MODE_PRIVATE)

        tvStatus = findViewById(R.id.tvStatus)
        tvStatusDesc = findViewById(R.id.tvStatusDesc)
        etServerUrl = findViewById(R.id.etServerUrl)
        etEmployeePhone = findViewById(R.id.etEmployeePhone)
        btnToggleTracking = findViewById(R.id.btnToggleTracking)
        btnTestCall = findViewById(R.id.btnTestCall)

        // Load saved preferences
        val savedUrl = prefs.getString("server_url", "http://192.168.1.36:3000")
        val savedPhone = prefs.getString("employee_phone", "+919655247872")
        val isTracking = prefs.getBoolean("tracking_enabled", false)

        etServerUrl.setText(savedUrl)
        etEmployeePhone.setText(savedPhone)

        updateUiState(isTracking)

        // If tracking was previously enabled, ensure foreground service is running
        if (isTracking && checkPermissionsSilent()) {
            CallMonitorService.start(this)
        }

        btnToggleTracking.setOnClickListener {
            val phone = etEmployeePhone.text.toString().trim()
            val url = etServerUrl.text.toString().trim()

            if (phone.isEmpty()) {
                Toast.makeText(this, "Please enter your registered phone number", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (!checkAndRequestPermissions()) {
                return@setOnClickListener
            }

            val currentTracking = prefs.getBoolean("tracking_enabled", false)
            val newTracking = !currentTracking

            prefs.edit().apply {
                putString("server_url", url)
                putString("employee_phone", phone)
                putBoolean("tracking_enabled", newTracking)
                apply()
            }

            if (newTracking) {
                CallMonitorService.start(this)
                // Also trigger immediate sync of last calls
                CoroutineScope(Dispatchers.IO).launch {
                    CallMonitorService.syncRecentCalls(this@MainActivity, limit = 5)
                }
            } else {
                CallMonitorService.stop(this)
            }

            updateUiState(newTracking)
            val msg = if (newTracking) "Call tracking activated & service started!" else "Call tracking deactivated"
            Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
        }

        btnTestCall.setOnClickListener {
            val phone = etEmployeePhone.text.toString().trim()
            val url = etServerUrl.text.toString().trim()

            if (phone.isEmpty() || url.isEmpty()) {
                Toast.makeText(this, "Please enter phone and server URL first", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Save settings first
            prefs.edit().apply {
                putString("server_url", url)
                putString("employee_phone", phone)
                apply()
            }

            if (!checkAndRequestPermissions()) {
                Toast.makeText(this, "Call Log permission required to sync real calls.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnTestCall.isEnabled = false
            btnTestCall.text = "Syncing Real Calls..."

            CallMonitorService.syncRecentCalls(this@MainActivity, limit = 5, forceResync = true) { count ->
                runOnUiThread {
                    btnTestCall.isEnabled = true
                    btnTestCall.text = "Send Test Ping / Sync Now"
                    if (count > 0) {
                        Toast.makeText(
                            this@MainActivity,
                            "Success! Synced $count real call records to CRM!",
                            Toast.LENGTH_LONG
                        ).show()
                    } else {
                        // If no real calls were found in call log, send a test ping to verify connection
                        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
                        sdf.timeZone = TimeZone.getTimeZone("UTC")

                        CrmApiClient.syncCall(
                            this@MainActivity,
                            url,
                            phone,
                            "+919845012345",
                            "OUTGOING",
                            60,
                            sdf.format(Date())
                        ) { success, result ->
                            runOnUiThread {
                                if (success) {
                                    Toast.makeText(this@MainActivity, "Connection verified! Test ping synced to CRM.", Toast.LENGTH_LONG).show()
                                } else {
                                    Toast.makeText(this@MainActivity, "Sync failed: $result", Toast.LENGTH_LONG).show()
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun updateUiState(isTracking: Boolean) {
        if (isTracking) {
            tvStatus.text = "Active & Syncing Calls"
            tvStatus.setTextColor(Color.parseColor("#10B981"))
            tvStatusDesc.text = "Automatic foreground service is monitoring calls made with this SIM card."
            btnToggleTracking.text = "Deactivate Call Tracking"
            btnToggleTracking.setBackgroundColor(Color.parseColor("#DC2626"))
        } else {
            tvStatus.text = "Inactive • Tap to Activate"
            tvStatus.setTextColor(Color.parseColor("#F59E0B"))
            tvStatusDesc.text = "Tap activate to start syncing outgoing, incoming, and missed calls."
            btnToggleTracking.text = "Activate SIM Call Tracking"
            btnToggleTracking.setBackgroundColor(Color.parseColor("#059669"))
        }
    }

    private fun checkPermissionsSilent(): Boolean {
        val permissions = mutableListOf(
            Manifest.permission.READ_CALL_LOG,
            Manifest.permission.READ_PHONE_STATE
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        return permissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun checkAndRequestPermissions(): Boolean {
        val permissions = mutableListOf(
            Manifest.permission.READ_CALL_LOG,
            Manifest.permission.READ_PHONE_STATE
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), PERMISSION_REQUEST_CODE)
            return false
        }
        return true
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            val allGranted = grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            if (allGranted) {
                Toast.makeText(this, "Permissions granted! You can now activate tracking.", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Call Log permission is required to track calls.", Toast.LENGTH_LONG).show()
            }
        }
    }
}
