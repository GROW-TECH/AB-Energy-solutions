import React, { useState } from 'react';
import { LifeBuoy, ShieldCheck, Clock, AlertTriangle, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

// Existing Views & Role Dashboard
import { ServiceDashboard } from './ServiceDashboard';
import { ServiceTicketsView } from '../../components/service/ServiceTicketsView';
import { WarrantyView } from '../../components/service/WarrantyView';
import { AmcView } from '../../components/service/AmcView';

interface ServicePanelProps {
  initialSubTab?: 'dashboard' | 'tickets' | 'warranty' | 'amc';
  onTabChange?: (tab: string) => void;
}

export const ServicePanel: React.FC<ServicePanelProps> = ({
  initialSubTab = 'dashboard',
  onTabChange,
}) => {
  const { tickets, amcs } = useCrm();
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'tickets' | 'warranty' | 'amc'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabClick = (tab: 'dashboard' | 'tickets' | 'warranty' | 'amc') => {
    setActiveSubTab(tab);
    if (onTabChange) {
      const navMap: Record<string, string> = {
        dashboard: 'dashboard',
        tickets: 'service-tickets',
        warranty: 'warranty',
        amc: 'amc',
      };
      onTabChange(navMap[tab] || tab);
    }
  };

  const openTickets = tickets.filter(t => t.status !== 'Closed').length;
  const activeAmcs = amcs.filter(a => a.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Service Team Header - Shown on Dashboard */}
      {activeSubTab === 'dashboard' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                  <LifeBuoy className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Service, O&amp;M &amp; Maintenance Panel
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full">
                  Post-Commissioning Asset Care
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Resolve inverter fault tickets, schedule rooftop module cleaning rounds, process manufacturer warranty replacements, and manage annual maintenance contracts (AMC).
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{openTickets} Open Tickets</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-semibold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{activeAmcs} Active AMCs</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view Content */}
      <div>
        {activeSubTab === 'dashboard' && (
          <ServiceDashboard
            onNavigateToTab={(tab) => {
              if (tab === 'tickets' || tab === 'warranty' || tab === 'amc') {
                handleSubTabClick(tab as any);
              } else if (onTabChange) {
                onTabChange(tab);
              }
            }}
          />
        )}

        {activeSubTab === 'tickets' && <ServiceTicketsView />}

        {activeSubTab === 'warranty' && <WarrantyView />}

        {activeSubTab === 'amc' && <AmcView />}
      </div>
    </div>
  );
};
