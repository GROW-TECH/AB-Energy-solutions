import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, Plus, Search, Filter, Wrench, CheckCircle2, 
  Clock, AlertTriangle, ShieldCheck, ArrowRight, User, Calendar,
  ArrowLeft, Check, Layers, ChevronRight, ChevronLeft, Rocket,
  ShoppingCart, FileText, CheckCheck, Users, MapPin, Eye, ExternalLink, PackageCheck, Zap,
  Truck, Package, X, ListTodo, CheckSquare, Timer, Flag, Activity, Sparkles, Building2,
  Landmark, Lock, Video, Camera, Play, CheckCircle
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Project, ProjectStage, ProjectTask } from '../../types';
import { NavItemKey } from '../layout/Sidebar';
import { getApiUrl } from '../../utils/apiUrl';
import { getProjectBomItems } from '../../utils/bomUtils';

interface ProjectsViewProps {
  onNavigate: (tab: NavItemKey) => void;
}

export const mapTo4Step = (st: string = ''): ProjectStage => {
  if (st === 'Completed' || st === 'Commissioning' || st === 'Installation Completed') return 'Completed';
  if (st === 'Installation In Progress' || st === 'Testing') return 'Installation In Progress';
  if (st === 'Installation Scheduled') return 'Installation Scheduled';
  return 'Material Arrived';
};

export const stages: ProjectStage[] = [
  'Material Arrived',
  'Installation Scheduled',
  'Installation In Progress',
  'Completed',
];

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onNavigate }) => {
  const { projects, updateProject, updateProjectStage, quotations, currentUser, updateProjectTask, addProjectTask, employees, recordPayment, payments } = useCrm();
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
  const [selectedStageMilestone, setSelectedStageMilestone] = useState<ProjectStage>(
    selectedProject ? mapTo4Step(selectedProject.stage) : 'Material Arrived'
  );

  const [showPmAddTaskModal, setShowPmAddTaskModal] = useState(false);
  const [pmNewTaskTitle, setPmNewTaskTitle] = useState('');
  const [pmNewTaskAssignee, setPmNewTaskAssignee] = useState(selectedProject?.installationLeadName || 'Muthu Vel');
  const [pmNewTaskCategory, setPmNewTaskCategory] = useState<'Structure' | 'Electrical' | 'Inverter' | 'Safety' | 'BOS'>('Electrical');

  // PM Site Readiness Confirmation Modal State
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [shadowFreeConfirmed, setShadowFreeConfirmed] = useState(true);
  const [structuralIntegrityConfirmed, setStructuralIntegrityConfirmed] = useState(true);
  const [electricalClearanceConfirmed, setElectricalClearanceConfirmed] = useState(true);
  const [readinessNotes, setReadinessNotes] = useState('Rooftop surveyed, mounting anchors tested, and BESCOM tie-in clearance approved.');
  const [isConfirmingReadiness, setIsConfirmingReadiness] = useState(false);

  // Grid Live & 5-10 Yr AMC Activation Modal State
  const [showGridLiveModal, setShowGridLiveModal] = useState(false);
  const [amcYearsInput, setAmcYearsInput] = useState<number>(5);
  const [meterReadingInput, setMeterReadingInput] = useState<string>('12.5');
  const [installationTargetDaysInput, setInstallationTargetDaysInput] = useState<number>(3);

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
          structuralIntegrityConfirmed,
          civilIntegrityConfirmed: structuralIntegrityConfirmed,
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
    try {
      const res = await authFetch(`/api/installation/command-centre/${projectId}`);
      const data = await res.json();
      if (data.success && data.commandCentre) {
        setCommandCentre(data.commandCentre);
        if (data.commandCentre.project) {
          const cp = data.commandCentre.project;
          const parsedChecklist = typeof cp.checklist === 'string'
            ? (() => { try { return JSON.parse(cp.checklist); } catch { return {}; } })()
            : (cp.checklist || {});

          const resolvedTargetDate = parsedChecklist.targetCompletionDate || cp.target_completion_date || undefined;
          const resolvedStartDate = parsedChecklist.startDate || cp.start_date || cp.scheduled_installation_date || undefined;
          const resolvedDurationDays = Number(parsedChecklist.installationDurationDays) || Number(cp.installation_duration_days) || undefined;
          const resolvedSiteSurveyVerified = Boolean(cp.site_survey_verified || parsedChecklist.siteSurveyVerified);
          const resolvedMaterialArrived = Boolean(cp.material_arrived_on_site || parsedChecklist.materialArrivedOnSite);
          const resolvedArrivedIds = parsedChecklist.arrivedMaterialIds || undefined;
          const resolvedPhotos = typeof cp.post_install_photos === 'string'
            ? (() => { try { return JSON.parse(cp.post_install_photos); } catch { return undefined; } })()
            : (cp.post_install_photos || parsedChecklist.postInstallPhotos);
          const resolvedVideo = cp.commissioning_video_url || parsedChecklist.commissioningVideoUrl;
          const resolvedAttPhoto = cp.attendance_photo_url || parsedChecklist.attendancePhotoUrl;

          setSelectedProject(prev => {
            if (!prev || prev.id !== cp.id) return prev;
            return {
              ...prev,
              stage: cp.stage || prev.stage,
              startDate: resolvedStartDate || prev.startDate,
              targetCompletionDate: resolvedTargetDate || prev.targetCompletionDate,
              scheduled_installation_date: resolvedStartDate || (prev as any).scheduled_installation_date,
              installationDurationDays: resolvedDurationDays || prev.installationDurationDays || 2,
              checklist: parsedChecklist,
              arrivedMaterialIds: resolvedArrivedIds || prev.arrivedMaterialIds || [],
              materialArrivedOnSite: resolvedMaterialArrived ?? prev.materialArrivedOnSite,
              materialArrivedConfirmedAt: cp.material_arrived_confirmed_at || parsedChecklist.materialArrivedConfirmedAt || prev.materialArrivedConfirmedAt,
              materialArrivedConfirmedBy: cp.material_arrived_confirmed_by || parsedChecklist.materialArrivedConfirmedBy || prev.materialArrivedConfirmedBy,
              siteSurveyVerified: resolvedSiteSurveyVerified ?? prev.siteSurveyVerified,
              siteSurveyVerifiedAt: cp.site_survey_verified_at || parsedChecklist.siteSurveyVerifiedAt || prev.siteSurveyVerifiedAt,
              siteSurveyVerifiedBy: cp.site_survey_verified_by || parsedChecklist.siteSurveyVerifiedBy || prev.siteSurveyVerifiedBy,
              postInstallPhotos: resolvedPhotos !== undefined ? resolvedPhotos : prev.postInstallPhotos,
              commissioningVideoUrl: resolvedVideo !== undefined ? resolvedVideo : prev.commissioningVideoUrl,
              attendancePhotoUrl: resolvedAttPhoto || prev.attendancePhotoUrl,
              pmClearanceStatus: cp.pm_clearance_status || prev.pmClearanceStatus,
              pmClearedBy: cp.pm_cleared_by || prev.pmClearedBy,
              pmClearedAt: cp.pm_cleared_at || prev.pmClearedAt,
            };
          });
        }
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
      const timer = setInterval(() => {
        fetchCommandCentre(selectedProject.id);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [activeViewMode, selectedProject?.id]);

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
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedProject.customerName}</h2>
                  {(selectedProject.lastModifiedRole === 'Super Admin' || selectedProject.lastModifiedRole === 'CEO') && (
                    <span 
                      title={`Edited by ${selectedProject.lastModifiedBy || selectedProject.lastModifiedRole}${selectedProject.lastModifiedAt ? ' at ' + new Date(selectedProject.lastModifiedAt).toLocaleDateString() : ''}`}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Edited by {selectedProject.lastModifiedRole === 'CEO' ? 'CEO' : 'Super Admin'} ({selectedProject.lastModifiedBy || 'Admin'})
                    </span>
                  )}
                </div>
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

            {/* Government Subsidy Quick Badge */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-navy-950 rounded-xl p-3.5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-emerald-800/40">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Landmark className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Govt. Subsidy Support: Central DBT Scheme</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                      ₹78,000 CFA Eligible (DCR Modules)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    National Portal Application: <span className="font-mono text-emerald-300 font-semibold">DBT-TN-2026-98124</span> &bull; TANGEDCO Net Metering &amp; Inspection
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
            {/* 4-STAGE INTERACTIVE STEPPER (COORDINATED LIFECYCLE)       */}
            {/* ========================================================= */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>EPC Project Milestones (PM &amp; Installation Team Coordinated)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">4 Key Lifecycle Stages</span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pb-1">
                {stages.map((st, idx) => {
                  const currentMapped = mapTo4Step(selectedProject.stage);
                  const currentIdx = stages.indexOf(currentMapped);
                  const isDone = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  const isSelectedInView = projectDetailView === 'stage' && selectedStageMilestone === st;

                  const stepLabels = [
                    'Step 1: Material Arrival',
                    'Step 2: Schedule & Survey',
                    'Step 3: Crew Attendance',
                    'Step 4: Media, Warranty & Handover'
                  ];

                  const stepDescriptions = [
                    selectedProject.materialArrivedOnSite ? 'On site verified ✓' : 'Awaiting receipt',
                    selectedProject.siteSurveyVerified ? 'Survey & clearness verified ✓' : 'Schedule & audit',
                    'Daily check-in & execution',
                    selectedProject.stage === 'Completed' ? 'Handover completed ✓' : '4 photos, video & AMC'
                  ];

                  return (
                    <button
                      key={st}
                      onClick={() => {
                        setSelectedStageMilestone(st);
                        setProjectDetailView('stage');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
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
                        <span className="font-bold">{stepLabels[idx]}</span>
                        {isDone ? (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                        ) : (
                          <span className="text-slate-300">○</span>
                        )}
                      </div>
                      <div className={`text-xs truncate ${isSelectedInView ? 'font-black text-emerald-900' : isCurrent ? 'font-bold text-emerald-950' : isDone ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                        {st}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {stepDescriptions[idx]}
                      </div>
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
                  const startDateStr = selectedProject.startDate || '2026-11-02';
                  const schedDateStr = (selectedProject as any).scheduled_installation_date || selectedProject.startDate || '2026-11-02';
                  const endDateStr = selectedProject.targetCompletionDate || '2026-11-06';
                  const currentMapped = mapTo4Step(selectedProject.stage);
                  const currentIdx = stages.indexOf(currentMapped);
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
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {selectedProject.installationDurationDays ? `${selectedProject.installationDurationDays} Days Duration Target` : 'Target Handover'}
                          </div>
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
                          <span className="font-semibold text-emerald-400">Current: {currentMapped}</span>
                          <span>Target End: {endDateStr}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Current Milestone Spotlight Card */}
                {(() => {
                  const currentMapped = mapTo4Step(selectedProject.stage);
                  const currentIdx = stages.indexOf(currentMapped);
                  const bomItemsList = getProjectBomItems(commandCentre?.bomItems, selectedProject?.capacityKw || 5);
                  const arrivedMaterialIds: string[] = selectedProject?.arrivedMaterialIds || 
                    (selectedProject?.checklist as any)?.arrivedMaterialIds || [];
                  const arrivedCount = bomItemsList.filter((it: any) => arrivedMaterialIds.includes(it.id) || arrivedMaterialIds.includes(it.itemName)).length;
                  const allArrived = (arrivedCount === bomItemsList.length && bomItemsList.length > 0) || selectedProject.materialArrivedOnSite;

                  return (
                    <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                            {currentMapped === 'Completed' ? 'EPC LIFECYCLE COMPLETED' : 'CURRENT ACTIVE MILESTONE'}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {currentMapped === 'Completed' 
                              ? 'Project Successfully Commissioned & Closed ✓' 
                              : `Step ${currentIdx + 1}: ${currentMapped}`}
                          </span>
                          {currentMapped === 'Material Arrived' && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              allArrived ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {allArrived ? 'All Materials Verified on Site ✓' : `${arrivedCount}/${bomItemsList.length} Materials Received`}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 max-w-xl">
                          {currentMapped === 'Completed'
                            ? 'All 4 EPC lifecycle milestones (Material Arrival, Schedule & Survey, Crew Attendance, and Handover with Warranty) are completed and closed.'
                            : currentMapped === 'Material Arrived'
                            ? allArrived 
                              ? 'All materials verified at checklist by Installation Crew. Ready to confirm schedule and site survey clearness.'
                              : 'Materials dispatched to site. Field installation crew is inspecting crates and striking out the BOM checklist.'
                            : `This project is actively in ${currentMapped}. Work items and documents for this phase are tracked in its dedicated workspace.`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        {currentMapped === 'Material Arrived' && allArrived && (
                          <button
                            onClick={async () => {
                              const now = new Date().toISOString();
                              const pmName = currentUser?.name || 'Project Manager';
                              await updateProject(selectedProject.id, {
                                stage: 'Installation Scheduled',
                                materialArrivedOnSite: true,
                                materialArrivedConfirmedAt: now,
                                materialArrivedConfirmedBy: pmName,
                              });
                              setSelectedProject(prev => prev ? ({
                                ...prev,
                                stage: 'Installation Scheduled',
                                materialArrivedOnSite: true,
                                materialArrivedConfirmedAt: now,
                                materialArrivedConfirmedBy: pmName,
                              }) : null);
                              setSelectedStageMilestone('Installation Scheduled');
                              setProjectDetailView('stage');
                            }}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span>Move to Next Stage (Step 2)</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedStageMilestone(currentMapped);
                            setProjectDetailView('stage');
                          }}
                          className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{currentMapped === 'Completed' ? 'View Final Handover & Warranty' : `Open ${currentMapped} Workspace`}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

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
                                : 'Physical site work is on hold until PM confirms shadow-free clearance, roof structural anchor points, and electrical tie-in.'}
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

                {/* 3.5. On-Site BOM Material Receipt Checklist Card (Real-Time Installation Crew Sync) */}
                {(() => {
                  const bomItemsList = getProjectBomItems(commandCentre?.bomItems, selectedProject?.capacityKw || 5);
                  const arrivedMaterialIds: string[] = selectedProject?.arrivedMaterialIds || 
                    (selectedProject?.checklist as any)?.arrivedMaterialIds || [];
                  const arrivedCount = bomItemsList.filter((it: any) => arrivedMaterialIds.includes(it.id) || arrivedMaterialIds.includes(it.itemName)).length;
                  const allArrived = (arrivedCount === bomItemsList.length && bomItemsList.length > 0) || selectedProject.materialArrivedOnSite;

                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                              <Layers className="w-4 h-4" />
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              On-Site BOM Material Receipt Checklist (Installation Crew Live Sync)
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Real-time view of materials verified and striked out on site by the installation crew
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            allArrived 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {allArrived 
                              ? 'All 14 Materials Received on Site ✓' 
                              : `${arrivedCount} of ${bomItemsList.length} Materials Received`}
                          </span>

                          {allArrived && mapTo4Step(selectedProject.stage) === 'Material Arrived' && (
                            <button
                              onClick={async () => {
                                const now = new Date().toISOString();
                                const pmName = currentUser?.name || 'Project Manager';
                                await updateProject(selectedProject.id, {
                                  stage: 'Installation Scheduled',
                                  materialArrivedOnSite: true,
                                  materialArrivedConfirmedAt: now,
                                  materialArrivedConfirmedBy: pmName,
                                });
                                setSelectedProject(prev => prev ? ({
                                  ...prev,
                                  stage: 'Installation Scheduled',
                                  materialArrivedOnSite: true,
                                  materialArrivedConfirmedAt: now,
                                  materialArrivedConfirmedBy: pmName,
                                }) : null);
                                setSelectedStageMilestone('Installation Scheduled');
                                setProjectDetailView('stage');
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Move to Step 2 &rarr;</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Info Alert Banner */}
                      {allArrived ? (
                        <div className="p-3.5 bg-emerald-50/90 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <strong className="font-bold">All materials verified at checklist by Installation Crew!</strong>
                              <p className="text-[11px] text-emerald-800 mt-0.5">
                                Physical rooftop crates unboxed and inspected by {selectedProject.materialArrivedConfirmedBy || 'Installation Lead'}. Cleared to proceed to Step 2 (Schedule &amp; Survey Clearness).
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              const now = new Date().toISOString();
                              const pmName = currentUser?.name || 'Project Manager';
                              await updateProject(selectedProject.id, {
                                stage: 'Installation Scheduled',
                                materialArrivedOnSite: true,
                                materialArrivedConfirmedAt: now,
                                materialArrivedConfirmedBy: pmName,
                              });
                              setSelectedProject(prev => prev ? ({
                                ...prev,
                                stage: 'Installation Scheduled',
                                materialArrivedOnSite: true,
                                materialArrivedConfirmedAt: now,
                                materialArrivedConfirmedBy: pmName,
                              }) : null);
                              setSelectedStageMilestone('Installation Scheduled');
                              setProjectDetailView('stage');
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <span>Move to Next Stage (Step 2) &rarr;</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Awaiting Installation Crew to unbox delivery and tick each item on site ({arrivedCount}/{bomItemsList.length} verified).</span>
                        </div>
                      )}

                      {/* Checklist Table (Read-only for PM) */}
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs divide-y divide-slate-200">
                          <thead>
                            <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase">
                              <th className="py-2.5 px-3 w-12 text-center">Status</th>
                              <th className="py-2.5 px-3 w-10 text-center">#</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3">Equipment / Component Description</th>
                              <th className="py-2.5 px-3">Specification</th>
                              <th className="py-2.5 px-3 text-center">Unit</th>
                              <th className="py-2.5 px-3 text-center">Qty</th>
                              <th className="py-2.5 px-3 text-center">Receipt Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium bg-white">
                            {bomItemsList.map((item: any, idx: number) => {
                              const isArrived = arrivedMaterialIds.includes(item.id) || arrivedMaterialIds.includes(item.itemName);
                              return (
                                <tr 
                                  key={item.id || idx} 
                                  className={`transition-colors ${isArrived ? 'bg-emerald-50/50' : 'hover:bg-slate-50/60'}`}
                                >
                                  <td className="py-2.5 px-3 text-center">
                                    {isArrived ? (
                                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold mx-auto">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="w-4 h-4 rounded-full border-2 border-slate-300 inline-block align-middle" />
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                  <td className={`py-2.5 px-3 font-semibold ${isArrived ? 'line-through text-slate-400 opacity-60' : 'text-slate-900'}`}>
                                    {item.category}
                                  </td>
                                  <td className={`py-2.5 px-3 font-bold ${isArrived ? 'line-through text-slate-400 opacity-60' : 'text-slate-800'}`}>
                                    {item.itemName}
                                  </td>
                                  <td className={`py-2.5 px-3 font-mono text-[10px] ${isArrived ? 'line-through text-slate-400 opacity-60' : 'text-slate-600'}`}>
                                    {item.technicalSpecification || '-'}
                                  </td>
                                  <td className={`py-2.5 px-3 text-center font-semibold ${isArrived ? 'line-through text-slate-400 opacity-60' : 'text-slate-700'}`}>
                                    {item.unit || 'Nos'}
                                  </td>
                                  <td className={`py-2.5 px-3 text-center font-mono font-bold ${isArrived ? 'line-through text-slate-400 opacity-60' : 'text-slate-900'}`}>
                                    {item.quantity}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {isArrived ? (
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>Received on Site ✓</span>
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                        Awaiting Crew Unbox
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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
                          Step {stages.indexOf(selectedStageMilestone) + 1} of 4: {selectedStageMilestone} Workspace
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          stages.indexOf(selectedStageMilestone) < stages.indexOf(mapTo4Step(selectedProject.stage)) 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : selectedStageMilestone === mapTo4Step(selectedProject.stage) 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {stages.indexOf(selectedStageMilestone) < stages.indexOf(mapTo4Step(selectedProject.stage)) 
                            ? 'Completed ✓' 
                            : selectedStageMilestone === mapTo4Step(selectedProject.stage) 
                            ? 'Currently Active' 
                            : 'Upcoming'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Coordinated workflow between Project Manager and Installation Field Crew.
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
                    ) : selectedStageMilestone !== mapTo4Step(selectedProject.stage) ? (
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
                {/* 1. STAGE: MATERIAL ARRIVED ON SITE                            */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Material Arrived' && (
                  <div className="space-y-4">
                    {/* Material Arrival On-Site Status Card */}
                    <div className={`p-5 rounded-2xl border transition-all ${
                      selectedProject.materialArrivedOnSite
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                        : 'bg-amber-50/80 border-amber-300 text-amber-950'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          {selectedProject.materialArrivedOnSite ? (
                            <PackageCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Truck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-sm sm:text-base">
                                {selectedProject.materialArrivedOnSite
                                  ? 'Materials Confirmed Arrived on Site'
                                  : 'Material Sourcing & Delivery to Site in Progress'}
                              </h3>
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                selectedProject.materialArrivedOnSite
                                  ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                  : 'bg-amber-200 text-amber-900 border border-amber-300'
                              }`}>
                                {selectedProject.materialArrivedOnSite ? 'Materials On Site ✓' : 'Awaiting Arrival'}
                              </span>
                            </div>
                            <p className="text-xs mt-1 leading-relaxed">
                              {selectedProject.materialArrivedOnSite ? (
                                <span>
                                  Installation Team confirmed all purchased BOM items arrived intact at customer rooftop on{' '}
                                  <strong className="font-mono text-emerald-900">
                                    {selectedProject.materialArrivedConfirmedAt ? new Date(selectedProject.materialArrivedConfirmedAt).toLocaleString() : 'Recently'}
                                  </strong>{' '}
                                  (Verified by {selectedProject.materialArrivedConfirmedBy || 'Installation Lead'}).
                                </span>
                              ) : (
                                <span>
                                  Purchase team has dispatched components. When the delivery arrives at the customer site, the on-site installation crew inspects the BOM and confirms arrival. Project Manager is notified immediately upon receipt.
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {!selectedProject.materialArrivedOnSite && (
                          <button
                            onClick={async () => {
                              const now = new Date().toISOString();
                              const pmName = currentUser?.name || 'Project Manager';
                              await updateProject(selectedProject.id, {
                                materialArrivedOnSite: true,
                                materialArrivedConfirmedAt: now,
                                materialArrivedConfirmedBy: pmName,
                                stage: 'Installation Scheduled'
                              });
                              setSelectedProject({
                                ...selectedProject,
                                materialArrivedOnSite: true,
                                materialArrivedConfirmedAt: now,
                                materialArrivedConfirmedBy: pmName,
                                stage: 'Installation Scheduled'
                              });
                              setSelectedStageMilestone('Installation Scheduled');
                            }}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <PackageCheck className="w-4 h-4" />
                            <span>Confirm Material Arrived on Site ✓</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Commercial & Contract Value Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Linked Quotation</span>
                        <div className="font-mono font-bold text-slate-900">{selectedProject.quotationId || 'QT-2026-00026-V1'}</div>
                        <div className="text-[11px] text-slate-500">{selectedProject.capacityKw} kW System</div>
                      </div>
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contract Value</span>
                        <div className="font-mono font-bold text-emerald-700">₹{Number(selectedProject.totalAmount || 0).toLocaleString('en-IN')}</div>
                        <div className="text-[11px] text-emerald-600 font-semibold">13.8% Composite GST Inclusive</div>
                      </div>
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Milestone</span>
                        <div className="font-bold text-slate-900">90% Advance Paid</div>
                        <div className="text-[11px] text-slate-500">Balance 10% on Commissioning</div>
                      </div>
                    </div>

                    {/* Dispatched Equipment Bill of Materials Table (Synced with Field Crew) */}
                    {(() => {
                      const bomItemsList = getProjectBomItems(commandCentre?.bomItems, selectedProject?.capacityKw || 5);
                      const arrivedMaterialIds: string[] = selectedProject?.arrivedMaterialIds || 
                        (selectedProject?.checklist as any)?.arrivedMaterialIds || [];
                      const arrivedCount = bomItemsList.filter((it: any) => arrivedMaterialIds.includes(it.id) || arrivedMaterialIds.includes(it.itemName)).length;
                      const allArrived = (arrivedCount === bomItemsList.length && bomItemsList.length > 0) || selectedProject.materialArrivedOnSite;

                      return (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                <Layers className="w-4 h-4 text-emerald-600" />
                                <span>Dispatched Equipment &amp; Bill of Materials (BOM)</span>
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Real-time on-site arrival checklist verified and striked out by the field installation crew
                              </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              allArrived
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {allArrived
                                ? 'All Materials Received ✓'
                                : `${arrivedCount} of ${bomItemsList.length} Received on Site`}
                            </span>
                          </div>

                          {/* Field Crew Receipt Progress Bar */}
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <span>Field Crew Receipt Progress:</span>
                                <span className="font-mono text-emerald-700 font-extrabold">{arrivedCount} / {bomItemsList.length} Items Striked Out</span>
                              </span>
                              <span className="font-mono font-bold text-slate-600 text-xs">
                                {Math.round((arrivedCount / (bomItemsList.length || 1)) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.round((arrivedCount / (bomItemsList.length || 1)) * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400">
                              (Read-only for Project Manager. Checklist updates live as the installation crew inspects and ticks each item on site.)
                            </p>
                          </div>

                          <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-xs divide-y divide-slate-200">
                              <thead>
                                <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase">
                                  <th className="py-2.5 px-3 w-12 text-center">Status</th>
                                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                                  <th className="py-2.5 px-3">Category</th>
                                  <th className="py-2.5 px-3">Equipment / Component Description</th>
                                  <th className="py-2.5 px-3">Specification</th>
                                  <th className="py-2.5 px-3 text-center">Unit</th>
                                  <th className="py-2.5 px-3 text-center">Qty Dispatched</th>
                                  <th className="py-2.5 px-3 text-center">Receipt Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium bg-white">
                                {bomItemsList.map((item: any, idx: number) => {
                                  const isArrived = arrivedMaterialIds.includes(item.id) || arrivedMaterialIds.includes(item.itemName);
                                  return (
                                    <tr 
                                      key={item.id || idx} 
                                      className={`transition-colors ${isArrived ? 'bg-emerald-50/50' : 'hover:bg-slate-50/60'}`}
                                    >
                                      <td className="py-2.5 px-3 text-center">
                                        {isArrived ? (
                                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold mx-auto">
                                            ✓
                                          </span>
                                        ) : (
                                          <span className="w-4 h-4 rounded-full border-2 border-slate-300 inline-block align-middle" />
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                      <td className={`py-2.5 px-3 font-semibold ${isArrived ? 'line-through text-slate-400 opacity-60' : 'text-slate-900'}`}>
                                        {item.category}
                                      </td>
                                      <td className={`py-2.5 px-3 font-bold ${isArrived ? 'line-through text-slate-400 opacity-60' : 'text-slate-800'}`}>
                                        {item.itemName}
                                      </td>
                                      <td className={`py-2.5 px-3 font-mono text-[10px] ${isArrived ? 'line-through text-slate-400 opacity-60' : 'text-slate-600'}`}>
                                        {item.technicalSpecification || '-'}
                                      </td>
                                      <td className={`py-2.5 px-3 text-center font-semibold ${isArrived ? 'line-through text-slate-400 opacity-60' : 'text-slate-700'}`}>
                                        {item.unit || 'Nos'}
                                      </td>
                                      <td className={`py-2.5 px-3 text-center font-mono font-bold ${isArrived ? 'line-through text-slate-400 opacity-60' : 'text-slate-900'}`}>
                                        {item.quantity}
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        {isArrived ? (
                                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                            <Check className="w-3 h-3 text-emerald-600" />
                                            <span>Received on Site ✓</span>
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                            Awaiting Crew Unbox
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="pt-2 flex justify-between items-center">
                            <div>
                              {allArrived ? (
                                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>All materials received on site. Cleared for installation scheduling.</span>
                                </span>
                              ) : (
                                <span className="text-xs text-amber-700 font-medium">
                                  Awaiting installation crew to unbox and strike out all {bomItemsList.length} items.
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => setSelectedStageMilestone('Installation Scheduled')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <span>Proceed to Step 2: Schedule &amp; Survey Clearness</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 2. STAGE: INSTALLATION SCHEDULED & SURVEY VERIFIED             */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Installation Scheduled' && (
                  <div className="space-y-4">
                    {/* Schedule & Duration Card */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span>Installation Execution Schedule &amp; Duration</span>
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Determined by the Installation Team based on system capacity and site conditions
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {selectedProject.siteSurveyVerified ? 'Schedule Locked ✓' : 'Kickoff Scheduled'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Kickoff Date</span>
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            {selectedProject.startDate || '2026-11-05'}
                          </div>
                          <div className="text-[10px] text-slate-500">Installation Start</div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Duration Required</span>
                          <div className="font-mono font-bold text-emerald-700 text-sm">
                            {selectedProject.installationDurationDays || 2} Days
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold">Decided by Field Crew</div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Target Handover</span>
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            {selectedProject.targetCompletionDate || '2026-11-07'}
                          </div>
                          <div className="text-[10px] text-slate-500">Target Completion</div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Field Lead</span>
                          <div className="font-bold text-slate-900 truncate">
                            {selectedProject.installationLeadName || 'Muthu Vel'}
                          </div>
                          <div className="text-[10px] text-slate-500">Field Operations</div>
                        </div>
                      </div>
                    </div>

                    {/* Site Survey Clearness Verification Card */}
                    <div className={`p-5 rounded-2xl border transition-all ${
                      selectedProject.siteSurveyVerified
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                        : 'bg-amber-50/80 border-amber-300 text-amber-950'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          {selectedProject.siteSurveyVerified ? (
                            <CheckCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-sm sm:text-base">
                                Site Survey Measurements &amp; Clearness Verification
                              </h3>
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                selectedProject.siteSurveyVerified
                                  ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                  : 'bg-amber-200 text-amber-900 border border-amber-300'
                              }`}>
                                {selectedProject.siteSurveyVerified ? 'Clearness Verified ✓' : 'Verification Required'}
                              </span>
                            </div>
                            <p className="text-xs mt-1 leading-relaxed">
                              {selectedProject.siteSurveyVerified ? (
                                <span>
                                  Installation team verified site survey measurements, shadow-free area, and structural anchors on{' '}
                                  <strong className="font-mono text-emerald-900">
                                    {selectedProject.siteSurveyVerifiedAt ? new Date(selectedProject.siteSurveyVerifiedAt).toLocaleString() : 'Recently'}
                                  </strong>{' '}
                                  (Verified by {selectedProject.siteSurveyVerifiedBy || 'Installation Lead'}).
                                </span>
                              ) : (
                                <span>
                                  The technical survey conducted by the survey engineer is shown below. The installation team reviews dimensions and clicks &quot;Verified Site Clearness &amp; Measurements&quot; to authorize commencement.
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {!selectedProject.siteSurveyVerified && (
                          <button
                            onClick={async () => {
                              const now = new Date().toISOString();
                              const pmName = currentUser?.name || 'Project Manager';
                              await updateProject(selectedProject.id, {
                                siteSurveyVerified: true,
                                siteSurveyVerifiedAt: now,
                                siteSurveyVerifiedBy: pmName,
                                stage: 'Installation In Progress'
                              });
                              setSelectedProject({
                                ...selectedProject,
                                siteSurveyVerified: true,
                                siteSurveyVerifiedAt: now,
                                siteSurveyVerifiedBy: pmName,
                                stage: 'Installation In Progress'
                              });
                              setSelectedStageMilestone('Installation In Progress');
                            }}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Confirm Site Clearness &amp; Authorize Crew ✓</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Direct Technical Survey Audit (Readout from Survey Engineer) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <FolderKanban className="w-4 h-4 text-teal-600" />
                            <span>Technical Site Survey Audit (Engineer Survey Readout)</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Direct technical audit captured during the initial on-site engineering survey
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          Survey Ref: SRV-2026-009
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Rooftop Structural &amp; Orientation Details</span>
                          </div>
                          <div className="space-y-1.5 text-slate-600">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Roof Surface Type:</span>
                              <span className="font-bold text-slate-900">RCC Flat Roof (Waterproofed)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Feasible Shadow-Free Area:</span>
                              <span className="font-mono font-bold text-slate-900">278 sq.ft Unobstructed</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">True South Orientation:</span>
                              <span className="font-bold text-emerald-700">Azimuth 180° / 12° Optimal Tilt</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Structure Anchoring:</span>
                              <span className="font-bold text-slate-800">Pre-Engineered Fasteners (Non-Penetrating)</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-600" />
                            <span>Electrical &amp; Grid Interconnect Clearances</span>
                          </div>
                          <div className="space-y-1.5 text-slate-600">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Inverter Mounting Location:</span>
                              <span className="font-bold text-slate-900">Covered Utility Wall (Shaded)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">DC Cable Route Length:</span>
                              <span className="font-mono font-bold text-slate-900">25 Meters (4 sq.mm UV)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">AC Cable Route Length:</span>
                              <span className="font-mono font-bold text-slate-900">12 Meters (6 sq.mm Copper)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">DISCOM Grid Sanction:</span>
                              <span className="font-mono font-bold text-emerald-700">{selectedProject.discomSanctionNumber || 'BESCOM-SANC-2026-9941'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setSelectedStageMilestone('Installation In Progress')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Proceed to Step 3: Daily Crew Attendance &amp; Tasks</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 3. STAGE: DAILY ATTENDANCE & INSTALLATION EXECUTION            */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Installation In Progress' && (
                  <div className="space-y-4">
                    {/* Daily Field Crew Attendance Card */}
                    {(() => {
                      const latestAtt = commandCentre?.attendance?.[0];
                      const isCheckedIn = Boolean(latestAtt || selectedProject.attendancePhotoUrl);
                      const gpsText = latestAtt?.latitude 
                        ? `${Number(latestAtt.latitude).toFixed(4)}° N, ${Number(latestAtt.longitude).toFixed(4)}° E`
                        : typeof selectedProject.attendanceGpsCoords === 'string'
                        ? selectedProject.attendanceGpsCoords
                        : (selectedProject.attendanceGpsCoords?.lat && selectedProject.attendanceGpsCoords?.lng)
                        ? `${selectedProject.attendanceGpsCoords.lat.toFixed(4)}° N, ${selectedProject.attendanceGpsCoords.lng.toFixed(4)}° E`
                        : null;
                      const timeText = latestAtt?.checkInTime 
                        ? `${latestAtt.date || 'Today'}, ${latestAtt.checkInTime}`
                        : latestAtt?.date 
                        ? latestAtt.date 
                        : null;
                      const checkInPhoto = selectedProject.attendancePhotoUrl || latestAtt?.selfieUrl || latestAtt?.photoUrl || null;
                      const siteLead = latestAtt?.siteLeadName || selectedProject.installationLeadName || 'Muthu Vel';

                      return (
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-600" />
                                <span>Daily Field Crew Attendance &amp; On-Site Verification</span>
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Rooftop labor crew check-in with live photographic evidence and GPS timestamp
                              </p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isCheckedIn 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {isCheckedIn ? 'Crew Checked-In ✓' : 'Awaiting Field Crew Check-In'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Attendance Details */}
                            <div className="md:col-span-2 space-y-3 text-xs">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Site Lead</span>
                                  <div className="font-bold text-slate-900 block mt-0.5">{siteLead}</div>
                                  <div className="text-[10px] text-slate-500">Team Commander</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Check-In GPS &amp; Timestamp</span>
                                  {isCheckedIn && (gpsText || timeText) ? (
                                    <>
                                      <div className="font-mono font-bold text-emerald-700 block mt-0.5">
                                        {gpsText || 'GPS Captured on Submit'}
                                      </div>
                                      <div className="text-[10px] text-slate-500">{timeText || 'Verified Today'}</div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="font-bold text-amber-700 block mt-0.5">
                                        Pending Check-In
                                      </div>
                                      <div className="text-[10px] text-slate-500">Awaiting site arrival check-in</div>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Rooftop Crew Members</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                  {(selectedProject.assigned_crew_members && selectedProject.assigned_crew_members.length > 0
                                    ? selectedProject.assigned_crew_members
                                    : ['Muthu Vel (Site Lead)', 'Karthik Mani (Inverter / Cabling)', 'Saravanan Perumal (Earthing / BOS)', 'Rajesh Varma (Structure Mounts)']
                                  ).map((memberStr: string, mIdx: number) => (
                                    <div key={mIdx} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200">
                                      <span className={`w-2 h-2 rounded-full ${isCheckedIn ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                                      <span className="font-semibold text-slate-800">{memberStr}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* On-Site Verification Selfie Photo */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                              <span className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Live Rooftop Check-In Photo</span>
                              {checkInPhoto ? (
                                <>
                                  <img
                                    src={checkInPhoto}
                                    alt="Field Crew Check-In"
                                    className="w-full h-32 object-cover rounded-lg border border-slate-200 shadow-2xs mb-2"
                                  />
                                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Photo Verified with Geotag</span>
                                  </span>
                                </>
                              ) : (
                                <div className="w-full h-32 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-3 text-slate-400 bg-white/60 mb-2">
                                  <Camera className="w-6 h-6 text-slate-300 mb-1" />
                                  <span className="text-[11px] font-bold text-slate-600">Awaiting Live Selfie</span>
                                  <span className="text-[9px] text-slate-400 mt-0.5">Appears immediately upon field check-in</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Live Installation Tasks & Quality Checklist */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <ListTodo className="w-4 h-4 text-emerald-600" />
                            <span>Installation Execution Tasks &amp; Quality Checklist</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Field tasks tracked in real-time between Project Manager and Installation Crew
                          </p>
                        </div>
                        <button
                          onClick={() => setShowPmAddTaskModal(true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Assign New Task</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {[
                          { id: 't1', title: 'Pre-engineered aluminum mounting structure & anchor bolting', category: 'Structure', done: true },
                          { id: 't2', title: 'Tier-1 solar PV modules mounted, aligned, and clamped', category: 'Structure', done: true },
                          { id: 't3', title: 'DC string cabling, conduit routing, and MC4 connectors crimped', category: 'Electrical', done: true },
                          { id: 't4', title: 'Dual chemical earthing pits installed with copper electrodes', category: 'BOS', done: true },
                          { id: 't5', title: 'Inverter mounted on wall, ACDB/DCDB connected, and isolators wired', category: 'Inverter', done: true },
                          { id: 't6', title: 'Pre-commissioning test: Voc, Isc, and earth resistance check (< 5 ohms)', category: 'Safety', done: true },
                        ].map(task => (
                          <div key={task.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              ✓
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-slate-800 text-xs block leading-snug">{task.title}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">{task.category}</span>
                                <span className="text-[10px] text-emerald-600 font-semibold">Completed on Site</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setSelectedStageMilestone('Completed')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Proceed to Step 4: Media, Warranty &amp; Handover</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 4. STAGE: MEDIA EVIDENCE, WARRANTY & SERVICE HANDOVER          */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Completed' && (() => {
                  const photos = selectedProject.postInstallPhotos || {};
                  const isRealMediaUrl = (v?: string | null) => {
                    if (!v || typeof v !== 'string') return false;
                    const trimmed = v.trim();
                    if (trimmed.length < 5) return false;
                    return trimmed.startsWith('data:') || trimmed.startsWith('http') || trimmed.startsWith('/uploads') || trimmed.startsWith('blob:');
                  };

                  const p1 = isRealMediaUrl(photos.panelFixing) ? photos.panelFixing : null;
                  const p2 = isRealMediaUrl(photos.inverterCabling) ? photos.inverterCabling : null;
                  const p3 = isRealMediaUrl(photos.earthingProtection) ? photos.earthingProtection : null;
                  const p4 = isRealMediaUrl(photos.plantWithCustomer) ? photos.plantWithCustomer : null;

                  const uploadedCount = [p1, p2, p3, p4].filter(Boolean).length;
                  const allPhotosUploaded = uploadedCount === 4;
                  const videoUrl = isRealMediaUrl(selectedProject.commissioningVideoUrl) ? selectedProject.commissioningVideoUrl : null;
                  const hasVideo = Boolean(videoUrl);
                  const allEvidenceReady = allPhotosUploaded && hasVideo;
                  const isCleared = selectedProject.pmClearanceStatus === 'Cleared' || selectedProject.stage === 'Completed';

                  return (
                    <div className="space-y-4">
                      {/* PM Field Review & Leave-Site Clearance Status */}
                      <div className={`p-5 rounded-2xl border transition-all ${
                        allEvidenceReady
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                          : 'bg-amber-50/80 border-amber-300 text-amber-950'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            {allEvidenceReady ? (
                              <CheckCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-black text-sm sm:text-base">PM Field Clearance &amp; Photographic Evidence Review</h3>
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                  isCleared
                                    ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                    : allEvidenceReady
                                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                    : 'bg-amber-200 text-amber-900 border border-amber-300'
                                }`}>
                                  {isCleared
                                    ? 'Crew Cleared to Leave Site ✓'
                                    : allEvidenceReady
                                    ? 'Evidence Ready for PM Sign-Off'
                                    : 'Awaiting Crew Uploads'}
                                </span>
                              </div>
                              <p className="text-xs mt-1 leading-relaxed">
                                {isCleared ? (
                                  <span>Site photos and live commissioning video reviewed and verified. Field installation crew is cleared for demobilization. Ready for final Grid Live sync and Service Team warranty transfer.</span>
                                ) : allEvidenceReady ? (
                                  <span>All 4 rooftop photos and client confirmation video have been uploaded by the installation crew. Review below and grant leave-site clearance.</span>
                                ) : (
                                  <span>Installation in progress. Field crew must upload 4 geotagged rooftop photos and client confirmation video before demobilization clearance can be granted ({uploadedCount}/4 photos uploaded, {hasVideo ? 'video ready ✓' : 'video pending'}).</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                            {!isCleared && allEvidenceReady && (
                              <button
                                onClick={async () => {
                                  const now = new Date().toISOString();
                                  const pmName = currentUser?.name || 'Project Manager';
                                  await updateProject(selectedProject.id, {
                                    pmClearanceStatus: 'Cleared',
                                    pmClearedBy: pmName,
                                    pmClearedAt: now,
                                  });
                                  setSelectedProject(prev => prev ? ({
                                    ...prev,
                                    pmClearanceStatus: 'Cleared',
                                    pmClearedBy: pmName,
                                    pmClearedAt: now,
                                  }) : null);
                                }}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                <span>Grant Leave-Site Clearance ✓</span>
                              </button>
                            )}

                            {selectedProject.stage !== 'Completed' && (
                              <button
                                onClick={() => setShowGridLiveModal(true)}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                              >
                                <Zap className="w-4 h-4" />
                                <span>Activate Grid Live &amp; Handover to Service</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 4 Geotagged Installed Photos from 4 Angles (Empty until uploaded by Install Crew) */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                              <Camera className="w-4 h-4 text-emerald-600" />
                              <span>Post-Installation Photographic Evidence (4 Angles)</span>
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Geotagged high-resolution evidence captured before demobilizing crew
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            allPhotosUploaded 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {allPhotosUploaded ? 'All 4 Angles Uploaded ✓' : `${uploadedCount} of 4 Angles Uploaded`}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { title: 'Angle 1: PV Array & Tilt', desc: 'Solar Module Layout', url: p1 },
                            { title: 'Angle 2: Inverter & Wiring', desc: 'ACDB/DCDB Dressing', url: p2 },
                            { title: 'Angle 3: Earthing Pit', desc: 'Dual Electrodes & Arrestor', url: p3 },
                            { title: 'Angle 4: Net-Meter & Plant', desc: 'With Customer On Site', url: p4 },
                          ].map((item, idx) => (
                            <div key={idx} className="space-y-1.5">
                              {item.url ? (
                                <div className="h-32 rounded-xl bg-slate-900 overflow-hidden relative group border border-slate-200 shadow-2xs">
                                  <img
                                    src={item.url}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                                    <span className="text-[10px] font-bold text-white truncate">{item.title}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-32 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 flex flex-col items-center justify-center p-2.5 text-center text-slate-400">
                                  <Camera className="w-6 h-6 text-slate-300 mb-1.5" />
                                  <span className="text-[11px] font-bold text-slate-600 block leading-tight">{item.title}</span>
                                  <span className="text-[9px] text-slate-400 mt-1">Awaiting field crew upload</span>
                                </div>
                              )}
                              <span className="text-[10px] text-slate-500 font-semibold block text-center truncate">{item.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rooftop Client Confirmation Video Player (Empty until uploaded) */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                              <Video className="w-4 h-4 text-emerald-600" />
                              <span>Rooftop Client Confirmation Video (Walkthrough &amp; Sign-off)</span>
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Live on-site video confirming customer satisfaction and plant operation (up to 5 mins or any length)
                            </p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            hasVideo 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {hasVideo ? 'Video Confirmed ✓' : 'Awaiting Video Upload'}
                          </span>
                        </div>

                        {hasVideo ? (
                          <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video max-h-72 flex items-center justify-center relative shadow-sm">
                            <video
                              controls
                              src={videoUrl!.startsWith('http') || videoUrl!.startsWith('blob:') ? videoUrl! : getApiUrl(videoUrl!)}
                              className="w-full h-full object-cover"
                            >
                              Your browser does not support HTML5 video.
                            </video>
                          </div>
                        ) : (
                          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-8 flex flex-col items-center justify-center text-center">
                            <Video className="w-8 h-8 text-slate-300 mb-2" />
                            <span className="text-xs font-bold text-slate-700">No Client Confirmation Video Uploaded Yet</span>
                            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                              The installation crew will record an on-site walkthrough video (up to 5 mins) with the customer and upload it. It will appear here immediately for review.
                            </p>
                          </div>
                        )}
                      </div>

                    {/* Warranty & AMC Duration Selection & Service Team Transfer */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Customer Warranty &amp; Service Team Handover</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Automatic registration into Service Team portal with recurring maintenance visits
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {selectedProject.stage === 'Completed' ? 'Service Handover Active ✓' : 'Ready for Handover'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        {[
                          { years: 5, label: '5 Years (Standard Included)', desc: 'Included with EPC contract' },
                          { years: 7, label: '7 Years (Extended Care)', desc: 'Quarterly health audits' },
                          { years: 8, label: '8 Years (Premium Complete)', desc: 'Comprehensive coverage' },
                          { years: 10, label: '10 Years (Full Lifecycle AMC)', desc: 'Full replacement guarantee' }
                        ].map(opt => (
                          <div
                            key={opt.years}
                            onClick={() => setAmcYearsInput(opt.years)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              amcYearsInput === opt.years
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className="font-extrabold text-slate-900 block text-xs">{opt.years} Years</span>
                            <span className="text-[10px] text-slate-600 font-semibold block mt-0.5">{opt.label}</span>
                            <span className="text-[9px] text-slate-400 block mt-1">{opt.desc}</span>
                          </div>
                        ))}
                      </div>

                      {selectedProject.stage !== 'Completed' ? (
                        <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div>
                            <span className="font-black text-sm text-emerald-950 flex items-center gap-1.5">
                              <Rocket className="w-4 h-4 text-emerald-600" />
                              <span>Complete Project &amp; Transfer to Service Team</span>
                            </span>
                            <p className="text-xs text-emerald-800 mt-0.5">
                              This sets the project status to Completed, generates the warranty dossier, and automatically schedules recurring AMC visits for {amcYearsInput} years in the Service Team portal.
                            </p>
                          </div>
                          <button
                            onClick={() => setShowGridLiveModal(true)}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer animate-pulse"
                          >
                            <Zap className="w-4 h-4" />
                            <span>Confirm Grid Live &amp; Handover ({amcYearsInput} Years)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800 text-xs">Project Successfully Closed &amp; Transferred</div>
                            <div className="text-[11px] text-slate-500">Registered in Service schedule expiring {new Date().getFullYear() + amcYearsInput}.</div>
                          </div>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300">
                            Closed ✓
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {inProcurementQuotes.length} Deal{inProcurementQuotes.length > 1 ? 's' : ''} in Procurement (Purchase Team)
                    </h4>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-amber-600 text-white">
                      Equipment Sourcing In Progress
                    </span>
                    {inProcurementQuotes.some(q => q.advancePaymentReceived || payments?.some(p => (p.isAdvance || p.paymentNumber?.includes('ADV')) && (p.quotationId === q.id || p.customerName?.toLowerCase() === q.leadName?.toLowerCase()))) && (
                      <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-700 text-white flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                        <span>Advance Paid</span>
                      </span>
                    )}
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
                Structural &amp; Electrical Mounting Active
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm truncate mt-0.5">{p.customerName}</h4>
                          {(p.lastModifiedRole === 'Super Admin' || p.lastModifiedRole === 'CEO') && (
                            <span 
                              title={`Edited by ${p.lastModifiedBy || p.lastModifiedRole}`}
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0"
                            >
                              Edited by {p.lastModifiedRole === 'CEO' ? 'CEO' : 'Super Admin'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {p.customerAddress}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {(p.advancePaymentReceived || payments?.some(pay => (pay.isAdvance || pay.paymentNumber?.includes('ADV')) && (pay.projectId === p.id || pay.customerName?.toLowerCase() === p.customerName?.toLowerCase()))) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Advance Paid</span>
                          </span>
                        )}
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          p.stage === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          p.stage.includes('Installation') ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {p.stage}
                        </span>
                      </div>
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900">{p.customerName}</span>
                            {(p.lastModifiedRole === 'Super Admin' || p.lastModifiedRole === 'CEO') && (
                              <span 
                                title={`Edited by ${p.lastModifiedBy || p.lastModifiedRole}${p.lastModifiedAt ? ' at ' + new Date(p.lastModifiedAt).toLocaleDateString() : ''}`}
                                className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-300"
                              >
                                Edited by {p.lastModifiedRole === 'CEO' ? 'CEO' : 'Super Admin'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{p.customerAddress}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                          {p.capacityKw} kW
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(p.advancePaymentReceived || payments?.some(pay => (pay.isAdvance || pay.paymentNumber?.includes('ADV')) && (pay.projectId === p.id || pay.customerName?.toLowerCase() === p.customerName?.toLowerCase()))) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Advance Paid</span>
                              </span>
                            )}
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              p.stage === 'Completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              p.stage.includes('Installation') ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {p.stage}
                            </span>
                          </div>
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
                <strong>Project Manager Clearance:</strong> Before installation team commences work, verify that the physical rooftop structural conditions and electrical interconnect points meet technical standards.
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
                    checked={structuralIntegrityConfirmed}
                    onChange={e => setStructuralIntegrityConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900">Rooftop Structural &amp; Mounting Anchor Integrity</span>
                    <p className="text-[11px] text-slate-500">RCC roof slab anchor points tested; pre-engineered mounting approved</p>
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

      {/* Grid Live & AMC Warranty Duration Modal (Client Meeting Requirement) */}
      {showGridLiveModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Grid Live Synchronization &amp; AMC Activation</h3>
                  <p className="text-[11px] text-slate-500">Official power generation start &amp; service contract enrollment</p>
                </div>
              </div>
              <button
                onClick={() => setShowGridLiveModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-950">
              <div className="flex justify-between font-bold">
                <span>Project ID: {selectedProject.id}</span>
                <span>Capacity: {selectedProject.capacityKw} kWp</span>
              </div>
              <div className="text-[11px] text-emerald-800">
                Customer: <strong>{selectedProject.customerName}</strong> ({selectedProject.customerPhone})
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const today = new Date().toISOString().split('T')[0];
                const readingNum = parseFloat(meterReadingInput) || 0;
                
                // 1. Update Project in State & MySQL
                updateProject(selectedProject.id, {
                  stage: 'Completed',
                  gridLiveDate: today,
                  amcWarrantyYears: amcYearsInput,
                  solarMeterInitialReading: readingNum,
                  ebInspectionCleared: true,
                  solarMeterFixed: true,
                  warrantyActivated: true,
                  amcInitiated: true,
                });

                // 2. Trigger CRM Stage update to auto-provision AMC contract in Service Portal
                updateProjectStage(selectedProject.id, 'Completed');

                setSelectedProject({
                  ...selectedProject,
                  stage: 'Completed',
                  gridLiveDate: today,
                  amcWarrantyYears: amcYearsInput,
                  solarMeterInitialReading: readingNum,
                  ebInspectionCleared: true,
                  solarMeterFixed: true,
                  warrantyActivated: true,
                  amcInitiated: true,
                });

                setSelectedStageMilestone('Completed');
                setShowGridLiveModal(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Select Customer Warranty &amp; AMC Duration *
                </label>
                <select
                  value={amcYearsInput}
                  onChange={e => setAmcYearsInput(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={5}>5 Years (Standard Included Warranty &amp; AMC)</option>
                  <option value={7}>7 Years (Extended Care &amp; Performance Contract)</option>
                  <option value={8}>8 Years (Premium Complete Care Contract)</option>
                  <option value={10}>10 Years (Comprehensive Full Lifecycle AMC)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  This automatically transfers the project into the Service Team portal with a {amcYearsInput}-year service contract and scheduled visits.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Initial Solar Meter Reading (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={meterReadingInput}
                    onChange={e => setMeterReadingInput(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Synchronization Date
                  </label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    disabled
                    className="w-full p-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-800 text-[11px]">Handover &amp; Service Actions:</div>
                <div className="text-[10px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Plant starts feeding green solar energy into the DISCOM grid.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Service Team portal registers AMC contract expiring in {new Date().getFullYear() + amcYearsInput}.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Customer receives warranty certificates and portal credentials.</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGridLiveModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Confirm Grid Live &amp; Activate {amcYearsInput}-Yr AMC</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
