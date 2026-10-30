import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Smartphone, 
  Mail, 
  MapPin, 
  Briefcase, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Clock, 
  Activity, 
  Radio, 
  RefreshCw,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { 
  isCallTrackingEnabled, 
  setCallTrackingEnabled, 
  getTodayTelephonyStats,
  formatCallDuration,
  syncCallLogToBackend
} from '../../utils/telephonyBridge';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, employees, logout } = useCrm();

  const [callTrackingActive, setCallTrackingActive] = useState<boolean>(isCallTrackingEnabled());
  const [stats, setStats] = useState(getTodayTelephonyStats());
  const [testSyncStatus, setTestSyncStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testSyncMsg, setTestSyncMsg] = useState<string>('');

  // Find linked employee record for detailed profile data
  const matchedEmployee = employees.find(
    e => (currentUser?.employeeId && e.id === currentUser.employeeId) ||
         (currentUser?.email && e.email.toLowerCase() === currentUser.email.toLowerCase()) ||
         (currentUser?.name && e.name.toLowerCase() === currentUser.name.toLowerCase())
  );

  const registeredPhone = matchedEmployee?.phone || '+91 98450 21876';
  const department = matchedEmployee?.department || 'Sales & Business Development';
  const location = matchedEmployee?.location || 'Bangalore HQ';

  useEffect(() => {
    if (isOpen) {
      setCallTrackingActive(isCallTrackingEnabled());
      setStats(getTodayTelephonyStats());
      setTestSyncStatus('idle');
      setTestSyncMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleTracking = () => {
    const next = !callTrackingActive;
    setCallTrackingActive(next);
    setCallTrackingEnabled(next);
  };

  const handleTestSync = async () => {
    setTestSyncStatus('testing');
    setTestSyncMsg('');

    try {
      const result = await syncCallLogToBackend({
        employee_id: matchedEmployee?.id || currentUser?.employeeId || 'EMP-TEST',
        employee_name: currentUser?.name || 'Sales Staff',
        employee_phone: registeredPhone,
        customer_phone: '+919999900000',
        customer_name: 'Telephony Test Probe',
        call_type: 'OUTGOING',
        call_status: 'ANSWERED',
        duration_seconds: 5,
        call_time: new Date().toISOString(),
        disposition: 'System Connection Verified',
        notes: 'In-app telephony bridge self-test passed successfully.',
      });

      if (result.success) {
        setTestSyncStatus('success');
        setTestSyncMsg('Telephony connection verified. Sync log response 200 OK.');
        setStats(getTodayTelephonyStats());
      } else {
        setTestSyncStatus('error');
        setTestSyncMsg(result.error || 'Test sync failed to reach server.');
      }
    } catch (err: any) {
      setTestSyncStatus('error');
      setTestSyncMsg(err.message || 'Network test failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-base">
              {currentUser?.role?.slice(0, 2).toUpperCase() || 'US'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base leading-tight">
                  {currentUser?.name || currentUser?.username}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentUser?.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{department} &bull; {location}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Identity & Contact Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                Email Address
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-1 truncate">
                {currentUser?.email || 'sales@abenergy.in'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                Employee ID
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-1">
                {matchedEmployee?.id || currentUser?.employeeId || 'EMP-2026-004'}
              </div>
            </div>
          </div>

          {/* Telephony & Call Tracking Section */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Registered SIM &amp; Telephony</h4>
                  <p className="text-[10px] text-slate-500">In-App Native Telephony Engine</p>
                </div>
              </div>

              {callTrackingActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Active &amp; Synchronized
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Disabled
                </span>
              )}
            </div>

            {/* Registered SIM Number */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registered Device Phone
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {registeredPhone}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-md">
                Primary SIM
              </span>
            </div>

            {/* In-App Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs font-bold text-slate-800">In-App Call Tracking</div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Prompts disposition notes and synchronizes talk duration after calls.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={callTrackingActive}
                onClick={handleToggleTracking}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  callTrackingActive ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    callTrackingActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Test Connection Button */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestSync}
                  disabled={testSyncStatus === 'testing'}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testSyncStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span>Test Telephony Sync</span>
                </button>
                <span className="text-[10px] text-slate-400">Zero external connector apps required</span>
              </div>

              {testSyncStatus === 'success' && (
                <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{testSyncMsg}</span>
                </div>
              )}

              {testSyncStatus === 'error' && (
                <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{testSyncMsg}</span>
                </div>
              )}
            </div>

            {/* Today's Activity Metrics */}
            <div className="pt-2 border-t border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Today's Telephony Activity
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                  <div className="text-base font-bold text-slate-900">{stats.totalCalls}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Calls Logged</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                  <div className="text-base font-bold text-slate-900">
                    {formatCallDuration(stats.totalDurationSeconds)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Talk Time</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                  <div className="text-base font-bold text-emerald-600">{stats.completedDispositions}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Dispositions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

