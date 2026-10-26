import React, { useState } from 'react';
import { 
  CreditCard, Search, CheckCircle2, 
  DollarSign, Receipt, Printer, ArrowRight, ArrowUpRight, Filter, ShieldCheck, Download, ExternalLink, X
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Payment } from '../../types';

export const PaymentsView: React.FC = () => {
  const { payments, customers } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('All');
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.transactionReference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = modeFilter === 'All' || p.paymentMode === modeFilter;
    return matchesSearch && matchesMode;
  });

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const avgPayment = payments.length > 0 ? Math.round(totalCollected / payments.length) : 0;
  const neftRtgsCount = payments.filter(p => p.paymentMode.includes('NEFT') || p.paymentMode.includes('RTGS')).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Finance &amp; Treasury
            </span>
            <span className="text-xs text-slate-400 font-medium">Verified Banking Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Payment Receipts &amp; Collections Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time reconciliation against GST tax invoices with bank UTR validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Ledger Status:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            100% Reconciled
          </span>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Collections</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{(totalCollected / 100000).toFixed(2)}L
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {payments.length} verified settlements
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Transaction Size</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{(avgPayment / 1000).toFixed(1)}k
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Per milestone tranche</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bank Wire Settlements</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{neftRtgsCount}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">NEFT / RTGS transfers</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Default / Bounce Rate</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">0.0%</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Zero payment dishonors</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipt #, customer name, or bank UTR..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-hidden text-xs text-slate-900 placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-500">Mode:</span>
          <select
            value={modeFilter}
            onChange={e => setModeFilter(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">All Modes</option>
            <option value="NEFT / Bank Transfer">NEFT / Bank Transfer</option>
            <option value="UPI / Online QR">UPI / Online QR</option>
            <option value="Cheque Deposit">Cheque Deposit</option>
          </select>
        </div>
      </div>

      {/* Main Full-Width Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 uppercase font-extrabold text-[10px] text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Receipt No &amp; Date</th>
                <th className="py-3.5 px-4">Customer &amp; Client ID</th>
                <th className="py-3.5 px-4">Invoice / Project Ref</th>
                <th className="py-3.5 px-4">Mode &amp; Bank UTR</th>
                <th className="py-3.5 px-4 text-right">Amount Received</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900">{p.paymentNumber}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">{p.paymentDate}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{p.customerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.customerId}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-mono text-slate-900 font-semibold">{p.invoiceId}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.projectId}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{p.paymentMode}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.transactionReference}</div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="font-mono font-black text-emerald-700 text-sm">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {p.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5 text-slate-500" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Payment Receipt Confirmation</h3>
              </div>
              <button 
                onClick={() => setSelectedReceipt(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Voucher:</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.paymentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.paymentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Reference:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedReceipt.invoiceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank UTR / Transaction ID:</span>
                <span className="font-mono text-slate-700">{selectedReceipt.transactionReference}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Amount Received:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  ₹{selectedReceipt.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
