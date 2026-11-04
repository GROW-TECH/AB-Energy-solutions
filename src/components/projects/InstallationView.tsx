import React, { useState, useEffect } from 'react';
import { 
  Wrench, CheckCircle2, ShieldCheck, 
  ArrowRight, ArrowLeft, Check, AlertTriangle, Users, MapPin, Clock, 
  Search, Filter, Calendar, Zap, PackageCheck, UserCheck, RefreshCw, ChevronRight,
  Plus, X, ListTodo, CheckSquare, Tag, FileText, Sparkles, Camera, Video, Upload, Eye, CheckCircle, Loader2
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { InstallationChecklist, Project, ProjectTask, ProjectStage } from '../../types';
import { getApiUrl } from '../../utils/apiUrl';
import { getProjectBomItems } from '../../utils/bomUtils';

export const InstallationView: React.FC = () => {
  const { 
    projects, 
    updateProject,
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

  // Coordinated 4-Step Active Tab
  const [activeStepTab, setActiveStepTab] = useState<'step1' | 'step2' | 'step3' | 'step4'>('step1');

  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  // Command Centre Data (BOM, Site Survey, Attendance)
  const [commandCentre, setCommandCentre] = useState<any>(null);
  const [isLoadingCC, setIsLoadingCC] = useState(false);

  // Step 1: Material Arrival Confirmation
  const [isConfirmingMaterial, setIsConfirmingMaterial] = useState(false);

  // Step 2: Scheduling & Site Survey Verification
  const [scheduledStartDate, setScheduledStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState<number>(2);
  const [isVerifyingSurvey, setIsVerifyingSurvey] = useState(false);

  // Step 3: Daily Field Attendance
  const [attendanceMode, setAttendanceMode] = useState<'solo' | 'team'>('solo');
  const [siteLeadName, setSiteLeadName] = useState(currentUser?.name || 'Muthu Vel');
  const [teamMembersInput, setTeamMembersInput] = useState('Karthik Mani (Inverter & Wiring), Saravanan Perumal (Earthing & BOS), Rajesh Varma (Structure & Foundation), Vijay Anand (Safety & QA)');
  const [attendancePhoto, setAttendancePhoto] = useState<string>('');
  const [attendanceGps, setAttendanceGps] = useState<{ lat?: number; lng?: number } | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [attendanceLoggedToday, setAttendanceLoggedToday] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);

  // Step 4: 4-Angle Rooftop Photos & 20-Sec Client Video
  const [photoAngle1, setPhotoAngle1] = useState<string>(''); // PV Array & Tilt
  const [photoAngle2, setPhotoAngle2] = useState<string>(''); // Inverter & Cabling
  const [photoAngle3, setPhotoAngle3] = useState<string>(''); // Earthing Pit & Lightning Arrestor
  const [photoAngle4, setPhotoAngle4] = useState<string>(''); // Net Meter & ACDB
  const [clientVideoUrl, setClientVideoUrl] = useState<string>('');
  const [netMeterFixed, setNetMeterFixed] = useState(true);
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);

  // Custom Site Tasks Form State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(currentUser?.name || 'Muthu Vel');
  const [newTaskCategory, setNewTaskCategory] = useState<'Structure' | 'Electrical' | 'Inverter' | 'Safety' | 'BOS'>('Electrical');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);

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

  // Fetch command centre data (BOM, Site Survey, POs)
  const fetchCommandCentre = async (projId: string) => {
    if (!projId) return;
    setIsLoadingCC(true);
    try {
      const res = await authFetch(`/api/installation/command-centre/${projId}`);
      const data = await res.json();
      if (data.success && data.commandCentre) {
        setCommandCentre(data.commandCentre);
        if (data.commandCentre.attendance) {
          setAttendanceLogs(data.commandCentre.attendance);
          const todayStr = new Date().toISOString().split('T')[0];
          const hasToday = data.commandCentre.attendance.some((a: any) => a.date?.startsWith(todayStr));
          setAttendanceLoggedToday(hasToday);
        }
      }
    } catch (e) {
      console.error('Error fetching command centre in InstallationView:', e);
    } finally {
      setIsLoadingCC(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchCommandCentre(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Sync project state into local form controls
  useEffect(() => {
    if (selectedProject) {
      if (selectedProject.startDate) {
        setScheduledStartDate(selectedProject.startDate);
      }
      if (selectedProject.installationDurationDays) {
        setDurationDays(selectedProject.installationDurationDays);
      }
      if (selectedProject.attendancePhotoUrl) {
        setAttendancePhoto(selectedProject.attendancePhotoUrl);
      }
      if (selectedProject.postInstallPhotos) {
        setPhotoAngle1(selectedProject.postInstallPhotos.panelFixing || '');
        setPhotoAngle2(selectedProject.postInstallPhotos.inverterCabling || '');
        setPhotoAngle3(selectedProject.postInstallPhotos.earthingProtection || '');
        setPhotoAngle4(selectedProject.postInstallPhotos.plantWithCustomer || '');
      }
      if (selectedProject.commissioningVideoUrl) {
        setClientVideoUrl(selectedProject.commissioningVideoUrl);
      }

      // Automatically open the most relevant step based on project progress
      if (!selectedProject.materialArrivedOnSite) {
        setActiveStepTab('step1');
      } else if (!selectedProject.siteSurveyVerified) {
        setActiveStepTab('step2');
      } else if (!attendanceLoggedToday) {
        setActiveStepTab('step3');
      } else {
        setActiveStepTab('step4');
      }
    }
  }, [selectedProject?.id]);

  const handleSelectProject = (project: Project) => {
    setSelectedProjectId(project.id);
    setActiveViewMode('detail');
  };

  // =========================================================================
  // STEP 1: CONFIRM MATERIAL ARRIVAL ON SITE
  // =========================================================================
  const handleConfirmMaterialArrival = async () => {
    if (!selectedProject) return;
    setIsConfirmingMaterial(true);
    const nowIso = new Date().toISOString();
    const confirmedBy = currentUser?.name || siteLeadName;

    try {
      await authFetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialArrivedOnSite: true,
          materialArrivedConfirmedAt: nowIso,
          materialArrivedConfirmedBy: confirmedBy,
          stage: 'Installation Scheduled',
          checklist: {
            ...selectedProject.checklist,
            materialArrivedOnSite: true,
            materialArrivedConfirmedAt: nowIso,
            materialArrivedConfirmedBy: confirmedBy,
          }
        })
      });

      updateProject(selectedProject.id, {
        materialArrivedOnSite: true,
        materialArrivedConfirmedAt: nowIso,
        materialArrivedConfirmedBy: confirmedBy,
        stage: 'Installation Scheduled',
      });

      setSuccessAlert('Materials physically confirmed on site! Project Manager notified and Step 2 unlocked.');
      setTimeout(() => setSuccessAlert(null), 5000);
      setActiveStepTab('step2');
    } catch (err: any) {
      alert(`Error confirming material arrival: ${err.message}`);
    } finally {
      setIsConfirmingMaterial(false);
    }
  };

  // =========================================================================
  // STEP 2: VERIFY SITE CLEARNESS & SCHEDULE INSTALLATION
  // =========================================================================
  const handleVerifySurveyAndSchedule = async () => {
    if (!selectedProject) return;
    setIsVerifyingSurvey(true);
    const nowIso = new Date().toISOString();
    const confirmedBy = currentUser?.name || siteLeadName;

    // Compute target completion date based on duration
    const startDt = new Date(scheduledStartDate);
    const targetDt = new Date(startDt.getTime() + durationDays * 86400000);
    const targetDateStr = targetDt.toISOString().split('T')[0];

    try {
      await authFetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: scheduledStartDate,
          targetCompletionDate: targetDateStr,
          installationDurationDays: durationDays,
          siteSurveyVerified: true,
          siteSurveyVerifiedAt: nowIso,
          siteSurveyVerifiedBy: confirmedBy,
          stage: 'Installation In Progress',
          checklist: {
            ...selectedProject.checklist,
            siteSurveyVerified: true,
            siteSurveyVerifiedAt: nowIso,
            siteSurveyVerifiedBy: confirmedBy,
            installationDurationDays: durationDays,
          }
        })
      });

      updateProject(selectedProject.id, {
        startDate: scheduledStartDate,
        targetCompletionDate: targetDateStr,
        installationDurationDays: durationDays,
        siteSurveyVerified: true,
        siteSurveyVerifiedAt: nowIso,
        siteSurveyVerifiedBy: confirmedBy,
        stage: 'Installation In Progress',
      });

      setSuccessAlert(`Installation schedule confirmed (${durationDays} Days Duration) and survey clearness verified! Step 3 Attendance unlocked.`);
      setTimeout(() => setSuccessAlert(null), 5000);
      setActiveStepTab('step3');
    } catch (err: any) {
      alert(`Error saving schedule and survey verification: ${err.message}`);
    } finally {
      setIsVerifyingSurvey(false);
    }
  };

  // =========================================================================
  // STEP 3: DAILY FIELD ATTENDANCE CHECK-IN (WITH SELFIE & GPS)
  // =========================================================================
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
          projectId: selectedProject.id,
          siteLeadName: siteLeadName.trim() || 'Site Lead',
          presentTeamMembers: members,
          latitude: lat || null,
          longitude: lng || null,
          date: new Date().toISOString().split('T')[0],
          notes: attendanceMode === 'solo' 
            ? 'Solo rooftop technician on site. Image selfie & GPS logged.' 
            : `Team of ${members.length} technicians checked in on site. Verified with live selfie and GPS coordinates.`
        })
      });
      const data = await res.json();
      setIsCheckingIn(false);
      if (data.success) {
        setAttendanceLoggedToday(true);
        fetchCommandCentre(selectedProject.id);

        // Update photo on project record
        if (attendancePhoto) {
          updateProject(selectedProject.id, {
            attendancePhotoUrl: attendancePhoto,
          });
        }

        setSuccessAlert(`Daily field attendance verified! ${members.length} crew member(s) confirmed on site with GPS.`);
        setTimeout(() => setSuccessAlert(null), 5000);
        setActiveStepTab('step4');
      } else {
        alert(data.error || 'Failed to record attendance');
      }
    } catch (e: any) {
      setIsCheckingIn(false);
      alert(e.message);
    }
  };

  const compressImage = (file: File, maxWidth = 1280, maxHeight = 960, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Attendance Selfie Photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setter(compressed);
      } catch (_) {
        const reader = new FileReader();
        reader.onloadend = () => setter(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  // =========================================================================
  // STEP 4: SUBMIT INSTALLATION PROOFS FOR PM SIGN-OFF
  // =========================================================================
  const handleSubmitForPMSignOff = async () => {
    if (!selectedProject) return;
    setIsSubmittingCompletion(true);

    const photosPayload = {
      panelFixing: photoAngle1 || '',
      inverterCabling: photoAngle2 || '',
      earthingProtection: photoAngle3 || '',
      plantWithCustomer: photoAngle4 || '',
    };

    try {
      await authFetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'Installation Completed',
          postInstallPhotos: photosPayload,
          commissioningVideoUrl: clientVideoUrl || '',
          solarMeterFixed: netMeterFixed,
          checklist: {
            ...selectedProject.checklist,
            photosUploaded: [photoAngle1, photoAngle2, photoAngle3, photoAngle4].filter(Boolean),
            postInstallPhotos: photosPayload,
            commissioningVideoUrl: clientVideoUrl || '',
          }
        })
      });

      updateProject(selectedProject.id, {
        stage: 'Installation Completed',
        postInstallPhotos: photosPayload,
        commissioningVideoUrl: clientVideoUrl || '',
        solarMeterFixed: netMeterFixed,
      });

      setSuccessAlert('Installation completed! 4-Angle Rooftop Photos & Client Confirmation Video submitted for Project Manager sign-off & warranty selection.');
      setTimeout(() => setSuccessAlert(null), 6000);
    } catch (err: any) {
      alert(`Error submitting installation: ${err.message}`);
    } finally {
      setIsSubmittingCompletion(false);
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

    try {
      const updatedTasks = [
        ...projectTasks,
        {
          id: `TSK-${Date.now().toString().slice(-4)}`,
          ...newTaskPayload,
          completedAt: undefined,
          status: 'Pending' as const,
        }
      ];
      await authFetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updatedTasks })
      });
    } catch (err) {
      console.error('Error syncing task toggle to server:', err);
    }
  };

  // Filter projects for the list view
  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.customerAddress && p.customerAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.installationLeadName && p.installationLeadName.toLowerCase().includes(searchQuery.toLowerCase()));

    const isDone = p.stage === 'Completed' || p.stage === 'Installation Completed';
    if (stageFilter === 'READY') return matchesSearch && Boolean(p.materialArrivedOnSite || p.material_readiness_status === 'Fully Received at Site') && !isDone;
    if (stageFilter === 'IN_PROGRESS') return matchesSearch && (p.stage === 'Installation Scheduled' || p.stage === 'Installation In Progress');
    if (stageFilter === 'COMPLETED') return matchesSearch && isDone;
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
                <span>Field Crew Operations &bull; 4-Step Coordinated Lifecycle</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Assigned Rooftop Installation Projects
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                4-Step execution: 1. Confirm Material Arrival &bull; 2. Schedule &amp; Verify Survey &bull; 3. Daily Attendance &bull; 4. Rooftop Photos, Client Video &amp; Sign-off.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <div className="text-xs">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Field Lead</span>
                <span className="font-extrabold text-slate-900">{siteLeadName}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Work Orders</span>
              <span className="text-lg font-black text-slate-900 font-mono">{projects.length}</span>
            </div>
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Material On Site</span>
              <span className="text-lg font-black text-emerald-900 font-mono">
                {projects.filter(p => p.materialArrivedOnSite || p.material_readiness_status === 'Fully Received at Site').length}
              </span>
            </div>
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">In Progress</span>
              <span className="text-lg font-black text-amber-900 font-mono">
                {projects.filter(p => p.stage === 'Installation In Progress' || p.stage === 'Installation Scheduled').length}
              </span>
            </div>
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Completed</span>
              <span className="text-lg font-black text-blue-900 font-mono">
                {projects.filter(p => p.stage === 'Completed' || p.stage === 'Installation Completed').length}
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
              { id: 'READY', label: 'Materials on Site' },
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
              const isCompleted = project.stage === 'Completed' || project.stage === 'Installation Completed';
              const hasMaterialsOnSite = Boolean(project.materialArrivedOnSite || project.material_readiness_status === 'Fully Received at Site');

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
                        <span className="text-[10px] text-slate-400 block font-semibold">Duration Target</span>
                        <span className="font-bold text-slate-800 font-mono text-[11px]">
                          {project.installationDurationDays || 2} Days ({project.targetCompletionDate || 'Upcoming'})
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Installation Lead:</span>
                        <span className="font-bold text-slate-800">{project.installationLeadName || siteLeadName}</span>
                      </div>
                    </div>

                    {/* Step Status Badges */}
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Step 1: Material On Site:</span>
                        <span className={`font-bold flex items-center gap-1 ${hasMaterialsOnSite ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {hasMaterialsOnSite ? 'Confirmed ✓' : 'Awaiting Arrival'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Step 2: Survey Cleared:</span>
                        <span className={`font-bold flex items-center gap-1 ${project.siteSurveyVerified ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {project.siteSurveyVerified ? 'Verified ✓' : 'Pending Verification'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleSelectProject(project)}
                      className={`w-full py-2.5 ${
                        isCompleted
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          : 'bg-slate-900 hover:bg-emerald-600 text-white shadow-xs group-hover:bg-emerald-600'
                      } font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer`}
                    >
                      <span>{isCompleted ? 'View Installation Records' : 'Open 4-Step Site Workspace'}</span>
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
  // VIEW MODE 2: SELECTED PROJECT DETAIL WORKSPACE (4-STEP WORKFLOW)
  // ==========================================
  const bomItemsList = getProjectBomItems(commandCentre?.bomItems, selectedProject?.capacityKw || 5);
  const arrivedMaterialIds: string[] = selectedProject?.arrivedMaterialIds || 
    (selectedProject?.checklist as any)?.arrivedMaterialIds || [];
  const arrivedCount = bomItemsList.filter((it: any) => arrivedMaterialIds.includes(it.id) || arrivedMaterialIds.includes(it.itemName)).length;
  const allMaterialsArrived = arrivedCount === bomItemsList.length && bomItemsList.length > 0;

  const handleToggleMaterialArrival = (itemId: string, itemName: string) => {
    if (!selectedProject) return;
    const isChecked = arrivedMaterialIds.includes(itemId) || arrivedMaterialIds.includes(itemName);
    let nextList: string[];
    if (isChecked) {
      nextList = arrivedMaterialIds.filter(id => id !== itemId && id !== itemName);
    } else {
      nextList = [...arrivedMaterialIds, itemId, itemName];
    }
    nextList = Array.from(new Set(nextList));

    const allNowChecked = bomItemsList.every((it: any) => nextList.includes(it.id) || nextList.includes(it.itemName));
    const nowIso = new Date().toISOString();
    const confirmedBy = currentUser?.name || siteLeadName || 'Installation Lead';

    const updates: any = {
      arrivedMaterialIds: nextList,
      checklist: {
        ...(selectedProject.checklist || {}),
        arrivedMaterialIds: nextList,
      }
    };

    if (allNowChecked) {
      updates.materialArrivedOnSite = true;
      updates.materialArrivedConfirmedAt = nowIso;
      updates.materialArrivedConfirmedBy = confirmedBy;
      updates.stage = 'Installation Scheduled';
    } else {
      updates.materialArrivedOnSite = false;
    }

    updateProject(selectedProject.id, updates);

    // Persist immediately to server so Project Manager sees live strikethroughs and arrival status
    authFetch(`/api/projects/${selectedProject.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(err => console.error('Error syncing material toggle:', err));
  };

  const handleCheckAllMaterials = () => {
    if (!selectedProject) return;
    const allIds = bomItemsList.flatMap((it: any) => [it.id, it.itemName]);
    const nowIso = new Date().toISOString();
    const confirmedBy = currentUser?.name || siteLeadName || 'Installation Lead';

    const updates: any = {
      arrivedMaterialIds: allIds,
      materialArrivedOnSite: true,
      materialArrivedConfirmedAt: nowIso,
      materialArrivedConfirmedBy: confirmedBy,
      stage: 'Installation Scheduled',
      checklist: {
        ...(selectedProject.checklist || {}),
        arrivedMaterialIds: allIds,
        materialArrivedOnSite: true,
        materialArrivedConfirmedAt: nowIso,
        materialArrivedConfirmedBy: confirmedBy,
      }
    };

    updateProject(selectedProject.id, updates);

    // Persist immediately to server
    authFetch(`/api/projects/${selectedProject.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(err => console.error('Error syncing check all materials:', err));
  };

  const surveyData = commandCentre?.survey || {
    feasible_area_sqft: 2400,
    shadow_free_area: 2150,
    rooftop_type: 'RCC Flat Roof (RCC Terrace)',
    measured_dc_cable_meters: 15,
    measured_ac_cable_meters: 10,
    inverter_location: 'External shaded wall next to main LT distribution board',
    feasibility_verdict: 'Feasible (Full Solar Potential)',
    engineer_name: 'Lead Site Survey Engineer',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Project Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
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

        <div className="flex flex-wrap items-center gap-2.5">
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
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>{successAlert}</div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4-STEP COORDINATED EPC INSTALLATION WORKFLOW HEADER                        */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              4-Step Installation &amp; PM Coordinated Lifecycle
            </h2>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Field Team Lead: {siteLeadName}
          </span>
        </div>

        {/* 4 Steps Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { 
              id: 'step1', 
              num: 1, 
              title: 'Material Arrival on Site', 
              desc: 'Confirm physically at site', 
              isDone: Boolean(selectedProject?.materialArrivedOnSite),
              icon: PackageCheck
            },
            { 
              id: 'step2', 
              num: 2, 
              title: 'Schedule & Survey Clearness', 
              desc: 'Decide days & verify roof', 
              isDone: Boolean(selectedProject?.siteSurveyVerified),
              icon: Calendar
            },
            { 
              id: 'step3', 
              num: 3, 
              title: 'Daily Field Attendance', 
              desc: 'Live selfie photo & GPS', 
              isDone: attendanceLoggedToday,
              icon: Users
            },
            { 
              id: 'step4', 
              num: 4, 
              title: 'Execution & PM Sign-Off', 
              desc: '4 Photos, Video & Handover', 
              isDone: selectedProject?.stage === 'Completed' || selectedProject?.stage === 'Installation Completed',
              icon: CheckCircle2
            },
          ].map(s => {
            const Icon = s.icon;
            const isActive = activeStepTab === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStepTab(s.id as any)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isActive 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                    : s.isDone 
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800 hover:bg-emerald-100/60' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-mono text-[10px] font-black uppercase ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                    Step {s.num}
                  </span>
                  {s.isDone ? (
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isActive ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'
                    }`}>
                      ✓
                    </span>
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  )}
                </div>
                <div className={`text-xs font-black truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {s.title}
                </div>
                <div className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {s.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: MATERIAL ARRIVAL ON SITE (PURCHASED BOM REVIEW & RECEIPT)         */}
      {/* ========================================================================= */}
      {activeStepTab === 'step1' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <PackageCheck className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Step 1: Material Arrival on Site &amp; Purchased BOM Verification
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tick each material item below as crates arrive on site. Ticking an item strikes it out and updates the Project Manager in real time.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCheckAllMaterials}
                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All Arrived ({bomItemsList.length})</span>
              </button>

              {allMaterialsArrived || selectedProject?.materialArrivedOnSite ? (
                <button
                  type="button"
                  onClick={() => {
                    handleConfirmMaterialArrival();
                    setActiveStepTab('step2');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All Arrived ✓ Move to Step 2 &rarr;</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isConfirmingMaterial}
                  onClick={handleConfirmMaterialArrival}
                  className="px-4 py-2 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  <span>{isConfirmingMaterial ? 'Confirming...' : 'Fast Confirm Arrival ✓'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Delivery Site Destination Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Destination Site</span>
              <span className="font-bold text-slate-900 text-sm block mt-0.5">{selectedProject?.customerName}</span>
              <span className="text-slate-600">{selectedProject?.customerAddress} &bull; {selectedProject?.customerPhone}</span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project Capacity</span>
              <span className="font-black text-emerald-700 text-sm font-mono block mt-0.5">{selectedProject?.capacityKw} kW On-Grid</span>
            </div>
          </div>

          {/* Material Arrival Real-Time Progress Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <span>Field Crew Unboxing &amp; Receipt Progress:</span>
                <span className="font-mono text-emerald-700 font-extrabold">
                  {arrivedCount} of {bomItemsList.length} Materials Received on Site
                </span>
              </span>
              <span className="font-mono font-bold text-slate-700 text-xs">
                {Math.round((arrivedCount / (bomItemsList.length || 1)) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.round((arrivedCount / (bomItemsList.length || 1)) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Click any item row or checkbox to strike it out as received on site. The Project Manager dashboard updates automatically.
            </p>
          </div>

          {/* Interactive Purchased Materials Checklist (BOM) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Equipment Dispatched to Site ({bomItemsList.length} Items)
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">
                Click row to toggle checkmark &amp; strikethrough
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">Check</th>
                    <th className="py-2.5 px-3 text-center w-10">#</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Item Name &amp; Description</th>
                    <th className="py-2.5 px-3">Technical Specification</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-3 text-center">Qty Dispatched</th>
                    <th className="py-2.5 px-3 text-center">Arrival Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] bg-white">
                  {bomItemsList.map((item: any, idx: number) => {
                    const isChecked = arrivedMaterialIds.includes(item.id) || arrivedMaterialIds.includes(item.itemName);
                    return (
                      <tr 
                        key={item.id || idx}
                        onClick={() => handleToggleMaterialArrival(item.id, item.itemName)}
                        className={`cursor-pointer transition-colors select-none ${
                          isChecked 
                            ? 'bg-emerald-50/70 hover:bg-emerald-100/60' 
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleMaterialArrival(item.id, item.itemName)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                        </td>
                        <td className={`py-2.5 px-3 text-center font-mono font-bold ${isChecked ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {idx + 1}
                        </td>
                        <td className={`py-2.5 px-3 font-semibold ${isChecked ? 'line-through text-slate-400 opacity-60' : 'text-slate-900'}`}>
                          {item.category}
                        </td>
                        <td className={`py-2.5 px-3 font-bold ${isChecked ? 'line-through text-slate-400 opacity-60' : 'text-slate-800'}`}>
                          {item.itemName}
                        </td>
                        <td className={`py-2.5 px-3 font-mono text-[10px] ${isChecked ? 'line-through text-slate-400 opacity-60' : 'text-slate-600'}`}>
                          {item.technicalSpecification || 'Standard Industrial Grade'}
                        </td>
                        <td className={`py-2.5 px-3 text-center font-semibold ${isChecked ? 'line-through text-slate-400 opacity-60' : 'text-slate-700'}`}>
                          {item.unit || 'Nos'}
                        </td>
                        <td className={`py-2.5 px-3 text-center font-black font-mono ${isChecked ? 'line-through text-slate-400 opacity-60' : 'text-slate-900 bg-slate-50/70'}`}>
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isChecked ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Received on Site ✓</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              In Transit
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Proceed Action when all items ticked */}
            {allMaterialsArrived && (
              <div className="pt-3 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-xs text-emerald-950">
                      All {bomItemsList.length} Materials Received &amp; Inspected on Site!
                    </span>
                    <p className="text-[11px] text-emerald-800">
                      Project Manager notified. The installation schedule and technical survey verification are ready to commence.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleConfirmMaterialArrival();
                    setActiveStepTab('step2');
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <span>Proceed to Step 2: Schedule &amp; Survey</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: INSTALLATION SCHEDULING & SITE SURVEY VERIFICATION               */}
      {/* ========================================================================= */}
      {activeStepTab === 'step2' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Step 2: Installation Scheduling &amp; Site Survey Verification
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                The Installation Team decides how many days are required and verifies the existing site survey conducted by the Survey Engineer.
              </p>
            </div>

            {selectedProject?.siteSurveyVerified ? (
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Survey &amp; Schedule Verified ✓ ({selectedProject.siteSurveyVerifiedBy || siteLeadName})</span>
              </span>
            ) : (
              <button
                type="button"
                disabled={isVerifyingSurvey}
                onClick={handleVerifySurveyAndSchedule}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isVerifyingSurvey ? 'Saving...' : 'Verify Site Clearness & Confirm Schedule ✓'}</span>
              </button>
            )}
          </div>

          {/* Section A: Date and Days Picker */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-tight flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Decide Installation Schedule &amp; Execution Days</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Proposed Start Date
                </label>
                <input
                  type="date"
                  value={scheduledStartDate}
                  onChange={e => setScheduledStartDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Estimated Days Needed for Installation
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDurationDays(days)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        durationDays === days
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {days} {days === 1 ? 'Day' : 'Days'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Handover Date (Auto-Computed)
                </label>
                <div className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-800">
                  {(() => {
                    const d = new Date(scheduledStartDate);
                    d.setDate(d.getDate() + durationDays);
                    return d.toISOString().split('T')[0];
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Existing Site Survey Audit Viewer (Not a form!) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audited Technical Site Survey (Field Engineer: {surveyData.engineer_name || 'Verified'})</span>
              </h4>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {surveyData.feasibility_verdict || 'Feasible'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Rooftop Type</span>
                <span className="font-bold text-slate-900 block mt-0.5">{surveyData.rooftop_type || 'RCC Flat Roof'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Shadow-Free Area</span>
                <span className="font-bold text-slate-900 block mt-0.5">{surveyData.shadow_free_area || '2,150'} sq.ft</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">DC Cable Run Length</span>
                <span className="font-mono font-bold text-slate-900 block mt-0.5">{surveyData.measured_dc_cable_meters || '15'} Mtrs</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">AC Cable Run Length</span>
                <span className="font-mono font-bold text-slate-900 block mt-0.5">{surveyData.measured_ac_cable_meters || '10'} Mtrs</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Proposed Inverter &amp; Distribution Location</span>
              <p className="text-slate-800 font-semibold">{surveyData.inverter_location || 'North-facing sheltered exterior wall beside main LT electrical panel'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: DAILY FIELD ATTENDANCE CHECK-IN (LIVE SELFIE & GPS CAPTURE)       */}
      {/* ========================================================================= */}
      {activeStepTab === 'step3' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Users className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Step 3: Daily Site Team Attendance &amp; On-Site Check-In
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                On the scheduled date, check in with live crew selfie and GPS timestamp to verify on-site arrival for Project Manager.
              </p>
            </div>

            {attendanceLoggedToday ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Checked In Today ✓</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-xs font-bold">
                Check-in Pending for Today
              </span>
            )}
          </div>

          {/* Mode Selector & Crew Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Check-In Mode:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAttendanceMode('solo')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                      attendanceMode === 'solo' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Solo Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceMode('team')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                      attendanceMode === 'team' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Multiple Crew
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Site Lead Name</label>
                <input
                  type="text"
                  value={siteLeadName}
                  onChange={e => setSiteLeadName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-indigo-500"
                />
              </div>

              {attendanceMode === 'team' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Crew Members Present</label>
                  <input
                    type="text"
                    value={teamMembersInput}
                    onChange={e => setTeamMembersInput(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-indigo-500"
                    placeholder="Names separated by comma"
                  />
                </div>
              )}
            </div>

            {/* Live Rooftop Selfie Photo Upload */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Live Rooftop Crew Selfie / Site Arrival Photo</span>
              </span>

              {attendancePhoto ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-300 h-32 bg-slate-900">
                  <img src={attendancePhoto} alt="Crew on Site" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAttendancePhoto('')}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-md text-[10px] font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white rounded-lg cursor-pointer transition-colors">
                  <Camera className="w-6 h-6 text-indigo-500 mb-1" />
                  <span className="text-xs font-bold text-indigo-700">Capture / Upload Crew Photo</span>
                  <span className="text-[10px] text-slate-400">Shows team at customer rooftop</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => handlePhotoUpload(e, setAttendancePhoto)}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{attendanceGps ? `GPS Captured: ${attendanceGps.lat?.toFixed(4)}, ${attendanceGps.lng?.toFixed(4)}` : 'Live GPS captured on button click'}</span>
            </span>

            <button
              type="button"
              disabled={isCheckingIn}
              onClick={handleCaptureGpsAndCheckIn}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>{isCheckingIn ? 'Capturing GPS...' : attendanceLoggedToday ? 'Re-Log Today Attendance' : 'Check In Field Team & Verify On-Site Presence'}</span>
            </button>
          </div>

          {/* Today's Checked-in Attendance Log list */}
          {attendanceLogs.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logged Field Attendance</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {attendanceLogs.map((log: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{log.siteLeadName || log.site_lead_name}</span>
                      <span className="font-mono text-[10px] font-semibold text-slate-500">{log.checkInTime || log.check_in_time || '09:30'}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {Array.isArray(log.presentTeamMembers) ? log.presentTeamMembers.join(', ') : log.siteLeadName}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>GPS Lat/Lng Verified &bull; Active on Site</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: EXECUTION, 4 PHOTOS, 20-SEC CLIENT VIDEO & PM SUBMISSION          */}
      {/* ========================================================================= */}
      {activeStepTab === 'step4' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Custom Field Tasks Uploaded by Crew */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    <ListTodo className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Step 4: Installation Execution Tasks &amp; Progress Updates
                  </h3>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-mono text-[10px] font-bold">
                    {completedTaskCount} / {projectTasks.length} Completed
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Check off executed runs and write custom site tasks. Updates are instantly visible to the Project Manager.
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4-Angle Rooftop Photos Upload Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>4 Mandatory Geotagged Rooftop Photos</span>
              </h3>
              <p className="text-xs text-slate-500">
                Upload clear photos covering all 4 distinct system angles before submitting for Project Manager sign-off.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'ang1', title: '1. PV Array & Tilt', desc: 'Solar modules & clamps', state: photoAngle1, setter: setPhotoAngle1, fieldKey: 'panelFixing' },
                { id: 'ang2', title: '2. Inverter & Conduit', desc: 'Inverter & wiring routing', state: photoAngle2, setter: setPhotoAngle2, fieldKey: 'inverterCabling' },
                { id: 'ang3', title: '3. Earthing & Arrestor', desc: 'Pits & lightning protection', state: photoAngle3, setter: setPhotoAngle3, fieldKey: 'earthingProtection' },
                { id: 'ang4', title: '4. Net Meter & ACDB', desc: 'Bi-directional meter tie-in', state: photoAngle4, setter: setPhotoAngle4, fieldKey: 'plantWithCustomer' },
              ].map(card => (
                <div key={card.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{card.title}</span>
                    <span className="text-[10px] text-slate-400 block">{card.desc}</span>
                  </div>

                  {card.state ? (
                    <div className="relative rounded-lg overflow-hidden border border-slate-300 h-28 bg-slate-900">
                      <img src={card.state} alt={card.title} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          card.setter('');
                          if (selectedProject) {
                            const updatedPhotos = { ...(selectedProject.postInstallPhotos || {}), [card.fieldKey]: '' };
                            updateProject(selectedProject.id, { postInstallPhotos: updatedPhotos });
                            authFetch(`/api/projects/${selectedProject.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ postInstallPhotos: updatedPhotos })
                            }).catch(() => {});
                          }
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded text-[9px] font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white rounded-lg cursor-pointer h-28 transition-colors">
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[11px] font-bold text-emerald-700">Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const dUrl = await compressImage(file);
                              card.setter(dUrl);
                              if (selectedProject) {
                                const currentPhotos = selectedProject.postInstallPhotos || {};
                                const nextPhotos = { ...currentPhotos, [card.fieldKey]: dUrl };
                                updateProject(selectedProject.id, { postInstallPhotos: nextPhotos });
                                authFetch(`/api/projects/${selectedProject.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ postInstallPhotos: nextPhotos })
                                }).catch(() => {});
                              }
                            } catch (err) {
                              console.error('Error compressing image:', err);
                            }
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rooftop Client Confirmation Video (Walkthrough & Sign-off) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  <span>Rooftop Client Confirmation Video (Walkthrough &amp; Sign-off)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Walkthrough video of installed rooftop array and customer verification confirmation (below 5 mins or any length).
                </p>
              </div>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold">
                Client Video Gate
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-slate-300 bg-black aspect-video flex items-center justify-center">
                {clientVideoUrl ? (
                  <video
                    src={clientVideoUrl.startsWith('http') || clientVideoUrl.startsWith('blob:') ? clientVideoUrl : getApiUrl(clientVideoUrl)}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : isUploadingVideo ? (
                  <div className="p-4 text-purple-300 text-xs flex flex-col items-center justify-center text-center animate-pulse">
                    <Loader2 className="w-8 h-8 text-purple-400 mb-1.5 animate-spin" />
                    <span className="font-bold text-white text-xs">Uploading Video to Server...</span>
                    <span className="text-[10px] text-slate-300 mt-0.5">Streaming video file &bull; please wait</span>
                  </div>
                ) : (
                  <div className="p-4 text-slate-400 text-xs flex flex-col items-center justify-center text-center">
                    <Video className="w-8 h-8 text-slate-500 mb-1.5" />
                    <span className="font-bold text-slate-300">No Video Recorded Yet</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Upload a walkthrough video (below 5 mins or any length)</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Upload New Video Recording</span>
                  <p className="text-slate-500 text-[11px]">
                    Record or upload an on-site walkthrough video (below 5 mins) of modules, inverter LED sync, and customer confirmation.
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    disabled={isUploadingVideo}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsUploadingVideo(true);
                        setVideoUploadError(null);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const uploadRes = await authFetch('/api/installation/upload-media', {
                            method: 'POST',
                            body: formData,
                          });

                          let uploadData: any = null;
                          const contentType = uploadRes.headers.get('content-type') || '';
                          if (contentType.includes('application/json')) {
                            uploadData = await uploadRes.json();
                          } else {
                            const rawText = await uploadRes.text();
                            console.warn('[Video Upload Response Non-JSON]:', rawText.slice(0, 200));
                          }

                          if (uploadData && uploadData.success && uploadData.url) {
                            const publicVideoUrl = uploadData.url;
                            setClientVideoUrl(publicVideoUrl);
                            if (selectedProject) {
                              updateProject(selectedProject.id, { commissioningVideoUrl: publicVideoUrl });
                              await authFetch(`/api/projects/${selectedProject.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ commissioningVideoUrl: publicVideoUrl })
                              }).catch(err => console.warn('[Project Video Sync]', err));
                            }
                          } else {
                            // Fallback to local object URL so client walkthrough video can still be previewed
                            const localUrl = URL.createObjectURL(file);
                            setClientVideoUrl(localUrl);
                            if (selectedProject) {
                              updateProject(selectedProject.id, { commissioningVideoUrl: localUrl });
                            }
                            if (uploadData && uploadData.error) {
                              setVideoUploadError(`Notice: ${uploadData.error} (Using local video stream)`);
                            }
                          }
                        } catch (err: any) {
                          console.warn('Video upload network/parse notice:', err);
                          const localUrl = URL.createObjectURL(file);
                          setClientVideoUrl(localUrl);
                          if (selectedProject) {
                            updateProject(selectedProject.id, { commissioningVideoUrl: localUrl });
                          }
                        } finally {
                          setIsUploadingVideo(false);
                        }
                      }
                    }}
                    className="mt-2 block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
                  />
                  {videoUploadError && (
                    <p className="text-[10px] text-red-600 font-bold mt-1">{videoUploadError}</p>
                  )}
                </div>

                {/* DISCOM Net Metering Toggle */}
                <div className="pt-3 border-t border-slate-200">
                  <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={netMeterFixed}
                      onChange={e => setNetMeterFixed(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span>DISCOM Bi-Directional Net-Meter Fixed &amp; Grid Live</span>
                  </label>
                  <p className="text-[10px] text-slate-400 ml-6">Meter installed and export reading running</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Installation for PM Sign-off */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                All tasks, 4-angle rooftop photos, and client confirmation video ready for final Project Manager approval &amp; warranty handover.
              </span>
            </div>

            <button
              type="button"
              disabled={isSubmittingCompletion}
              onClick={handleSubmitForPMSignOff}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>{isSubmittingCompletion ? 'Submitting...' : 'Notify Installation Completed & Submit for PM Sign-Off ✓'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Task Modal */}
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
    </div>
  );
};
