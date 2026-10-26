import React, { useState } from 'react';
import { 
  FolderKanban, CheckSquare, Layers, Wrench, 
  Activity, CheckCircle2, Clock, AlertTriangle, LayoutDashboard, FileText, ShieldCheck
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

// Existing Views & Role Dashboard
import { ProjectManagerDashboard } from './ProjectManagerDashboard';
import { ProjectsView } from '../../components/projects/ProjectsView';
import { ProjectTasksView } from '../../components/projects/ProjectTasksView';
import { ProjectManagerBomView } from '../../components/projects/ProjectManagerBomView';
import { InstallationView } from '../../components/projects/InstallationView';
import { ProjectManagerHandoverView } from '../../components/projects/ProjectManagerHandoverView';
import { NavItemKey } from '../../components/layout/Sidebar';

interface ProjectManagerPanelProps {
  initialSubTab?: 'dashboard' | 'projects' | 'tasks' | 'materials' | 'installation' | 'handover';
  onTabChange?: (tab: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ProjectManagerPanel: React.FC<ProjectManagerPanelProps> = ({
  initialSubTab = 'dashboard',
  onTabChange,
  onNavigateToTab,
}) => {
  const { projects } = useCrm();
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'projects' | 'tasks' | 'materials' | 'installation' | 'handover'
  >(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabClick = (tab: 'dashboard' | 'projects' | 'tasks' | 'materials' | 'installation' | 'handover') => {
    setActiveSubTab(tab);
    if (onTabChange) {
      const navMap: Record<string, string> = {
        dashboard: 'dashboard',
        projects: 'projects',
        tasks: 'project-tasks',
        materials: 'materials',
        installation: 'installation',
        handover: 'quotations',
      };
      onTabChange(navMap[tab] || tab);
    }
  };

  const activeProjects = projects.filter(p => p.stage !== 'Completed');
  const commissioningProjects = projects.filter(p => p.stage === 'Commissioning' || p.stage === 'Net Metering');

  return (
    <div className="space-y-6">
      {/* Sub navigation bar for Project Manager */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => handleSubTabClick('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'dashboard'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-emerald-400" />
          <span>EPC Dashboard</span>
        </button>

        <button
          onClick={() => handleSubTabClick('projects')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'projects'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FolderKanban className="w-4 h-4 text-emerald-400" />
          <span>Solar Projects</span>
        </button>

        <button
          onClick={() => handleSubTabClick('materials')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'materials'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>BOM Technical Approvals</span>
        </button>

        <button
          onClick={() => handleSubTabClick('tasks')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'tasks'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>Project Tasks</span>
        </button>

        <button
          onClick={() => handleSubTabClick('handover')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'handover'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Deal Handover &amp; Quotes</span>
        </button>

        <button
          onClick={() => handleSubTabClick('installation')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'installation'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4 text-emerald-400" />
          <span>Installation Oversight</span>
        </button>
      </div>

      {/* Sub-view Content */}
      <div>
        {activeSubTab === 'dashboard' && (
          <ProjectManagerDashboard
            onNavigateToTab={(tab) => {
              if (tab === 'projects' || tab === 'tasks' || tab === 'materials' || tab === 'installation') {
                handleSubTabClick(tab as any);
              } else if (tab === 'quotations') {
                handleSubTabClick('handover');
              } else if (onTabChange) {
                onTabChange(tab);
              }
            }}
          />
        )}

        {activeSubTab === 'handover' && (
          <ProjectManagerHandoverView
            onNavigateToTab={(tab) => {
              if (tab === 'projects') handleSubTabClick('projects');
              else if (onNavigateToTab) onNavigateToTab(tab);
              else if (onTabChange) onTabChange(tab);
            }}
            onNavigateToProject={() => {
              handleSubTabClick('projects');
            }}
          />
        )}

        {activeSubTab === 'projects' && (
          <ProjectsView onNavigate={(tab) => {
            if (tab === 'quotations') handleSubTabClick('handover');
            else if (onNavigateToTab) onNavigateToTab(tab);
          }} />
        )}

        {activeSubTab === 'tasks' && <ProjectTasksView />}

        {activeSubTab === 'materials' && (
          <ProjectManagerBomView 
            onNavigateToProjects={() => handleSubTabClick('projects')} 
            onNavigateToHandover={() => handleSubTabClick('handover')}
          />
        )}

        {activeSubTab === 'installation' && <InstallationView />}
      </div>
    </div>
  );
};
