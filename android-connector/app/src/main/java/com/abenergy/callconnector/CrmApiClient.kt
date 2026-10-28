package com.abenergy.callconnector

import android.content.Context
import android.util.Log
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object CrmApiClient {
    private const val TAG = "CrmApiClient"

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    fun syncCall(
        context: Context,
        serverUrl: String,
        employeePhone: String,
        customerPhone: String,
        callType: String,
        durationSeconds: Long,
        callTimeIso: String,
        callback: (Boolean, String) -> Unit
    ) {
        val fullUrl = if (serverUrl.endsWith("/")) "${serverUrl}api/telephony/sync-call" else "$serverUrl/api/telephony/sync-call"

        try {
            val json = JSONObject().apply {
                put("employee_phone", employeePhone)
                put("customer_phone", customerPhone)
                put("call_type", callType)
                put("call_status", if (callType == "MISSED") "MISSED" else "ANSWERED")
                put("duration_seconds", durationSeconds)
                put("call_time", callTimeIso)
                put("notes", "Auto-synced from AB Energy Android Connector")
            }

            val mediaType = "application/json; charset=utf-8".toMediaType()
            val requestBody = json.toString().toRequestBody(mediaType)

            val request = Request.Builder()
                .url(fullUrl)
                .post(requestBody)
                .build()

            client.newCall(request).enqueue(object : okhttp3.Callback {
                override fun onFailure(call: okhttp3.Call, e: java.io.IOException) {
                    Log.e(TAG, "Failed to sync call: ${e.message}")
                    callback(false, e.message ?: "Network error")
                }

                override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) {
                    val responseBody = response.body?.string() ?: ""
                    if (response.isSuccessful) {
                        Log.i(TAG, "Call synced successfully: $responseBody")
                        callback(true, responseBody)
                    } else {
                        Log.e(TAG, "Server error (${response.code}): $responseBody")
                        callback(false, "Server returned ${response.code}")
                    }
                }
            })
        } catch (ex: Exception) {
            Log.e(TAG, "Exception during call sync", ex)
            callback(false, ex.localizedMessage ?: "Unknown error")
        }
    }

    fun syncCallBlocking(
        serverUrl: String,
        employeePhone: String,
        customerPhone: String,
        callType: String,
        durationSeconds: Long,
        callTimeIso: String
    ): Pair<Boolean, String> {
        val fullUrl = if (serverUrl.endsWith("/")) "${serverUrl}api/telephony/sync-call" else "$serverUrl/api/telephony/sync-call"
        return try {
            val json = JSONObject().apply {
                put("employee_phone", employeePhone)
                put("customer_phone", customerPhone)
                put("call_type", callType)
                put("call_status", if (callType == "MISSED") "MISSED" else "ANSWERED")
                put("duration_seconds", durationSeconds)
                put("call_time", callTimeIso)
                put("notes", "Auto-synced from AB Energy Android Connector")
            }

            val mediaType = "application/json; charset=utf-8".toMediaType()
            val requestBody = json.toString().toRequestBody(mediaType)

            val request = Request.Builder()
                .url(fullUrl)
                .post(requestBody)
                .build()

            client.newCall(request).execute().use { response ->
                val body = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    Pair(true, body)
                } else {
                    Pair(false, "Server error (${response.code}): $body")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during blocking call sync", e)
            Pair(false, e.localizedMessage ?: "Unknown error")
        }
    }
}
