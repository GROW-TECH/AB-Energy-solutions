import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, Plus, Search, Filter, Wrench, CheckCircle2, 
  Clock, AlertTriangle, ShieldCheck, ArrowRight, User, Calendar,
  ArrowLeft, Check, Layers, ChevronRight, ChevronLeft, Rocket,
  ShoppingCart, FileText, CheckCheck, Users, MapPin, Eye, ExternalLink, PackageCheck, Zap,
  Truck, Package, X, ListTodo, CheckSquare, Timer, Flag, Activity, Sparkles, Building2,
  Landmark, Lock
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Project, ProjectStage, ProjectTask } from '../../types';
import { NavItemKey } from '../layout/Sidebar';
import { getApiUrl } from '../../utils/apiUrl';

interface ProjectsViewProps {
  onNavigate: (tab: NavItemKey) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onNavigate }) => {
  const { projects, updateProject, updateProjectStage, quotations, currentUser, updateProjectTask, addProjectTask, employees } = useCrm();
  const acceptedQuotes = quotations.filter(q => q.status === 'Customer_Accepted');
  const [indentsMap, setIndentsMap] = useState<Record<string, any>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [activeViewMode, setActiveViewMode] = useState<'grid' | 'detail'>('grid');
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] || null);

  const [commandCentre, setCommandCentre] = useState<any | null>(null);
  const [isLoadingCc, setIsLoadingCc] = useState(false);

  // Executive Overview vs Dedicated Milestone Stage Workspace view
  const [projectDetailView, setProjectDetailView] = useState<'overview' | 'stage'>('overview');
  const [selectedStageMilestone, setSelectedStageMilestone] = useState<ProjectStage>(selectedProject?.stage || 'Booking');

  const [showPmAddTaskModal, setShowPmAddTaskModal] = useState(false);
  const [pmNewTaskTitle, setPmNewTaskTitle] = useState('');
  const [pmNewTaskAssignee, setPmNewTaskAssignee] = useState(selectedProject?.installationLeadName || 'Muthu Vel');
  const [pmNewTaskCategory, setPmNewTaskCategory] = useState<'Structure' | 'Electrical' | 'Inverter' | 'Safety' | 'BOS'>('Electrical');

  // PM Site Readiness Confirmation Modal State
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [shadowFreeConfirmed, setShadowFreeConfirmed] = useState(true);
  const [civilIntegrityConfirmed, setCivilIntegrityConfirmed] = useState(true);
  const [electricalClearanceConfirmed, setElectricalClearanceConfirmed] = useState(true);
  const [readinessNotes, setReadinessNotes] = useState('Rooftop surveyed, civil anchors tested, and BESCOM tie-in clearance approved.');
  const [isConfirmingReadiness, setIsConfirmingReadiness] = useState(false);

  // Dynamic Installation Crew Catalog: populated directly from CRM team directory / database
  // Automatically updates when new crew members are added in Team Management (no hardcoding)
  const [dynamicCrewList, setDynamicCrewList] = useState<Array<{ name: string; role: string; department: string }>>([]);

  useEffect(() => {
    // 1. Populate from active employees in CRM state
    const fromEmployees = (employees || [])
      .filter(e => e.role === 'Installation Team' && (e.status ? e.status === 'Active' : true))
      .map(e => ({
        name: e.name,
        role: e.role,
        department: (e as any).department || 'Installation & Field EPC'
      }));

    if (fromEmployees.length > 0) {
      setDynamicCrewList(fromEmployees);
    }

    // 2. Fetch live users from API to pick up newly added team members dynamically
    const tok = localStorage.getItem('ab_solar_token') || localStorage.getItem('ab_energy_auth_token') || '';
    fetch(getApiUrl('/api/users'), {
      headers: { Authorization: `Bearer ${tok}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data.users)) {
          const liveCrew = data.users
            .filter((u: any) => u.role === 'Installation Team' && u.isActive !== false)
            .map((u: any) => ({
              name: u.name || u.username,
              role: u.role,
              department: u.department || 'Installation & Field EPC'
            }));
          if (liveCrew.length > 0) {
            setDynamicCrewList(liveCrew);
          }
        }
      })
      .catch(() => {});
  }, [employees]);

  const fallbackCrew = [
    { name: 'Muthu Vel', role: 'Installation Team', department: 'Field EPC & Commissioning' },
    { name: 'Karthik Mani', role: 'Installation Team', department: 'Inverter & DC String Wiring' },
    { name: 'Saravanan Perumal', role: 'Installation Team', department: 'Earthing & Lightning Protection' },
    { name: 'Rajesh Varma', role: 'Installation Team', department: 'HDG Structure & Foundation' },
    { name: 'Vijay Anand', role: 'Installation Team', department: 'Quality & Safety Inspection' }
  ];

  const realCrewCatalog = dynamicCrewList.length > 0 ? dynamicCrewList : fallbackCrew;

  // Step 4: Installation Schedule & Crew Assignment State
  const [schedDateInput, setSchedDateInput] = useState<string>('');
  const [schedLeadInput, setSchedLeadInput] = useState<string>('');
  const [schedCrewMembers, setSchedCrewMembers] = useState<string[]>([]);
  const [newCrewName, setNewCrewName] = useState<string>('');
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);
  const [scheduleSaveSuccess, setScheduleSaveSuccess] = useState<boolean>(false);

  // Step 5: Quick check-in & Date-specific attendance view
  const [attendanceViewDate, setAttendanceViewDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [checkingInMember, setCheckingInMember] = useState<string | null>(null);

  // Sync Step 4 state when selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      const defaultDate = (selectedProject as any).scheduled_installation_date || selectedProject.targetCompletionDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
      setSchedDateInput(defaultDate);
      setSchedLeadInput(selectedProject.installationLeadName || 'Muthu Vel');
      const existingCrew = (selectedProject as any).assigned_crew_members;
      if (Array.isArray(existingCrew) && existingCrew.length > 0) {
        setSchedCrewMembers(existingCrew);
      } else {
        setSchedCrewMembers([
          `${selectedProject.installationLeadName || 'Muthu Vel'} (Lead)`,
          'Karthik Mani (Inverter & Wiring)',
          'Saravanan Perumal (Earthing & BOS)',
          'Rajesh Varma (Structure & Foundation)',
          'Vijay Anand (Safety & QA)'
        ]);
      }
    }
  }, [selectedProject?.id]);

  const handleSaveStep4ScheduleAndCrew = async () => {
    if (!selectedProject) return;
    setIsSavingSchedule(true);
    try {
      const updates: any = {
        scheduled_installation_date: schedDateInput,
        targetCompletionDate: schedDateInput,
        installationLeadName: schedLeadInput,
        assigned_crew_members: schedCrewMembers
      };
      updateProject(selectedProject.id, updates);
      setSelectedProject(prev => prev ? ({ ...prev, ...updates }) : null);

      await authFetch('/api/installation/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          scheduledDate: schedDateInput,
          installationLeadName: schedLeadInput,
          crewMembers: schedCrewMembers
        })
      }).catch(e => console.error(e));

      setScheduleSaveSuccess(true);
      setTimeout(() => setScheduleSaveSuccess(false), 3000);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleQuickCheckInMember = async (memberName: string) => {
    if (!selectedProject) return;
    setCheckingInMember(memberName);
    try {
      let lat: number | null = 11.6813;
      let lng: number | null = 78.1232;
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {}
      }

      const checkInTime = new Date().toTimeString().split(' ')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      const targetDate = attendanceViewDate || todayStr;
      const cleanName = memberName.split('(')[0].trim();

      const res = await authFetch('/api/installation/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          siteLeadName: cleanName,
          presentTeamMembers: [memberName.trim()],
          latitude: lat,
          longitude: lng,
          checkInTime,
          date: targetDate,
          notes: `Individual site check-in recorded for ${memberName}.`
        })
      });

      const data = await res.json();
      if (data.success) {
        const newRecord = {
          id: data.attendance?.id || `ATT-${Date.now().toString().slice(-6)}`,
          projectId: selectedProject.id,
          date: targetDate,
          siteLeadName: cleanName,
          checkInTime,
          latitude: lat,
          longitude: lng,
          presentTeamMembers: [memberName.trim()],
          notes: `Site check-in verified for ${memberName}.`
        };
        setCommandCentre((prev: any) => ({
          ...prev,
          attendance: [newRecord, ...(prev?.attendance || [])]
        }));
      }
    } catch (e: any) {
      console.error('Quick check-in error:', e);
    } finally {
      setCheckingInMember(null);
    }
  };

  const token = localStorage.getItem('ab_solar_token') || localStorage.getItem('ab_energy_auth_token') || '';
  const authFetch = (url: string, opts: any = {}) => {
    const fullUrl = url.startsWith('http') ? url : getApiUrl(url);
    const headers = { ...(opts.headers || {}), Authorization: `Bearer ${token}` };
    return fetch(fullUrl, { ...opts, headers });
  };

  useEffect(() => {
    authFetch('/api/procurement/pending-indents')
      .then(res => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        return ct.includes('application/json') ? res.json() : null;
      })
      .then(data => {
        if (data && data.success && data.indents) {
          const map: Record<string, any> = {};
          data.indents.forEach((ind: any) => {
            if (ind.quotation_id) map[ind.quotation_id] = ind;
          });
          setIndentsMap(map);
        }
      })
      .catch(err => console.error('Error fetching indents in ProjectsView:', err));
  }, []);

  const readyToConvertQuotes = acceptedQuotes.filter(q => indentsMap[q.id]?.has_signed_grn);
  const inProcurementQuotes = acceptedQuotes.filter(q => !indentsMap[q.id]?.has_signed_grn);

  const handleConfirmSiteReadiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      setIsConfirmingReadiness(true);
      const res = await authFetch(`/api/projects/${selectedProject.id}/confirm-readiness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledInstallationDate: scheduledDate,
          siteReadinessNotes: readinessNotes,
          shadowFreeConfirmed,
          civilIntegrityConfirmed,
          electricalClearanceConfirmed,
        })
      });
      const data = await res.json();
      setIsConfirmingReadiness(false);
      if (data.success) {
        setShowReadinessModal(false);
        (selectedProject as any).site_readiness_confirmed = 1;
        (selectedProject as any).scheduled_installation_date = scheduledDate;
        updateProjectStage(selectedProject.id, 'Installation Scheduled');
        fetchCommandCentre(selectedProject.id);
        alert('✓ Site Readiness Confirmed by Project Manager! Installation Team has been notified and cleared for physical execution.');
      } else {
        alert(data.error || 'Failed to confirm site readiness');
      }
    } catch (err: any) {
      setIsConfirmingReadiness(false);
      alert(err.message);
    }
  };

  const fetchCommandCentre = async (projectId: string) => {
    if (!projectId) return;
    setIsLoadingCc(true);
    try {
      const res = await authFetch(`/api/installation/command-centre/${projectId}`);
      const data = await res.json();
      if (data.success && data.commandCentre) {
        setCommandCentre(data.commandCentre);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingCc(false);
    }
  };

  useEffect(() => {
    if (activeViewMode === 'detail' && selectedProject?.id) {
      fetchCommandCentre(selectedProject.id);
    }
  }, [activeViewMode, selectedProject?.id]);

  const stages: ProjectStage[] = [
    'Booking',
    'Documentation',
    'Material Ready',
    'Installation Scheduled',
    'Installation In Progress',
    'Installation Completed',
    'Commissioning',
    'Completed',
  ];

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerPhone.includes(searchTerm) ||
      (p.discomSanctionNumber && p.discomSanctionNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStage = stageFilter === 'All' || p.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // KPI Calculations
  const totalProjects = projects.length;
  const totalCapacityKw = projects.reduce((sum, p) => sum + (Number(p.capacityKw) || 0), 0);
  const activeExecutionCount = projects.filter(p => p.stage.includes('Installation') || p.stage === 'Material Ready').length;
  const commissionedCount = projects.filter(p => p.stage === 'Completed' || p.stage === 'Commissioning').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* VIEW MODE 1: DEDICATED FULL-PAGE PROJECT EXECUTION DETAIL VIEW */}
      {activeViewMode === 'detail' && selectedProject && (
        <div className="space-y-4">
          {/* Top Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveViewMode('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Projects</span>
              </button>

              <div className="h-4 w-px bg-slate-200" />

              <span className="font-mono font-bold text-slate-900 text-xs">
                {selectedProject.id}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-medium">{selectedProject.customerName} ({selectedProject.capacityKw} kW)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setProjectDetailView('overview')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  projectDetailView === 'overview'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Executive Overview</span>
              </button>

              <button
                onClick={() => onNavigate('installation')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>12-Point Checklist</span>
              </button>
            </div>
          </div>

          {/* Full-Width Workspace Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-5xl mx-auto space-y-6 text-xs text-slate-700">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                    {selectedProject.id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Current Stage: {selectedProject.stage}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedProject.capacityKw} kW System
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedProject.customerName}</h2>
                <p className="text-slate-500 text-xs mt-0.5">{selectedProject.customerAddress} • {selectedProject.customerPhone}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contract Value</span>
                  <span className="font-bold text-emerald-700 font-mono text-base block">
                    ₹{Number(selectedProject.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-slate-500 text-[11px]">PM: {selectedProject.projectManagerName}</span>
                </div>
              </div>
            </div>

            {/* PM Surya Ghar Government Subsidy Quick Badge */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-navy-950 rounded-xl p-3.5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-emerald-800/40">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Landmark className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Govt. Subsidy: PM Surya Ghar Muft Bijli Yojana</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                      ₹78,000 CFA Eligible (DCR Modules)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    National Portal App: <span className="font-mono text-emerald-300 font-semibold">PMS-TN-2026-98124</span> &bull; TANGEDCO Net Metering & Inspection
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('subsidies')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors self-start sm:self-auto cursor-pointer"
              >
                <span>Open Subsidy Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ========================================================= */}
            {/* 8-MILESTONE INTERACTIVE STEPPER NAVIGATION TRACK          */}
            {/* ========================================================= */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>EPC Project Milestones</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">8 Key Lifecycle Stages</span>
              </div>

              <div className="flex overflow-x-auto sm:grid sm:grid-cols-4 lg:grid-cols-8 gap-2 pb-1">
                {stages.map((st, idx) => {
                  const currentIdx = stages.indexOf(selectedProject.stage);
                  const isDone = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  const isBlocked = isCurrent && st === 'Installation Scheduled' && !Boolean((selectedProject as any).site_readiness_confirmed || commandCentre?.project?.site_readiness_confirmed);
                  const isSelectedInView = projectDetailView === 'stage' && selectedStageMilestone === st;

                  return (
                    <button
                      key={st}
                      onClick={() => {
                        setSelectedStageMilestone(st);
                        setProjectDetailView('stage');
                      }}
                      className={`min-w-[130px] sm:min-w-0 flex-shrink-0 sm:flex-shrink p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelectedInView 
                          ? 'ring-2 ring-emerald-600 bg-emerald-50/80 border-emerald-400 shadow-xs' 
                          : isCurrent 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold' 
                          : isDone 
                          ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50/40' 
                          : 'bg-slate-50/50 text-slate-400 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1 opacity-90">
                        <span className="font-bold">Step {idx + 1}</span>
                        {isDone ? (
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px]">✓</span>
                        ) : isBlocked ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                        ) : (
                          <span className="text-slate-300">○</span>
                        )}
                      </div>
                      <div className={`text-[11px] truncate ${isSelectedInView ? 'font-black text-emerald-900' : isCurrent ? 'font-bold text-emerald-950' : isDone ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                        {st}
                      </div>
                      {isBlocked && (
                        <span className="text-[9px] text-amber-700 font-bold block mt-0.5">PM Hold</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ========================================================= */}
            {/* VIEW A: EXECUTIVE OVERVIEW PAGE                           */}
            {/* ========================================================= */}
            {projectDetailView === 'overview' && (
              <div className="space-y-6 animate-in fade-in">
                {/* 1. Schedule & Handover Countdown Ribbon */}
                {(() => {
                  const startDateStr = selectedProject.startDate || '2026-10-15';
                  const schedDateStr = (selectedProject as any).scheduled_installation_date || '2026-10-29';
                  const endDateStr = selectedProject.targetCompletionDate || '2026-11-20';
                  const currentIdx = stages.indexOf(selectedProject.stage);
                  const progressPct = Math.round(((currentIdx >= 0 ? currentIdx + 1 : 1) / stages.length) * 100);

                  let daysRemaining: number | null = null;
                  try {
                    const targetDate = new Date(endDateStr);
                    const today = new Date();
                    const diffTime = targetDate.getTime() - today.getTime();
                    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  } catch (e) {
                    daysRemaining = null;
                  }

                  return (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-bold text-sm tracking-wide text-white">Project Schedule &amp; Execution Timeline</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {daysRemaining !== null && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              daysRemaining > 5 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : daysRemaining >= 0 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {daysRemaining > 0 ? `⏳ ${daysRemaining} Days Until Handover` : daysRemaining === 0 ? '🏁 Target Handover Today' : `⚠️ Overdue by ${Math.abs(daysRemaining)} days`}
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-slate-200">
                            {progressPct}% Completed
                          </span>
                        </div>
                      </div>

                      {/* 3 Milestone Date Nodes */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                            <Flag className="w-3 h-3 text-emerald-400" />
                            <span>Project Kickoff / Start</span>
                          </div>
                          <div className="font-mono font-bold text-white text-sm">{startDateStr}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Agreement Signed &amp; Token Received</div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                            <Wrench className="w-3 h-3 text-amber-400" />
                            <span>Physical Site Work</span>
                          </div>
                          <div className="font-mono font-bold text-amber-300 text-sm">{schedDateStr}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Lead: {selectedProject.installationLeadName || 'Muthu Vel'}
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            <span>Target Commissioning / End</span>
                          </div>
                          <div className="font-mono font-bold text-cyan-300 text-sm">{endDateStr}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">DISCOM Meter &amp; Handover</div>
                        </div>
                      </div>

                      {/* Timeline Bar */}
                      <div className="pt-1">
                        <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                          <span>Start: {startDateStr}</span>
                          <span className="font-semibold text-emerald-400">Current: {selectedProject.stage}</span>
                          <span>Target End: {endDateStr}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Current Milestone Spotlight Card */}
                <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                        {selectedProject.stage === 'Completed' ? 'EPC LIFECYCLE COMPLETED' : 'CURRENT ACTIVE MILESTONE'}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {selectedProject.stage === 'Completed' 
                          ? 'Project Successfully Commissioned & Closed ✓' 
                          : `Step ${stages.indexOf(selectedProject.stage) + 1}: ${selectedProject.stage}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 max-w-xl">
                      {selectedProject.stage === 'Completed'
                        ? 'All 8 EPC milestones (Site Survey, Booking, Engineering BOM, Approvals, Material Dispatch, Rooftop Installation, Net Meter Testing, and Customer Handover) are 100% completed and finalized.'
                        : `This project is actively in ${selectedProject.stage}. Work items and documents for this phase are tracked in its dedicated workspace.`}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedStageMilestone(selectedProject.stage);
                      setProjectDetailView('stage');
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    <span>{selectedProject.stage === 'Completed' ? 'View Final Handover & Warranty' : `Open ${selectedProject.stage} Workspace`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 3. Priority Alerts & Blockers Box */}
                {(() => {
                  const isProjectDone = selectedProject.stage === 'Completed';
                  const isSiteReady = isProjectDone || Boolean((selectedProject as any).site_readiness_confirmed || commandCentre?.project?.site_readiness_confirmed);
                  const latestAtt = commandCentre?.attendance?.[0];
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isCheckedInToday = Boolean(latestAtt && latestAtt.date && String(latestAtt.date).startsWith(todayStr));

                  return (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Operational Alerts &amp; Critical Clearances
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Alert 1: PM Site Readiness */}
                        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                          isSiteReady ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-300 text-amber-950 shadow-2xs'
                        }`}>
                          {isSiteReady ? (
                            <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">PM Site Readiness Clearance</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                isSiteReady ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                              }`}>
                                {isProjectDone ? 'Project Handover Complete ✓' : isSiteReady ? 'Cleared ✓' : 'Awaiting Approval'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              {isProjectDone 
                                ? 'Installation, electrical tie-in, and net metering are fully completed and commissioned.' 
                                : isSiteReady 
                                ? `Confirmed by PM ${selectedProject.projectManagerName}. Installation crew is authorized for site execution.` 
                                : 'Physical site work is on hold until PM confirms shadow-free clearance, roof civil anchor points, and electrical tie-in.'}
                            </p>
                            {!isSiteReady && !isProjectDone && (currentUser?.role === 'Project Manager' || currentUser?.role === 'Super Admin') && (
                              <button
                                onClick={() => setShowReadinessModal(true)}
                                className="mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                              >
                                Confirm Site Readiness
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Alert 2: Crew Live Check-In */}
                        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                          isCheckedInToday ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}>
                          <Users className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">Rooftop Crew Attendance</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                isCheckedInToday ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {isCheckedInToday ? 'Active on Site ✓' : 'Check-in Pending'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              {isCheckedInToday && latestAtt?.latitude ? (
                                <span>Checked in with GPS stamp at {Number(latestAtt.latitude).toFixed(4)}° N, {Number(latestAtt.longitude).toFixed(4)}° E.</span>
                              ) : (
                                <span>Installation lead {selectedProject.installationLeadName || 'Muthu Vel'} logs site presence via mobile check-in.</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 4. Core Specifications & Stakeholder Cards */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    System Architecture &amp; Project Stakeholders
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Plant</span>
                      <span className="font-bold text-slate-900 text-sm block mt-0.5">{selectedProject.capacityKw} kWp Rooftop</span>
                      <span className="text-slate-500 text-[11px]">On-Grid 3-Phase Tie-in</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DISCOM Sanction</span>
                      <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">{selectedProject.discomSanctionNumber || 'BESCOM-SANC-2026-9941'}</span>
                      <span className="text-slate-500 text-[11px]">Bi-Directional Net Meter</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Leads</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">PM: {selectedProject.projectManagerName}</span>
                      <span className="text-slate-500 text-[11px]">Crew: {selectedProject.installationLeadName || 'Muthu Vel'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Financials</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm block mt-0.5">₹{Number(selectedProject.totalAmount || 0).toLocaleString('en-IN')}</span>
                      <span className="text-slate-500 text-[11px]">90% Advance / 10% Meter</span>
                    </div>
                  </div>
                </div>

                {/* 5. Project Master Notes */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">Project Master Execution Notes</span>
                  <p className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                    {selectedProject.notes || 'Ensure safety harness compliance for rooftop team. Bi-directional net meter sync scheduled with DISCOM engineer.'}
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW B: DEDICATED MILESTONE STAGE WORKSPACE               */}
            {/* ========================================================= */}
            {projectDetailView === 'stage' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Stage Workspace Header & Prev/Next Controls */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setProjectDetailView('overview')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Overview</span>
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          Step {stages.indexOf(selectedStageMilestone) + 1} of 8: {selectedStageMilestone} Workspace
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          stages.indexOf(selectedStageMilestone) < stages.indexOf(selectedProject.stage) 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : selectedStageMilestone === selectedProject.stage 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {stages.indexOf(selectedStageMilestone) < stages.indexOf(selectedProject.stage) 
                            ? 'Completed ✓' 
                            : selectedStageMilestone === selectedProject.stage 
                            ? 'Currently Active' 
                            : 'Upcoming'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Dedicated view showing documents, team checklist, and actions for this milestone.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Previous Stage */}
                    <button
                      disabled={stages.indexOf(selectedStageMilestone) === 0}
                      onClick={() => {
                        const prevIdx = stages.indexOf(selectedStageMilestone) - 1;
                        if (prevIdx >= 0) setSelectedStageMilestone(stages[prevIdx]);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev Stage</span>
                    </button>

                    {/* Next Stage */}
                    <button
                      disabled={stages.indexOf(selectedStageMilestone) === stages.length - 1}
                      onClick={() => {
                        const nextIdx = stages.indexOf(selectedStageMilestone) + 1;
                        if (nextIdx < stages.length) setSelectedStageMilestone(stages[nextIdx]);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Next Stage</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Set Project Stage Action */}
                    {selectedProject.stage === 'Completed' ? (
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold border border-slate-200 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Project Completed (Locked)</span>
                      </span>
                    ) : selectedStageMilestone !== selectedProject.stage ? (
                      <button
                        onClick={() => {
                          updateProjectStage(selectedProject.id, selectedStageMilestone);
                          setSelectedProject({ ...selectedProject, stage: selectedStageMilestone });
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                      >
                        Set Project to this Stage
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* 1. STAGE: BOOKING                                             */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Booking' && (
                  <div className="space-y-4">
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Milestone 1: Project Booking &amp; Client Agreement</span>
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Booking Confirmed
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Quotation Code</span>
                          <span className="font-mono font-bold text-slate-900 block mt-0.5">{selectedProject.quotationId || 'QT-2026-00021-V1'}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Commercial Value</span>
                          <span className="font-mono font-bold text-emerald-700 block mt-0.5">₹{Number(selectedProject.totalAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Milestone</span>
                          <span className="font-semibold text-slate-800 block mt-0.5">90% Advance Paid</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        Client token received. System sizing confirmed for {selectedProject.capacityKw} kWp. Project order transferred from Sales pipeline into active EPC execution workflow.
                      </p>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 2. STAGE: DOCUMENTATION                                       */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Documentation' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Survey Feasibility Card */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <FolderKanban className="w-4 h-4 text-teal-600" />
                            <span>Technical Site Survey Feasibility</span>
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                            {commandCentre?.survey?.status || 'Survey Verified'}
                          </span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Plant Capacity Calculated:</span>
                            <span className="font-bold text-slate-900 font-mono">{commandCentre?.survey?.recommended_capacity_kw || selectedProject.capacityKw} kWp</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Shadow-Free Rooftop Area:</span>
                            <span className="font-semibold text-slate-800 font-mono">{commandCentre?.survey?.shadow_free_area || '2,400'} sq.ft</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Feasibility Verdict:</span>
                            <span className="font-bold text-teal-700">{commandCentre?.survey?.feasibility_verdict || 'Feasible (Full Solar Potential)'}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-100 text-[11px]">
                            <span className="text-slate-400">Assigned Field Engineer:</span>
                            <span className="font-semibold text-slate-700">{commandCentre?.survey?.engineer_name || 'Lead Survey Engineer'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer KYC & DISCOM Liaison Card */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                            <span>Customer Identity &amp; Net-Metering Docs</span>
                          </span>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-[10px] font-bold">
                            Encrypted Storage
                          </span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Proof Document:</span>
                            <span className="font-bold text-slate-900">{commandCentre?.customerDoc?.document_type || 'Aadhaar Card'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">ID Number Masked:</span>
                            <span className="font-mono font-semibold text-slate-800">{commandCentre?.customerDoc?.id_number_masked || 'XXXX-XXXX-4589'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">DISCOM Net-Meter Status:</span>
                            <span className="font-bold text-emerald-700">Sanction Approved</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-100 text-[11px]">
                            <span className="text-slate-400">Access Restricted:</span>
                            <span className="text-slate-600 font-semibold">Super Admin &amp; Project Manager</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 3. STAGE: MATERIAL READY                                      */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Material Ready' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* BOM Table Card */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <span>Engineering Bill of Materials (BOM)</span>
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                            {commandCentre?.bom?.status || 'BOM Approved'}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Indented Line Items:</span>
                            <span className="font-bold text-slate-900">{commandCentre?.bomItems?.length || 5} Items</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Estimated BOM Cost:</span>
                            <span className="font-bold text-emerald-700 font-mono">
                              ₹{Number(commandCentre?.bom?.total_estimated_cost || selectedProject.totalAmount * 0.7).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="divide-y divide-slate-100 pt-1 text-[11px] max-h-48 overflow-y-auto">
                            {(commandCentre?.bomItems && commandCentre.bomItems.length > 0 ? commandCentre.bomItems : [
                              { item_name: '550W Mono PERC Bifacial Modules', quantity: 20, unit: 'Nos' },
                              { item_name: '15kW On-Grid 3-Phase String Inverter', quantity: 1, unit: 'Nos' },
                              { item_name: 'HDG Elevated Mounting Structure', quantity: 1, unit: 'Set' },
                              { item_name: '4 sq.mm 1000V DC Solar Cable', quantity: 120, unit: 'Mtrs' },
                              { item_name: 'Chemical Earthing Pit Kit (Copper)', quantity: 3, unit: 'Sets' }
                            ]).map((item: any, idx: number) => (
                              <div key={idx} className="py-1.5 flex justify-between">
                                <span className="text-slate-700 truncate pr-2">{item.item_name}</span>
                                <span className="font-bold text-slate-900 shrink-0">{item.quantity} {item.unit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* PO & GRN Card */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <ShoppingCart className="w-4 h-4 text-blue-600" />
                            <span>Procurement &amp; Goods Receipt (GRN)</span>
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            commandCentre?.materialReadiness === 'Fully Received at Site' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {commandCentre?.materialReadiness || 'Ready in Warehouse'}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Purchase Orders Issued:</span>
                            <span className="font-bold text-slate-900">{commandCentre?.purchaseOrders?.length || 1} PO(s)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Goods Receipt Notes (GRN):</span>
                            <span className="font-semibold text-emerald-700">{commandCentre?.goodsReceiptNotes?.length || 1} GRN Verified</span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-100 text-[11px] flex justify-between">
                            <span className="text-slate-400">Site Delivery Destination:</span>
                            <span className="font-semibold text-slate-800">{selectedProject.customerAddress || 'Customer Rooftop'}</span>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => onNavigate('purchase-orders' as any)}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open Procurement Hub</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 4. STAGE: INSTALLATION SCHEDULED                              */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Installation Scheduled' && (
                  <div className="space-y-4">
                    {/* Site Readiness Card */}
                    {(() => {
                      const isSiteReady = Boolean((selectedProject as any).site_readiness_confirmed || commandCentre?.project?.site_readiness_confirmed);
                      const schedDate = schedDateInput || (selectedProject as any).scheduled_installation_date || commandCentre?.project?.scheduled_installation_date || selectedProject.targetCompletionDate;

                      return (
                        <div className={`p-5 rounded-2xl border transition-all ${
                          isSiteReady 
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' 
                            : 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-xs'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                              {isSiteReady ? (
                                <CheckCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-black text-base">PM Site Readiness &amp; Execution Clearance</h3>
                                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                    isSiteReady ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                                  }`}>
                                    {isSiteReady ? 'Site Cleared ✓' : 'Hold: Awaiting PM Confirmation'}
                                  </span>
                                </div>
                                <p className="text-xs mt-1 leading-relaxed">
                                  {isSiteReady ? (
                                    <span>
                                      Site readiness verified by Project Manager {selectedProject.projectManagerName}. Physical installation scheduled for <strong className="font-mono text-emerald-800">{schedDate || 'Upcoming'}</strong>. Field crew is cleared for execution.
                                    </span>
                                  ) : (
                                    <span>
                                      Physical rooftop work is locked. The Project Manager must verify shadow-free clearance, roof civil anchor points, and electrical tie-in clearance before physical dispatch.
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {!isSiteReady && (currentUser?.role === 'Project Manager' || currentUser?.role === 'Super Admin') && (
                              <button
                                onClick={() => setShowReadinessModal(true)}
                                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer animate-pulse"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                <span>Confirm Site Readiness</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Step 4 Interactive PM Control Panel: Installation Schedule Date & Crew Member Assignment */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span>Schedule Installation Date &amp; Assign Field Crew</span>
                          </h4>
                          <p className="text-slate-500 text-xs mt-0.5">
                            Set the official physical kickoff date and assign the rooftop installation lead and technicians.
                          </p>
                        </div>
                        {scheduleSaveSuccess && (
                          <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>Schedule &amp; Crew Saved!</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Installation Schedule Date */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Installation Kickoff / Target Date *</span>
                          </label>
                          <input
                            type="date"
                            value={schedDateInput}
                            onChange={e => setSchedDateInput(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                          />
                          <p className="text-[11px] text-slate-500">
                            The target date on-site mounting begins. This syncs with customer timeline and materials delivery.
                          </p>
                        </div>

                        {/* 2. Assigned Installation Lead */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Assigned Installation Lead (Site In-Charge) *</span>
                          </label>
                          <select
                            value={schedLeadInput}
                            onChange={e => {
                              const val = e.target.value;
                              setSchedLeadInput(val);
                              if (!schedCrewMembers.some(m => m.includes(val))) {
                                setSchedCrewMembers(prev => [`${val} (Lead)`, ...prev.filter(m => !m.includes('(Lead)'))]);
                              }
                            }}
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                          >
                            {realCrewCatalog.map(member => (
                              <option key={member.name} value={member.name}>
                                {member.name} — {member.department}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-slate-500">
                            Responsible for on-site checklist execution, daily attendance stamping, and safety compliance.
                          </p>
                        </div>
                      </div>

                      {/* 3. Assign Crew Members Roster */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Assigned Field Crew Members ({schedCrewMembers.length} Members)</span>
                          </label>
                          <span className="text-[11px] text-slate-400">
                            Will appear in Step 5 attendance roster
                          </span>
                        </div>

                        {/* Current Member Chips */}
                        <div className="flex flex-wrap items-center gap-2">
                          {schedCrewMembers.map((m, idx) => (
                            <span 
                              key={idx} 
                              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs"
                            >
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{m}</span>
                              <button
                                type="button"
                                onClick={() => setSchedCrewMembers(prev => prev.filter((_, i) => i !== idx))}
                                className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-0.5 rounded-full hover:bg-red-50"
                                title={`Remove ${m}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Company Real Installation Crew Presets */}
                        <div className="space-y-1.5 pt-1">
                          <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Company Registered Installation Crew:</span>
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {realCrewCatalog.map(member => {
                              const isAssigned = schedCrewMembers.some(m => m.toLowerCase().includes(member.name.toLowerCase()));
                              return (
                                <button
                                  key={member.name}
                                  type="button"
                                  onClick={() => {
                                    if (isAssigned) {
                                      setSchedCrewMembers(prev => prev.filter(m => !m.toLowerCase().includes(member.name.toLowerCase())));
                                    } else {
                                      setSchedCrewMembers(prev => [...prev, `${member.name} (${member.department.split('&')[0].trim()})`]);
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                    isAssigned 
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs' 
                                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <div className="truncate pr-2">
                                    <span className="block text-xs font-extrabold truncate">{member.name}</span>
                                    <span className="block text-[10px] text-slate-500 truncate">{member.department}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                    isAssigned ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {isAssigned ? 'Assigned ✓' : '+ Assign'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Add Custom Member Bar */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Add custom technician / helper name & role, e.g. Prakash (Rigger)"
                            value={newCrewName}
                            onChange={e => setNewCrewName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newCrewName.trim()) {
                                  setSchedCrewMembers(prev => [...prev, newCrewName.trim()]);
                                  setNewCrewName('');
                                }
                              }
                            }}
                            className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newCrewName.trim()) {
                                setSchedCrewMembers(prev => [...prev, newCrewName.trim()]);
                                setNewCrewName('');
                              }
                            }}
                            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        {scheduleSaveSuccess && (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Schedule &amp; Crew assignments recorded!</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleSaveStep4ScheduleAndCrew}
                          disabled={isSavingSchedule}
                          className={`px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50 ${
                            scheduleSaveSuccess
                              ? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {scheduleSaveSuccess ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                              <span>Saved ✓</span>
                            </>
                          ) : isSavingSchedule ? (
                            <>
                              <Clock className="w-4 h-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Save Schedule &amp; Crew Assignments</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 5. STAGE: INSTALLATION IN PROGRESS                            */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Installation In Progress' && (
                  <div className="space-y-4">
                    {/* Live Crew Attendance & Site Roster Card */}
                    {(() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const activeAttDate = attendanceViewDate || todayStr;
                      const allAttendanceLogs: any[] = commandCentre?.attendance || [];
                      
                      // Filter attendance logs STRICTLY for the active attendance date
                      const targetDateLogs = allAttendanceLogs.filter(log => {
                        if (!log.date) return false;
                        const d = String(log.date).split('T')[0];
                        return d === activeAttDate;
                      });

                      // Build a map of only members checked in on THIS specific date
                      const checkedInMap: Record<string, {
                        checkInTime: string;
                        date: string;
                        latitude?: number;
                        longitude?: number;
                        siteLeadName: string;
                        notes?: string;
                      }> = {};

                      targetDateLogs.forEach(log => {
                        const logDate = String(log.date).split('T')[0];
                        const time = log.checkInTime || log.check_in_time || '09:00';
                        const members = Array.isArray(log.presentTeamMembers) ? log.presentTeamMembers : [];
                        
                        // Register individual members
                        members.forEach((m: string) => {
                          const key = m.trim().toLowerCase();
                          const simpleKey = m.split('(')[0].trim().toLowerCase();
                          checkedInMap[key] = {
                            checkInTime: time,
                            date: logDate,
                            latitude: log.latitude || log.gps_lat,
                            longitude: log.longitude || log.gps_lng,
                            siteLeadName: log.siteLeadName || log.team_lead_name || 'Field Lead',
                            notes: log.notes
                          };
                          checkedInMap[simpleKey] = checkedInMap[key];
                        });

                        // Register site lead
                        if (log.siteLeadName) {
                          const leadKey = log.siteLeadName.trim().toLowerCase();
                          checkedInMap[leadKey] = {
                            checkInTime: time,
                            date: logDate,
                            latitude: log.latitude || log.gps_lat,
                            longitude: log.longitude || log.gps_lng,
                            siteLeadName: log.siteLeadName,
                            notes: log.notes
                          };
                        }
                      });

                      // Assigned crew members
                      const assignedCrew: string[] = (selectedProject as any).assigned_crew_members?.length
                        ? (selectedProject as any).assigned_crew_members
                        : [
                            `${selectedProject.installationLeadName || 'Muthu Vel'} (Lead)`,
                            'Karthik Mani (Inverter & Wiring)',
                            'Saravanan Perumal (Earthing & BOS)',
                            'Rajesh Varma (Structure & Foundation)',
                            'Vijay Anand (Safety & QA)'
                          ];

                      // Also include any person who checked in on this date
                      const allDisplayMembers = [...assignedCrew];
                      targetDateLogs.forEach(log => {
                        const members = Array.isArray(log.presentTeamMembers) ? log.presentTeamMembers : [log.siteLeadName];
                        members.forEach((m: string) => {
                          if (m && !allDisplayMembers.some(em => em.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(em.toLowerCase()))) {
                            allDisplayMembers.push(m);
                          }
                        });
                      });

                      const checkedInCount = allDisplayMembers.filter(m => {
                        const key = m.trim().toLowerCase();
                        const simpleKey = m.split('(')[0].trim().toLowerCase();
                        return Boolean(checkedInMap[key] || checkedInMap[simpleKey]);
                      }).length;

                      const totalAssigned = allDisplayMembers.length;
                      const percentPresent = totalAssigned > 0 ? Math.round((checkedInCount / totalAssigned) * 100) : 0;

                      return (
                        <div className="p-5 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-slate-50 border border-emerald-200 rounded-2xl space-y-4 shadow-xs">
                          {/* Top Header & Date Switcher */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-700" />
                                <h3 className="font-extrabold text-slate-900 text-sm">
                                  Rooftop Installation Team Live Attendance &amp; Site Roster
                                </h3>
                              </div>
                              <p className="text-slate-500 text-xs mt-0.5">
                                Showing check-in status for <strong className="text-slate-800 font-mono">{activeAttDate === todayStr ? `Today (${activeAttDate})` : activeAttDate}</strong> across all {totalAssigned} assigned crew members.
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Date Switcher */}
                              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[11px] font-bold text-slate-600">Date:</span>
                                <input
                                  type="date"
                                  value={activeAttDate}
                                  onChange={e => setAttendanceViewDate(e.target.value)}
                                  className="border-0 bg-transparent text-xs font-bold font-mono text-slate-800 focus:ring-0 p-0 cursor-pointer"
                                />
                                {activeAttDate !== todayStr && (
                                  <button
                                    type="button"
                                    onClick={() => setAttendanceViewDate(todayStr)}
                                    className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md text-[10px] font-bold cursor-pointer"
                                  >
                                    Today
                                  </button>
                                )}
                                {(() => {
                                  const sched = (selectedProject as any)?.scheduled_installation_date || selectedProject?.targetCompletionDate;
                                  if (sched && sched !== activeAttDate) {
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => setAttendanceViewDate(sched)}
                                        className="px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-md text-[10px] font-bold cursor-pointer"
                                        title={`View scheduled date: ${sched}`}
                                      >
                                        Kickoff ({sched})
                                      </button>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>

                              <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-2xs ${
                                checkedInCount === totalAssigned 
                                  ? 'bg-emerald-600 text-white' 
                                  : checkedInCount > 0 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                  : 'bg-slate-200 text-slate-800'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${checkedInCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                <span>{checkedInCount} of {totalAssigned} Checked In ({percentPresent}%)</span>
                              </span>
                            </div>
                          </div>

                          {/* Crew Roster Grid: EVERY Assigned Crew Member Visible Side-by-Side */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {allDisplayMembers.map((member, idx) => {
                              const key = member.trim().toLowerCase();
                              const simpleKey = member.split('(')[0].trim().toLowerCase();
                              const info = checkedInMap[key] || checkedInMap[simpleKey];
                              const isCheckedIn = Boolean(info);

                              return (
                                <div
                                  key={idx}
                                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                                    isCheckedIn 
                                      ? 'bg-white border-emerald-300 shadow-xs' 
                                      : 'bg-slate-50/80 border-slate-200 opacity-90'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 truncate">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                          isCheckedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                          {member.charAt(0)}
                                        </div>
                                        <div className="truncate">
                                          <h5 className="font-extrabold text-slate-900 text-xs truncate">
                                            {member}
                                          </h5>
                                          <span className="text-[10px] text-slate-500 block truncate">
                                            {member.includes('(Lead)') ? 'Site Lead Engineer' : 'Rooftop Field Crew'}
                                          </span>
                                        </div>
                                      </div>

                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                        isCheckedIn 
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                                      }`}>
                                        {isCheckedIn ? 'Checked In ✓' : 'Pending Check-in'}
                                      </span>
                                    </div>

                                    {/* Status Details */}
                                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] space-y-1">
                                      {isCheckedIn && info ? (
                                        <>
                                          <div className="flex items-center justify-between">
                                            <span className="text-slate-500">Check-in Time:</span>
                                            <span className="font-bold text-slate-800 font-mono">
                                              {info.checkInTime}
                                            </span>
                                          </div>
                                          {info.latitude && info.longitude ? (
                                            <div className="flex items-center justify-between">
                                              <span className="text-slate-500">GPS Stamp:</span>
                                              <a
                                                href={`https://www.google.com/maps?q=${info.latitude},${info.longitude}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-emerald-700 hover:text-emerald-800 font-mono font-bold flex items-center gap-0.5 underline text-[10px]"
                                              >
                                                <MapPin className="w-3 h-3 text-emerald-600" />
                                                <span>{Number(info.latitude).toFixed(4)}°, {Number(info.longitude).toFixed(4)}°</span>
                                              </a>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-between">
                                              <span className="text-slate-500">Site Location:</span>
                                              <span className="font-semibold text-slate-700 text-[10px]">Rooftop Verified</span>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="flex items-center justify-between text-amber-700">
                                          <span>Awaiting on-site arrival</span>
                                          <Clock className="w-3 h-3" />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quick Check-in action if not checked in */}
                                  {!isCheckedIn && (
                                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex justify-end">
                                      <button
                                        type="button"
                                        disabled={checkingInMember === member}
                                        onClick={() => handleQuickCheckInMember(member)}
                                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>{checkingInMember === member ? 'Marking...' : 'Mark Checked In'}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Historical / Recorded Attendance Events for Today */}
                          {allAttendanceLogs.length > 0 && (
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                                Logged Site Check-in Events ({allAttendanceLogs.length} Records)
                              </span>
                              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                                {allAttendanceLogs.map((att, idx) => {
                                  const members = Array.isArray(att.presentTeamMembers) ? att.presentTeamMembers : [att.siteLeadName];
                                  return (
                                    <div key={idx} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        <div>
                                          <span className="font-bold text-slate-900">
                                            {att.siteLeadName || 'Site Crew'}
                                          </span>
                                          <span className="text-slate-500 ml-1.5">
                                            {members.length > 1 ? `with ${members.join(', ')}` : 'logged check-in'}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px] shrink-0">
                                        <span>{att.date} at {att.checkInTime || att.check_in_time || '09:00'}</span>
                                        {att.latitude && att.longitude && (
                                          <a
                                            href={`https://www.google.com/maps?q=${att.latitude},${att.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-emerald-700 underline flex items-center gap-0.5"
                                          >
                                            <MapPin className="w-3 h-3" />
                                            <span>{Number(att.latitude).toFixed(4)}°, {Number(att.longitude).toFixed(4)}°</span>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Site Tasks Section */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <ListTodo className="w-4 h-4 text-emerald-600" />
                            <span>Tasks Uploaded by Installation Team &amp; PM</span>
                          </h4>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Dynamic site tasks written and executed on site. Check off tasks or assign new scopes.
                          </p>
                        </div>

                        {selectedProject.stage !== 'Completed' ? (
                          <button
                            onClick={() => setShowPmAddTaskModal(true)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Task</span>
                          </button>
                        ) : (
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-semibold border border-slate-200 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Tasks Finalized (Completed)</span>
                          </span>
                        )}
                      </div>

                      {(!selectedProject.tasks || selectedProject.tasks.length === 0) ? (
                        <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl">
                          <ListTodo className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                          <p className="text-xs text-slate-500 font-medium">No tasks logged for this project yet.</p>
                          {selectedProject.stage !== 'Completed' && (
                            <button
                              onClick={() => setShowPmAddTaskModal(true)}
                              className="mt-2.5 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                              + Create First Task
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedProject.tasks.map((task) => {
                            const isDone = Boolean(task.isCompleted || task.status === 'Completed');
                            return (
                              <div
                                key={task.id}
                                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                  isDone ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                                }`}
                              >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <button
                                    onClick={() => {
                                      const nextCompleted = !isDone;
                                      updateProjectTask(selectedProject.id, task.id, nextCompleted);
                                      const updated = (selectedProject.tasks || []).map(t => 
                                        t.id === task.id ? { ...t, isCompleted: nextCompleted, status: nextCompleted ? 'Completed' as const : 'Pending' as const } : t
                                      );
                                      setSelectedProject({ ...selectedProject, tasks: updated });
                                    }}
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors ${
                                      isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 hover:border-emerald-500 bg-white'
                                    }`}
                                  >
                                    {isDone && <Check className="w-3.5 h-3.5" />}
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                        {task.title}
                                      </span>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                        {task.category || 'Site Task'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                                      <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span>Assignee: {task.assignedTo || task.assignedToName || 'Installation Team'}</span>
                                      </span>
                                      {task.dueDate && (
                                        <span className="flex items-center gap-1 font-mono">
                                          <Calendar className="w-3 h-3" />
                                          <span>Target: {task.dueDate}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                                  isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isDone ? 'Completed' : (task.status || 'Pending')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 6. STAGE: INSTALLATION COMPLETED                              */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Installation Completed' && (
                  <div className="space-y-4">
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-emerald-600" />
                            <span>Milestone 6: 12-Point EPC Commissioning Checklist</span>
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Strict technical inspection passed before grid synchronization.
                          </p>
                        </div>

                        <button
                          onClick={() => onNavigate('installation')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Open 12-Point Checklist View</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        {[
                          'Structure Fastening & Torque',
                          'Module Clamping & Pitch',
                          'Inverter Wall Mounting',
                          'DC Wiring Conduit Protected',
                          'AC Cabling Armoured & Clipped',
                          'Chemical Earthing Pits (<5Ω)',
                          'Lightning Arrester Installed',
                          'DCDB Protection Fuses Verified',
                          'ACDB Isolator Test',
                          'Remote Wi-Fi Monitoring Sync',
                          'Voc & Isc String Multi-meter Test',
                          'Safety Warning Signages Affixed'
                        ].map((chk, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-slate-800 font-medium text-[11px]">{chk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 7. STAGE: COMMISSIONING                                       */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Commissioning' && (
                  <div className="space-y-4">
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Zap className="w-4 h-4 text-emerald-600" />
                          <span>Milestone 7: DISCOM Net-Metering &amp; Grid Synchronization</span>
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Synchronization Ready
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Sanction Ref</span>
                          <span className="font-mono font-bold text-slate-900 block mt-0.5">{selectedProject.discomSanctionNumber || 'BESCOM-SANC-2026-9941'}</span>
                        </div>
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Target Handover</span>
                          <span className="font-mono font-bold text-emerald-700 block mt-0.5">{selectedProject.targetCompletionDate}</span>
                        </div>
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">DISCOM Inspector</span>
                          <span className="font-semibold text-slate-800 block mt-0.5">Joint Inspection Cleared</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600">
                        Bi-directional net meter installed by DISCOM engineer. Inverter Anti-Islanding and voltage sync verified. Solar plant is actively exporting green energy to the grid.
                      </p>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 8. STAGE: COMPLETED                                           */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Completed' && (
                  <div className="space-y-4">
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Milestone 8: Final Handover, Warranty &amp; AMC Initiation</span>
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Project Commissioned &amp; Closed
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Panel Warranty</span>
                          <span className="font-bold text-emerald-700 block mt-0.5">25-Year Performance</span>
                        </div>
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Inverter Warranty</span>
                          <span className="font-bold text-emerald-700 block mt-0.5">5-Year Replacement</span>
                        </div>
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Portal</span>
                          <span className="font-semibold text-slate-800 block mt-0.5">Credentials Issued</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600">
                        Handover certificate signed by {selectedProject.customerName}. AMC contract registered in service schedule.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PM Add Custom Task Modal */}
          {showPmAddTaskModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Assign New Site Task</h3>
                  </div>
                  <button
                    onClick={() => setShowPmAddTaskModal(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!selectedProject) return;
                    const assignee = pmNewTaskAssignee || selectedProject.installationLeadName || 'Muthu Vel';
                    const newTask: ProjectTask = {
                      id: `TSK-${Date.now()}`,
                      title: pmNewTaskTitle.trim(),
                      stage: selectedProject.stage,
                      isCompleted: false,
                      assignedRole: 'Installation Team',
                      assignedToName: assignee,
                      dueDate: selectedProject.targetCompletionDate || '2026-11-20',
                      status: 'Pending',
                      assignedTo: assignee,
                      category: pmNewTaskCategory
                    };
                    addProjectTask(selectedProject.id, newTask);
                    setSelectedProject({
                      ...selectedProject,
                      tasks: [...(selectedProject.tasks || []), newTask]
                    });
                    setPmNewTaskTitle('');
                    setShowPmAddTaskModal(false);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Task Title / Work Scope *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Verify inverter surge protection & grounding"
                      value={pmNewTaskTitle}
                      onChange={(e) => setPmNewTaskTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={pmNewTaskCategory}
                        onChange={(e) => setPmNewTaskCategory(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-emerald-600"
                      >
                        <option value="Structure">Structure</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Inverter">Inverter</option>
                        <option value="Safety">Safety</option>
                        <option value="BOS">BOS &amp; Earthing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Assignee</label>
                      <input
                        type="text"
                        value={pmNewTaskAssignee}
                        onChange={(e) => setPmNewTaskAssignee(e.target.value)}
                        placeholder="Muthu Vel"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-emerald-600"
                      >
                      </input>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowPmAddTaskModal(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Add &amp; Assign Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}


      {/* VIEW MODE 2: FULL-WIDTH HIGH-DENSITY PROJECTS GRID */}
      {activeViewMode === 'grid' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Solar EPC Projects &amp; Milestones
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Turnkey installation execution, material reservation, DISCOM net-metering liaison, and commissioning.
              </p>
            </div>

            <button
              onClick={() => onNavigate('installation')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>12-Point Safety Checklist</span>
            </button>
          </div>

          {/* Banner 1: Truly Ready for Project Conversion (Customer-signed GRN on site) */}
          {readyToConvertQuotes.length > 0 && (
            <div className="p-4.5 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border-2 border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3.5">
                <span className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 animate-bounce">
                  <Rocket className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {readyToConvertQuotes.length} Client-Accepted Deal{readyToConvertQuotes.length > 1 ? 's' : ''} Ready to Convert to Project
                    </h4>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-600 text-white animate-pulse">
                      Materials Signed ✓ • Ready for Handover
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {readyToConvertQuotes.map(q => `${q.leadName} (${q.quotationNumber} • ${q.systemCapacityKw} kW)`).join(', ')} — materials received on site &amp; verified with customer electronic signature. Click to launch EPC execution.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('quotations')}
                className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <Rocket className="w-4 h-4 text-emerald-200" />
                <span>Launch EPC Handover &rarr;</span>
              </button>
            </div>
          )}

          {/* Banner 2: Deals in Procurement (Purchase Team sourcing equipment) */}
          {inProcurementQuotes.length > 0 && (
            <div className="p-4.5 bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-slate-500/10 border-2 border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3.5">
                <span className="p-2.5 bg-amber-600 text-white rounded-xl shadow-xs shrink-0">
                  <Truck className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {inProcurementQuotes.length} Deal{inProcurementQuotes.length > 1 ? 's' : ''} in Procurement (Purchase Team)
                    </h4>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-amber-600 text-white">
                      Equipment Sourcing In Progress
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {inProcurementQuotes.map(q => `${q.leadName} (${q.quotationNumber} • ${q.systemCapacityKw} kW)`).join(', ')} — Purchase Team is issuing supplier POs and managing site delivery. EPC project conversion unlocks once materials arrive with customer digital signature (GRN).
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('quotations')}
                className="px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <Truck className="w-4 h-4 text-amber-400" />
                <span>Track Procurement Status &rarr;</span>
              </button>
            </div>
          )}

          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total Projects Executed
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {totalProjects}
              </div>
              <span className="text-[11px] font-semibold text-slate-500 block">
                Active Contracts Under Management
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total Capacity In Progress
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {totalCapacityKw.toFixed(1)} kW
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 block">
                Turnkey Solar Rooftop Power
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                In Active Installation
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {activeExecutionCount} Plants
              </div>
              <span className="text-[11px] font-semibold text-amber-600 block">
                Civil &amp; Electrical Mounting Active
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Fully Commissioned
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {commissionedCount} Plants
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 block">
                Grid Synchronized &amp; Generating
              </span>
            </div>
          </div>

          {/* Full-Width High-Density Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search project ID, customer, sanction reference..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <select
                  value={stageFilter}
                  onChange={e => setStageFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="All">All Stages</option>
                  {stages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Mobile Card List (< lg) */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <div className="py-12 text-center text-slate-400 p-4 text-xs">
                  No projects match your current search or stage filter.
                </div>
              ) : (
                filteredProjects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProject(p);
                      setActiveViewMode('detail');
                    }}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-xs text-slate-900 block truncate">
                          {p.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm truncate mt-0.5">{p.customerName}</h4>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {p.customerAddress}
                        </span>
                      </div>

                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        p.stage === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        p.stage.includes('Installation') ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {p.stage}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Capacity</span>
                        <span className="font-bold text-slate-900 font-mono">{p.capacityKw} kW Solar</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Target Completion</span>
                        <span className="font-bold text-slate-900 font-mono">{p.targetCompletionDate || 'Upcoming'}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Project Manager:</span>
                        <span className="font-semibold text-slate-800">{p.projectManagerName || 'Karthik Raja'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onNavigate('installation')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                      >
                        12-Point Checklist
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProject(p);
                          setActiveViewMode('detail');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                      >
                        Open Workspace
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop High-Density Data Table (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Project ID</th>
                    <th className="py-3 px-4">Customer &amp; Site</th>
                    <th className="py-3 px-4 text-center">Capacity</th>
                    <th className="py-3 px-4">Execution Stage</th>
                    <th className="py-3 px-4">DISCOM Sanction</th>
                    <th className="py-3 px-4">Project Manager</th>
                    <th className="py-3 px-4 text-center">Target Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No projects match your current search or stage filter.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map(p => (
                      <tr 
                        key={p.id}
                        onClick={() => {
                          setSelectedProject(p);
                          setActiveViewMode('detail');
                        }}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-emerald-700">
                          {p.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{p.customerName}</div>
                          <div className="text-[11px] text-slate-400">{p.customerAddress}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                          {p.capacityKw} kW
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            p.stage === 'Completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            p.stage.includes('Installation') ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {p.stage}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {p.discomSanctionNumber || 'BESCOM-SANC-2026'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 font-medium">
                          {p.projectManagerName}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                          {p.targetCompletionDate}
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedProject(p);
                                setActiveViewMode('detail');
                              }}
                              className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => onNavigate('installation')}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              Checklist
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
              <span>Showing {filteredProjects.length} of {projects.length} EPC projects</span>
              <div className="flex items-center gap-1 font-semibold text-slate-600">
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PM SITE READINESS CONFIRMATION MODAL */}
      {showReadinessModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Step 6: PM Site Readiness Approval</h3>
                  <p className="text-[11px] text-slate-400">Project: {selectedProject.id} • {selectedProject.customerName}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReadinessModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSiteReadiness} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                <strong>Project Manager Clearance:</strong> Before installation team commences work, verify that the physical rooftop civil conditions and electrical interconnect points meet technical standards.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Installation Kickoff Date *</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2.5 pt-1">
                <label className="block text-xs font-bold text-slate-800">Pre-Installation Mandatory Clearances</label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shadowFreeConfirmed}
                    onChange={e => setShadowFreeConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900">Shadow-Free Rooftop Area &amp; Pathway Clearance</span>
                    <p className="text-[11px] text-slate-500">Confirmed unobstructed sun exposure and safe ladder/stairway roof access</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={civilIntegrityConfirmed}
                    onChange={e => setCivilIntegrityConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900">Civil Structural &amp; Waterproofing Integrity</span>
                    <p className="text-[11px] text-slate-500">RCC roof slab anchor points tested; chemical waterproofing approved</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={electricalClearanceConfirmed}
                    onChange={e => setElectricalClearanceConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900">Electrical Interconnect &amp; LT Panel Clearance</span>
                    <p className="text-[11px] text-slate-500">Inverter wall space cleared, AC/DC conduit route planned, and main breaker accessible</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PM Readiness &amp; Scheduling Remarks</label>
                <textarea
                  rows={2}
                  value={readinessNotes}
                  onChange={e => setReadinessNotes(e.target.value)}
                  placeholder="Notes for installation crew lead, safety gear reminders..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReadinessModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConfirmingReadiness}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isConfirmingReadiness ? 'Confirming...' : 'Approve Readiness & Unlock Installation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
