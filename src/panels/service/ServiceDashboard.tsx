import React from 'react';
import { 
  LifeBuoy, ShieldCheck, Clock, AlertTriangle, 
  ArrowRight
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface ServiceDashboardProps {
  onNavigateToTab: (tab: string) => void;
}

export const ServiceDashboard: React.FC<ServiceDashboardProps> = ({
  onNavigateToTab,
}) => {
  const { tickets, amcs } = useCrm();

  const openTickets = tickets.filter(t => t.status !== 'Closed');
  const criticalTickets = tickets.filter(t => (t.severity === 'Urgent' || t.severity === 'High') && t.status !== 'Closed');
  const activeAmcs = amcs.filter(a => a.status === 'Active');
  const dueAmcs = amcs.filter(a => a.status === 'Renewal Due');

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Service &amp; O&amp;M Asset Care Hub</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Solar Service, Breakdown Tickets &amp; AMC Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Rooftop solar breakdown ticket SLA dispatch, solar module cleaning rounds, inverter error resolution, and AMC renewals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToTab('warranty')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Warranty Portal</span>
            </button>
            <button
              onClick={() => onNavigateToTab('tickets')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>All Tickets</span>
            </button>
          </div>
        </div>

        {/* 4 O&M Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Open Tickets</span>
              <LifeBuoy className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{openTickets.length} Active</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Awaiting technician diagnostic visit
            </div>
          </div>

          <div className="p-4 bg-red-50/60 border border-red-200/80 rounded-xl">
            <div className="flex items-center justify-between text-red-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">High / Urgent SLA Alarms</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-extrabold text-red-900">{criticalTickets.length} Priority</div>
            <div className="text-[11px] text-red-700 mt-1 font-medium">
              Plant generation trip / 4 hr SLA
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active AMC Contracts</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-900">{activeAmcs.length} Plants</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              Annual maintenance &amp; drone thermography
            </div>
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl">
            <div className="flex items-center justify-between text-amber-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">AMC Renewals Due</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-900">{dueAmcs.length} Due</div>
            <div className="text-[11px] text-amber-700 mt-1 font-medium">
              Annual contract renewal reminders sent
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split: Open Breakdown Tickets + AMC Preventive Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Breakdown Tickets Queue */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <LifeBuoy className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Solar Breakdown Service Queue</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('tickets')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>All Tickets ({tickets.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-3">
              {openTickets.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Zero open tickets! All solar client systems are generating at optimal efficiency.
                </div>
              ) : (
                openTickets.slice(0, 5).map(t => (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">{t.customerName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {t.ticketNumber}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          t.severity === 'Urgent' || t.severity === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {t.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Issue: <strong className="text-slate-700">{t.issueCategory}</strong> • {t.description}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-500 hidden sm:inline">Assigned: {t.technicianName || 'Unassigned'}</span>
                      <button
                        onClick={() => onNavigateToTab('tickets')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Dispatch
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-3 rounded-b-2xl flex items-center justify-between text-xs text-slate-600">
            <span>Critical inverter faults have maximum 4-hour SLA resolution window</span>
            <button
              onClick={() => onNavigateToTab('tickets')}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Open Ticket Dispatcher
            </button>
          </div>
        </div>

        {/* AMC Maintenance Schedule */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">AMC Service Contracts</h3>
              </div>
              <span className="text-xs font-bold text-emerald-700">{amcs.length} Total</span>
            </div>

            <div className="divide-y divide-slate-100 mt-3">
              {amcs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active AMC contracts yet. Contracts will automatically provision upon project commissioning.
                </div>
              ) : (
                amcs.slice(0, 5).map(a => (
                  <div key={a.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800 truncate">{a.customerName}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">
                        {a.planName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>Visits: {a.completedVisits}/{a.visitsPerYear} Completed</span>
                      <span className="font-semibold text-slate-700">{a.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateToTab('amc')}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Manage AMC Preventive Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
