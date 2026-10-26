import React, { useState } from 'react';
import { 
  Users, GitBranch, CalendarClock, FileText, 
  UserCheck, Plus, Flame, IndianRupee, Target, LayoutDashboard 
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

// Existing Views & Role Dashboard
import { SalesDashboard } from './SalesDashboard';
import { LeadsView } from '../../components/sales/LeadsView';
import { PipelineView } from '../../components/sales/PipelineView';
import { FollowUpsView } from '../../components/sales/FollowUpsView';
import { QuotationsView } from '../../components/sales/QuotationsView';
import { CustomersView } from '../../components/sales/CustomersView';
import { NegotiationView } from '../../components/sales/NegotiationView';

interface SalesPanelProps {
  initialSubTab?: 'dashboard' | 'leads' | 'pipeline' | 'followups' | 'quotations' | 'negotiations' | 'customers';
  targetQuoteLeadId?: string;
  onTabChange?: (tab: string) => void;
  onOpenNewLead: () => void;
  onNavigateToQuotation: (leadId?: string) => void;
  onNavigateToSurvey: (leadId?: string) => void;
  onNavigateToProject: (projectId?: string) => void;
}

export const SalesPanel: React.FC<SalesPanelProps> = ({
  initialSubTab = 'dashboard',
  targetQuoteLeadId,
  onTabChange,
  onOpenNewLead,
  onNavigateToQuotation,
  onNavigateToSurvey,
  onNavigateToProject,
}) => {
  const { leads, activeRole } = useCrm();
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'leads' | 'pipeline' | 'followups' | 'quotations' | 'negotiations' | 'customers'
  >(initialSubTab);

  // Sync sub-tab immediately when sidebar navigation changes
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabClick = (tab: 'dashboard' | 'leads' | 'pipeline' | 'followups' | 'quotations' | 'negotiations' | 'customers') => {
    setActiveSubTab(tab);
    if (onTabChange) {
      const navKey = tab === 'followups' ? 'follow-ups' : tab;
      onTabChange(navKey);
    }
  };

  const hotLeadsCount = leads.filter(l => l.priority === 'High' && l.status !== 'Won' && l.status !== 'Lost').length;
  const totalPipelineKw = leads.filter(l => l.status !== 'Lost').reduce((sum, l) => sum + (l.recommendedKw || 0), 0);
  const wonLeadsCount = leads.filter(l => l.status === 'Won').length;

  return (
    <div className="space-y-6">
      {/* Sales Panel Top Header - Shown on Dashboard */}
      {activeSubTab === 'dashboard' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                  <Users className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {activeRole === 'Sales Manager' ? 'Sales Manager Operations' : 'Sales Executive Panel'}
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full">
                  Lead-to-Deal Conversion
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage client inquiries, trigger rooftop survey dispatches, generate customized solar proposals, and close EPC deals.
              </p>
            </div>

            {/* Quick Metrics & Action */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs font-semibold text-amber-800">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>{hotLeadsCount} Hot Leads</span>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>{totalPipelineKw} kW Pipeline</span>
              </div>

              <button
                onClick={onOpenNewLead}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Lead</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view Content */}
      <div>
        {activeSubTab === 'dashboard' && (
          <SalesDashboard
            onOpenNewLead={onOpenNewLead}
            onNavigateToTab={(tab) => {
              if (tab === 'leads' || tab === 'pipeline' || tab === 'follow-ups' || tab === 'quotations' || tab === 'customers') {
                handleSubTabClick(tab === 'follow-ups' ? 'followups' : tab as any);
              } else if (onTabChange) {
                onTabChange(tab);
              }
            }}
            onNavigateToQuotation={(leadId) => {
              setActiveSubTab('quotations');
              if (onNavigateToQuotation) onNavigateToQuotation(leadId);
            }}
          />
        )}
        {activeSubTab === 'leads' && (
          <LeadsView
            onOpenNewLead={onOpenNewLead}
            onNavigateToQuotation={(leadId) => {
              setActiveSubTab('quotations');
              if (onNavigateToQuotation) onNavigateToQuotation(leadId);
            }}
            onNavigateToSurvey={onNavigateToSurvey}
          />
        )}

        {activeSubTab === 'pipeline' && (
          <PipelineView
            onOpenNewLead={onOpenNewLead}
            onNavigateToQuotation={(leadId) => {
              setActiveSubTab('quotations');
              if (onNavigateToQuotation) onNavigateToQuotation(leadId);
            }}
            onNavigateToSurvey={onNavigateToSurvey}
          />
        )}

        {activeSubTab === 'quotations' && (
          <QuotationsView
            initialLeadId={targetQuoteLeadId}
            onNavigateToProject={onNavigateToProject}
          />
        )}

        {activeSubTab === 'negotiations' && (
          <NegotiationView 
            onNavigateToProject={onNavigateToProject} 
            onNavigateToTab={onTabChange} 
          />
        )}

        {activeSubTab === 'followups' && <FollowUpsView />}

        {activeSubTab === 'customers' && (
          <CustomersView onNavigate={(tab) => {
            if (tab === 'customer-portal') {
              if (onTabChange) onTabChange('customer-portal');
            } else if (tab === 'leads' || tab === 'quotations' || tab === 'pipeline') {
              setActiveSubTab(tab as any);
            }
          }} />
        )}
      </div>
    </div>
  );
};
