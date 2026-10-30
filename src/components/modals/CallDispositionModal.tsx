import React, { useState, useEffect } from 'react';
import { 
  PhoneOutgoing, 
  Clock, 
  CheckCircle2, 
  X, 
  Calendar, 
  FileText, 
  User, 
  Tag, 
  Sparkles,
  PhoneCall,
  AlertCircle
} from 'lucide-react';
import { 
  ActiveCallSession, 
  formatCallDuration, 
  syncCallLogToBackend, 
  clearActiveCallSession 
} from '../../utils/telephonyBridge';
import { useCrm } from '../../context/CrmContext';

interface CallDispositionModalProps {
  session: ActiveCallSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (callId?: string) => void;
}

const DISPOSITION_OPTIONS = [
  { id: 'Connected - Interested', label: 'Connected - Interested', variant: 'emerald' },
  { id: 'Site Survey Requested', label: 'Site Survey Requested', variant: 'blue' },
  { id: 'Follow-up Required', label: 'Follow-up Required', variant: 'amber' },
  { id: 'Busy / Unreachable', label: 'Busy / Unreachable', variant: 'slate' },
  { id: 'Ringing / No Answer', label: 'Ringing / No Answer', variant: 'slate' },
  { id: 'Not Interested', label: 'Not Interested', variant: 'red' },
];

export const CallDispositionModal: React.FC<CallDispositionModalProps> = ({
  session,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { leads, updateLead } = useCrm();

  const [disposition, setDisposition] = useState<string>('Connected - Interested');
  const [notes, setNotes] = useState<string>('');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (session && isOpen) {
      // Calculate elapsed time from dial start to return
      const elapsed = Math.max(1, Math.round((Date.now() - session.startTime) / 1000));
      setDurationSeconds(elapsed);
      setDisposition('Connected - Interested');
      setNotes('');
      setErrorMsg(null);
    }
  }, [session, isOpen]);

  if (!isOpen || !session) return null;

  const handleSaveDisposition = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        employee_id: session.employeeId,
        employee_name: session.employeeName,
        employee_phone: session.employeePhone,
        customer_phone: session.customerPhone,
        customer_name: session.customerName,
        lead_id: session.leadId,
        call_type: 'OUTGOING' as const,
        call_status: (durationSeconds > 10 ? 'ANSWERED' : 'BUSY') as 'ANSWERED' | 'BUSY',
        duration_seconds: durationSeconds,
        call_time: new Date(session.startTime).toISOString(),
        disposition,
        notes: notes.trim(),
      };

      const result = await syncCallLogToBackend(payload);

      // If associated with a Lead in CRM state, append to lead timeline/notes
      if (session.leadId) {
        const existingLead = leads.find(l => l.id === session.leadId);
        if (existingLead) {
          const timestampStr = new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          const newEntry = `[Call Log - ${timestampStr}] (${formatCallDuration(durationSeconds)}, ${disposition})${notes.trim() ? ': ' + notes.trim() : ''}`;
          const updatedNotes = existingLead.notes 
            ? `${existingLead.notes}\n\n${newEntry}`
            : newEntry;

          updateLead(session.leadId, {
            notes: updatedNotes,
            lastContactedAt: new Date().toISOString(),
          });
        }
      }

      clearActiveCallSession();
      if (onSaved) onSaved(result.call_id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save call disposition');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    clearActiveCallSession();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <PhoneOutgoing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Call Summary &amp; Disposition</h3>
              <p className="text-xs text-slate-500">Record customer feedback and sync with CRM timeline</p>
            </div>
          </div>
          <button 
            onClick={handleDiscard}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Call Metadata Banner */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">{session.customerName}</div>
                <div className="text-xs text-slate-500 font-mono">{session.customerPhone}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>{formatCallDuration(durationSeconds)}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Total Duration</div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Disposition Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              Call Outcome / Disposition
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DISPOSITION_OPTIONS.map(opt => {
                const isSelected = disposition === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDisposition(opt.id)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Conversation Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Client interested in 5 kW hybrid system. Requested rooftop survey for next Tuesday morning."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSaveDisposition}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save to Lead Timeline</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
