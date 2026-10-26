import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Filter, Phone, Mail, MapPin, 
  CheckCircle2, ChevronRight, ChevronLeft, X, Calendar, 
  ArrowRight, Clock, ShieldAlert, FileText, Send, Sun, Compass, Trash2, UserCheck
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Lead, LeadStatus, Priority, CustomerApplicationType, SolarSystemType } from '../../types';

interface LeadsViewProps {
  onOpenNewLead: () => void;
  onNavigateToQuotation: (leadId: string) => void;
  onNavigateToSurvey: (leadId: string) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  onOpenNewLead,
  onNavigateToQuotation,
  onNavigateToSurvey,
}) => {
  const { leads, updateLead, qualifyLead, deleteLead, timeline, activeRole, currentUser, employees } = useCrm();

  const isExecutive = activeRole === 'Sales Executive';
  const CUSTOMER_TYPES: CustomerApplicationType[] = ['Home', 'Residential', 'Commercial', 'Industrial', 'Water Pump'];
  const SYSTEM_TYPES: SolarSystemType[] = ['On-Grid', 'Off-Grid', 'Hybrid'];
  const isLeadAssignedToMe = (lead: Lead) => {
    return (
      lead.assignedToId === currentUser?.id || 
      (currentUser?.name && lead.assignedToName?.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0])) ||
      lead.assignedToName?.toLowerCase().includes('vikram')
    );
  };

  const myLeadsCount = leads.filter(isLeadAssignedToMe).length;
  const [assignedScope, setAssignedScope] = useState<'my' | 'all'>(isExecutive ? 'my' : 'all');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // Survey Scheduling Modal State
  const [surveyLeadToSchedule, setSurveyLeadToSchedule] = useState<Lead | null>(null);
  const [scheduleEngineerId, setScheduleEngineerId] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<string>(() => {
    const d = new Date(Date.now() + 86400000 * 2);
    return d.toISOString().split('T')[0];
  });
  const [scheduleTime, setScheduleTime] = useState<string>('10:00 AM - 12:00 PM');
  const [scheduleNotes, setScheduleNotes] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Reset to first page when filtering or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, pageSize, assignedScope]);

  // Scoped baseline leads for counts
  const activeBaseLeads = (isExecutive && assignedScope === 'my' && myLeadsCount > 0)
    ? leads.filter(isLeadAssignedToMe)
    : leads;

  // Filtered Leads
  const filteredLeads = leads.filter(lead => {
    if (isExecutive && assignedScope === 'my' && myLeadsCount > 0) {
      if (!isLeadAssignedToMe(lead)) return false;
    }

    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.address && lead.address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || lead.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const statuses: LeadStatus[] = [
    'New', 'Contacted', 'Qualified', 'Site Survey Scheduled', 
    'Survey Completed', 'Quotation Sent', 'Negotiation', 'Won', 'Lost'
  ];

  const totalLeadsCount = activeBaseLeads.length;
  const highPriorityCount = activeBaseLeads.filter(l => l.priority === 'High' || l.priority === 'Urgent').length;
  const totalEstimatedKw = activeBaseLeads.reduce((sum, l) => sum + (l.recommendedKw || 0), 0);
  const surveyReadyCount = activeBaseLeads.filter(l => l.status === 'Qualified' || l.status === 'Survey Completed').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Solar Leads Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated lead qualification, preliminary kW sizing, and technical survey dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Kanban
            </button>
          </div>

          <button
            onClick={onOpenNewLead}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Solar Lead</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Leads in CRM
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {totalLeadsCount}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 block">
            Active Consumer Inquiries
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            High Priority Leads
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {highPriorityCount}
          </div>
          <span className="text-[11px] font-semibold text-amber-600 block">
            Urgent Follow-Up Required
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Estimated Solar Capacity
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {totalEstimatedKw} kW
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 block">
            Calculated Pipeline Volume
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Survey Qualified
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {surveyReadyCount}
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 block">
            Ready for Rooftop Audit
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, phone, city, or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isExecutive && (
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setAssignedScope('my')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  assignedScope === 'my'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Leads ({myLeadsCount})
              </button>
              <button
                type="button"
                onClick={() => setAssignedScope('all')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  assignedScope === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Team ({leads.length})
              </button>
            </div>
          )}

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main View: Table or Kanban */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Lead ID &amp; Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">System Sizing</th>
                  <th className="py-3 px-4">Monthly Bill &amp; Roof</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Status &amp; Priority</th>
                  <th className="py-3 px-4 text-right">Instant Automation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLeads.map(lead => (
                  <tr 
                    key={lead.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-emerald-700">
                        {lead.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {lead.id} • {lead.source}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {lead.customerType || 'Residential'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {lead.systemType || 'On-Grid'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{lead.phone}</div>
                      {lead.email && <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{lead.email}</div>}
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]" title={lead.address || `${lead.city}, ${lead.state}`}>
                        {lead.address || `${lead.city}, ${lead.state}`}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <span>{lead.recommendedKw} kW</span>
                        <span className="text-[10px] font-normal text-slate-500">System</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        Est: ₹{(lead.estimatedBudget / 100000).toFixed(1)} Lakhs
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        ₹{lead.monthlyBill.toLocaleString('en-IN')}/mo
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {lead.roofAreaSqFt} sq.ft ({lead.roofType})
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{lead.assignedToName}</div>
                      <div className="text-[10px] text-slate-400">Sales Representative</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lead.status === 'Won' ? 'bg-emerald-100 text-emerald-800' :
                          lead.status === 'Qualified' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'Survey Completed' ? 'bg-purple-100 text-purple-800' :
                          lead.status === 'New' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {lead.status}
                        </span>

                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          lead.priority === 'Urgent' ? 'text-red-600' :
                          lead.priority === 'High' ? 'text-amber-600' :
                          'text-slate-400'
                        }`}>
                          ● {lead.priority}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.status === 'New' || lead.status === 'Contacted' ? (
                          <button
                            onClick={() => {
                              setSurveyLeadToSchedule(lead);
                              const engs = employees.filter(e => e.role === 'Survey Engineer');
                              if (engs.length > 0 && !scheduleEngineerId) setScheduleEngineerId(engs[0].id);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            title="Schedule site survey and assign engineer"
                          >
                            <Compass className="w-3 h-3" />
                            <span>Survey</span>
                          </button>
                        ) : null}

                        <button
                          onClick={() => onNavigateToQuotation(lead.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          title="Generate Solar Techno-Commercial Proposal"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Quote</span>
                        </button>


                        <button
                          onClick={() => setLeadToDelete(lead)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="Delete Solar Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clean Pagination Bar */}
          <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong>{filteredLeads.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * pageSize, filteredLeads.length)}</strong> of{' '}
                <strong>{filteredLeads.length}</strong> leads
              </span>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Per page:</span>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-medium text-slate-700"
                >
                  <option value={8}>8</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                      currentPage === page
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {(['New', 'Qualified', 'Survey Completed', 'Quotation Sent'] as LeadStatus[]).map(st => {
            const colLeads = filteredLeads.filter(l => l.status === st);
            return (
              <div key={st} className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{st}</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-600">
                    {colLeads.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 shadow-xs cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{lead.name}</h4>
                          <span className="text-[10px] text-slate-400">{lead.id} • {lead.city}</span>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[9px] border border-blue-200">
                              {lead.customerType || 'Residential'}
                            </span>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold text-[9px] border border-amber-200">
                              {lead.systemType || 'On-Grid'}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-emerald-700 text-xs bg-emerald-50 px-1.5 py-0.5 rounded">
                          {lead.recommendedKw} kW
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        Bill: ₹{lead.monthlyBill.toLocaleString('en-IN')}/mo • {lead.roofType}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">{lead.assignedToName}</span>
                        {st === 'New' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSurveyLeadToSchedule(lead);
                              const engs = employees.filter(e => e.role === 'Survey Engineer');
                              if (engs.length > 0 && !scheduleEngineerId) setScheduleEngineerId(engs[0].id);
                            }}
                            className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                          >
                            <Compass className="w-3 h-3" />
                            <span>Schedule Survey</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">{lead.source}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Lead Details Drawer / Slide-Over */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                    {selectedLead.id}
                  </span>
                  <span className="text-xs font-bold text-slate-300">Lead Profile</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">{selectedLead.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs">

              {selectedLead.status === 'New' || selectedLead.status === 'Contacted' ? (
                <button
                  onClick={() => {
                    setSurveyLeadToSchedule(selectedLead);
                    const engs = employees.filter(e => e.role === 'Survey Engineer');
                    if (engs.length > 0 && !scheduleEngineerId) setScheduleEngineerId(engs[0].id);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Schedule &amp; Dispatch Survey</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigateToQuotation(selectedLead.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate Quotation</span>
                </button>
              )}

              <a
                href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${selectedLead.name}, greetings from AB Energy Solutions regarding your ${selectedLead.recommendedKw}kW Solar System inquiry!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold rounded-lg transition-colors ml-auto"
              >
                <Send className="w-3.5 h-3.5 text-emerald-700" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
              {/* Solar Recommendation Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-emerald-600" />
                    <span>Calculated Solar Sizing</span>
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-600 text-white rounded">
                    {selectedLead.recommendedKw} kW Sizing
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1 text-slate-700">
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <div className="text-[10px] text-slate-400">Monthly Yield</div>
                    <div className="font-bold text-slate-900">{selectedLead.recommendedKw * 120} kWh</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <div className="text-[10px] text-slate-400">Est. Budget</div>
                    <div className="font-bold text-slate-900">₹{(selectedLead.estimatedBudget / 100000).toFixed(1)}L</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <div className="text-[10px] text-slate-400">Annual Savings</div>
                    <div className="font-bold text-emerald-700">₹{(selectedLead.recommendedKw * 1460 * 7.5).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                  Contact &amp; Site Location
                </h4>
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400">Phone</span>
                    <div className="font-semibold text-slate-800">{selectedLead.phone}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Email</span>
                    <div className="font-semibold text-slate-800">{selectedLead.email || 'N/A'}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400">Address</span>
                    <div className="font-semibold text-slate-800">{selectedLead.address || selectedLead.city}, {selectedLead.state} - {selectedLead.pincode}</div>
                  </div>
                </div>
              </div>

              {/* Technical Attributes */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                  Site Technical Feasibility
                </h4>
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400">Monthly Bill</span>
                    <div className="font-semibold text-slate-800">₹{selectedLead.monthlyBill.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Sanction Load</span>
                    <div className="font-semibold text-slate-800">{selectedLead.sanctionLoad} kW</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Roof Area</span>
                    <div className="font-semibold text-slate-800">{selectedLead.roofAreaSqFt} Sq. Ft.</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Roof Construction</span>
                    <div className="font-semibold text-slate-800">{selectedLead.roofType}</div>
                  </div>
                </div>
              </div>

              {/* Quick Action: Generate Proposal */}
              <div>
                <button
                  onClick={() => {
                    onNavigateToQuotation(selectedLead.id);
                    setSelectedLead(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Solar Quotation &amp; Proposal</span>
                </button>
              </div>

              {/* Solar Application & System Classification */}
              <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                  Solar Application & System
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Customer / Application Type
                    </label>
                    <select
                      value={selectedLead.customerType || 'Residential'}
                      onChange={e => {
                        const newType = e.target.value as CustomerApplicationType;
                        updateLead(selectedLead.id, { customerType: newType });
                        setSelectedLead({ ...selectedLead, customerType: newType });
                      }}
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      {CUSTOMER_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Solar System Type
                    </label>
                    <select
                      value={selectedLead.systemType || 'On-Grid'}
                      onChange={e => {
                        const newType = e.target.value as SolarSystemType;
                        updateLead(selectedLead.id, { systemType: newType });
                        setSelectedLead({ ...selectedLead, systemType: newType });
                      }}
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      {SYSTEM_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Update Dropdown */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                  Update Lead Stage
                </h4>
                <select
                  value={selectedLead.status}
                  onChange={e => {
                    const newSt = e.target.value as LeadStatus;
                    updateLead(selectedLead.id, { status: newSt });
                    setSelectedLead({ ...selectedLead, status: newSt });
                  }}
                  className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Activity Timeline for this Lead */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                  Lead Activity History &amp; Automated Logs
                </h4>
                <div className="space-y-2">
                  {timeline.filter(t => t.entityId === selectedLead.id).map(item => (
                    <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-0.5">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>{item.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{item.description}</p>
                      <div className="text-[10px] text-emerald-700 font-medium">By: {item.performedBy}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone: Delete Lead */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={() => setLeadToDelete(selectedLead)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete This Lead</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3 text-red-600">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Solar Lead?</h3>
                <p className="text-[11px] text-slate-500 font-mono">{leadToDelete.id}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to delete <strong>{leadToDelete.name}</strong> ({leadToDelete.phone})? 
              This will permanently remove the lead and all associated records from the database.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setLeadToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteLead(leadToDelete.id);
                  if (selectedLead?.id === leadToDelete.id) setSelectedLead(null);
                  setLeadToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule & Assign Site Survey Modal */}
      {surveyLeadToSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Schedule &amp; Dispatch Survey</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{surveyLeadToSchedule.id} • {surveyLeadToSchedule.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSurveyLeadToSchedule(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lead Brief */}
            <div className="p-3 bg-slate-50 rounded-xl mb-4 text-xs space-y-1 text-slate-700 border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Contact:</span>
                <span className="font-semibold text-slate-900">{surveyLeadToSchedule.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Site Location:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[200px]">{surveyLeadToSchedule.city || surveyLeadToSchedule.address || 'Address on record'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly Bill / Feasible kW:</span>
                <span className="font-bold text-emerald-700">₹{surveyLeadToSchedule.monthlyBill.toLocaleString('en-IN')} • {surveyLeadToSchedule.recommendedKw} kW</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const selectedEng = employees.find(emp => emp.id === scheduleEngineerId) || employees.find(emp => emp.role === 'Survey Engineer');
                qualifyLead(surveyLeadToSchedule.id, {
                  engineerId: selectedEng?.id,
                  engineerName: selectedEng?.name,
                  scheduledDate: scheduleDate,
                  scheduledTime: scheduleTime,
                  notes: scheduleNotes.trim(),
                });
                if (selectedLead?.id === surveyLeadToSchedule.id) {
                  setSelectedLead({ ...selectedLead, status: 'Qualified' });
                }
                setSurveyLeadToSchedule(null);
                setScheduleNotes('');
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Select Survey Engineer *
                </label>
                <select
                  required
                  value={scheduleEngineerId}
                  onChange={(e) => setScheduleEngineerId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {employees.filter(e => e.role === 'Survey Engineer').map(eng => (
                    <option key={eng.id} value={eng.id}>
                      {eng.name} ({eng.activeLeadsCount || 2} active assignments)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    Visit Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Time Slot
                  </label>
                  <select
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="10:00 AM - 12:00 PM">10:00 AM – 12:00 PM (Morning)</option>
                    <option value="12:00 PM - 02:00 PM">12:00 PM – 02:00 PM (Midday)</option>
                    <option value="02:00 PM - 04:00 PM">02:00 PM – 04:00 PM (Afternoon)</option>
                    <option value="04:00 PM - 06:00 PM">04:00 PM – 06:00 PM (Late)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Survey Instructions &amp; Site Notes
                </label>
                <textarea
                  rows={2}
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  placeholder="e.g. Bring laser meter, inspect parapet shading, verify 3-phase LT meter."
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSurveyLeadToSchedule(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Dispatch Survey</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
