import React, { useState, useMemo } from 'react';
import { 
  CalendarClock, CheckCircle2, Clock, Phone, MessageCircle, 
  MapPin, Plus, Search, Filter, AlertCircle, Check, 
  Trash2, Pencil, RotateCcw, Zap, DollarSign, Building2, 
  ChevronDown, ChevronUp, FileText, CheckCheck, X, User
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { FollowUp, Lead, LeadStatus } from '../../types';

export const FollowUpsView: React.FC = () => {
  const { 
    followUps, 
    leads, 
    createFollowUp, 
    updateFollowUp, 
    toggleStrikeFollowUp, 
    deleteFollowUp, 
    updateLead,
    employees 
  } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'All' | 'Pending' | 'Won' | 'SiteSurvey' | 'Lost' | 'Unresponsive'>('All');
  const [expandedLeadIds, setExpandedLeadIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [selectedLeadForNewNote, setSelectedLeadForNewNote] = useState<Lead | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteDate, setNewNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNoteChannel, setNewNoteChannel] = useState<FollowUp['type']>('Call');
  const [newLeadStatus, setNewLeadStatus] = useState<string>('');

  // Edit Note Modal
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');

  // Group follow-ups by leadId
  const followUpsByLead = useMemo(() => {
    const map = new Map<string, FollowUp[]>();
    for (const f of followUps) {
      if (f.leadId) {
        if (!map.has(f.leadId)) map.set(f.leadId, []);
        map.get(f.leadId)!.push(f);
      }
    }
    // Sort each lead's follow-ups chronologically
    for (const list of map.values()) {
      list.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    }
    return map;
  }, [followUps]);

  // Overall Statistics
  const totalNotes = followUps.length;
  const struckOutNotes = followUps.filter(f => f.isStruckOut || f.status === 'Completed').length;
  const pendingNotes = followUps.filter(f => !f.isStruckOut && f.status === 'Pending').length;
  const leadsWithEb = leads.filter(l => l.consumerNumberDiscom || (l as any).ebServiceNumber).length;

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search matches
      const s = (searchTerm || '').trim().toLowerCase();
      const leadName = (lead.name || '').toLowerCase();
      const leadPhone = lead.phone || '';
      const leadCity = (lead.city || '').toLowerCase();
      const ebNum = ((lead.consumerNumberDiscom || (lead as any).ebServiceNumber) || '').toLowerCase();
      const leadNotes = (lead.notes || '').toLowerCase();
      const matchesSearch = !s || 
        leadName.includes(s) || 
        leadPhone.includes(s) || 
        leadCity.includes(s) ||
        ebNum.includes(s) ||
        leadNotes.includes(s);

      if (!matchesSearch) return false;

      // Status tab filters
      if (activeFilterTab === 'Pending') {
        const leadFups = followUpsByLead.get(lead.id) || [];
        return leadFups.some(f => !f.isStruckOut && f.status === 'Pending');
      }
      if (activeFilterTab === 'Won') {
        return lead.status === 'Won' || leadNotes.includes('advance') || leadNotes.includes('paid');
      }
      if (activeFilterTab === 'SiteSurvey') {
        return lead.status === 'Site Survey Scheduled' || lead.status === 'Site Survey Completed' || leadNotes.includes('site visit');
      }
      if (activeFilterTab === 'Lost') {
        return lead.status === 'Lost' || leadNotes.includes('another vendor') || leadNotes.includes('another vendar');
      }
      if (activeFilterTab === 'Unresponsive') {
        return lead.status === 'Unresponsive' || lead.status === 'Dropped' || leadNotes.includes('not answering');
      }

      return true;
    });
  }, [leads, searchTerm, activeFilterTab, followUpsByLead]);

  const toggleLeadExpanded = (leadId: string) => {
    setExpandedLeadIds(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };

  const openAddNoteForLead = (lead: Lead) => {
    setSelectedLeadForNewNote(lead);
    setNewNoteText('');
    setNewNoteDate(new Date().toISOString().split('T')[0]);
    setNewLeadStatus(lead.status);
    setShowAddNoteModal(true);
  };

  const handleSaveNewNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForNewNote || !newNoteText.trim()) return;

    createFollowUp({
      leadId: selectedLeadForNewNote.id,
      leadName: selectedLeadForNewNote.name,
      title: `Call Note (${newNoteDate})`,
      dueDate: newNoteDate,
      dueTime: '11:00 AM',
      type: newNoteChannel,
      status: 'Pending',
      isStruckOut: false,
      notes: newNoteText.trim(),
      priority: 'High'
    });

    if (newLeadStatus && newLeadStatus !== selectedLeadForNewNote.status) {
      updateLead(selectedLeadForNewNote.id, {
        status: newLeadStatus as LeadStatus,
        notes: newNoteText.trim()
      });
    }

    setShowAddNoteModal(false);
    setSelectedLeadForNewNote(null);
    setNewNoteText('');
  };

  const openEditModal = (fup: FollowUp) => {
    setEditingFollowUp(fup);
    setEditText(fup.notes || fup.title || '');
    setEditDate(fup.dueDate || new Date().toISOString().split('T')[0]);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFollowUp) return;

    updateFollowUp(editingFollowUp.id, {
      notes: editText.trim(),
      dueDate: editDate
    });

    setEditingFollowUp(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-emerald-600" />
            <span>Lead Follow-Up &amp; Daily Outreach Board</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full-access call log and task history with real-time strikethrough, edits, and automated lead synchronization.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedLeadForNewNote(leads[0] || null);
            setShowAddNoteModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Follow-Up Note</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Leads in Follow-Up</span>
          <span className="text-lg font-black text-slate-900 block mt-0.5">{leads.length} Leads</span>
          <span className="text-[10px] text-emerald-600 font-medium">100% Auto-Enrolled</span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Pending Callbacks</span>
          <span className="text-lg font-black text-amber-600 block mt-0.5">{pendingNotes} Active</span>
          <span className="text-[10px] text-slate-500">Require follow-up action</span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Struck-Out / Completed</span>
          <span className="text-lg font-black text-slate-700 block mt-0.5">{struckOutNotes} Done</span>
          <span className="text-[10px] text-emerald-600">Crossed out &amp; verified</span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Captured EB Meter Numbers</span>
          <span className="text-lg font-black text-indigo-600 block mt-0.5">{leadsWithEb} Accounts</span>
          <span className="text-[10px] text-indigo-500 font-medium">Ready for DBT Subsidy</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {[
              { id: 'All', label: `All Leads (${leads.length})` },
              { id: 'Pending', label: `Pending Callbacks (${pendingNotes})` },
              { id: 'Won', label: `Won / Advance Paid` },
              { id: 'SiteSurvey', label: `Site Visits` },
              { id: 'Lost', label: `Lost to Competitor` },
              { id: 'Unresponsive', label: `Unresponsive` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilterTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeFilterTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, city, EB number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Leads List with Inline Follow-Up History */}
      <div className="space-y-3">
        {filteredLeads.length === 0 ? (
          <div className="bg-white p-12 text-center text-xs text-slate-400 border border-slate-200 rounded-2xl">
            No leads found matching your search or filter.
          </div>
        ) : (
          filteredLeads.map(lead => {
            const leadFollowUps = followUpsByLead.get(lead.id) || [];
            const isExpanded = expandedLeadIds[lead.id] !== false; // Default expanded
            const activePendingFup = leadFollowUps.find(f => !f.isStruckOut && f.status === 'Pending');
            const ebNum = lead.consumerNumberDiscom || (lead as any).ebServiceNumber;

            return (
              <div
                key={lead.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden"
              >
                {/* Lead Summary Bar */}
                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      onClick={() => toggleLeadExpanded(lead.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer mt-0.5 sm:mt-0"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{lead.name}</span>
                        
                        <a
                          href={`tel:${lead.phone}`}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Phone className="w-3 h-3 text-blue-600" />
                          <span>{lead.phone}</span>
                        </a>

                        {lead.city && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{lead.city}</span>
                          </span>
                        )}

                        {lead.recommendedKw > 0 && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-extrabold flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-600" />
                            <span>{lead.recommendedKw} kW ({lead.customerType || 'System'})</span>
                          </span>
                        )}

                        {ebNum && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-mono font-bold">
                            EB: {ebNum}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>Source: <strong className="text-slate-700">{lead.source}</strong></span>
                        <span>&bull;</span>
                        <span>Notes Count: <strong className="text-slate-800">{leadFollowUps.length}</strong></span>
                        {lead.monthlyBill > 0 && (
                          <>
                            <span>&bull;</span>
                            <span>EB Bill: <strong className="text-slate-700">₹{lead.monthlyBill.toLocaleString('en-IN')}/mo</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                    {/* Status Dropdown */}
                    <select
                      value={lead.status}
                      onChange={e => updateLead(lead.id, { status: e.target.value as LeadStatus })}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                        lead.status === 'Won' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        lead.status === 'Lost' ? 'bg-red-100 text-red-800 border-red-300' :
                        lead.status === 'Site Survey Scheduled' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        lead.status === 'Proposal Sent' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                        'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Site Survey Scheduled">Site Survey Scheduled</option>
                      <option value="Site Survey Completed">Site Survey Completed</option>
                      <option value="Proposal Sent">Proposal Sent</option>
                      <option value="Won">Won (Advance Received)</option>
                      <option value="Lost">Lost to Competitor</option>
                      <option value="Unresponsive">Unresponsive</option>
                      <option value="Dropped">Dropped / Not Interested</option>
                    </select>

                    <button
                      onClick={() => openAddNoteForLead(lead)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Call / Note</span>
                    </button>
                  </div>
                </div>

                {/* Follow-up Notes Timeline Table */}
                {isExpanded && (
                  <div className="p-4 space-y-2 bg-white">
                    {leadFollowUps.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No follow-up notes logged yet for this lead. Click "+ Log Call / Note" above to write today's conversation.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                        {leadFollowUps.map((fup, idx) => {
                          const isStruck = fup.isStruckOut || fup.status === 'Completed';

                          return (
                            <div
                              key={fup.id}
                              className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                                isStruck ? 'bg-slate-50/80' : 'bg-emerald-50/30'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 mt-0.5 ${
                                  isStruck 
                                    ? 'bg-slate-200 text-slate-600' 
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {fup.dueDate || 'Undated'}
                                </span>

                                <div className="min-w-0">
                                  <p className={`text-xs leading-relaxed ${
                                    isStruck 
                                      ? 'line-through text-slate-400 decoration-slate-400 decoration-1' 
                                      : 'font-semibold text-slate-800'
                                  }`}>
                                    {fup.notes || fup.title}
                                  </p>

                                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span>#{idx + 1}</span>
                                    <span>&bull;</span>
                                    <span>By: {fup.assignedToName || 'Sales Executive'}</span>
                                    {isStruck && (
                                      <>
                                        <span>&bull;</span>
                                        <span className="text-emerald-700 font-bold">Struck Out / Closed ✓</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons: Strike Out, Edit, Delete */}
                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => toggleStrikeFollowUp(fup.id)}
                                  title={isStruck ? 'Un-strike (Mark Pending)' : 'Strike Out (Mark Done)'}
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                    isStruck
                                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                  }`}
                                >
                                  {isStruck ? (
                                    <>
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Un-Strike</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Strike Out ✓</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openEditModal(fup)}
                                  title="Edit note"
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 rounded transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Delete this follow-up entry?')) {
                                      deleteFollowUp(fup.id);
                                    }
                                  }}
                                  title="Delete note"
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add New Note Modal */}
      {showAddNoteModal && selectedLeadForNewNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Log Follow-up Note for {selectedLeadForNewNote.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Phone: {selectedLeadForNewNote.phone} &bull; {selectedLeadForNewNote.city}
                </p>
              </div>
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewNote} className="space-y-3.5 text-xs pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Interaction Date *</label>
                  <input
                    type="date"
                    required
                    value={newNoteDate}
                    onChange={e => setNewNoteDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Interaction Channel</label>
                  <select
                    value={newNoteChannel}
                    onChange={e => setNewNoteChannel(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-emerald-500"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Site Visit">Site Visit</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Customer Remarks / Call Conversation Details *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Spoke with customer, loan process in progress, callback Friday 11 AM..."
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Update Lead Stage / Disposition (Optional)
                </label>
                <select
                  value={newLeadStatus}
                  onChange={e => setNewLeadStatus(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-emerald-500"
                >
                  <option value={selectedLeadForNewNote.status}>Keep current ({selectedLeadForNewNote.status})</option>
                  <option value="Qualified">Qualified (Follow-up)</option>
                  <option value="Site Survey Scheduled">Site Survey Scheduled</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Won">Won (Advance Received)</option>
                  <option value="Lost">Lost to Competitor</option>
                  <option value="Unresponsive">Unresponsive / Call Cut</option>
                  <option value="Dropped">Dropped / Not Interested</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Save Note to History ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingFollowUp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">Edit Follow-Up Note</h3>
              <button
                onClick={() => setEditingFollowUp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs pt-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note Content</label>
                <textarea
                  rows={3}
                  required
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingFollowUp(null)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Update Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
