/**
 * Telephony Bridge for In-App Native Calling & Sync
 * Handles direct dialer integration, duration calculation,
 * return-to-app disposition triggers, and backend synchronization.
 * Zero external apps required.
 */

import { getApiUrl } from './apiUrl';

export interface ActiveCallSession {
  leadId?: string;
  customerName: string;
  customerPhone: string;
  employeeId?: string;
  employeeName?: string;
  employeePhone?: string;
  startTime: number;
  initiatedViaApp: boolean;
}

export interface CallSyncPayload {
  employee_id?: string;
  employee_name?: string;
  employee_phone?: string;
  customer_phone: string;
  customer_name?: string;
  lead_id?: string;
  call_type: 'OUTGOING' | 'INCOMING' | 'MISSED';
  call_status?: 'ANSWERED' | 'BUSY' | 'MISSED' | 'FAILED';
  duration_seconds: number;
  call_time?: string;
  sim_slot?: number;
  disposition?: string;
  notes?: string;
}

export interface LocalCallRecord {
  id: string;
  timestamp: number;
  customerName: string;
  customerPhone: string;
  durationSeconds: number;
  disposition: string;
  notes: string;
  employeeName: string;
}

const STORAGE_ACTIVE_CALL = 'crm_active_call_session';
const STORAGE_TRACKING_ENABLED = 'crm_call_tracking_enabled';
const STORAGE_ONBOARDING_DONE = 'crm_telephony_onboarding_done';
const STORAGE_LOCAL_LOGS = 'crm_local_call_history';

/**
 * Check if in-app call tracking is active for the current user
 */
export function isCallTrackingEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_TRACKING_ENABLED);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Toggle call tracking preference
 */
export function setCallTrackingEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_TRACKING_ENABLED, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('call-tracking-toggled', { detail: { enabled } }));
  } catch (err) {
    console.error('Failed to update call tracking state', err);
  }
}

/**
 * Check if the first-time onboarding prompt has already been completed
 */
export function isTelephonyOnboardingDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_ONBOARDING_DONE) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark onboarding prompt as completed
 */
export function setTelephonyOnboardingDone(done: boolean = true): void {
  try {
    localStorage.setItem(STORAGE_ONBOARDING_DONE, done ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to set onboarding state', err);
  }
}

/**
 * Retrieve any active in-flight call session
 */
export function getActiveCallSession(): ActiveCallSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_ACTIVE_CALL) || localStorage.getItem(STORAGE_ACTIVE_CALL);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clear the current active call session
 */
export function clearActiveCallSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_ACTIVE_CALL);
    localStorage.removeItem(STORAGE_ACTIVE_CALL);
  } catch (err) {
    console.error('Failed to clear call session', err);
  }
}

/**
 * Sanitize phone number to standard dialable string
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Keep leading + for country code, strip other spaces and symbols
  const hasPlus = phone.trim().startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Initiate an Outgoing Call from Lead / Contact
 * Automatically opens the native phone dialer and registers session for auto-disposition on app resume.
 */
export function initiateLeadCall(params: {
  leadId?: string;
  customerName: string;
  customerPhone: string;
  employeeId?: string;
  employeeName?: string;
  employeePhone?: string;
}): void {
  const cleanPhone = sanitizePhoneNumber(params.customerPhone);
  if (!cleanPhone) {
    alert('Invalid phone number provided for call.');
    return;
  }

  const session: ActiveCallSession = {
    leadId: params.leadId,
    customerName: params.customerName || 'Lead Contact',
    customerPhone: cleanPhone,
    employeeId: params.employeeId,
    employeeName: params.employeeName,
    employeePhone: params.employeePhone,
    startTime: Date.now(),
    initiatedViaApp: true,
  };

  try {
    const serialized = JSON.stringify(session);
    sessionStorage.setItem(STORAGE_ACTIVE_CALL, serialized);
    localStorage.setItem(STORAGE_ACTIVE_CALL, serialized);
  } catch (e) {
    console.error('Failed to store call session:', e);
  }

  // Check if running inside Android APK with injected JavaScriptInterface
  const androidBridge = (window as any).AndroidCallTracker;
  if (androidBridge && typeof androidBridge.dialNumber === 'function') {
    try {
      androidBridge.dialNumber(cleanPhone, params.customerName || '');
      return;
    } catch (err) {
      console.warn('Android bridge dialNumber failed, falling back to tel: URI', err);
    }
  }

  // Standard web dialer trigger (works across mobile browsers, WebView, Capacitor, Cordova)
  window.location.href = `tel:${encodeURIComponent(cleanPhone)}`;
}

/**
 * Send call log data to the backend API (/api/telephony/sync-call)
 */
export async function syncCallLogToBackend(payload: CallSyncPayload): Promise<{
  success: boolean;
  call_id?: string;
  message?: string;
  error?: string;
}> {
  try {
    const token = localStorage.getItem('ab_solar_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl('/api/telephony/sync-call'), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Store in local history cache for instant metrics
      recordLocalCallHistory({
        id: data.call_id || `CALL-${Date.now()}`,
        timestamp: Date.now(),
        customerName: payload.customer_name || 'Customer',
        customerPhone: payload.customer_phone,
        durationSeconds: payload.duration_seconds || 0,
        disposition: payload.disposition || 'Completed',
        notes: payload.notes || '',
        employeeName: payload.employee_name || 'Sales Staff',
      });
      return { success: true, call_id: data.call_id, message: data.message };
    } else {
      return { success: false, error: data.message || 'Sync failed' };
    }
  } catch (err: any) {
    console.error('Failed to sync call log:', err);
    return { success: false, error: err.message || 'Network error syncing call log' };
  }
}

/**
 * Record completed call into local history for instantaneous dashboard metrics
 */
function recordLocalCallHistory(record: LocalCallRecord): void {
  try {
    const existingRaw = localStorage.getItem(STORAGE_LOCAL_LOGS);
    const list: LocalCallRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
    list.unshift(record);
    // Keep last 100 calls in local cache
    localStorage.setItem(STORAGE_LOCAL_LOGS, JSON.stringify(list.slice(0, 100)));
    window.dispatchEvent(new CustomEvent('call-history-updated'));
  } catch (err) {
    console.error('Failed to cache local call record', err);
  }
}

/**
 * Retrieve today's telephony statistics for current employee
 */
export function getTodayTelephonyStats(): {
  totalCalls: number;
  totalDurationSeconds: number;
  completedDispositions: number;
  recentCalls: LocalCallRecord[];
} {
  try {
    const existingRaw = localStorage.getItem(STORAGE_LOCAL_LOGS);
    const list: LocalCallRecord[] = existingRaw ? JSON.parse(existingRaw) : [];

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startTimestamp = startOfDay.getTime();

    const todayCalls = list.filter(c => c.timestamp >= startTimestamp);
    const totalDurationSeconds = todayCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
    const completedDispositions = todayCalls.filter(c => Boolean(c.disposition)).length;

    return {
      totalCalls: todayCalls.length,
      totalDurationSeconds,
      completedDispositions,
      recentCalls: todayCalls.slice(0, 5),
    };
  } catch {
    return {
      totalCalls: 0,
      totalDurationSeconds: 0,
      completedDispositions: 0,
      recentCalls: [],
    };
  }
}

/**
 * Format duration in seconds to standard readable string (e.g., "2m 45s" or "32s")
 */
export function formatCallDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

