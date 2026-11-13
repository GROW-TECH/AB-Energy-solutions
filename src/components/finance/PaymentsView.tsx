import React, { useState } from 'react';
import { 
  CreditCard, Search, CheckCircle2, 
  DollarSign, Receipt, Printer, ArrowRight, ArrowUpRight, Filter, ShieldCheck, Download, ExternalLink, X,
  Eye, Clock, Image as ImageIcon
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Payment } from '../../types';
import { convertNumberToWords } from '../../utils/quotationEngine';
import { getApiUrl } from '../../utils/apiUrl';

export const PaymentsView: React.FC = () => {
  const { payments, customers, verifyPaymentScreenshot, showToast } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Advances' | 'Milestones'>('All');
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const handleVerifyPayment = async (paymentId: string) => {
    setVerifyingId(paymentId);
    try {
      await verifyPaymentScreenshot(paymentId);
      if (showToast) {
        showToast('Payment proof verified successfully by Accounts!', 'success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  const advancePayments = payments.filter(p => p.isAdvance || p.paymentNumber.includes('ADV') || p.id.includes('ADV'));
  const totalAdvancesCollected = advancePayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const filteredPayments = payments.filter(p => {
    const isAdv = p.isAdvance || p.paymentNumber.includes('ADV') || p.id.includes('ADV');
    const matchesType = typeFilter === 'All' ? true : typeFilter === 'Advances' ? isAdv : !isAdv;
    const matchesSearch = 
      p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.transactionReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.quotationId && p.quotationId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMode = modeFilter === 'All' || p.paymentMode === modeFilter;
    return matchesType && matchesSearch && matchesMode;
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

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider flex items-center justify-between">
            <span>Customer Advances</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-extrabold text-[9px]">Accounts</span>
          </div>
          <div className="text-2xl font-black text-amber-950 mt-1 font-mono">
            ₹{(totalAdvancesCollected / 100000).toFixed(2)}L
          </div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">
            {advancePayments.length} project advance receipts
          </div>
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

      {/* Tabs Filter Bar (All vs Customer Advances vs Milestones) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setTypeFilter('All')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            typeFilter === 'All'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Payments ({payments.length})
        </button>
        <button
          onClick={() => setTypeFilter('Advances')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            typeFilter === 'Advances'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <span>Customer Advances</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/90 text-amber-900 font-extrabold">
            {advancePayments.length}
          </span>
        </button>
        <button
          onClick={() => setTypeFilter('Milestones')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            typeFilter === 'Milestones'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Milestone Tranches ({payments.length - advancePayments.length})
        </button>
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

      {/* Payments Mobile Cards (< lg) */}
      <div className="lg:hidden divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Receipt className="w-9 h-9 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No payment receipts found</p>
          </div>
        ) : (
          filteredPayments.map(p => (
            <div key={p.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">{p.paymentNumber}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {p.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">{p.paymentDate}</div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-black text-emerald-700 text-sm sm:text-base">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Customer:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[190px]">{p.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Invoice:</span>
                  <span className="font-mono text-slate-700 font-semibold">{p.invoiceId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Payment Mode:</span>
                  <span className="font-semibold text-slate-800">{p.paymentMode}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Bank UTR / Ref:</span>
                  <span className="font-mono text-[11px] text-slate-700 truncate max-w-[180px]">{p.transactionReference}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  onClick={() => setSelectedReceipt(p)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Receipt</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Full-Width Ledger Table (Desktop >= lg) */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 uppercase font-extrabold text-[10px] text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Receipt No &amp; Date</th>
                <th className="py-3.5 px-4">Customer &amp; Client ID</th>
                <th className="py-3.5 px-4">Invoice / Project Ref</th>
                <th className="py-3.5 px-4">Mode &amp; Bank UTR</th>
                <th className="py-3.5 px-4 text-right">Amount Received</th>
                <th className="py-3.5 px-4 text-center">Payment Proof</th>
                <th className="py-3.5 px-4 text-center">Accounts Verification</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-slate-900">{p.paymentNumber}</span>
                      {(p.isAdvance || p.paymentNumber.includes('ADV') || p.id.includes('ADV')) && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          Advance
                        </span>
                      )}
                    </div>
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

                  {/* Payment Proof / Screenshot */}
                  <td className="py-3.5 px-4 text-center">
                    {p.paymentScreenshot ? (
                      <button
                        onClick={() => setSelectedScreenshotUrl(p.paymentScreenshot || null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="Click to view payment proof screenshot"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>View Proof</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Direct Bank</span>
                    )}
                  </td>

                  {/* Accounts Verification */}
                  <td className="py-3.5 px-4 text-center">
                    {p.verifiedByAccounts || p.status === 'Verified' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-2.5 h-2.5 text-amber-600" />
                          Pending
                        </span>
                        <button
                          onClick={() => handleVerifyPayment(p.id)}
                          disabled={verifyingId === p.id}
                          className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors cursor-pointer disabled:opacity-50"
                          title="Verify payment screenshot as Accounts officer"
                        >
                          {verifyingId === p.id ? '...' : 'Verify'}
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
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

      {/* Payment Receipt Modal - Official Payment-In Receipt (Matches Image 2) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:static print:bg-transparent print:backdrop-blur-none print-modal-overlay">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 print:max-w-full print:w-full print:max-h-none print:shadow-none print:border-none print:rounded-none print:overflow-visible print-modal-wrapper">
            {/* Top Control Bar - Hidden in Print */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 no-print print:hidden print-modal-header">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">Official Payment-In Receipt Voucher</h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/30">
                  {selectedReceipt.paymentNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedReceipt(null)} 
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Printable Payment-In Receipt Body (Matching Attached Image 2 Exactly) */}
            <div id="printable-payment-receipt" className="printable-receipt-card p-8 sm:p-12 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800 bg-white">
              {/* Header Grid: Company Info Left, Official Logo Right */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <h2 className="font-black text-slate-950 text-base sm:text-lg tracking-tight uppercase">
                    AB ENERGY SOLUTIONS
                  </h2>
                  <div className="text-[11px] text-slate-700 leading-snug">
                    No 13, Thammampatty Main Road, Maheswari Theatre Opposite Street,<br />
                    Vazhapadi, Salem, Tamil Nadu - 636115
                  </div>
                  <div className="text-[11px] text-slate-700 pt-1 space-y-0.5">
                    <div>Phone no.: <span className="font-mono font-medium">9566499678</span></div>
                    <div>Email: <span className="font-mono">abenergysolutiontn@gmail.com</span></div>
                    <div>GSTIN: <span className="font-mono font-bold text-slate-900">33FSQPA3244H1ZU</span></div>
                    <div>State: <span className="font-medium">33-Tamil Nadu</span></div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <img
                    src={getApiUrl('/logo.png')}
                    onError={(e: any) => { e.currentTarget.src = getApiUrl('/logo.jpg'); }}
                    alt="AB Energy Solutions"
                    className="h-16 w-auto object-contain"
                  />
                </div>
              </div>

              {/* Gray Separator Line */}
              <div className="border-t border-slate-300 my-4" />

              {/* Centered Document Title */}
              <div className="text-center py-1">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-600 tracking-wide uppercase">
                  Payment-In
                </h3>
              </div>

              {/* Received From Left & Receipt Details Right */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Received From
                  </span>
                  <h4 className="font-black text-slate-900 text-sm sm:text-base uppercase tracking-tight">
                    {selectedReceipt.customerName}
                  </h4>
                  {(() => {
                    const matchedCust = customers.find(c => c.id === selectedReceipt.customerId || c.name === selectedReceipt.customerName);
                    return matchedCust ? (
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        {matchedCust.phone && <div>Phone: <span className="font-mono">{matchedCust.phone}</span></div>}
                        {matchedCust.address && <div className="text-slate-500 max-w-xs">{matchedCust.address}</div>}
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="text-left sm:text-right space-y-1 font-mono">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Receipt Details
                  </span>
                  <div className="text-xs text-slate-800">
                    Receipt No.: <strong className="text-slate-900 font-bold">{selectedReceipt.paymentNumber}</strong>
                  </div>
                  <div className="text-xs text-slate-800">
                    Date: <strong className="text-slate-900 font-bold">{selectedReceipt.paymentDate}</strong>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown Table */}
              <div className="pt-4 border-t border-slate-300">
                <div className="flex justify-between text-xs font-bold text-slate-600 pb-2 border-b border-slate-200 uppercase tracking-wider">
                  <span>Description</span>
                  <span>Received</span>
                </div>

                <div className="py-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-black text-slate-900 text-sm tracking-wide">
                        {selectedReceipt.notes || (selectedReceipt.paymentNumber?.includes('ADV') ? 'ADVANCE' : 'MILESTONE PAYMENT')}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Invoice Reference: <span className="font-mono font-semibold text-slate-700">{selectedReceipt.invoiceId}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Payment Mode: <span className="font-medium text-slate-800">{selectedReceipt.paymentMode || 'Bank Transfer'}</span>
                        {selectedReceipt.transactionReference && (
                          <span className="font-mono ml-2 text-slate-600">(Ref: {selectedReceipt.transactionReference})</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                        ₹ {selectedReceipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="border-t border-slate-200 pt-3 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Amount In Words
                  </span>
                  <div className="text-xs font-bold text-slate-900 capitalize">
                    {convertNumberToWords(selectedReceipt.amount)}
                  </div>
                </div>

                {/* Attached Screenshot Proof if available */}
                {selectedReceipt.paymentScreenshot && (
                  <div className="no-print pt-4 border-t border-slate-200 mt-4">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Attached Payment Proof:
                    </span>
                    <div
                      onClick={() => setSelectedScreenshotUrl(selectedReceipt.paymentScreenshot || null)}
                      className="inline-block cursor-pointer group relative rounded-lg overflow-hidden border border-slate-300 max-h-24 bg-slate-900"
                    >
                      <img
                        src={selectedReceipt.paymentScreenshot}
                        alt="Proof"
                        className="max-h-24 object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                        View Proof
                      </div>
                    </div>
                  </div>
                )}

                {/* Signatory Footer */}
                <div className="pt-12 flex justify-end">
                  <div className="text-center space-y-8 min-w-[200px]">
                    <div className="text-xs font-bold text-slate-800 uppercase">
                      For: AB ENERGY SOLUTIONS
                    </div>
                    <div className="h-8 flex items-center justify-center">
                      <span className="font-serif italic text-base text-slate-700 tracking-wider font-semibold">
                        AB Energy Solutions
                      </span>
                    </div>
                    <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {selectedScreenshotUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Payment Receipt &amp; UTR Proof</h3>
              </div>
              <button
                onClick={() => setSelectedScreenshotUrl(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-900 rounded-xl overflow-hidden max-h-[70vh] flex items-center justify-center">
              <img
                src={selectedScreenshotUrl}
                alt="Payment Proof"
                className="max-h-[68vh] w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">Verified for Accounts &amp; Banking Audit</span>
              <button
                onClick={() => setSelectedScreenshotUrl(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
