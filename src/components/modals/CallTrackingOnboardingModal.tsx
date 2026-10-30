import React from 'react';
import { 
  Smartphone, 
  Check, 
  ShieldCheck, 
  PhoneOutgoing, 
  Clock, 
  X 
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { 
  setCallTrackingEnabled, 
  setTelephonyOnboardingDone 
} from '../../utils/telephonyBridge';

interface CallTrackingOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CallTrackingOnboardingModal: React.FC<CallTrackingOnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, employees } = useCrm();

  if (!isOpen) return null;

  const matchedEmployee = employees.find(
    e => (currentUser?.employeeId && e.id === currentUser.employeeId) ||
         (currentUser?.email && e.email.toLowerCase() === currentUser.email.toLowerCase()) ||
         (currentUser?.name && e.name.toLowerCase() === currentUser.name.toLowerCase())
  );

  const registeredPhone = matchedEmployee?.phone || '+91 98450 21876';

  const handleActivate = () => {
    setCallTrackingEnabled(true);
    setTelephonyOnboardingDone(true);
    onClose();
  };

  const handleDismiss = () => {
    setTelephonyOnboardingDone(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Smartphone className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Activate Telephony Tracking</h3>
          <p className="text-xs text-slate-500 mt-1">
            Configure direct in-app calling for your registered sales number
          </p>
        </div>

        <div className="px-6 py-2 space-y-4">
          {/* Registered SIM Number Pill */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Registered Sales Executive SIM
            </span>
            <span className="text-base font-bold text-slate-900 font-mono">
              {registeredPhone}
            </span>
          </div>

          {/* Benefits list */}
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <p>
                <strong className="text-slate-800">1-Tap Direct Dialing:</strong> Place calls to leads straight from the pipeline or mobile cards.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <p>
                <strong className="text-slate-800">Automatic Disposition Notes:</strong> Promptly record customer requirements upon return.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <p>
                <strong className="text-slate-800">Zero External Apps:</strong> Works directly within this application and the generated mobile APK.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleActivate}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Enable In-App Call Tracking</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer text-center"
          >
            Configure in Profile Later
          </button>
        </div>
      </div>
    </div>
  );
};

