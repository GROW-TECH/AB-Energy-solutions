import React, { useState } from 'react';
import { 
  ShieldCheck, LayoutDashboard, BarChart3, Cpu, Users, 
  FileText, Settings, Database, Activity, CheckCircle2 
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

// Existing Views
import { SmartDashboard } from '../../components/dashboard/SmartDashboard';
import { AnalyticsView } from '../../components/analytics/AnalyticsView';
import { TeamView } from '../../components/team/TeamView';
import { DocumentsView } from '../../components/documents/DocumentsView';
import { SettingsView } from '../../components/settings/SettingsView';

interface SuperAdminPanelProps {
  onOpenNewLead: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
  onOpenNewLead,
  onNavigateToTab,
}) => {
  const { leads, projects, invoices } = useCrm();
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'analytics' | 'team' | 'documents' | 'settings'
  >('overview');

  const totalRevenue = invoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const activeProjectsCount = projects.filter(p => p.stage !== 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Super Admin Top Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-slate-900 text-emerald-400 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Super Admin Dashboard
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full">
                All Access Authority
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Executive business oversight, remote MySQL persistence, recommendation engine, and multi-department governance.
            </p>
          </div>

          {/* Quick System Indicators */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>MySQL Live</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>{activeProjectsCount} Active Projects</span>
            </div>
          </div>
        </div>
      </div>

      {/* Super Admin Active Sub-view */}
      <div>
        {activeSubTab === 'overview' && (
          <SmartDashboard
            onOpenNewLead={onOpenNewLead}
            onNavigate={(tab) => {
              if (onNavigateToTab) onNavigateToTab(tab);
            }}
          />
        )}

        {activeSubTab === 'analytics' && (
          <AnalyticsView
            onNavigate={(tab) => {
              if (onNavigateToTab) onNavigateToTab(tab);
            }}
          />
        )}

        {activeSubTab === 'team' && <TeamView />}

        {activeSubTab === 'documents' && <DocumentsView />}

        {activeSubTab === 'settings' && <SettingsView />}
      </div>
    </div>
  );
};
