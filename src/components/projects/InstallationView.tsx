import React, { useState, useEffect } from 'react';
import { 
  Wrench, CheckCircle2, ShieldCheck, 
  ArrowRight, ArrowLeft, Check, AlertTriangle, Users, MapPin, Clock, 
  Search, Filter, Calendar, Zap, PackageCheck, UserCheck, RefreshCw, ChevronRight,
  Plus, X, ListTodo, CheckSquare, Tag, FileText, Sparkles
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { InstallationChecklist, Project, ProjectTask } from '../../types';
import { getApiUrl } from '../../utils/apiUrl';

export const InstallationView: React.FC = () => {
  const { 
    projects, 
    updateInstallationChecklist, 
    updateProjectStage, 
    updateProjectTask, 
    addProjectTask, 
    currentUser 
  } = useCrm();

  // Navigation View Mode: 'list' (Work Orders List) vs 'detail' (Project Installation Workspace)
  const [activeViewMode, setActiveViewMode] = useState<'list' | 'detail'>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'READY' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  const [successAlert, setSuccessAlert] = useState(false);

  // Field Attendance State
  const [attendanceMode, setAttendanceMode] = useState<'solo' | 'team'>('solo');
  const [siteLeadName, setSiteLeadName] = useState(currentUser?.name || 'Muthu Vel');
  const [teamMembersInput, setTeamMembersInput] = useState('Rahul (Fitter), Suresh (Electrician), Imran (Rigger)');
  const [attendanceGps, setAttendanceGps] = useState<{ lat?: number; lng?: number } | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [attendanceLoggedToday, setAttendanceLoggedToday] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);

  // Custom Site Tasks Form State (Requirement 1: Technicians can write & add their own tasks)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(currentUser?.name || 'Muthu Vel');
  const [newTaskCategory, setNewTaskCategory] = useState<'Structure' | 'Electrical' | 'Inverter' | 'Safety' | 'BOS'>('Electrical');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTaskTab, setActiveTaskTab] = useState<'all' | 'custom' | 'standard'>('all');

  const token = localStorage.getItem('ab_solar_token') || localStorage.getItem('ab_energy_auth_token') || '';
  const authFetch = (url: string, opts: any = {}) => {
    const fullUrl = url.startsWith('http') ? url : getApiUrl(url);
    const headers = { ...(opts.headers || {}), Authorization: `Bearer ${token}` };
    return fetch(fullUrl, { ...opts, headers });
  };

  // Sync current user name into site lead if logged in
  useEffect(() => {
    if (currentUser?.name && !siteLeadName) {
      setSiteLeadName(currentUser.name);
      setNewTaskAssignee(currentUser.name);
    }
  }, [currentUser]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Fetch project attendance
  const fetchAttendance = async (projId: string) => {
    if (!projId) return;
    try {
      const res = await authFetch(`/api/installation/attendance/${projId}`);
      const data = await res.json();
      if (data.success && data.attendance) {
        setAttendanceLogs(data.attendance);
        const todayStr = new Date().toISOString().split('T')[0];
        const hasToday = data.attendance.some((a: any) => a.date?.startsWith(todayStr));
        setAttendanceLoggedToday(hasToday);
      }
    } catch (e) {
      console.error('Error fetching attendance in InstallationView:', e);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchAttendance(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleSelectProject = (project: Project) => {
    setSelectedProjectId(project.id);
    setActiveViewMode('detail');
  };

  const handleCaptureGpsAndCheckIn = () => {
    setIsCheckingIn(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setAttendanceGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          submitAttendance(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          submitAttendance();
        },
        { timeout: 8000 }
      );
    } else {
      submitAttendance();
    }
  };

  const submitAttendance = async (lat?: number, lng?: number) => {
    try {
      let members: string[] = [];
      if (attendanceMode === 'solo') {
        members = [siteLeadName.trim() || 'Site Lead'];
      } else {
        const parsed = teamMembersInput.split(',').map(m => m.trim()).filter(Boolean);
        if (parsed.length > 0 && !parsed.includes(siteLeadName)) {
          members = [siteLeadName, ...parsed];
        } else {
          members = parsed.length > 0 ? parsed : [siteLeadName];
        }
      }

      const res = await authFetch('/api/installation/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          siteLeadName: siteLeadName.trim() || 'Site Lead',
          presentTeamMembers: members,
          latitude: lat || null,
          longitude: lng || null,
          date: new Date().toISOString().split('T')[0],
          notes: attendanceMode === 'solo' 
            ? 'Solo site inspection & attendance checked in.' 
            : `Team of ${members.length} technicians checked in at rooftop installation site.`
        })
      });
      const data = await res.json();
      setIsCheckingIn(false);
      if (data.success) {
        setAttendanceLoggedToday(true);
        fetchAttendance(selectedProjectId);
        alert(`✓ Daily attendance logged successfully! [${members.length} Member(s) present]`);
      } else {
        alert(data.error || 'Failed to record attendance');
      }
    } catch (e: any) {
      setIsCheckingIn(false);
      alert(e.message);
    }
  };

  // Checklist
  const checklist = selectedProject?.checklist || {
    structureFastening: false,
    moduleClampingTorque: false,
    inverterWallMounting: false,
    dcWiringConduit: false,
    acWiringArmoured: false,
    chemicalEarthingPits: false,
    lightningArrester: false,
    dcdbProtectionFuses: false,
    acdbMccbIsolator: false,
    remoteMonitoringConfigured: false,
    vocAndIscTesting: false,
    safetySignagesAffixed: false,
    photosUploaded: [],
  };

  type BooleanChecklistKey = 
    | 'structureFastening' 
    | 'moduleClampingTorque' 
    | 'inverterWallMounting' 
    | 'dcWiringConduit' 
    | 'acWiringArmoured' 
    | 'chemicalEarthingPits' 
    | 'lightningArrester' 
    | 'dcdbProtectionFuses' 
    | 'acdbMccbIsolator' 
    | 'remoteMonitoringConfigured' 
    | 'vocAndIscTesting' 
    | 'safetySignagesAffixed';

  const checklistItems: { key: BooleanChecklistKey; label: string; desc: string }[] = [
    { key: 'structureFastening', label: '1. HDG Structure Fastening & Anchor Bolting', desc: 'Base anchor fasteners grouted with epoxy chemical mortar; zero roof vibration.' },
    { key: 'moduleClampingTorque', label: '2. Solar Module Clamping & Torque Verification', desc: 'End and mid-clamps torqued to 12 Nm; rubber cushions installed.' },
    { key: 'inverterWallMounting', label: '3. Inverter Wall Mounting & Thermal Clearance', desc: 'Inverter mounted vertically with 300mm air clearance on all sides; IP65 sealed.' },
    { key: 'dcWiringConduit', label: '4. DC Solar Cable UV Conduit Routing', desc: '4 sq.mm / 6 sq.mm XLPO copper DC cable enclosed in heavy-duty UV resistant conduit.' },
    { key: 'acWiringArmoured', label: '5. AC Armoured Cable & Glanding', desc: 'Heavy duty aluminium/copper armoured cable glanded and grounded at both ends.' },
    { key: 'chemicalEarthingPits', label: '6. Chemical Earthing Pits Resistance (< 2 Ohms)', desc: 'Dedicated pits for Inverter, Structure, and Lightning Arrester measured with Megger.' },
    { key: 'lightningArrester', label: '7. ESE Lightning Arrester Installation', desc: 'Mounted minimum 2 meters above highest solar panel point; dedicated down-conductor.' },
    { key: 'dcdbProtectionFuses', label: '8. DCDB 1000V DC Fuses & Type II SPDs', desc: 'Individual string fuses tested; DC isolator switch mechanism verified.' },
    { key: 'acdbMccbIsolator', label: '9. ACDB MCCB / MCB & Grid Disconnect', desc: 'Bi-directional grid isolator operable under emergency stop test.' },
    { key: 'remoteMonitoringConfigured', label: '10. Cloud WiFi / 4G Remote Monitoring Data Logger', desc: 'Inverter registered on monitoring portal; live inverter packet verified.' },
    { key: 'vocAndIscTesting', label: '11. String Open-Circuit Voltage (Voc) & Polarity Test', desc: 'Measured within ±2% of design sheet calculations across all strings.' },
    { key: 'safetySignagesAffixed', label: '12. Bilingual Safety Warning Signages Affixed', desc: 'Caution: Dual Power Supply hazard stickers pasted on LT panel and ACDB.' },
  ];

  const completedChecklistCount = checklistItems.filter(item => checklist[item.key]).length;

  // Custom Tasks logic (written and added by site technicians)
  const projectTasks: ProjectTask[] = selectedProject?.tasks || [];
  const completedTaskCount = projectTasks.filter(t => t.isCompleted).length;

  const handleToggleChecklistItem = (key: BooleanChecklistKey) => {
    if (!selectedProject) return;
    const newVal = !checklist[key];
    updateInstallationChecklist(selectedProject.id, { [key]: newVal });
  };

  const handleCompleteAll = () => {
    if (!selectedProject) return;
    const allDone: Partial<InstallationChecklist> = {};
    checklistItems.forEach(item => {
      allDone[item.key] = true;
    });
    updateInstallationChecklist(selectedProject.id, allDone);
  };

  // Add custom task written by installation team
  const handleCreateCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProject) return;

    const formattedTitle = `[${newTaskCategory}] ${newTaskTitle.trim()}`;
    const newTaskPayload = {
      title: formattedTitle,
      stage: selectedProject.stage,
      assignedRole: 'Installation Team' as const,
      assignedToName: newTaskAssignee || siteLeadName,
      dueDate: newTaskDueDate,
      isCompleted: false,
    };

    addProjectTask(selectedProject.id, newTaskPayload);

    // Sync to backend projects table
    try {
      const updatedTasks = [
        ...projectTasks,
        {
          id: `TSK-${Date.now().toString().slice(-6)}`,
          ...newTaskPayload,
        }
      ];
      await authFetch(`/api/projects/${selectedProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updatedTasks })
      });
    } catch (err) {
      console.error('Error syncing custom task to server:', err);
    }

    setNewTaskTitle('');
    setShowAddTaskModal(false);
  };

  // Toggle custom task completion
  const handleToggleTask = async (task: ProjectTask) => {
    if (!selectedProject) return;
    const nextCompleted = !task.isCompleted;
    updateProjectTask(selectedProject.id, task.id, nextCompleted);

    try {
      const updatedTasks = projectTasks.map(t => 
        t.id === task.id ? { ...t, isCompleted: nextCompleted, completedAt: nextCompleted ? new Date().toISOString() : undefined } : t
      );
      await authFetch(`/api/projects/${selectedProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updatedTasks })
      });
    } catch (err) {
      console.error('Error syncing task toggle to server:', err);
    }
  };

  const handleSignOffAndCommission = async () => {
    if (!selectedProject) return;
    updateProjectStage(selectedProject.id, 'Installation Completed');
    try {
      await authFetch('/api/installation/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          milestone: 'Installation Quality Sign-Off (12-Point Completed)',
          status: 'Completed',
          percentageCompleted: 100,
          loggedBy: siteLeadName,
          notes: 'All safety and structural items verified complete by installation lead.'
        })
      });
    } catch (e) {
      console.error(e);
    }
    setSuccessAlert(true);
    setTimeout(() => setSuccessAlert(false), 4000);
  };

  // Filter projects for the list view
  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.customerAddress && p.customerAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.installationLeadName && p.installationLeadName.toLowerCase().includes(searchQuery.toLowerCase()));

    const isSiteReady = Boolean(
      (p as any)?.site_readiness_confirmed || 
      (p as any)?.siteReadinessConfirmed ||
      p.stage === 'Installation Scheduled' ||
      p.stage === 'Installation In Progress' ||
      p.stage === 'Installation Completed' ||
      p.stage === 'Commissioning' ||
      p.stage === 'Completed'
    );

    if (stageFilter === 'READY') return matchesSearch && isSiteReady && p.stage !== 'Completed';
    if (stageFilter === 'IN_PROGRESS') return matchesSearch && (p.stage === 'Installation Scheduled' || p.stage === 'Installation In Progress');
    if (stageFilter === 'COMPLETED') return matchesSearch && (p.stage === 'Installation Completed' || p.stage === 'Commissioning' || p.stage === 'Completed');
    return matchesSearch;
  });

  // ==========================================
  // VIEW MODE 1: ASSIGNED PROJECTS LIST VIEW
  // ==========================================
  if (activeViewMode === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Top Header Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 mb-2">
                <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                <span>Field Crew Work Orders &amp; Site Operations</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Assigned Rooftop Installation Projects
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Select an assigned installation project below to review site readiness clearance, check in daily crew attendance, and execute custom site tasks.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px]">Logged-in Crew Lead:</span>
                <span className="font-bold text-slate-800">{siteLeadName}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Work Orders</span>
              <span className="text-lg font-black text-slate-900 font-mono">{projects.length}</span>
            </div>
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">PM Cleared (Ready)</span>
              <span className="text-lg font-black text-emerald-900 font-mono">
                {projects.filter(p => p.stage === 'Installation Scheduled' || (p as any)?.site_readiness_confirmed).length}
              </span>
            </div>
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">In Progress</span>
              <span className="text-lg font-black text-amber-900 font-mono">
                {projects.filter(p => p.stage === 'Installation In Progress').length}
              </span>
            </div>
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Completed</span>
              <span className="text-lg font-black text-blue-900 font-mono">
                {projects.filter(p => p.stage === 'Installation Completed' || p.stage === 'Completed').length}
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, project ID, site address..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Projects' },
              { id: 'READY', label: 'Cleared for Site Work' },
              { id: 'IN_PROGRESS', label: 'Installation Ongoing' },
              { id: 'COMPLETED', label: 'Completed' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStageFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  stageFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Work Order Cards Grid */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No matching installation projects found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or stage filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => {
              const isSiteReady = Boolean(
                (project as any)?.site_readiness_confirmed || 
                (project as any)?.siteReadinessConfirmed ||
                project.stage === 'Installation Scheduled' ||
                project.stage === 'Installation In Progress' ||
                project.stage === 'Installation Completed' ||
                project.stage === 'Commissioning' ||
                project.stage === 'Completed'
              );

              const isCompleted = project.stage === 'Installation Completed' || project.stage === 'Completed';

              return (
                <div
                  key={project.id}
                  className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md">
                        {project.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted ? 'bg-emerald-100 text-emerald-800' :
                        project.stage === 'Installation In Progress' ? 'bg-blue-100 text-blue-800' :
                        project.stage === 'Installation Scheduled' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {project.stage}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                        {project.customerName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{project.customerAddress || 'Customer Site'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Capacity</span>
                        <span className="font-bold text-slate-800 font-mono">{project.capacityKw} kW Solar</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Target Date</span>
                        <span className="font-bold text-slate-800 font-mono text-[11px]">{project.targetCompletionDate || 'Upcoming'}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Installation Lead:</span>
                        <span className="font-bold text-slate-800">{project.installationLeadName || siteLeadName}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      {isSiteReady ? (
                        <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Site Readiness Cleared (PM Approved)</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Awaiting PM Site Readiness Clearance</span>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="text-slate-400">Material Status:</span>
                      <span className={`font-bold ${
                        project.material_readiness_status === 'Fully Received at Site' 
                          ? 'text-emerald-700' 
                          : 'text-amber-700'
                      }`}>
                        {project.material_readiness_status || 'In Warehouse'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleSelectProject(project)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs group-hover:bg-emerald-600"
                    >
                      <span>Open Site Work Order</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW MODE 2: SELECTED PROJECT DETAIL WORKSPACE
  // ==========================================
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Project Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveViewMode('list')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Work Orders</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-xs font-bold">
                {selectedProject?.id}
              </span>
              <h1 className="text-base font-extrabold text-slate-900">
                {selectedProject?.customerName}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{selectedProject?.customerAddress || 'Customer Site'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.customerName} ({p.id}) - {p.stage}
              </option>
            ))}
          </select>

          <button
            onClick={handleCompleteAll}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Check All 12 Quality Items
          </button>
        </div>
      </div>

      {successAlert && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <strong>Installation Completed &amp; Verified!</strong> Milestone logged and DISCOM Net-Metering inspection triggered for project manager.
          </div>
        </div>
      )}

      {/* Step 6: Site Readiness Status Banner */}
      {(() => {
        const isSiteReady = Boolean(
          (selectedProject as any)?.site_readiness_confirmed || 
          (selectedProject as any)?.siteReadinessConfirmed ||
          selectedProject?.stage === 'Installation Scheduled' ||
          selectedProject?.stage === 'Installation In Progress' ||
          selectedProject?.stage === 'Installation Completed' ||
          selectedProject?.stage === 'Commissioning' ||
          selectedProject?.stage === 'Completed'
        );

        if (!isSiteReady) {
          return (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs text-amber-950">
                <span className="font-bold text-sm block">Step 6: Awaiting Project Manager Site Readiness Approval</span>
                Physical rooftop installation cannot begin yet. The assigned Project Manager ({selectedProject?.projectManagerName || 'Karthik Raja'}) must inspect the site, confirm shadow-free access, civil structural anchoring, and electrical tie-in clearance before installation activities unlock.
              </div>
            </div>
          );
        }

        return (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-950 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold">Step 6 Cleared: Site Readiness Confirmed by PM ({selectedProject?.projectManagerName || 'Karthik Raja'})</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800">
              Installation Target: {selectedProject?.targetCompletionDate}
            </span>
          </div>
        );
      })()}

      {/* DAILY ATTENDANCE & PRE-INSTALLATION CHECK ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Attendance Check-in Widget (Supports Single Member Solo vs Multiple Crew Team) */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <Users className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Site Team Daily Attendance Check-In</h3>
                <p className="text-[11px] text-slate-400">Rooftop labor crew verification with GPS timestamp</p>
              </div>
            </div>

            {attendanceLoggedToday ? (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Checked In Today</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold">
                Check-in Pending
              </span>
            )}
          </div>

          {/* Solo vs Multiple Crew Mode Selector */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500">Check-in Mode:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setAttendanceMode('solo')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  attendanceMode === 'solo' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Solo / Single Member
              </button>
              <button
                type="button"
                onClick={() => setAttendanceMode('team')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  attendanceMode === 'team' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Multiple Crew Members
              </button>
            </div>
            
            <span className="text-[10px] font-mono text-slate-400 ml-auto">
              {attendanceMode === 'solo' ? '1 Person Check-in' : 'Team Check-in'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Site Lead Name</label>
              <input
                type="text"
                value={siteLeadName}
                onChange={e => setSiteLeadName(e.target.value)}
                placeholder="Enter lead engineer name"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-indigo-500"
              />
            </div>

            {attendanceMode === 'team' ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Additional Crew Members</label>
                <input
                  type="text"
                  value={teamMembersInput}
                  onChange={e => setTeamMembersInput(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-indigo-500"
                  placeholder="Comma separated: Suresh (Elec), Rahul (Fitter)"
                />
              </div>
            ) : (
              <div className="flex flex-col justify-end">
                <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 flex items-center gap-1.5 font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Logging solo attendance for <strong>{siteLeadName}</strong></span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{attendanceGps ? `GPS: ${attendanceGps.lat?.toFixed(4)}, ${attendanceGps.lng?.toFixed(4)}` : 'GPS Captured on Submit'}</span>
            </span>

            <button
              type="button"
              disabled={isCheckingIn}
              onClick={handleCaptureGpsAndCheckIn}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isCheckingIn ? 'Capturing GPS...' : attendanceLoggedToday ? 'Re-Log Attendance' : 'Check In Team Attendance'}</span>
            </button>
          </div>
        </div>

        {/* Material Readiness Status Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Material Readiness</h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              selectedProject?.material_readiness_status === 'Fully Received at Site' ? 'bg-emerald-100 text-emerald-800' :
              selectedProject?.material_readiness_status === 'Partial Shortage' ? 'bg-amber-100 text-amber-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {selectedProject?.material_readiness_status || 'In Warehouse'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-600">Site Delivery:</span>
              <span className="text-slate-900 font-bold truncate max-w-[140px] text-right">{selectedProject?.customerAddress || 'Customer Site'}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-slate-600">Capacity:</span>
              <span className="text-slate-900 font-mono font-bold">{selectedProject?.capacityKw} kW</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              {selectedProject?.material_readiness_status === 'Fully Received at Site' ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Modules, Inverter &amp; BOS physically received. Ready for installation.</span>
                </span>
              ) : (
                <span className="text-amber-800 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Procurement / delivery in progress. Check PO status before unboxing.</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REQUIREMENT 1: FIELD TASKS WRITTEN & UPLOADED BY CREW (DYNAMIC TASK FORM) */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <ListTodo className="w-4 h-4" />
              </span>
              <h2 className="text-base font-extrabold text-slate-900">
                Installation Tasks Written &amp; Uploaded by Field Crew
              </h2>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-mono text-[10px] font-bold">
                {completedTaskCount} / {projectTasks.length} Completed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Write and record customized site execution tasks, electrical runs, safety items, or mounting notes directly.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddTaskModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Write &amp; Add Site Task</span>
          </button>
        </div>

        {/* Task List */}
        {projectTasks.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <ListTodo className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No custom site tasks added yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Write &amp; Add Site Task" to log tasks executed by your rooftop crew.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {projectTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  task.isCompleted
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                  task.isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-xs font-bold truncate ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded shrink-0 ${
                      task.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {task.isCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1 text-slate-600 font-semibold">
                      <UserCheck className="w-3 h-3 text-slate-400" />
                      <span>{task.assignedToName || 'Site Crew'}</span>
                    </span>
                    <span>Due: {task.dueDate}</span>
                    {task.completedAt && (
                      <span className="text-emerald-700 font-medium">
                        ✓ Done {task.completedAt.split('T')[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Write &amp; Add Site Task</h3>
              </div>
              <button 
                onClick={() => setShowAddTaskModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Task Title / Action Item Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inverter display IP65 seal check &amp; WiFi setup"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Discipline / Category
                  </label>
                  <select
                    value={newTaskCategory}
                    onChange={e => setNewTaskCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Electrical">Electrical Wiring</option>
                    <option value="Structure">Structure &amp; Anchors</option>
                    <option value="Inverter">Inverter &amp; Protection</option>
                    <option value="Safety">Safety &amp; Signages</option>
                    <option value="BOS">BOS &amp; Earthing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Assigned Technician
                  </label>
                  <input
                    type="text"
                    value={newTaskAssignee}
                    onChange={e => setNewTaskAssignee(e.target.value)}
                    placeholder="Technician name"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={e => setNewTaskDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Add Task to Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12-POINT QUALITY CHECKLIST */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              12-Point EPC Compliance Quality Checklist
            </h2>
            <p className="text-xs text-slate-500">
              Assigned Installation Lead: <strong className="text-slate-800">{selectedProject?.installationLeadName || siteLeadName}</strong>
            </p>
          </div>

          <div className="text-right">
            <div className="text-xl font-black text-slate-900 font-mono">
              {completedChecklistCount} / {checklistItems.length}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Points Verified</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${(completedChecklistCount / checklistItems.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 12 Checklist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {checklistItems.map(item => {
          const isDone = checklist[item.key];
          return (
            <div 
              key={item.key} 
              onClick={() => handleToggleChecklistItem(item.key)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                isDone 
                  ? 'bg-emerald-50/60 border-emerald-300' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              <div className="space-y-0.5 flex-1">
                <h4 className={`text-xs font-bold ${isDone ? 'text-emerald-950 line-through' : 'text-slate-900'}`}>
                  {item.label}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            {completedChecklistCount === checklistItems.length
              ? 'All 12 items verified compliant. Ready to sign off installation and submit for net-metering commissioning.' 
              : `${checklistItems.length - completedChecklistCount} safety items remain to be checked.`
            }
          </span>
        </div>

        <button
          onClick={handleSignOffAndCommission}
          disabled={completedChecklistCount !== checklistItems.length}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <span>Sign Off &amp; Trigger Net-Metering</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
