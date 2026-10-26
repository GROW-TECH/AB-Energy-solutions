import React, { useState } from 'react';
import { 
  LifeBuoy, Plus, Search, Filter, AlertTriangle, CheckCircle2, 
  Clock, User, Phone, MapPin, Wrench, ArrowRight, ShieldCheck, X
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export const ServiceTicketsView: React.FC = () => {
  const { tickets, updateServiceTicket, createServiceTicket, customers } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [showNewModal, setShowNewModal] = useState(false);

  // New ticket state
  const [newCustId, setNewCustId] = useState(customers[0]?.id || '');
  const [newCategory, setNewCategory] = useState<any>('Inverter Error / Offline');
  const [newSeverity, setNewSeverity] = useState<any>('High');
  const [newDesc, setNewDesc] = useState('');

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.issueCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.technicianName && t.technicianName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesSeverity = severityFilter === 'All' || t.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const urgentCount = tickets.filter(t => t.severity === 'Urgent' || t.severity === 'High').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress' || t.status === 'Assigned' || t.status === 'Open').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === newCustId);
    if (!cust) return;

    createServiceTicket({
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerAddress: cust.address,
      issueCategory: newCategory,
      severity: newSeverity,
      description: newDesc,
    });

    setShowNewModal(false);
    setNewDesc('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Operations &amp; Maintenance
            </span>
            <span className="text-xs text-slate-400 font-medium">Field Dispatch Desk</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Solar Service Helpdesk &amp; O&amp;M Tickets</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated field technician dispatch, inverter error diagnostics, and SLA lifecycle tracking.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Service Ticket</span>
        </button>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Tickets Logged</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{tickets.length}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Across all commissioned plants</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Urgent / High Priority</div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{urgentCount}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">Requires immediate dispatch</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active In Progress</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{inProgressCount}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Field engineers assigned</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SLA Resolution Rate</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">98.4%</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Within 24-hr guarantee
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search ticket no, customer, error category, technician..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-hidden text-xs text-slate-900 placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Severity:</span>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Severities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List - Full Width Enterprise Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredTickets.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-sm text-slate-800">No Service Tickets</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {statusFilter !== 'All' || severityFilter !== 'All' || searchTerm
                  ? 'No tickets match your filter criteria.'
                  : 'All commissioned solar plants are operating nominally. When tickets are raised or reported, they will appear here.'}
              </p>
            </div>
          ) : (
            filteredTickets.map(t => (
            <div key={t.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 border ${
                  t.severity === 'Urgent' ? 'bg-red-50 text-red-700 border-red-200' :
                  t.severity === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-slate-500 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                      {t.ticketNumber}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{t.issueCategory}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                      t.severity === 'Urgent' ? 'bg-red-50 text-red-700 border-red-200' :
                      t.severity === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {t.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{t.description}</p>

                  <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2.5 pt-0.5">
                    <span className="font-semibold text-slate-800">{t.customerName}</span>
                    <span>•</span>
                    <span className="text-slate-600 font-mono">{t.customerPhone}</span>
                    <span>•</span>
                    <span className="text-slate-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Technician: <strong className="text-slate-900">{t.technicianName}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Scheduled: {t.scheduledDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                <span className="text-[11px] font-bold text-slate-400">Status:</span>
                <select
                  value={t.status}
                  onChange={e => updateServiceTicket(t.id, { status: e.target.value as any })}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">Create Solar Service Ticket</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Customer</label>
                <select
                  value={newCustId}
                  onChange={e => setNewCustId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.totalSystemKw} kW) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold"
                >
                  <option value="Inverter Error / Offline">Inverter Error / Red Light Fault</option>
                  <option value="Low Solar Generation Alert">Low Solar Generation Alert</option>
                  <option value="Grid Tripping / High Voltage">Grid Tripping / High Voltage</option>
                  <option value="Module Soiling / Cleaning Request">Module Soiling / Cleaning Request</option>
                  <option value="Physical Damage / Cable Bite">Physical Cable / Earthing Fault</option>
                  <option value="Net-Meter Error / DISCOM Sync">Net-Meter Error / DISCOM Sync</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Severity</label>
                <select
                  value={newSeverity}
                  onChange={e => setNewSeverity(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold"
                >
                  <option value="Urgent">Urgent (Zero generation / Spark)</option>
                  <option value="High">High (Inverter offline)</option>
                  <option value="Medium">Medium (Low yield)</option>
                  <option value="Low">Low (Routine check)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fault Description &amp; Symptoms</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Inverter showing Error Code 003, grid over-voltage tripping since 2 PM..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs"
                >
                  Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
