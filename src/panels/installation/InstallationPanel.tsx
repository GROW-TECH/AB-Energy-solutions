import React, { useState } from 'react';
import { 
  Wrench, CheckSquare, Boxes, Layers, 
  Truck, ShieldAlert, CheckCircle2, LayoutDashboard 
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

// Existing Views & Role Dashboard
import { InstallationDashboard } from './InstallationDashboard';
import { InstallationView } from '../../components/projects/InstallationView';
import { ProjectTasksView } from '../../components/projects/ProjectTasksView';
import { MaterialsPlanningView } from '../../components/projects/MaterialsPlanningView';

interface InstallationPanelProps {
  initialSubTab?: 'dashboard' | 'installation' | 'tasks' | 'materials';
  onTabChange?: (tab: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const InstallationPanel: React.FC<InstallationPanelProps> = ({
  initialSubTab = 'dashboard',
  onTabChange,
  onNavigateToTab,
}) => {
  const { projects } = useCrm();
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'installation' | 'tasks' | 'materials'
  >(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabClick = (tab: 'dashboard' | 'installation' | 'tasks' | 'materials') => {
    setActiveSubTab(tab);
    if (onTabChange) {
      const navMap: Record<string, string> = {
        dashboard: 'dashboard',
        installation: 'installation',
        tasks: 'project-tasks',
        materials: 'materials',
      };
      onTabChange(navMap[tab] || tab);
    }
  };

  const activeInstallations = projects.filter(
    p => p.stage === 'Installation Scheduled' || p.stage === 'Installation In Progress'
  ).length;

  return (
    <div className="space-y-6">
      {/* Installation Team Header - Shown on Dashboard */}
      {activeSubTab === 'dashboard' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                  <Wrench className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Installation Team &amp; Field Execution Panel
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full">
                  Site Mounting, Wiring &amp; Inverter Mounting
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage field technician work orders, daily progress logs, staging warehouse material pickups, and site safety audits.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-semibold text-emerald-800">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span>{activeInstallations} Ongoing Site Mountings</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view Content */}
      <div>
        {activeSubTab === 'dashboard' && (
          <InstallationDashboard
            onNavigateToTab={(tab) => {
              if (tab === 'installation' || tab === 'tasks' || tab === 'materials') {
                handleSubTabClick(tab as any);
              } else if (onTabChange) {
                onTabChange(tab);
              }
            }}
          />
        )}

        {activeSubTab === 'installation' && <InstallationView />}

        {activeSubTab === 'tasks' && <ProjectTasksView />}

        {activeSubTab === 'materials' && <MaterialsPlanningView />}
      </div>
    </div>
  );
};
