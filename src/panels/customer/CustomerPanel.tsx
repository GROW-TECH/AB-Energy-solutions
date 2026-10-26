import React from 'react';
import { SunMedium, ShieldCheck, Zap, Download } from 'lucide-react';
import { CustomerPortalView } from '../../components/portal/CustomerPortalView';

interface CustomerPanelProps {
  onBackToAdmin?: () => void;
}

export const CustomerPanel: React.FC<CustomerPanelProps> = ({ onBackToAdmin }) => {
  return (
    <div className="space-y-6">
      {/* Customer Portal Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-emerald-500 text-white rounded-lg">
                <SunMedium className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Customer Solar Self-Service Portal
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full">
                Live Generation &amp; Rooftop Status
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Track your rooftop solar power generation, monthly electricity bill savings, DISCOM net-metering approvals, and post-installation service care.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>25-Year Performance Warranty Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Customer Portal View */}
      <CustomerPortalView onBackToAdmin={onBackToAdmin} />
    </div>
  );
};
