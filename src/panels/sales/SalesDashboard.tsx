import React, { useState } from 'react';
import { 
  Users, Flame, FileText, CheckCircle2, Phone, 
  Calendar, ArrowRight, IndianRupee, Target, Clock,
  TrendingUp, Plus, Sparkles, AlertCircle, UserCheck, ShieldCheck
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Lead } from '../../types';

interface SalesDashboardProps {
  onOpenNewLead: () => void;
  onNavigateToTab: (tab: string) => void;
  onNavigateToQuotation: (leadId?: string) => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  onOpenNewLead,
  onNavigateToTab,
  onNavigateToQuotation,
}) => {
  const { leads, followUps, quotations, activeRole, currentUser, employees, updateLead, surveys } = useCrm();

  const isManager = activeRole === 'Sales Manager' || activeRole === 'Super Admin';
  const isExecutive = activeRole === 'Sales Executive';

  // State for Manager Lead Assignment
  const [selectedRepByLead, setSelectedRepByLead] = useState<Record<string, string>>({});
  const [assignSuccessLeadId, setAssignSuccessLeadId] = useState<string | null>(null);

  const salesExecutives = employees.filter(
    e => e.role === 'Sales Executive' || e.department?.toLowerCase().includes('sales')
  );

  // Scoped Data for Sales Executive
  const isLeadAssignedToCurrentRep = (l: Lead) => {
    if (!currentUser) return false;
    if (currentUser.employeeId && l.assignedToId === currentUser.employeeId) return true;
    if (currentUser.id && l.assignedToId === currentUser.id) return true;
    if (l.assignedToName && currentUser.name) {
      const aName = l.assignedToName.trim().toLowerCase();
      const uName = currentUser.name.trim().toLowerCase();
      if (aName === uName) return true;
      const first = uName.split(' ')[0];
      if (first.length >= 3 && aName.includes(first)) return true;
    }
    return false;
  };

  const myLeads = leads.filter(isLeadAssignedToCurrentRep);
  const executiveLeads = myLeads;
  const myPendingFollowups = followUps.filter(f => {
    if (f.status !== 'Pending') return false;
    if (currentUser?.employeeId && f.assignedToId === currentUser.employeeId) return true;
    if (currentUser?.id && f.assignedToId === currentUser.id) return true;
    return false;
  }).slice(0, 6);
  const myHotLeads = executiveLeads.filter(l => (l.priority === 'High' || l.priority === 'Urgent') && l.status !== 'Won' && l.status !== 'Lost');
  const myWonLeads = executiveLeads.filter(l => l.status === 'Won');
  const myActiveProposals = quotations.filter(q => {
    const isStatus = q.status === 'Sent' || q.status === 'Draft' || q.status === 'Negotiation';
    if (!isStatus) return false;
    if (myLeads.some(l => l.id === q.leadId)) return true;
    if (q.salespersonName && currentUser?.name && q.salespersonName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0])) return true;
    return false;
  });

  // Team Data for Sales Manager
  const totalLeads = leads.length;
  const unassignedLeads = leads.filter(l => !l.assignedToId || l.assignedToId === '' || l.assignedToName === 'Unassigned' || l.assignedToName === 'Unallocated');
  const hotLeads = leads.filter(l => (l.priority === 'High' || l.priority === 'Urgent') && l.status !== 'Won' && l.status !== 'Lost');
  const wonLeads = leads.filter(l => l.status === 'Won');
  const winRate = totalLeads > 0 ? Math.round((wonLeads.length / totalLeads) * 100) : 0;
  const totalPipelineKw = leads.filter(l => l.status !== 'Lost').reduce((sum, l) => sum + (l.recommendedKw || 0), 0);
  const quotationsSent = quotations.filter(q => q.status === 'Sent' || q.status === 'Draft' || q.status === 'Negotiation');
  const quotationsTotalValue = quotations.reduce((sum, q) => sum + q.totalAmount, 0);

  const handleAssignLead = (leadId: string) => {
    const repId = selectedRepByLead[leadId];
    if (!repId) return;
    const rep = employees.find(e => e.id === repId);
    if (!rep) return;

    updateLead(leadId, {
      assignedToId: rep.id,
      assignedToName: rep.name,
    });

    setAssignSuccessLeadId(leadId);
    setTimeout(() => setAssignSuccessLeadId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Summary Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>{isManager ? 'Sales Leadership Cockpit' : 'Sales Executive Workspace'}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isManager 
                ? 'Solar Sales Pipeline & Team Governance' 
                : 'My Solar Sales & Prospecting Desk'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isManager
                ? 'Team-wide lead assignment triage, representative closing velocity, proposal oversight, and quota tracking.'
                : 'Manage your assigned rooftop inquiries, execute today\'s customer follow-up calls, and close turnkey solar proposals.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenNewLead}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Lead</span>
            </button>
            <button
              onClick={() => onNavigateToTab('quotations')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>{isManager ? 'All Quotations' : 'Draft Proposal'}</span>
            </button>
          </div>
        </div>

        {/* 4 Role-Specific KPI Metric Tiles */}
        {isManager ? (
          /* SALES MANAGER KPIS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Team Pipeline</span>
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{totalPipelineKw} kW</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center justify-between">
                <span>{totalLeads} Total Inquiries</span>
                <span className="text-emerald-700 font-bold">{wonLeads.length} Closed Won</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl">
              <div className="flex items-center justify-between text-amber-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Unassigned Leads</span>
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-900">{unassignedLeads.length} Inquiries</div>
              <div className="text-[11px] text-amber-700 mt-1 font-medium">
                {unassignedLeads.length > 0 ? 'Requires immediate rep dispatch' : 'All leads assigned to representatives'}
              </div>
            </div>

            <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl">
              <div className="flex items-center justify-between text-blue-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Proposals in Market</span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-blue-900">{quotationsSent.length} Active</div>
              <div className="text-[11px] text-blue-700 mt-1 font-medium">
                Total Value: ₹{(quotationsTotalValue / 100000).toFixed(1)} Lakhs
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
              <div className="flex items-center justify-between text-emerald-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Team Win Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-900">{winRate}%</div>
              <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                {wonLeads.length} deals won from {totalLeads} inquiries
              </div>
            </div>
          </div>
        ) : (
          /* SALES EXECUTIVE KPIS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">My Active Leads</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{executiveLeads.length} Leads</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center justify-between">
                <span>{myHotLeads.length} Hot Deals</span>
                <span className="text-emerald-700 font-bold">{myWonLeads.length} Won</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl">
              <div className="flex items-center justify-between text-amber-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Callbacks Due Today</span>
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-900">{myPendingFollowups.length} Calls</div>
              <div className="text-[11px] text-amber-700 mt-1 font-medium">
                Scheduled discovery &amp; quote discussions
              </div>
            </div>

            <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl">
              <div className="flex items-center justify-between text-blue-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">My Active Quotes</span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-blue-900">{myActiveProposals.length} Proposals</div>
              <div className="text-[11px] text-blue-700 mt-1 font-medium">
                Awaiting customer contract signature
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
              <div className="flex items-center justify-between text-emerald-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">My Closed Won</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-900">{myWonLeads.length} Won</div>
              <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                Turnkey installations handed over to PM
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SALES MANAGER SPECIFIC WORKSPACE: Unassigned Triage + Rep Leaderboard */}
      {isManager && (
        <div className="space-y-6">
          {/* Unassigned Leads Triage Desk */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Users className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Lead Ingestion &amp; Assignment Triage Desk</h3>
                  <p className="text-[11px] text-slate-500">Dispatch new incoming solar enquiries to certified sales executives</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToTab('leads')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Leads Table ({leads.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {unassignedLeads.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl mt-4 border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                <span className="font-semibold text-slate-700">All inbound leads are assigned!</span> Zero triage backlog.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {unassignedLeads.slice(0, 4).map(lead => (
                  <div key={lead.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{lead.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold">
                          {lead.recommendedKw || 5} kW System
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{lead.id}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {lead.city}, {lead.state} • Phone: {lead.phone} • Source: <strong className="text-slate-700">{lead.source}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedRepByLead[lead.id] || ''}
                        onChange={e => setSelectedRepByLead({ ...selectedRepByLead, [lead.id]: e.target.value })}
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">Select Sales Rep...</option>
                        {salesExecutives.map(rep => (
                          <option key={rep.id} value={rep.id}>
                            {rep.name}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleAssignLead(lead.id)}
                        disabled={!selectedRepByLead[lead.id]}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        {assignSuccessLeadId === lead.id ? 'Assigned!' : 'Assign'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sales Representative Performance Leaderboard */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Representative Sales Performance Matrix</h3>
                  <p className="text-[11px] text-slate-500">Real-time pipeline volume, proposal conversion, and closing rate per executive</p>
                </div>
              </div>
            </div>

            {/* Mobile Cards (< lg) */}
            <div className="lg:hidden divide-y divide-slate-100 mt-3">
              {salesExecutives.map(rep => {
                const repLeads = leads.filter(l => l.assignedToId === rep.id || l.assignedToName === rep.name);
                const repWon = repLeads.filter(l => l.status === 'Won').length;
                const repQuotes = quotations.filter(q => q.salespersonId === rep.id || q.salespersonName === rep.name).length;
                const repWinRate = repLeads.length > 0 ? Math.round((repWon / repLeads.length) * 100) : 0;
                return (
                  <div key={rep.id} className="py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-emerald-400 font-bold text-xs flex items-center justify-center">
                          {rep.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800 text-xs">{rep.name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {repWinRate}% Won
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-xl text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Pipeline</span>
                        <span className="font-bold text-slate-800 text-xs">{repLeads.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Quotes</span>
                        <span className="font-bold text-slate-800 text-xs">{repQuotes}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Won Deals</span>
                        <span className="font-bold text-emerald-700 text-xs">{repWon}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= lg) */}
            <div className="hidden lg:block overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                    <th className="pb-2">Sales Consultant</th>
                    <th className="pb-2">Active Pipeline</th>
                    <th className="pb-2">Quotations Sent</th>
                    <th className="pb-2">Closed Won</th>
                    <th className="pb-2 text-right">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesExecutives.map(rep => {
                    const repLeads = leads.filter(l => l.assignedToId === rep.id || l.assignedToName === rep.name);
                    const repWon = repLeads.filter(l => l.status === 'Won').length;
                    const repQuotes = quotations.filter(q => q.salespersonId === rep.id || q.salespersonName === rep.name).length;
                    const repWinRate = repLeads.length > 0 ? Math.round((repWon / repLeads.length) * 100) : 0;
                    return (
                      <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-900 text-emerald-400 font-bold text-[10px] flex items-center justify-center">
                              {rep.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{rep.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 font-semibold text-slate-700">{repLeads.length} Leads</td>
                        <td className="py-2.5 text-slate-600">{repQuotes} Proposals</td>
                        <td className="py-2.5 font-bold text-emerald-700">{repWon} Deals</td>
                        <td className="py-2.5 text-right font-bold text-slate-900">{repWinRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Main Operational Split: Today's Follow-ups + Hot Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Scheduled Follow-up Calls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isManager ? 'Team Follow-up Calls Scheduled' : 'My Follow-up Callbacks Due Today'}
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('follow-ups')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({followUps.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-3">
              {myPendingFollowups.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No pending follow-ups scheduled for today. Great job!
                </div>
              ) : (
                myPendingFollowups.map(item => {
                  const leadPhone = leads.find(l => l.id === item.leadId)?.phone || '+91 98450 12345';
                  return (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">{item.leadName}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-semibold">
                            {item.type || 'Call'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.notes}</p>
                      </div>

                      <a
                        href={`tel:${leadPhone}`}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>Call</span>
                      </a>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-3 rounded-b-2xl flex items-center justify-between text-xs text-slate-600">
            <span>Pending Reminders: {followUps.filter(f => f.status === 'Pending').length}</span>
            <button
              onClick={() => onNavigateToTab('follow-ups')}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Open Full Calendar
            </button>
          </div>
        </div>

        {/* Hot Leads Needing Immediate Action */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                  <Flame className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isManager ? 'High Priority Team Inquiries' : 'My High Priority Hot Inquiries'}
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('leads')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>All Leads ({isManager ? leads.length : executiveLeads.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-3">
              {(isManager ? hotLeads : myHotLeads).slice(0, 5).map(lead => (
                <div key={lead.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs truncate">{lead.name}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">
                        {lead.recommendedKw} kW
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {lead.city}, {lead.state} • Monthly Bill: ₹{lead.monthlyBill?.toLocaleString('en-IN') || '0'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(() => {
                      const linkedSurvey = surveys.find(s => s.leadId === lead.id || s.id === lead.surveyId);
                      const isSurveyApproved = linkedSurvey?.status === 'Approved' || lead.status === 'Survey Completed' || lead.status === 'Quotation Sent' || lead.status === 'Negotiation' || lead.status === 'Won' || Boolean(lead.quotationId);
                      if (isSurveyApproved) {
                        return (
                          <button
                            onClick={() => onNavigateToQuotation(lead.id)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Quote
                          </button>
                        );
                      }
                      return (
                        <button
                          onClick={() => onNavigateToTab?.('leads')}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          View Lead
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-3 rounded-b-2xl flex items-center justify-between text-xs text-slate-600">
            <span>High conversion probability prospects</span>
            <button
              onClick={() => onNavigateToTab('pipeline')}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Open Pipeline Kanban
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

