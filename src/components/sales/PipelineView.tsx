import React, { useState } from 'react';
import { 
  GitBranch, Plus, Search, Filter, Phone, MapPin, 
  ChevronRight, ChevronLeft, ArrowRight, DollarSign, Calendar,
  User, CheckCircle2, AlertCircle, Eye, FileText, Compass,
  GripVertical, X, Check, ArrowUpRight, Sparkles, Building2, Clock
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Lead, LeadStatus, Priority } from '../../types';

interface PipelineViewProps {
  onOpenNewLead: () => void;
  onNavigateToQuotation?: (leadId: string) => void;
  onNavigateToSurvey?: (leadId: string) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  onOpenNewLead,
  onNavigateToQuotation,
  onNavigateToSurvey,
}) => {
  const { leads, updateLead, qualifyLead, employees } = useCrm();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRep, setSelectedRep] = useState('All');

  // Drag and Drop State
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);

  // Lead Details Modal State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Status Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const pipelineStages: { stage: LeadStatus; label: string; color: string; badgeColor: string; bgActive: string }[] = [
    { stage: 'New', label: '1. Inbound Leads', color: 'border-t-slate-500', badgeColor: 'bg-slate-100 text-slate-700', bgActive: 'bg-slate-50' },
    { stage: 'Contacted', label: '2. Contacted / Discovery', color: 'border-t-blue-500', badgeColor: 'bg-blue-50 text-blue-700', bgActive: 'bg-blue-50/40' },
    { stage: 'Qualified', label: '3. Site Feasibility', color: 'border-t-amber-500', badgeColor: 'bg-amber-50 text-amber-800', bgActive: 'bg-amber-50/40' },
    { stage: 'Site Survey Scheduled', label: '4. Survey In Progress', color: 'border-t-indigo-500', badgeColor: 'bg-indigo-50 text-indigo-700', bgActive: 'bg-indigo-50/40' },
    { stage: 'Quotation Sent', label: '5. Proposal Active', color: 'border-t-cyan-500', badgeColor: 'bg-cyan-50 text-cyan-800', bgActive: 'bg-cyan-50/40' },
    { stage: 'Negotiation', label: '6. Final Review', color: 'border-t-yellow-500', badgeColor: 'bg-yellow-50 text-yellow-800', bgActive: 'bg-yellow-50/40' },
    { stage: 'Won', label: '7. Closed / Won Deal', color: 'border-t-emerald-500', badgeColor: 'bg-emerald-50 text-emerald-800', bgActive: 'bg-emerald-50/40' },
  ];

  const stageOrder: LeadStatus[] = [
    'New',
    'Contacted',
    'Qualified',
    'Site Survey Scheduled',
    'Quotation Sent',
    'Negotiation',
    'Won'
  ];

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggingLeadId(leadId);
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const moveLeadToStage = (leadId: string, newStage: LeadStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === newStage) return;

    if (newStage === 'Qualified' && !lead.surveyId) {
      qualifyLead(leadId);
      showToast(`Qualified ${lead.name} and scheduled Site Feasibility survey`);
    } else {
      updateLead(leadId, { status: newStage });
      const targetStageObj = pipelineStages.find(s => s.stage === newStage);
      showToast(`Moved ${lead.name} to ${targetStageObj?.label || newStage}`);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: LeadStatus) => {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggingLeadId;
    setDraggingLeadId(null);
    if (leadId) {
      moveLeadToStage(leadId, targetStage);
    }
  };

  // Shift stage backward/forward
  const shiftStage = (leadId: string, currentStage: LeadStatus, direction: 'prev' | 'next') => {
    // Normalise status if it's Survey Completed or Follow-up Scheduled
    let effectiveStage = currentStage;
    if (currentStage === 'Follow-up Scheduled') effectiveStage = 'Contacted';
    if (currentStage === 'Survey Completed') effectiveStage = 'Site Survey Scheduled';

    const currentIndex = stageOrder.indexOf(effectiveStage);
    if (currentIndex === -1) return;

    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < stageOrder.length) {
      moveLeadToStage(leadId, stageOrder[newIndex]);
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.city && lead.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRep = selectedRep === 'All' || lead.assignedToName === selectedRep;

    return matchesSearch && matchesRep;
  });

  // Calculate Metrics
  const totalPipelineKw = filteredLeads.reduce((acc, l) => acc + (l.recommendedKw || 0), 0);
  const totalPipelineVal = filteredLeads.reduce((acc, l) => acc + (l.estimatedBudget || 0), 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-600" />
            <span>Solar Sales Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive Drag-and-Drop deals pipeline with automated step advancement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Metrics Badges */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
            <span>Total: <strong className="text-slate-900">{filteredLeads.length}</strong> Leads</span>
            <span className="text-slate-300">•</span>
            <span><strong className="text-emerald-700">{totalPipelineKw} kW</strong></span>
            <span className="text-slate-300">•</span>
            <span>Est. <strong className="text-slate-900">₹{(totalPipelineVal / 100000).toFixed(1)}L</strong></span>
          </div>

          <button
            onClick={onOpenNewLead}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name, city, or Lead ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Assigned Rep:</span>
          <select
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="All">All Representatives</option>
            {employees.filter(e => e.role === 'Sales Executive' || e.role === 'Sales Manager').map(emp => (
              <option key={emp.id} value={emp.name}>{emp.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Stages Horizontal Board */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none">
        {pipelineStages.map(({ stage, label, color, badgeColor }) => {
          // Stage lead matching (including sub-statuses)
          const stageLeads = filteredLeads.filter(l => {
            if (stage === 'Contacted') return l.status === 'Contacted' || l.status === 'Follow-up Scheduled';
            if (stage === 'Site Survey Scheduled') return l.status === 'Site Survey Scheduled' || l.status === 'Survey Completed';
            return l.status === stage;
          });

          const stageKw = stageLeads.reduce((acc, l) => acc + (l.recommendedKw || 0), 0);
          const stageVal = stageLeads.reduce((acc, l) => acc + (l.estimatedBudget || 0), 0);
          const isDragTarget = dragOverStage === stage;

          return (
            <div 
              key={stage}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
              className={`w-80 flex-shrink-0 rounded-2xl p-3 border-2 transition-all flex flex-col max-h-[82vh] ${
                isDragTarget 
                  ? 'bg-emerald-50/60 border-emerald-400 border-dashed shadow-md ring-2 ring-emerald-400/30' 
                  : `bg-slate-50/90 border-slate-200/90 border-t-4 ${color}`
              }`}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{label}</h3>
                  <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    {stageKw} kW • ₹{(stageVal / 100000).toFixed(1)}L
                  </div>
                </div>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs ${badgeColor}`}>
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards Drop Zone */}
              <div className="space-y-3 overflow-y-auto flex-1 pr-1 min-h-[140px]">
                {stageLeads.length === 0 ? (
                  <div className={`p-8 text-center text-xs rounded-xl border border-dashed transition-colors flex flex-col items-center justify-center gap-1.5 ${
                    isDragTarget 
                      ? 'border-emerald-400 bg-emerald-100/40 text-emerald-700 font-semibold' 
                      : 'border-slate-200 bg-white/40 text-slate-400'
                  }`}>
                    {isDragTarget ? (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-600 animate-bounce" />
                        <span>Drop lead here</span>
                      </>
                    ) : (
                      <span>No leads at this stage</span>
                    )}
                  </div>
                ) : (
                  stageLeads.map(lead => {
                    const isDraggingThis = draggingLeadId === lead.id;
                    const stageIdx = stageOrder.indexOf(stage);

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => setSelectedLead(lead)}
                        className={`bg-white p-3.5 rounded-xl border transition-all space-y-2.5 shadow-2xs group cursor-grab active:cursor-grabbing hover:shadow-md hover:border-emerald-300 ${
                          isDraggingThis ? 'opacity-40 scale-95 border-emerald-500 ring-2 ring-emerald-400' : 'border-slate-200'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 -ml-1" />
                              <h4 className="font-bold text-slate-900 text-xs group-hover:text-emerald-700 leading-snug line-clamp-1">
                                {lead.name}
                              </h4>
                            </div>
                            <span className="text-[10px] text-slate-400 pl-3">
                              {lead.id} • {lead.city || 'Bangalore'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="font-extrabold text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
                              {lead.recommendedKw} kW
                            </span>
                          </div>
                        </div>

                        {/* Power Bill & Roof Spec */}
                        <div className="bg-slate-50 rounded-lg p-2 text-[11px] text-slate-600 flex items-center justify-between border border-slate-100">
                          <div>
                            <span className="text-slate-400 text-[10px]">Bill: </span>
                            <span className="font-bold text-slate-800">₹{lead.monthlyBill?.toLocaleString('en-IN') || 0}/mo</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 bg-white rounded border border-slate-200">
                            {lead.roofType || 'RCC Flat'}
                          </span>
                        </div>

                        {/* Assignee & Stage Arrow Shifters */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{lead.assignedToName?.split(' ')[0] || 'Unassigned'}</span>
                          </span>

                          {/* Quick Shift Arrows */}
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {stageIdx > 0 && (
                              <button
                                onClick={() => shiftStage(lead.id, stage, 'prev')}
                                title="Move back to previous stage"
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {stageIdx < stageOrder.length - 1 && (
                              <button
                                onClick={() => shiftStage(lead.id, stage, 'next')}
                                title="Advance to next stage"
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-700 transition-colors"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Stage Specific Action Button */}
                        <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                          {stage === 'New' && (
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                onClick={() => moveLeadToStage(lead.id, 'Contacted')}
                                className="w-full py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[10px] transition-colors border border-blue-200 flex items-center justify-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>Contacted</span>
                              </button>
                              <button
                                onClick={() => moveLeadToStage(lead.id, 'Qualified')}
                                className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors shadow-2xs flex items-center justify-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Qualify</span>
                              </button>
                            </div>
                          )}

                          {stage === 'Contacted' && (
                            <button
                              onClick={() => moveLeadToStage(lead.id, 'Qualified')}
                              className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-[10px] transition-colors border border-amber-200 flex items-center justify-center gap-1"
                            >
                              <span>Confirm Feasibility</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}

                          {stage === 'Qualified' && (
                            <button
                              onClick={() => {
                                if (onNavigateToSurvey) onNavigateToSurvey(lead.id);
                                else moveLeadToStage(lead.id, 'Site Survey Scheduled');
                              }}
                              className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] transition-colors border border-indigo-200 flex items-center justify-center gap-1"
                            >
                              <Compass className="w-3 h-3 text-indigo-600" />
                              <span>Audit / Survey Site</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}

                          {stage === 'Site Survey Scheduled' && (
                            <div className="w-full py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-semibold text-center flex items-center justify-center gap-1.5">
                              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>Awaiting Survey &amp; PM BOM Approval</span>
                            </div>
                          )}

                          {stage === 'Quotation Sent' && (
                            <button
                              onClick={() => moveLeadToStage(lead.id, 'Negotiation')}
                              className="w-full py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 font-bold rounded-lg text-[10px] transition-colors border border-yellow-300 flex items-center justify-center gap-1"
                            >
                              <span>Enter Final Review</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}

                          {stage === 'Negotiation' && (
                            <button
                              onClick={() => moveLeadToStage(lead.id, 'Won')}
                              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors shadow-2xs flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Close Deal (Won)</span>
                            </button>
                          )}

                          {stage === 'Won' && (
                            <div className="py-1 px-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Deal Won &amp; Converted</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Lead Details & Stage Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">{selectedLead.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {selectedLead.recommendedKw} kW
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedLead.id} • Assigned to {selectedLead.assignedToName}</p>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stage Switcher */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-emerald-600" />
                <span>Move Pipeline Stage Directly:</span>
              </label>
              <select
                value={selectedLead.status}
                onChange={(e) => {
                  const newStage = e.target.value as LeadStatus;
                  moveLeadToStage(selectedLead.id, newStage);
                  setSelectedLead(prev => prev ? { ...prev, status: newStage } : null);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="New">1. Inbound Leads</option>
                <option value="Contacted">2. Contacted / Discovery</option>
                <option value="Qualified">3. Site Feasibility (Qualified)</option>
                <option value="Site Survey Scheduled">4. Survey In Progress</option>
                <option value="Quotation Sent">5. Proposal Active</option>
                <option value="Negotiation">6. Final Review / Negotiation</option>
                <option value="Won">7. Closed / Won Deal</option>
                <option value="Lost">Lost / Closed</option>
              </select>
            </div>

            {/* Contact & Site Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</span>
                <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <a href={`tel:${selectedLead.phone}`} className="hover:underline text-emerald-700">{selectedLead.phone}</a>
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Monthly Electricity Bill</span>
                <p className="font-bold text-slate-800 mt-0.5">₹{selectedLead.monthlyBill?.toLocaleString('en-IN') || 0} / month</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Roof Type &amp; Sanction</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedLead.roofType} ({selectedLead.sanctionLoad || 0} kW load)</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Location</span>
                <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedLead.city || 'Bangalore'}</span>
                </p>
              </div>
            </div>

            {/* Fast Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              {onNavigateToSurvey && (
                <button
                  onClick={() => {
                    onNavigateToSurvey(selectedLead.id);
                    setSelectedLead(null);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>View Survey</span>
                </button>
              )}

              {onNavigateToQuotation && (
                <button
                  onClick={() => {
                    onNavigateToQuotation(selectedLead.id);
                    setSelectedLead(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Quotation</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
