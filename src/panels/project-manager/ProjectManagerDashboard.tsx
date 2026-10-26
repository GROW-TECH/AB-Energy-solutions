import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, Activity, Clock, CheckCircle2, 
  Layers, ArrowRight, Zap, CheckSquare, FileCheck, Compass, Rocket, Truck
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { getApiUrl } from '../../utils/apiUrl';

interface ProjectManagerDashboardProps {
  onNavigateToTab: (tab: string) => void;
}

export const ProjectManagerDashboard: React.FC<ProjectManagerDashboardProps> = ({
  onNavigateToTab,
}) => {
  const { projects, surveys, quotations } = useCrm();

  const activeProjects = projects.filter(p => p.stage !== 'Completed');
  const completedProjects = projects.filter(p => p.stage === 'Completed');
  const gridSyncProjects = projects.filter(p => p.stage === 'Commissioning' || p.stage === 'Net Metering');
  const totalKw = projects.reduce((sum, p) => sum + p.capacityKw, 0);

  const surveysForReview = surveys.filter(s => s.status === 'Submitted for Review');
  const acceptedQuotes = quotations.filter(q => q.status === 'Customer_Accepted');
  const [indentsMap, setIndentsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const token = localStorage.getItem('ab_solar_token') || localStorage.getItem('ab_energy_auth_token') || '';
    fetch(getApiUrl('/api/procurement/pending-indents'), {
      headers: { Authorization: `Bearer ${token}` }
    })
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
      .catch(err => console.error('Error in ProjectManagerDashboard indents:', err));
  }, []);

  const readyToConvertQuotes = acceptedQuotes.filter(q => indentsMap[q.id]?.has_signed_grn);
  const inProcurementQuotes = acceptedQuotes.filter(q => !indentsMap[q.id]?.has_signed_grn);

  const allTasks = projects.flatMap(p => (p.tasks || []).map(t => ({ ...t, projectName: p.customerName })));
  const pendingTasks = allTasks.filter(t => !t.isCompleted);

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Project Manager &amp; EPC Operations</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Solar EPC &amp; Grid Synchronization Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live rooftop construction milestone tracking, DISCOM approvals, component BOM staging, and commercial commissioning.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToTab('materials')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Material Planning (BOM)</span>
            </button>
            <button
              onClick={() => onNavigateToTab('projects')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FolderKanban className="w-4 h-4" />
              <span>All Projects</span>
            </button>
          </div>
        </div>

        {/* 4 EPC Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active EPC Sites</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{activeProjects.length} Sites</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Under engineering &amp; execution
            </div>
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl">
            <div className="flex items-center justify-between text-amber-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Grid Synchronization</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-900">{gridSyncProjects.length} Pending</div>
            <div className="text-[11px] text-amber-700 mt-1 font-medium">
              Net-meter testing &amp; CEIG inspection
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Commissioned Plants</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-900">{completedProjects.length} Plants</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              Handed over to client &amp; O&amp;M
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Capacity Executed</span>
              <Zap className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-900">{totalKw} kW</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              Cumulative solar generation assets
            </div>
          </div>
        </div>

        {/* Pending Technical Survey Reviews Banner */}
        {surveysForReview.length > 0 && (
          <div className="mt-5 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-600 text-white rounded-xl shadow-xs shrink-0">
                <FileCheck className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-bold text-amber-950 text-sm">
                  {surveysForReview.length} Site Audit{surveysForReview.length > 1 ? 's' : ''} Awaiting Technical Sign-Off
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  {surveysForReview.map(s => `${s.customerName} (${s.id})`).join(', ')} submitted by field engineers. Feasibility review required before quotation.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('site-surveys')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
            >
              <span>Review &amp; Sign Off</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Banner 1: Truly Ready for Project Conversion (Customer-signed GRN on site) */}
        {readyToConvertQuotes.length > 0 && (
          <div className="mt-4 p-4.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-2 border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <span className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 animate-bounce">
                <Rocket className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {readyToConvertQuotes.length} Client-Accepted Deal{readyToConvertQuotes.length > 1 ? 's' : ''} Ready for Project Handover
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-600 text-white animate-pulse">
                    Materials Signed ✓ • Action Required
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Customer {readyToConvertQuotes.map(q => `${q.leadName} (${q.quotationNumber})`).join(', ')} — materials received on site &amp; customer signature verified. Launch EPC project execution.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('quotations')}
              className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <Rocket className="w-4 h-4 text-emerald-200" />
              <span>Convert to EPC Project &rarr;</span>
            </button>
          </div>
        )}

        {/* Banner 2: Deals in Procurement (Purchase Team sourcing equipment) */}
        {inProcurementQuotes.length > 0 && (
          <div className="mt-4 p-4.5 bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-slate-500/10 border-2 border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
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
                    Material Sourcing In Progress
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Customer {inProcurementQuotes.map(q => `${q.leadName} (${q.quotationNumber})`).join(', ')} accepted the quotation. Purchase Team is managing supplier POs and material delivery. EPC conversion unlocks upon customer electronic signature (GRN).
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('quotations')}
              className="px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Track Procurement Status &rarr;</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Split: Live Projects Stage + Milestone Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects Stages */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <FolderKanban className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Active Solar EPC Projects</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('projects')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>All Projects ({projects.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-3">
              {projects.slice(0, 5).map(project => (
                <div key={project.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs truncate">{project.customerName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {project.id}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {project.capacityKw} kW
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span>Stage: <strong className="text-slate-700">{project.stage}</strong></span>
                      <span>•</span>
                      <span>Target COD: {project.targetCompletionDate || 'Pending'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateToTab('projects')}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    View EPC
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-3 rounded-b-2xl flex items-center justify-between text-xs text-slate-600">
            <span>DISCOM Bi-directional meter installation tracking active</span>
            <button
              onClick={() => onNavigateToTab('projects')}
              className="text-blue-700 font-bold hover:underline cursor-pointer"
            >
              Open Gantt Stage Gate View
            </button>
          </div>
        </div>

        {/* Milestone Tasks Checklist */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <CheckSquare className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Critical Tasks</h3>
              </div>
              <span className="text-xs font-bold text-amber-700">{pendingTasks.length} Pending</span>
            </div>

            <div className="divide-y divide-slate-100 mt-3">
              {pendingTasks.slice(0, 5).map(task => (
                <div key={task.id} className="py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800 line-clamp-1">{task.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {task.stage}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>Assigned: {task.assignedToName || 'Team'}</span>
                    <span>Due: {task.dueDate}</span>
                  </div>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  All current project tasks are completed.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateToTab('tasks')}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Manage All Milestone Tasks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
