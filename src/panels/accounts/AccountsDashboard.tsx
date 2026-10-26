import React from 'react';
import { 
  Receipt, CreditCard, DollarSign, IndianRupee, 
  TrendingUp, AlertCircle, CheckCircle2, ArrowRight,
  ShoppingCart, FileCheck, Clock
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface AccountsDashboardProps {
  onNavigateToTab: (tab: string) => void;
}

export const AccountsDashboard: React.FC<AccountsDashboardProps> = ({
  onNavigateToTab,
}) => {
  const { invoices, payments, expenses } = useCrm();

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPending = invoices.filter(i => i.status === 'Sent' || i.status === 'Overdue').reduce((sum, i) => sum + i.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const pendingInvoices = invoices.filter(i => i.status !== 'Paid');

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Accounts &amp; Financial Controller</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Finance, GST Billing &amp; Collections Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Client milestone receivables, GST tax compliance, EPC vendor procurement ledger, and Surya Ghar subsidy claims.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToTab('expenses')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Record Expense</span>
            </button>
            <button
              onClick={() => onNavigateToTab('invoices')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Create Tax Invoice</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Gross Invoiced</span>
              <Receipt className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">₹{(totalInvoiced / 100000).toFixed(2)}L</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              {invoices.length} Tax &amp; Milestone Invoices
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Collected Revenue</span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-900">₹{(totalPaid / 100000).toFixed(2)}L</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              Realized in corporate bank account
            </div>
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl">
            <div className="flex items-center justify-between text-amber-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Receivables Due</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-900">₹{(totalPending / 100000).toFixed(2)}L</div>
            <div className="text-[11px] text-amber-700 mt-1 font-medium">
              {pendingInvoices.length} Client milestone stages pending
            </div>
          </div>

          <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-xl">
            <div className="flex items-center justify-between text-rose-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">EPC Procurement Outflow</span>
              <DollarSign className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-extrabold text-rose-900">₹{(totalExpenses / 100000).toFixed(2)}L</div>
            <div className="text-[11px] text-rose-700 mt-1 font-medium">
              Material purchase &amp; logistics expenses
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split: Pending Receivables + GST & Subsidy Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Invoices for Follow-up */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Receipt className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Milestone Invoices Awaiting Payment</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('invoices')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>All Invoices ({invoices.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-3">
              {pendingInvoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Zero overdue invoices! All milestone payments are 100% collected.
                </div>
              ) : (
                pendingInvoices.slice(0, 5).map(inv => (
                  <div key={inv.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">{inv.customerName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {inv.invoiceNumber}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          inv.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Due: {inv.dueDate || 'Immediate'} • Stage Milestone Billing
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-extrabold text-slate-900">
                        ₹{(inv.totalAmount).toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => onNavigateToTab('payments')}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Record
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-3 rounded-b-2xl flex items-center justify-between text-xs text-slate-600">
            <span>GST invoices are generated in compliance with Indian CGST + SGST rules</span>
            <button
              onClick={() => onNavigateToTab('invoices')}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Open Invoicing Hub
            </button>
          </div>
        </div>

        {/* Tax Compliance & Subsidy DBT Guide */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                <FileCheck className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Solar Tax &amp; PM Subsidy DBT</h3>
            </div>

            <ul className="mt-4 space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                <span>GST: 12% on solar photovoltaic modules and 18% on electrical inverters &amp; BOS cabling.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                <span>PM Surya Ghar: ₹33,000 subsidy per kW up to 2 kW, and ₹78,000 flat for 3 kW and above.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                <span>National Portal Inspection Certificate and Commissioning Photo needed for DBT approval.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                <span>Vendor purchase orders require GST input credit claim tracking for solar hardware.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateToTab('pos')}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Review Vendor Purchase Orders</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
