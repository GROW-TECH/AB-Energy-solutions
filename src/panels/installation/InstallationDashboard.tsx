import React from 'react';
import { 
  Wrench, Boxes, Layers, 
  ShieldAlert, CheckCircle2, 
  MapPin, ArrowRight, AlertTriangle, CheckSquare 
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface InstallationDashboardProps {
  onNavigateToTab: (tab: string) => void;
}

export const InstallationDashboard: React.FC<InstallationDashboardProps> = ({
  onNavigateToTab,
}) => {
  const { projects, products } = useCrm();

  const installingProjects = projects.filter(
    p => p.stage === 'Installation Scheduled' || p.stage === 'Installation In Progress'
  );
  const lowStockItems = products.filter(i => i.currentStock <= i.minThreshold);

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Installation Team Field Hub</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Field Installation &amp; Site Execution Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Rooftop structure fabrication, solar module mounting, DC string wiring, and staging warehouse material logistics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToTab('materials')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Material Planning &amp; BOM</span>
            </button>
            <button
              onClick={() => onNavigateToTab('installation')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Field Schedule</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Site Work</span>
              <Wrench className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{installingProjects.length} Rooftops</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Currently under structural &amp; electrical work
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Material Staging</span>
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-900">{projects.length} BOM Lists</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              Hardware kits ready for field dispatch
            </div>
          </div>

          <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl">
            <div className="flex items-center justify-between text-blue-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Field Tasks</span>
              <CheckSquare className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-blue-900">{installingProjects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0)} Milestones</div>
            <div className="text-[11px] text-blue-700 mt-1 font-medium">
              Technical check items and sign-offs
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Safety Sign-offs</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-900">100% OK</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              Harness &amp; earthing resistance tested
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split: Today's Site Work Orders + Safety Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Site Work Orders */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Wrench className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Ongoing Field Installations</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('installation')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-3">
              {installingProjects.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No installation in progress today. All scheduled sites up to date!
                </div>
              ) : (
                installingProjects.map(p => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">{p.customerName}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">
                          {p.capacityKw} kW
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{p.customerAddress}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{p.stage}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateToTab('installation')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Site Checklist
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-3 rounded-b-2xl flex items-center justify-between text-xs text-slate-600">
            <span>Material requisition requires site manager signoff</span>
            <button
              onClick={() => onNavigateToTab('materials')}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Open BOM Requisition
            </button>
          </div>
        </div>

        {/* Field Safety & Electrical Testing Guide */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Site Safety &amp; Quality QA</h3>
            </div>

            <ul className="mt-4 space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                <span>Lifeline rope &amp; dual-lanyard full-body safety harness mandatory on roofs above 2.5m.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                <span>Anchor fasteners tightened with torque wrench to manufacturer Nm specs.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                <span>Independent earth pits: Pit 1 (DC SPD), Pit 2 (AC SPD), Pit 3 (Lightning Arrestor &lt; 5 Ohms).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                <span>Verify open-circuit voltage (Voc) of each PV string before connecting to MPPT input.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateToTab('materials')}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Inspect Project BOM &amp; Dispatches</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
