import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  User,
  Users,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  X,
  Play,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiUrl';
import { useCrm } from '../../context/CrmContext';

interface CallRecord {
  id: string;
  employee_id: string | null;
  employee_name: string;
  employee_phone: string;
  customer_phone: string;
  customer_name: string;
  lead_id: string | null;
  call_type: 'INCOMING' | 'OUTGOING' | 'MISSED' | 'REJECTED';
  call_status: 'ANSWERED' | 'MISSED' | 'NO_ANSWER' | 'BUSY' | 'FAILED';
  duration_seconds: number;
  call_time: string;
  sim_slot: number;
  disposition: string | null;
  notes: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
}

interface CallMetrics {
  total_calls_today: number;
  outgoing_count: number;
  incoming_count: number;
  missed_count: number;
  unresolved_missed_count: number;
  total_talk_time_seconds: number;
}

interface TeamMemberMetric {
  employee_id: string;
  employee_name: string;
  total_calls: number;
  outgoing_calls: number;
  pending_missed: number;
  talk_time_seconds: number;
}

export const CallTrackingView: React.FC = () => {
  const { currentUser } = useCrm();

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [metrics, setMetrics] = useState<CallMetrics>({
    total_calls_today: 0,
    outgoing_count: 0,
    incoming_count: 0,
    missed_count: 0,
    unresolved_missed_count: 0,
    total_talk_time_seconds: 0
  });
  const [teamBreakdown, setTeamBreakdown] = useState<TeamMemberMetric[]>([]);
  const [isManagerView, setIsManagerView] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'missed' | 'outgoing' | 'incoming' | 'team'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Reset to page 1 on filter/tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedEmployeeFilter]);

  // Disposition / Notes Modal
  const [selectedCallForNotes, setSelectedCallForNotes] = useState<CallRecord | null>(null);
  const [dispositionText, setDispositionText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Test Simulation Modal
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simPhone, setSimPhone] = useState('+919845012345');
  const [simName, setSimName] = useState('Vikrant Deshpande');
  const [simType, setSimType] = useState<'OUTGOING' | 'INCOMING' | 'MISSED'>('OUTGOING');
  const [simDuration, setSimDuration] = useState(140);

  // Floating Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // In-app Delete Confirmation Modal State
  const [callToDelete, setCallToDelete] = useState<CallRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const triggerNativeSync = () => {
    if (typeof (window as any).AndroidCallTracker?.syncNow === 'function') {
      try {
        (window as any).AndroidCallTracker.syncNow();
      } catch (e) {
        console.warn('Native sync failed', e);
      }
    }
  };

  const fetchCalls = async () => {
    try {
      triggerNativeSync();
      const token = localStorage.getItem('ab_solar_token') || localStorage.getItem('ab_energy_auth_token') || '';
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedEmployeeFilter) params.append('employee_id', selectedEmployeeFilter);

      if (activeTab === 'missed') {
        params.append('type', 'MISSED');
      } else if (activeTab === 'outgoing') {
        params.append('type', 'OUTGOING');
      } else if (activeTab === 'incoming') {
        params.append('type', 'INCOMING');
      }

      params.append('page', String(currentPage));
      params.append('limit', String(pageSize));

      const res = await fetch(getApiUrl(`/api/telephony/calls?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCalls(data.calls || []);
        setMetrics(data.metrics || {});
        setTeamBreakdown(data.team_breakdown || []);
        setIsManagerView(data.is_manager_view);
        if (data.pagination) {
          setTotalRecords(data.pagination.total || 0);
          setTotalPages(data.pagination.total_pages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to fetch call logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();

    const handleCallUpdate = () => {
      fetchCalls();
    };

    window.addEventListener('call-history-updated', handleCallUpdate);
    window.addEventListener('focus', handleCallUpdate);
    return () => {
      window.removeEventListener('call-history-updated', handleCallUpdate);
      window.removeEventListener('focus', handleCallUpdate);
    };
  }, [activeTab, searchQuery, selectedEmployeeFilter, currentPage, pageSize]);

  // Auto-refresh polling every 15s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchCalls, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, searchQuery, selectedEmployeeFilter, currentPage, pageSize]);

  const handleResolveMissedCall = async (callId: string) => {
    try {
      const token = localStorage.getItem('ab_solar_token') || localStorage.getItem('ab_energy_auth_token') || '';
      const res = await fetch(getApiUrl(`/api/telephony/resolve-missed/${callId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: 'Callback completed by executive' })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Missed call marked as resolved!', 'success');
        fetchCalls();
      }
    } catch (err) {
      console.error('Failed to resolve missed call:', err);
      showToast('Failed to resolve missed call', 'error');
    }
  };

  const handleSaveDisposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCallForNotes) return;
    setSavingNotes(true);
    try {
      const token = localStorage.getItem('ab_solar_token') || localStorage.getItem('ab_energy_auth_token') || '';
      const res = await fetch(getApiUrl(`/api/telephony/calls/${selectedCallForNotes.id}/disposition`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          disposition: dispositionText,
          notes: notesText
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCallForNotes(null);
        showToast('Call outcome and notes updated!', 'success');
        fetchCalls();
      }
    } catch (err) {
      console.error('Failed to update disposition:', err);
      showToast('Failed to update call notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const executeDeleteCall = async () => {
    if (!callToDelete) return;
    const targetId = callToDelete.id;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('ab_solar_token') || localStorage.getItem('ab_energy_auth_token') || '';
      const res = await fetch(getApiUrl(`/api/telephony/calls/${targetId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCalls(prev => prev.filter(c => c.id !== targetId));
        setCallToDelete(null);
        showToast('Call record deleted successfully', 'success');
        fetchCalls();
      } else {
        showToast(data.message || 'Failed to delete call record', 'error');
      }
    } catch (err: any) {
      console.error('Failed to delete call record:', err);
      showToast(err.message || 'Failed to delete call record', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSimulateCall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('ab_solar_token') || localStorage.getItem('ab_energy_auth_token') || '';
      const res = await fetch(getApiUrl('/api/telephony/sync-call'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_phone: (currentUser as any)?.phone || '+919655247872',
          employee_id: currentUser?.id,
          customer_phone: simPhone,
          customer_name: simName,
          call_type: simType,
          call_status: simType === 'MISSED' ? 'MISSED' : 'ANSWERED',
          duration_seconds: simType === 'MISSED' ? 0 : Number(simDuration),
          call_time: new Date().toISOString(),
          notes: 'Test call simulated via CRM Web Portal'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowSimulateModal(false);
        fetchCalls();
      }
    } catch (err) {
      console.error('Failed to simulate call:', err);
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || sec === 0) return '0s';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatCallTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Find any unresolved missed calls
  const urgentMissedCalls = calls.filter(c => c.call_type === 'MISSED' && !c.is_resolved);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative">
      {/* Floating In-App Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200 max-w-md w-[92%] sm:w-auto">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />}
          <span className="text-xs sm:text-sm font-semibold">{toast.message}</span>
        </div>
      )}
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  {isManagerView ? 'Team Telephony & SIM Call Tracker' : 'My Call Tracker & Telephony'}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                  Live SIM Sync
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {isManagerView
                  ? 'Real-time call analytics, duration tracking, and missed call follow-up queue across all sales executives'
                  : 'Track your customer conversations, talk-time targets, and urgent callback requests'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              autoRefresh
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh (15s)
          </button>

          <button
            onClick={() => setShowSimulateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
          >
            <Play className="w-3.5 h-3.5 text-emerald-600" />
            Simulate Call Event
          </button>

          <button
            onClick={fetchCalls}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Urgent Missed Call Banner (If any exist) */}
      {urgentMissedCalls.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 text-sm">
                Attention: {urgentMissedCalls.length} Unresolved Missed Call{urgentMissedCalls.length > 1 ? 's' : ''} Require Callback!
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Customers waiting for callback: {urgentMissedCalls.slice(0, 3).map(c => `${c.customer_name} (${c.customer_phone})`).join(', ')}
                {urgentMissedCalls.length > 3 ? ` and ${urgentMissedCalls.length - 3} more...` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('missed')}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            Open Missed Call Desk
          </button>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Calls Today
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {metrics.total_calls_today || 0}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
            <span className="text-emerald-600 font-medium">{metrics.outgoing_count} Outgoing</span>
            <span>•</span>
            <span className="text-blue-600 font-medium">{metrics.incoming_count} Incoming</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Talk Time
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatSeconds(metrics.total_talk_time_seconds || 0)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Avg: {metrics.total_calls_today > 0 ? formatSeconds(Math.round(metrics.total_talk_time_seconds / metrics.total_calls_today)) : '0s'} per call
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Answered Rate
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {metrics.total_calls_today > 0
              ? `${Math.round(((metrics.total_calls_today - (metrics.missed_count || 0)) / metrics.total_calls_today) * 100)}%`
              : '100%'}
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">
            High connection quality
          </div>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm transition-all ${
          (metrics.unresolved_missed_count || 0) > 0
            ? 'bg-rose-50 border-rose-200'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              (metrics.unresolved_missed_count || 0) > 0 ? 'text-rose-700' : 'text-slate-500'
            }`}>
              Pending Missed Calls
            </span>
            <div className={`p-2 rounded-lg ${
              (metrics.unresolved_missed_count || 0) > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
            }`}>
              <PhoneMissed className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-2 text-2xl font-bold ${
            (metrics.unresolved_missed_count || 0) > 0 ? 'text-rose-900' : 'text-slate-900'
          }`}>
            {metrics.unresolved_missed_count || 0}
          </div>
          <div className={`mt-1 text-xs ${
            (metrics.unresolved_missed_count || 0) > 0 ? 'text-rose-700 font-medium' : 'text-slate-500'
          }`}>
            {(metrics.unresolved_missed_count || 0) > 0 ? 'Immediate callback needed' : 'All callbacks resolved'}
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>All Calls</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                activeTab === 'all' ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {metrics.total_calls_today ?? calls.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('missed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'missed'
                  ? 'bg-white text-rose-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
              }`}
            >
              <PhoneMissed className="w-3.5 h-3.5 text-rose-500" />
              <span>Missed Calls</span>
              {(metrics.unresolved_missed_count || 0) > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  {metrics.unresolved_missed_count}
                </span>
              ) : (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  activeTab === 'missed' ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {metrics.missed_count || 0}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('outgoing')}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'outgoing'
                  ? 'bg-white text-emerald-800 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
              }`}
            >
              <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-600" />
              <span>Outgoing</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                activeTab === 'outgoing' ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {metrics.outgoing_count || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'incoming'
                  ? 'bg-white text-blue-800 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
              }`}
            >
              <PhoneIncoming className="w-3.5 h-3.5 text-blue-600" />
              <span>Incoming</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                activeTab === 'incoming' ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {metrics.incoming_count || 0}
              </span>
            </button>

            {isManagerView && (
              <button
                onClick={() => setActiveTab('team')}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'team'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Team Leaderboard</span>
              </button>
            )}
          </div>

          {/* Search & Staff Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search phone, customer, notes..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {isManagerView && teamBreakdown.length > 0 && (
              <select
                value={selectedEmployeeFilter}
                onChange={e => setSelectedEmployeeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Executives</option>
                {teamBreakdown.map(tm => (
                  <option key={tm.employee_id} value={tm.employee_id}>
                    {tm.employee_name} ({tm.total_calls} calls)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Content Body: Team Leaderboard vs Call Feed */}
        {activeTab === 'team' && isManagerView ? (
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Sales Executive Call Activity Leaderboard (Today)
              </h3>
              <p className="text-xs text-slate-500">
                Tracks talk-time volume and callback responsiveness for each sales rep SIM
              </p>
            </div>

            {/* Leaderboard Mobile Cards (< lg) */}
            <div className="lg:hidden divide-y divide-slate-100">
              {teamBreakdown.map((member, idx) => (
                <div key={member.employee_id || idx} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {member.employee_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">{member.employee_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {member.employee_id}</div>
                      </div>
                    </div>
                    {member.pending_missed > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                        {member.pending_missed} Missed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        0 Missed
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Calls</span>
                      <span className="font-bold text-slate-900 text-xs">{member.total_calls}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Outgoing</span>
                      <span className="font-semibold text-emerald-700 text-xs">{member.outgoing_calls}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Talk Time</span>
                      <span className="font-bold text-slate-800 text-xs">{formatSeconds(member.talk_time_seconds)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Leaderboard Desktop Table (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Sales Executive</th>
                    <th className="py-3 px-4">Total Calls</th>
                    <th className="py-3 px-4">Outgoing</th>
                    <th className="py-3 px-4">Pending Missed</th>
                    <th className="py-3 px-4">Talk Time</th>
                    <th className="py-3 px-4 text-right">Activity Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {teamBreakdown.map((member, idx) => (
                    <tr key={member.employee_id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                            {member.employee_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{member.employee_name}</div>
                            <div className="text-[11px] text-slate-500">ID: {member.employee_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{member.total_calls}</td>
                      <td className="py-3 px-4 text-emerald-700 font-medium">{member.outgoing_calls}</td>
                      <td className="py-3 px-4">
                        {member.pending_missed > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                            {member.pending_missed} Pending
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">0 Clean</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {formatSeconds(member.talk_time_seconds)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="w-32 bg-slate-100 h-2 rounded-full ml-auto overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (member.total_calls / 30) * 100)}%`
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {/* Call Logs Mobile Cards (< lg) */}
            <div className="lg:hidden divide-y divide-slate-100">
              {calls.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <PhoneCall className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No call records found matching this filter.
                </div>
              ) : (
                calls.map(call => {
                  const isMissed = call.call_type === 'MISSED' || call.call_status === 'MISSED';
                  return (
                    <div
                      key={call.id}
                      className={`p-4 transition-colors space-y-2.5 ${
                        isMissed && !call.is_resolved ? 'bg-rose-50/40' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {call.call_type === 'OUTGOING' && (
                            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0" title="Outgoing Call">
                              <PhoneOutgoing className="w-4 h-4" />
                            </div>
                          )}
                          {call.call_type === 'INCOMING' && (
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0" title="Incoming Answered">
                              <PhoneIncoming className="w-4 h-4" />
                            </div>
                          )}
                          {isMissed && (
                            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 animate-pulse" title="Missed Call">
                              <PhoneMissed className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{call.customer_name || 'Inbound Caller'}</h4>
                            <div className="text-slate-500 font-mono text-xs flex items-center gap-1.5 mt-0.5">
                              <span>{call.customer_phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`font-mono text-xs font-bold block ${call.duration_seconds > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                            {formatSeconds(call.duration_seconds)}
                          </span>
                          <span className="text-[10px] text-slate-400">{formatCallTime(call.call_time)}</span>
                        </div>
                      </div>

                      <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Rep (SIM):</span>
                          <span className="font-semibold text-slate-800">{call.employee_name}</span>
                        </div>
                        {call.lead_id && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">CRM Lead:</span>
                            <span className="font-mono text-emerald-700 font-bold">{call.lead_id}</span>
                          </div>
                        )}
                        {call.disposition && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Outcome:</span>
                            <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">{call.disposition}</span>
                          </div>
                        )}
                        {call.notes && (
                          <div className="pt-1 border-t border-slate-200/60 text-slate-600 italic text-[11px]">
                            "{call.notes}"
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          {isMissed && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              call.is_resolved ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-700 animate-pulse'
                            }`}>
                              {call.is_resolved ? 'Resolved' : 'Needs Callback'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${call.customer_phone}`}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                            title="Call Customer"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          {isMissed && !call.is_resolved && (
                            <button
                              onClick={() => handleResolveMissedCall(call.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                            >
                              Resolved ✓
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedCallForNotes(call);
                              setDispositionText(call.disposition || '');
                              setNotesText(call.notes || '');
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                            title="Add / Edit Call Notes"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCallToDelete(call)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg"
                            title="Delete Call Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Master Call Logs Table (Desktop >= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Direction & Status</th>
                    <th className="py-3 px-4">Customer / Number</th>
                    <th className="py-3 px-4">Executive (SIM)</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Outcome / Notes</th>
                    <th className="py-3 px-4 text-right w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {calls.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        <PhoneCall className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No call records found matching this filter.
                      </td>
                    </tr>
                  ) : (
                    calls.map(call => {
                      const isMissed = call.call_type === 'MISSED' || call.call_status === 'MISSED';
                      return (
                        <tr
                          key={call.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isMissed && !call.is_resolved ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          {/* Call Type / Badge */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {call.call_type === 'OUTGOING' && (
                                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg" title="Outgoing Call">
                                  <PhoneOutgoing className="w-4 h-4" />
                                </div>
                              )}
                              {call.call_type === 'INCOMING' && (
                                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg" title="Incoming Answered">
                                  <PhoneIncoming className="w-4 h-4" />
                                </div>
                              )}
                              {isMissed && (
                                <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg animate-pulse" title="Missed Call">
                                  <PhoneMissed className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-slate-900 block capitalize">
                                  {call.call_type.toLowerCase()}
                                </span>
                                {isMissed && (
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                    call.is_resolved
                                      ? 'bg-slate-100 text-slate-600'
                                      : 'bg-rose-100 text-rose-700'
                                  }`}>
                                    {call.is_resolved ? 'Resolved' : 'Needs Callback'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Customer Info */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">
                              {call.customer_name || 'Inbound Caller'}
                            </div>
                            <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1.5 mt-0.5">
                              <span>{call.customer_phone}</span>
                              <a
                                href={`tel:${call.customer_phone}`}
                                className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded hover:bg-emerald-50"
                                title="Direct Dial"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            </div>
                            {call.lead_id && (
                              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.2 rounded mt-1 inline-block">
                                CRM Lead: {call.lead_id}
                              </span>
                            )}
                          </td>

                          {/* Executive */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{call.employee_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{call.employee_phone}</div>
                          </td>

                          {/* Duration */}
                          <td className="py-3 px-4">
                            <span className={`font-mono font-medium ${
                              call.duration_seconds > 0 ? 'text-slate-900' : 'text-slate-400'
                            }`}>
                              {formatSeconds(call.duration_seconds)}
                            </span>
                          </td>

                          {/* Call Time */}
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {formatCallTime(call.call_time)}
                          </td>

                          {/* Outcome / Notes */}
                          <td className="py-3 px-4 max-w-xs">
                            {call.disposition && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-semibold mr-1.5">
                                {call.disposition}
                              </span>
                            )}
                            <p className="text-slate-600 text-xs truncate mt-0.5" title={call.notes || ''}>
                              {call.notes || <span className="text-slate-400 italic">No notes</span>}
                            </p>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right w-44">
                            <div className="flex items-center justify-end gap-1.5 min-w-[140px]">
                              {/* Call Button */}
                              <a
                                href={`tel:${call.customer_phone}`}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                                title="Call Customer"
                              >
                                <Phone className="w-4 h-4" />
                              </a>

                              {/* Mark Resolved for missed calls */}
                              {isMissed && !call.is_resolved && (
                                <button
                                  onClick={() => handleResolveMissedCall(call.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors"
                                  title="Mark callback completed"
                                >
                                  Resolved ✓
                                </button>
                              )}

                              {/* Add Notes Button */}
                              <button
                                onClick={() => {
                                  setSelectedCallForNotes(call);
                                  setDispositionText(call.disposition || '');
                                  setNotesText(call.notes || '');
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                                title="Add / Edit Call Notes"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>

                              {/* Delete Call Button */}
                              <button
                                onClick={() => setCallToDelete(call)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                                title="Delete Call Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>
                  Showing {calls.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                  {Math.min(currentPage * pageSize, totalRecords || calls.length)} of {totalRecords || calls.length} calls
                </span>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1.5">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>per page</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  Page {currentPage} of {Math.max(1, totalPages)}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Disposition / Call Notes Modal */}
      {selectedCallForNotes && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Log Call Outcome & Notes
              </h3>
              <button
                onClick={() => setSelectedCallForNotes(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDisposition} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer
                </label>
                <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-800 font-medium">
                  {selectedCallForNotes.customer_name} ({selectedCallForNotes.customer_phone})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Call Disposition / Intent
                </label>
                <select
                  value={dispositionText}
                  onChange={e => setDispositionText(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Disposition</option>
                  <option value="Interested - High Intent">Interested - High Intent</option>
                  <option value="Quote Requested">Quote Requested</option>
                  <option value="Site Survey Booked">Site Survey Booked</option>
                  <option value="Follow-up Scheduled">Follow-up Scheduled</option>
                  <option value="Price Too High">Price Too High</option>
                  <option value="Rooftop Not Suitable">Rooftop Not Suitable</option>
                  <option value="Not Interested / Wrong Number">Not Interested / Wrong Number</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Executive Notes & Next Steps
                </label>
                <textarea
                  rows={3}
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  placeholder="e.g. Discussed 10kW system. Wants net metering quote sent on WhatsApp..."
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCallForNotes(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNotes}
                  className="px-4 py-2 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-colors shadow-sm"
                >
                  {savingNotes ? 'Saving...' : 'Save Call Notes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulator Modal (For Immediate Testing) */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Simulate Android SIM Call Event
              </h3>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              This simulates the HTTP POST payload that your sales executive's Android phone sends to the CRM when a call ends.
            </p>

            <form onSubmit={handleSimulateCall} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Phone Number
                </label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={e => setSimPhone(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={simName}
                  onChange={e => setSimName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Call Direction
                  </label>
                  <select
                    value={simType}
                    onChange={e => setSimType(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="OUTGOING">Outgoing (Dialed)</option>
                    <option value="INCOMING">Incoming (Received)</option>
                    <option value="MISSED">Missed Call</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    value={simDuration}
                    onChange={e => setSimDuration(Number(e.target.value))}
                    disabled={simType === 'MISSED'}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-colors shadow-sm"
                >
                  Push Test Call to CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal (Replaces browser popup) */}
      {callToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Delete Call Record?</h4>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Are you sure you want to delete this {callToDelete.call_type.toLowerCase()} call with <strong className="text-slate-800">{callToDelete.customer_phone}</strong> ({callToDelete.customer_name})? This cannot be undone.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCallToDelete(null)}
                className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDeleteCall}
                className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
