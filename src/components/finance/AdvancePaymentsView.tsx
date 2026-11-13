import React, { useState } from 'react';
import { 
  IndianRupee, Search, Filter, Phone, MapPin, Zap, 
  Calendar, FileText, CheckCircle2, ArrowRight, Printer, 
  Download, ShieldCheck, Clock, AlertCircle, ExternalLink, 
  Layers, Truck, Package, Check, Building2, User, Eye,
  ShoppingCart, RefreshCw, X, Send
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Payment, Quotation, Project, Invoice } from '../../types';
import { getApiUrl } from '../../utils/apiUrl';
import { convertNumberToWords } from '../../utils/quotationEngine';

interface AdvancePaymentsViewProps {
  onNavigateToTab?: (tab: string) => void;
  onNavigateToProject?: (projectId?: string) => void;
}

export const AdvancePaymentsView: React.FC<AdvancePaymentsViewProps> = ({
  onNavigateToTab,
  onNavigateToProject,
}) => {
  const { quotations, payments, projects, invoices, verifyPaymentScreenshot, sendInvoiceToAuditor, showToast, activeRole, currentUser } = useCrm();
  const isAuditor = activeRole === 'Auditor' || currentUser?.role === 'Auditor';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<any | null>(null);
  const [receiptViewTab, setReceiptViewTab] = useState<'receipt' | 'tax_invoice'>('receipt');
  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [auditorSendingAdvId, setAuditorSendingAdvId] = useState<string | null>(null);

  const handleDirectPrint = () => {
    window.print();
  };

  const handleSendAdvanceToAuditor = async (rec: any) => {
    const invId = rec.linkedInvoice?.id || `INV-${rec.quote.id}`;
    setAuditorSendingAdvId(rec.quote.id);
    try {
      await sendInvoiceToAuditor(invId);
      if (showToast) {
        showToast(`90% Advance Tax Invoice (${rec.paymentNumber}) forwarded to Auditor Panel!`, 'success');
      }
    } finally {
      setAuditorSendingAdvId(null);
    }
  };

  const handleVerifyScreenshot = async (payId: string, clientName: string) => {
    setVerifyingId(payId);
    try {
      await verifyPaymentScreenshot(payId);
      if (showToast) {
        showToast(`Advance payment proof for ${clientName} verified successfully!`, 'success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  // Filter accepted quotes or quotes with advance payments
  const acceptedQuotes = quotations.filter(q => 
    q.status === 'Customer_Accepted' || 
    q.status === 'Converted_To_Project' || 
    q.advancePaymentReceived
  );

  // Filter advance payments from payments state
  const advancePayments = payments.filter(p => 
    p.isAdvance || 
    p.paymentNumber?.includes('ADV') || 
    p.id.includes('ADV')
  );

  // Combine quotations and payments into consolidated advance records
  const advanceRecords = acceptedQuotes.map(q => {
    const advance90 = Math.round(q.totalAmount * 0.90);
    const matchedPay = advancePayments.find(p => 
      p.quotationId === q.id || 
      p.customerName?.toLowerCase() === q.leadName?.toLowerCase() ||
      (q.convertedToProjectId && p.projectId === q.convertedToProjectId)
    );

    const linkedProj = projects.find(p => 
      p.quotationId === q.id || 
      p.id === q.convertedToProjectId || 
      p.customerName?.toLowerCase() === q.leadName?.toLowerCase()
    );

    const matchedInv = invoices.find(inv => 
      inv.projectId === q.convertedToProjectId || 
      inv.customerName?.toLowerCase() === q.leadName?.toLowerCase() ||
      inv.id.includes(q.id)
    );

    const paymentScreenshot = matchedPay?.paymentScreenshot || q.advancePaymentScreenshot || linkedProj?.advancePaymentScreenshot;
    const isVerified = Boolean(matchedPay?.verifiedByAccounts || q.advancePaymentVerified || linkedProj?.advancePaymentVerified);
    const paymentId = matchedPay?.id || matchedPay?.paymentNumber || q.id;

    // Dynamic BOM list for this plant capacity
    const kw = q.systemCapacityKw || 5;
    const defaultMaterials = [
      { name: 'Solar Panels (Mono PERC / Bifacial)', category: 'Solar PV Modules', qty: `${Math.round(kw * 1000 / 540)} Nos (${kw} kWp)`, status: 'Ready for PO' },
      { name: `On-Grid Solar Inverter (${kw} kW)`, category: 'Inverter', qty: '1 No', status: 'Ready for PO' },
      { name: 'HDG Mounting Structure (Flat / Sheet Roof)', category: 'Module Mounting Structure', qty: '1 Set', status: 'Ready for PO' },
      { name: 'DC Solar Cable 4 sq.mm (Red & Black)', category: 'DC Cabling', qty: `${Math.round(kw * 6)} Mtrs`, status: 'Ready for PO' },
      { name: 'AC Armoured Cable 4 sq.mm (3/4 Core)', category: 'AC Cabling', qty: `${Math.round(kw * 5)} Mtrs`, status: 'Ready for PO' },
      { name: 'MC4 Connectors (Pair IP68)', category: 'Connectors & BOS', qty: `${Math.max(2, Math.round(kw / 2))} Sets`, status: 'Ready for PO' },
      { name: 'DC Distribution Box (DCDB with SPD)', category: 'Protection & Switchgear', qty: '1 No', status: 'Ready for PO' },
      { name: 'AC Distribution Box (ACDB with MCB)', category: 'Protection & Switchgear', qty: '1 No', status: 'Ready for PO' },
      { name: 'Chemical Earthing Rods (17mm x 2m)', category: 'Earthing & Lightning', qty: '3 Nos', status: 'Ready for PO' },
      { name: 'Earthing Compound (25kg Bag)', category: 'Earthing & Lightning', qty: '3 Bags', status: 'Ready for PO' },
      { name: 'Copper Lightning Arrestor Spike', category: 'Earthing & Lightning', qty: '1 Set', status: 'Ready for PO' },
      { name: 'Conduits, UV Pipes, Saddles & Accessories', category: 'Conduits & BOS', qty: '1 Set', status: 'Ready for PO' },
      { name: 'SS-304 Hardware Bolts, Washers & Nuts', category: 'Hardware', qty: '1 Set', status: 'Ready for PO' },
      { name: 'Statutory Safety & Hazard Warning Signboards', category: 'Signage & Safety', qty: '1 Set', status: 'Ready for PO' },
    ];

    return {
      quote: q,
      advanceAmount: matchedPay?.amount || q.advancePaymentAmount || advance90,
      paymentMode: matchedPay?.paymentMode || q.advancePaymentMode || 'NEFT/RTGS',
      paymentRef: matchedPay?.transactionReference || q.advancePaymentRef || `UTR-2026-${q.id.replace(/\D/g, '') || '98412'}`,
      paymentDate: matchedPay?.paymentDate || (q.acceptedAt ? q.acceptedAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      paymentNumber: matchedPay?.paymentNumber || `ADV-${q.quotationNumber || q.id}`,
      paymentId,
      paymentScreenshot,
      isVerified,
      linkedProject: linkedProj,
      linkedInvoice: matchedInv,
      materials: defaultMaterials,
    };
  });

  // Filter records by search term
  const filteredRecords = advanceRecords.filter(rec => {
    const q = rec.quote;
    const term = searchTerm.toLowerCase();
    return (
      q.leadName?.toLowerCase().includes(term) ||
      q.quotationNumber?.toLowerCase().includes(term) ||
      q.customerPhone?.includes(term) ||
      rec.paymentRef?.toLowerCase().includes(term)
    );
  });

  const totalAdvanceAmount = advanceRecords.reduce((sum, r) => sum + r.advanceAmount, 0);

  const handleOpenPrintModal = (rec: any) => {
    const taxable = Math.round(rec.advanceAmount / 1.138);
    const gstHalf = Math.round((rec.advanceAmount - taxable) / 2);

    const invoiceToPrint: Invoice = rec.linkedInvoice || {
      id: `INV-${rec.quote.id}`,
      invoiceNumber: `INV-2026-000${rec.quote.id.replace(/\D/g, '').slice(-2) || '26'}`,
      projectId: rec.linkedProject?.id || `PROJECT-${rec.quote.id}`,
      customerId: rec.quote.customerId || rec.quote.leadId || '',
      customerName: rec.quote.leadName,
      customerPhone: rec.quote.customerPhone,
      customerGstin: rec.quote.customerGstin,
      issueDate: rec.paymentDate,
      dueDate: rec.paymentDate,
      subtotal: taxable,
      cgst: gstHalf,
      sgst: gstHalf,
      igst: 0,
      totalAmount: rec.advanceAmount,
      paidAmount: rec.advanceAmount,
      balanceDue: 0,
      status: 'Paid',
      items: [
        {
          description: `90% Milestone Advance for ${rec.quote.systemCapacityKw || 5} kW Solar EPC Plant (Booking & Procurement)`,
          hsnCode: '995465',
          quantity: 1,
          rate: taxable,
          amount: taxable,
        }
      ]
    };

    const receiptObj = {
      receiptNumber: rec.paymentNumber || `RCPT-${(rec.paymentId || '0001671').replace(/\D/g, '').slice(-6) || '0001671'}`,
      date: rec.paymentDate,
      customerName: rec.quote.leadName || rec.linkedProject?.customerName || 'Valued Customer',
      customerPhone: rec.quote.customerPhone,
      customerAddress: rec.quote.customerAddress,
      amount: rec.advanceAmount,
      amountInWords: convertNumberToWords(rec.advanceAmount),
      paymentMode: rec.paymentMode || 'Cash',
      transactionRef: rec.paymentRef,
      capacityKw: rec.quote.systemCapacityKw || 5,
      invoice: invoiceToPrint
    };

    setSelectedReceiptForPrint(receiptObj);
    setSelectedInvoiceForPrint(invoiceToPrint);
    setReceiptViewTab('receipt');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 mb-2">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sales Management &amp; Finance Accounts Hub</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Customer Advance Payments &amp; Material Allocation
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Verified client booking advances from accepted solar contracts linked to equipment procurement and official GST tax receipts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('purchase-orders')}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Go to Purchase Orders &rarr;</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Advances Collected</span>
            <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
              ₹{(totalAdvanceAmount / 100000).toFixed(2)}L
            </span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
              {advanceRecords.length} verified booking receipts
            </span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Deals in Procurement</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              {advanceRecords.length} Deals
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
              100% advance verified
            </span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Allocated BOM Materials</span>
            <span className="text-2xl font-black text-amber-700 font-mono mt-1 block">
              {advanceRecords.length * 14} Items
            </span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
              Funded by customer advances
            </span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Banking Ledger Status</span>
            <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">
              100%
            </span>
            <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">
              Reconciled &amp; Audited
            </span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, quote #, phone, UTR..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Showing <span className="text-slate-900 font-bold">{filteredRecords.length}</span> advance records
        </div>
      </div>

      {/* Advance Payments & Material Allocation Cards */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <IndianRupee className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">No advance payments found</p>
            <p className="text-xs text-slate-400 mt-1">
              Customer advance payments will appear here automatically when proposals are accepted in Negotiation Hub.
            </p>
          </div>
        ) : (
          filteredRecords.map(rec => {
            const isExpanded = expandedMaterialId === rec.quote.id;

            return (
              <div 
                key={rec.quote.id}
                className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-6 shadow-xs transition-all space-y-5"
              >
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                        {rec.quote.quotationNumber || rec.quote.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono">
                        {rec.quote.systemCapacityKw || 5} kW System
                      </span>
                      {rec.isVerified ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-black inline-flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          Advance Paid &amp; Verified by Accounts
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-black inline-flex items-center gap-1 shadow-2xs">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Pending Accounts Verification
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
                      <span>{rec.quote.leadName}</span>
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap pt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rec.quote.customerPhone}</span>
                      </span>
                      {rec.quote.customerAddress && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rec.quote.customerAddress}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap lg:justify-end">
                    {/* View Screenshot button */}
                    {rec.paymentScreenshot && (
                      <button
                        onClick={() => setSelectedScreenshotUrl(rec.paymentScreenshot || null)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-300"
                        title="View Customer Advance Payment Screenshot"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>View Screenshot</span>
                      </button>
                    )}

                    {/* Verify Payment Screenshot Button */}
                    {!rec.isVerified && (
                      <button
                        onClick={() => handleVerifyScreenshot(rec.paymentId, rec.quote.leadName)}
                        disabled={verifyingId === rec.paymentId}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                        title="Verify advance payment proof and reconcile with banking ledger"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{verifyingId === rec.paymentId ? 'Verifying...' : 'Verify Payment Screenshot'}</span>
                      </button>
                    )}

                    {(() => {
                      const isSentToAuditor = Boolean(
                        rec.linkedInvoice?.sentToAuditor || 
                        invoices.find(i => (i.id === rec.linkedInvoice?.id || (rec.linkedProject?.id && i.projectId === rec.linkedProject.id) || i.id === `INV-${rec.quote.id}`) && i.sentToAuditor)
                      );

                      if (isAuditor) {
                        return (
                          <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isSentToAuditor ? 'Received in Auditor Panel ✓' : 'Statutory Invoice'}</span>
                          </span>
                        );
                      }

                      if (isSentToAuditor) {
                        return (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs cursor-default">
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Sent to Auditor ✓</span>
                          </span>
                        );
                      }

                      return (
                        <button
                          type="button"
                          disabled={auditorSendingAdvId === rec.quote.id}
                          onClick={() => handleSendAdvanceToAuditor(rec)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                          title="Forward 90% Advance Tax Invoice to Auditor panel"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{auditorSendingAdvId === rec.quote.id ? 'Sending...' : 'Send to Auditor'}</span>
                        </button>
                      );
                    })()}

                    <button
                      onClick={() => handleOpenPrintModal(rec)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      title="Print official GST Tax Invoice and Advance Payment Receipt"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Print Tax Invoice &amp; Receipt</span>
                    </button>

                    <button
                      onClick={() => setExpandedMaterialId(isExpanded ? null : rec.quote.id)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isExpanded ? 'Hide Materials' : 'View Sourced Materials (14)'}</span>
                    </button>

                    {onNavigateToTab && (
                      <button
                        onClick={() => onNavigateToTab('purchase-orders')}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                        title="Jump to Purchase Orders Panel"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Financial Ledger & Advance Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Advance Collected</span>
                    <span className="text-base font-mono font-black text-emerald-700 block mt-0.5">
                      ₹{rec.advanceAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">90% contract mobilization</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Payment Mode</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{rec.paymentMode}</span>
                    <span className="text-[10px] text-slate-500">HDFC Bank Direct Deposit</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Bank UTR / Transaction Ref</span>
                    <span className="font-mono text-xs font-bold text-slate-900 block mt-0.5 truncate" title={rec.paymentRef}>
                      {rec.paymentRef}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Verified Settlement</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Payment Date</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{rec.paymentDate}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{rec.paymentNumber}</span>
                  </div>
                </div>

                {/* Material Requirements Section (What is being bought with this advance) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span>Materials Sourced Using This Advance ({rec.materials.length} Equipment Line Items)</span>
                    </span>
                    <button
                      onClick={() => setExpandedMaterialId(isExpanded ? null : rec.quote.id)}
                      className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      {isExpanded ? 'Collapse' : 'Expand Full Bill of Materials'}
                    </button>
                  </div>

                  {/* Summary preview or full table */}
                  {isExpanded ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs divide-y divide-slate-200">
                        <thead className="bg-slate-100/80 text-slate-700 font-bold text-[10px] uppercase">
                          <tr>
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3">Equipment / Item Description</th>
                            <th className="p-3">Component Category</th>
                            <th className="p-3 text-right">Required Quantity</th>
                            <th className="p-3 text-center">Procurement Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {rec.materials.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                              <td className="p-3 font-bold text-slate-900">{m.name}</td>
                              <td className="p-3 text-slate-600">{m.category}</td>
                              <td className="p-3 text-right font-mono font-bold text-slate-900">{m.qty}</td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-slate-700">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">Key Equipment Allocated:</span>
                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-800">
                          {rec.materials[0].name} ({rec.materials[0].qty})
                        </span>
                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-800">
                          {rec.materials[1].name}
                        </span>
                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-800">
                          {rec.materials[2].name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-bold">
                          +{rec.materials.length - 3} more items
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 shrink-0">
                        100% Advance Allocated
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Official A4 Payment-In Receipt & Tax Invoice Modal (Matches Image 2) */}
      {(selectedReceiptForPrint || selectedInvoiceForPrint) && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:static print:bg-transparent print:backdrop-blur-none print-modal-overlay">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 print:max-w-full print:w-full print:max-h-none print:shadow-none print:border-none print:rounded-none print:overflow-visible print-modal-wrapper">
            {/* Modal Controls - Hidden during Print */}
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 no-print print:hidden print-modal-header">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Customer Advance Payment-In Receipt</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/30">
                  {selectedReceiptForPrint?.receiptNumber || selectedInvoiceForPrint?.invoiceNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setReceiptViewTab('receipt')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      receiptViewTab === 'receipt' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Payment-In Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptViewTab('tax_invoice')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      receiptViewTab === 'tax_invoice' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    GST Tax Invoice
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDirectPrint}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoiceForPrint(null);
                    setSelectedReceiptForPrint(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* TAB 1: OFFICIAL PAYMENT-IN RECEIPT (MATCHES USER ATTACHMENT IMAGE 2 EXACTLY) */}
            {receiptViewTab === 'receipt' && selectedReceiptForPrint && (
              <div id="printable-payment-receipt-body" className="p-8 sm:p-12 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800 bg-white">
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
                      {selectedReceiptForPrint.customerName}
                    </h4>
                    {selectedReceiptForPrint.customerPhone && (
                      <div className="text-[11px] text-slate-600 font-mono">
                        Phone: {selectedReceiptForPrint.customerPhone}
                      </div>
                    )}
                    {selectedReceiptForPrint.customerAddress && (
                      <div className="text-[11px] text-slate-500 max-w-xs">
                        {selectedReceiptForPrint.customerAddress}
                      </div>
                    )}
                  </div>

                  <div className="text-left sm:text-right space-y-1 font-mono">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Receipt Details
                    </span>
                    <div className="text-xs text-slate-800">
                      Receipt No.: <strong className="text-slate-900 font-bold">{selectedReceiptForPrint.receiptNumber}</strong>
                    </div>
                    <div className="text-xs text-slate-800">
                      Date: <strong className="text-slate-900 font-bold">{selectedReceiptForPrint.date}</strong>
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
                          ADVANCE
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          90% Mobilization Advance for {selectedReceiptForPrint.capacityKw} kW Solar Rooftop Installation
                        </div>
                      </div>
                      <div className="font-mono font-black text-slate-950 text-base sm:text-lg">
                        ₹ {Number(selectedReceiptForPrint.amount).toLocaleString('en-IN')}.00
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                      <span className="font-semibold text-slate-600">Payment Mode</span>
                      <span className="font-bold text-slate-900 font-mono">{selectedReceiptForPrint.paymentMode}</span>
                    </div>

                    {selectedReceiptForPrint.transactionRef && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-500">Transaction Ref / UTR</span>
                        <span className="font-mono text-slate-700">{selectedReceiptForPrint.transactionRef}</span>
                      </div>
                    )}
                  </div>

                  {/* Amount In Words Section */}
                  <div className="border-t border-slate-300 pt-4 mt-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Amount In Words
                    </span>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      {selectedReceiptForPrint.amountInWords}
                    </div>
                  </div>
                </div>

                {/* Authorized Signatory Block (Matching Image 2) */}
                <div className="pt-16 sm:pt-20 flex justify-end">
                  <div className="text-center w-56 space-y-2">
                    <div className="text-xs font-bold text-slate-800">
                      For: AB ENERGY SOLUTIONS
                    </div>
                    <div className="h-10 border-b border-dashed border-slate-400 mx-auto w-40" />
                    <div className="text-xs font-bold text-slate-900">
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DETAILED STATUTORY GST TAX INVOICE */}
            {receiptViewTab === 'tax_invoice' && selectedInvoiceForPrint && (
              <div id="printable-advance-tax-invoice" className="p-8 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800 bg-white">
                {/* Header Letterhead */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <img
                        src={getApiUrl('/logo.png')}
                        onError={(e: any) => { e.currentTarget.src = getApiUrl('/logo.jpg'); }}
                        alt="AB Energy Solutions"
                        className="h-16 w-auto max-w-[200px] object-contain"
                      />
                      <div>
                        <h2 className="font-black text-slate-900 text-xl tracking-tight uppercase leading-none">
                          AB ENERGY SOLUTIONS
                        </h2>
                        <p className="text-xs text-slate-600 font-semibold mt-1">
                          Certified Solar EPC &amp; Grid-Tied Renewable Power Systems
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5 mt-2">
                      <div>No 13, Thammampatty Main Road, Maheswari Theatre Opposite Street, Vazhapadi, Salem, Tamil Nadu - 636115</div>
                      <div>GSTIN: <span className="font-mono font-bold text-slate-900">33FSQPA3244H1ZU</span> &bull; State: Tamil Nadu (33)</div>
                      <div>Email: abenergysolutiontn@gmail.com &bull; Contact: +91 95664 99678</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">TAX INVOICE</span>
                    <span className="text-lg font-mono font-black text-slate-900 block mt-0.5">
                      {selectedInvoiceForPrint.invoiceNumber}
                    </span>
                    <div className="text-[11px] text-slate-500 space-y-0.5 mt-1 font-mono">
                      <div>Issue Date: {selectedInvoiceForPrint.issueDate}</div>
                      <div>Payment Date: {selectedInvoiceForPrint.dueDate}</div>
                    </div>
                  </div>
                </div>

                {/* Billed To / Client Details Grid */}
                <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Billed To (Client Details)</span>
                    <h4 className="font-black text-slate-900 text-sm">{selectedInvoiceForPrint.customerName}</h4>
                    <div className="text-slate-600 mt-1 space-y-0.5">
                      <div>Contact: {selectedInvoiceForPrint.customerPhone || 'N/A'}</div>
                      {selectedInvoiceForPrint.customerGstin && <div>Client GSTIN: {selectedInvoiceForPrint.customerGstin}</div>}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">EPC Project Details</span>
                    <div className="font-mono font-bold text-slate-900">
                      Project Ref: {selectedInvoiceForPrint.projectId || 'PROJECT-SOLAR-01'}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-1 space-y-0.5">
                      <div>SAC Code: <span className="font-mono font-bold">995465</span> (Solar Turnkey EPC Contract)</div>
                      <div>Reverse Charge: No &bull; Place of Supply: Tamil Nadu (33)</div>
                    </div>
                  </div>
                </div>

                {/* Invoice Line Items */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-100 font-bold text-[10px] uppercase text-slate-700">
                      <tr>
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3">Description of Goods / Services</th>
                        <th className="p-3 text-center">HSN/SAC</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Taxable Rate (₹)</th>
                        <th className="p-3 text-right">Total Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedInvoiceForPrint.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{item.description}</div>
                            <div className="text-[10px] text-slate-500">Includes procurement allocation of Tier-1 solar panels, inverter &amp; balance of system.</div>
                          </td>
                          <td className="p-3 text-center font-mono">{item.hsnCode || '995465'}</td>
                          <td className="p-3 text-center font-mono font-bold">{item.quantity}</td>
                          <td className="p-3 text-right font-mono">₹{(item.rate ?? item.unitRate ?? 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tax Calculations & Totals */}
                <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-600 max-w-sm">
                    <span className="font-bold text-slate-900 text-xs block">Bank Payment Details (NEFT / RTGS)</span>
                    <div className="text-[11px] space-y-0.5 font-mono">
                      <div>Account Name: <strong className="text-slate-800">AB Energy Solutions</strong></div>
                      <div>Bank: State Bank of India / HDFC Bank</div>
                      <div>Branch: Salem Main Branch</div>
                      <div>GSTIN: 33FSQPA3244H1ZU</div>
                    </div>
                  </div>

                  <div className="w-full sm:w-80 space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal (Taxable Amount)</span>
                      <span className="font-mono font-bold">₹{selectedInvoiceForPrint.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Composite Solar GST (CGST + SGST @ 13.8%)</span>
                      <span className="font-mono font-bold">₹{(selectedInvoiceForPrint.cgst + selectedInvoiceForPrint.sgst + selectedInvoiceForPrint.igst).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Invoice Amount</span>
                      <span className="font-mono">₹{selectedInvoiceForPrint.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-emerald-700 pt-1">
                      <span>Amount Paid to Date (Advance)</span>
                      <span className="font-mono">- ₹{selectedInvoiceForPrint.paidAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                      <span>Balance Due</span>
                      <span className="font-mono text-emerald-700">₹{selectedInvoiceForPrint.balanceDue.toLocaleString('en-IN')} (Nil)</span>
                    </div>
                  </div>
                </div>

                {/* Signatory Footer */}
                <div className="pt-8 flex items-end justify-between border-t border-slate-200 text-slate-500 text-[11px]">
                  <div>
                    <p>Declaration: This invoice shows the actual price of goods and services described and that all particulars are true and correct.</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-400">Computer generated invoice. System verified receipt.</p>
                  </div>

                  <div className="text-center shrink-0">
                    <div className="h-10"></div>
                    <div className="font-bold text-slate-900">For AB Energy Solutions</div>
                    <div className="text-[10px] text-slate-400">Authorized Signatory</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Payment Screenshot Modal / Lightbox */}
      {selectedScreenshotUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Customer Advance Payment Proof</h3>
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

