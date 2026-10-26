import React, { useState } from 'react';
import { 
  CalendarClock, CheckCircle2, Clock, Phone, MessageCircle, 
  MapPin, Plus, Search, Filter, AlertCircle, Send, Check
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { FollowUp } from '../../types';

export const FollowUpsView: React.FC = () => {
  const { followUps, completeFollowUp, createFollowUp, leads, employees } = useCrm();

  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Completed'>('Pending');
  const [showNewModal, setShowNewModal] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [selectedFollowUpToComplete, setSelectedFollowUpToComplete] = useState<FollowUp | null>(null);

  // Form states for new follow-up
  const [newTitle, setNewTitle] = useState('');
  const [newLeadId, setNewLeadId] = useState(leads[0]?.id || '');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newType, setNewType] = useState<FollowUp['type']>('Call');
  const [newPriority, setNewPriority] = useState<FollowUp['priority']>('High');
  const [newNotes, setNewNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredFollowUps = followUps.filter(f => {
    if (activeTab === 'Pending') return f.status === 'Pending';
    if (activeTab === 'Completed') return f.status === 'Completed';
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = leads.find(l => l.id === newLeadId);
    createFollowUp({
      title: newTitle,
      leadId: newLeadId,
      leadName: lead?.name || 'Customer',
      dueDate: newDueDate,
      dueTime: '11:30 AM',
      type: newType,
      priority: newPriority,
      notes: newNotes,
    });
    setShowNewModal(false);
    setNewTitle('');
    setNewNotes('');
  };

  const confirmComplete = () => {
    if (selectedFollowUpToComplete) {
      completeFollowUp(selectedFollowUpToComplete.id, completeNotes);
      setSelectedFollowUpToComplete(null);
      setCompleteNotes('');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-emerald-600" />
            <span>Automated Follow-ups &amp; Customer Outreach</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-generated multi-day quotation cadences and discovery reminders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('Pending')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'Pending' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Pending ({followUps.filter(f => f.status === 'Pending').length})
            </button>
            <button
              onClick={() => setActiveTab('Completed')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'Completed' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Completed ({followUps.filter(f => f.status === 'Completed').length})
            </button>
            <button
              onClick={() => setActiveTab('All')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              All
            </button>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredFollowUps.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No follow-ups found in this view.
            </div>
          ) : (
            filteredFollowUps.map(fup => {
              const isOverdue = fup.status === 'Pending' && fup.dueDate < todayStr;
              const isToday = fup.dueDate === todayStr;

              return (
                <div
                  key={fup.id}
                  className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    isOverdue ? 'bg-red-50/30' : fup.status === 'Completed' ? 'bg-slate-50/50' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      fup.type === 'Call' ? 'bg-blue-100 text-blue-700' :
                      fup.type === 'WhatsApp' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {fup.type === 'Call' ? <Phone className="w-4 h-4" /> : fup.type === 'WhatsApp' ? <MessageCircle className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{fup.title}</span>
                        {isOverdue && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-100 text-red-700">
                            Overdue
                          </span>
                        )}
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800">
                            Today
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                        <span className="font-medium text-slate-700">{fup.leadName || fup.customerName}</span>
                        <span>•</span>
                        <span>Due: {fup.dueDate} ({fup.dueTime})</span>
                        <span>•</span>
                        <span>Assigned: <strong className="text-slate-800">{fup.assignedToName}</strong></span>
                        {fup.quotationId && (
                          <>
                            <span>•</span>
                            <span className="text-blue-700 font-medium">Quote: {fup.quotationId}</span>
                          </>
                        )}
                      </div>

                      {fup.notes && (
                        <p className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-1.5 rounded-md border border-slate-200/60">
                          {fup.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {fup.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => setSelectedFollowUpToComplete(fup)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Done</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {selectedFollowUpToComplete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Complete Follow-up Task</h3>
            <p className="text-xs text-slate-500 mb-3">{selectedFollowUpToComplete.title}</p>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Call / Conversation Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={completeNotes}
              onChange={e => setCompleteNotes(e.target.value)}
              placeholder="Spoke with customer, agreed on 5kW system, waiting on bank loan..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedFollowUpToComplete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmComplete}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
              >
                Save &amp; Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Follow-up Task Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Create Follow-up Task</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discuss revised pricing with subsidy breakdown"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Related Lead / Customer</label>
                <select
                  value={newLeadId}
                  onChange={e => setNewLeadId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.recommendedKw} kW) - {l.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Channel Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as FollowUp['type'])}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Site Visit">Site Visit</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instructions / Goal</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Remind about PM Surya Ghar 78,000 subsidy deadline..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
