import React, { useState } from 'react';
import { 
  Handshake, Search, Filter, Phone, MapPin, Zap, 
  Calendar, FileText, CheckCircle2, ArrowRight, MessageSquare, 
  Printer, Download, ShieldCheck, Clock, AlertCircle, Edit3, 
  Save, RotateCcw, Check, Sparkles, Building2, User, 
  IndianRupee, ChevronRight, X, Layers, Truck, Package, ExternalLink
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Quotation, QuotationVersion } from '../../types';
import { getApiUrl } from '../../utils/apiUrl';
import { getQuotationPdfUrl } from '../common/QuotationProposalModal';

interface NegotiationViewProps {
  onNavigateToProject?: (projectId?: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const NegotiationView: React.FC<NegotiationViewProps> = ({
  onNavigateToProject,
  onNavigateToTab,
}) => {
  const { 
    quotations, 
    createQuotationRevision, 
    recordCustomerAcceptance, 
    currentUser,
    projects
  } = useCrm();

  const [activeTab, setActiveTab] = useState<'active' | 'in_procurement'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuoteForNegotiation, setSelectedQuoteForNegotiation] = useState<Quotation | null>(null);
  
  // Negotiation Edit State
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [negotiationNotes, setNegotiationNotes] = useState<string>('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Quotes eligible for Active Negotiation: Sent to client
  const activeNegotiations = quotations.filter(q => {
    if (q.status !== 'Sent') return false;

    const matchesSearch = 
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerPhone.includes(searchTerm) ||
      (q.customerAddress && q.customerAddress.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  // Quotes accepted by customer and handed over to Procurement (Purchase Team)
  const inProcurementQuotes = quotations.filter(q => {
    if (q.status !== 'Customer_Accepted') return false;

    const matchesSearch = 
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerPhone.includes(searchTerm) ||
      (q.customerAddress && q.customerAddress.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const displayedQuotes = activeTab === 'active' ? activeNegotiations : inProcurementQuotes;

  const totalNegotiatingValue = activeNegotiations.reduce((sum, q) => sum + q.totalAmount, 0);
  const totalNegotiatingKw = activeNegotiations.reduce((sum, q) => sum + q.systemCapacityKw, 0);
  const acceptedInProcurementCount = inProcurementQuotes.length;

  const handleOpenNegotiation = (q: Quotation) => {
    setSelectedQuoteForNegotiation(q);
    setDiscountAmount(q.discountAmount || 0);
    setNegotiationNotes('');
  };

  // Recalculate figures dynamically in negotiation drawer
  const activeVer: QuotationVersion | undefined = selectedQuoteForNegotiation?.versions?.[selectedQuoteForNegotiation.versions.length - 1] || selectedQuoteForNegotiation?.versions?.[0];
  const originalSubtotal = activeVer?.subtotal || selectedQuoteForNegotiation?.subtotal || selectedQuoteForNegotiation?.totalAmount || 0;
  const currentTaxable = Math.max(0, originalSubtotal - discountAmount);
  const currentGst = Math.round(currentTaxable * 0.138); // 13.8% composite solar GST
  const currentTotal = currentTaxable + currentGst;
  const currentAdvance90 = Math.round(currentTotal * 0.90);
  const currentCommissioning10 = currentTotal - currentAdvance90;

  // 1. Submit Negotiated Revision (V1 -> V2)
  const handleSaveRevision = async () => {
    if (!selectedQuoteForNegotiation) return;
    setIsSubmittingRevision(true);
    try {
      await createQuotationRevision(selectedQuoteForNegotiation.id, {
        discountAmount,
        notes: negotiationNotes ? `${selectedQuoteForNegotiation.notes || ''}\n[Negotiation]: ${negotiationNotes}` : selectedQuoteForNegotiation.notes,
      });
      showToast(`Revision saved! Commercial discount updated to ₹${discountAmount.toLocaleString('en-IN')}.`, 'success');
      
      // Update local quote
      const nextVerNum = (selectedQuoteForNegotiation.currentVersion || 1) + 1;
      setSelectedQuoteForNegotiation({
        ...selectedQuoteForNegotiation,
        discountAmount,
        totalAmount: currentTotal,
        currentVersion: nextVerNum,
        quotationNumber: `${selectedQuoteForNegotiation.id}-V${nextVerNum}`,
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to save revision', 'error');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  // 2. Client Agreed
  const handleClientAgreed = async () => {
    if (!selectedQuoteForNegotiation) return;
    setIsAccepting(true);
    try {
      const ok = await recordCustomerAcceptance(
        selectedQuoteForNegotiation.id, 
        `Client agreed on negotiated terms: ₹${currentTotal.toLocaleString('en-IN')} with ₹${discountAmount.toLocaleString('en-IN')} discount. 90% advance: ₹${currentAdvance90.toLocaleString('en-IN')}.`
      );
      if (ok) {
        showToast('🎉 Customer Agreement Recorded! Deal moved to Purchase Team panel for material procurement.', 'success');
        setSelectedQuoteForNegotiation(null);
        setActiveTab('in_procurement');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to record acceptance', 'error');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-700' 
            : 'bg-red-600 text-white border-red-700'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-800 mb-2">
              <Handshake className="w-3.5 h-3.5 text-amber-600" />
              <span>Sales &amp; Commercials • Deal Negotiation Hub</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Client Quotation Negotiation &amp; Deal Closing
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Proposals dispatched to clients. Adjust commercial discounts, log counter-offers, create proposal revisions (V1 &rarr; V2), lock customer agreement, and convert directly to Project Manager EPC execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Payment Structure</span>
              <span className="text-xs font-extrabold text-slate-900">90% Advance / 10% Handover</span>
            </div>
          </div>
        </div>

        {/* Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100/60 transition-colors" onClick={() => setActiveTab('active')}>
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Negotiations</span>
              <Handshake className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-950 font-mono">
              {activeNegotiations.length} Deals
            </div>
            <div className="text-[11px] font-semibold text-amber-700 mt-1">
              Proposals sent &amp; under discussion
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-100/60 transition-colors" onClick={() => setActiveTab('in_procurement')}>
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">In Procurement</span>
              <Truck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {acceptedInProcurementCount} Deals
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-1">
              Customer accepted &bull; Sourcing materials
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pipeline Volume</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {totalNegotiatingKw} kW
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              Solar capacity under negotiation
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Commercial Value</span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ₹{(totalNegotiatingValue / 100000).toFixed(1)}L
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              Active turnkey negotiation book
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Active Negotiations vs In Procurement */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Handshake className="w-4 h-4" />
          <span>Active Client Negotiations</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'active' ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {activeNegotiations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('in_procurement')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'in_procurement'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Customer Accepted &bull; In Purchase Process</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'in_procurement' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {acceptedInProcurementCount}
          </span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deals by client, quote #, phone, address..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all text-slate-800"
          />
        </div>
        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-slate-900">{displayedQuotes.length}</span> {activeTab === 'active' ? 'active negotiations' : 'deals in procurement'}
        </div>
      </div>

      {/* Negotiations / Procurement Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {displayedQuotes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            {activeTab === 'active' ? (
              <>
                <Handshake className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600">No active deals in negotiation</p>
                <p className="mt-1">When a quotation is sent to the client, it will appear here for commercial discount adjustments and customer agreement.</p>
              </>
            ) : (
              <>
                <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600">No accepted deals awaiting procurement</p>
                <p className="mt-1">Once a customer accepts a proposal, it transfers to the Purchase Team panel for material indents and site delivery.</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Negotiation Mobile Cards (< lg) */}
            <div className="lg:hidden divide-y divide-slate-100">
              {displayedQuotes.map(q => {
                const advance90 = Math.round(q.totalAmount * 0.90);
                const isAccepted = q.status === 'Customer_Accepted';

                return (
                  <div key={q.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {q.quotationNumber}
                          </span>
                          {isAccepted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold">
                              <Truck className="w-3 h-3 text-emerald-600" />
                              <span>Accepted</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-[10px] font-bold">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Negotiating</span>
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">{q.leadName}</h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{q.customerPhone}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-900 font-mono font-bold rounded-lg text-xs inline-block">
                          {q.systemCapacityKw} kWp
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{q.packageTier || 'Premium'}</div>
                      </div>
                    </div>

                    {q.customerAddress && (
                      <div className="text-[11px] text-slate-500 truncate" title={q.customerAddress}>
                        {q.customerAddress}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Subtotal</span>
                        <span className="font-mono text-slate-600">₹{(q.subtotal || q.totalAmount).toLocaleString('en-IN')}</span>
                        {q.discountAmount ? (
                          <span className="text-[10px] text-emerald-700 block font-bold">-₹{q.discountAmount.toLocaleString('en-IN')} disc</span>
                        ) : null}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Final Contract</span>
                        <span className="font-mono font-black text-slate-900 text-sm">₹{q.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-medium">90% Advance Required:</span>
                        <span className="font-mono font-bold text-emerald-800 text-xs">₹{advance90.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {isAccepted ? (
                        <>
                          <button
                            onClick={() => {
                              if (onNavigateToTab) {
                                onNavigateToTab('purchase-orders');
                              }
                            }}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Truck className="w-3.5 h-3.5 text-emerald-100" />
                            <span>Purchase Panel &rarr;</span>
                          </button>
                          <button
                            onClick={() => handleOpenNegotiation(q)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleOpenNegotiation(q)}
                          className="w-full py-2 bg-slate-900 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <span>Negotiate Deal</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Customer &amp; Quote Ref</th>
                    <th className="p-4 text-center">System Capacity</th>
                    <th className="p-4 text-right">Gross Subtotal</th>
                    <th className="p-4 text-right">Discount</th>
                    <th className="p-4 text-right">Final Contract (₹)</th>
                    <th className="p-4">90% Advance Requirement</th>
                    <th className="p-4">Process Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedQuotes.map(q => {
                    const advance90 = Math.round(q.totalAmount * 0.90);
                    const isAccepted = q.status === 'Customer_Accepted';

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{q.leadName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-emerald-700 font-bold">{q.quotationNumber}</span>
                            <span>•</span>
                            <span>{q.customerPhone}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">{q.customerAddress}</div>
                        </td>

                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-900 font-mono font-bold rounded-lg text-xs">
                            {q.systemCapacityKw} kWp
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{q.packageTier || 'Premium'}</div>
                        </td>

                        <td className="p-4 text-right font-mono text-slate-600">
                          ₹{(q.subtotal || q.totalAmount).toLocaleString('en-IN')}
                        </td>

                        <td className="p-4 text-right font-mono font-bold text-emerald-700">
                          {q.discountAmount ? `-₹${q.discountAmount.toLocaleString('en-IN')}` : '₹0'}
                        </td>

                        <td className="p-4 text-right font-mono font-black text-slate-900 text-sm">
                          ₹{q.totalAmount.toLocaleString('en-IN')}
                        </td>

                        <td className="p-4">
                          <div className="font-mono font-bold text-emerald-800 text-xs">
                            ₹{advance90.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">90% on PO / Booking</div>
                        </td>

                        <td className="p-4">
                          {isAccepted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold">
                              <Truck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>In Purchase &bull; Procurement Initiated</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-[10px] font-bold">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>In Client Negotiation</span>
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {isAccepted ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  if (onNavigateToTab) {
                                    onNavigateToTab('purchase-orders');
                                  }
                                }}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                              >
                                <Truck className="w-3.5 h-3.5 text-emerald-100" />
                                <span>Purchase Panel &rarr;</span>
                              </button>
                              <button
                                onClick={() => handleOpenNegotiation(q)}
                                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                title="View Details"
                              >
                                Details
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenNegotiation(q)}
                              className="px-4 py-2 bg-slate-900 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                            >
                              <span>Negotiate Deal</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Negotiation Workspace Drawer / Modal */}
      {selectedQuoteForNegotiation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    {selectedQuoteForNegotiation.status === 'Customer_Accepted' ? 'Agreed Proposal' : 'Negotiate Commercials'} • {selectedQuoteForNegotiation.leadName}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                    {selectedQuoteForNegotiation.quotationNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Plant Capacity: <strong className="text-slate-800">{selectedQuoteForNegotiation.systemCapacityKw} kW</strong> • Mobile: <strong className="text-slate-800">{selectedQuoteForNegotiation.customerPhone}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedQuoteForNegotiation(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informational Banner if Customer Accepted */}
            {selectedQuoteForNegotiation.status === 'Customer_Accepted' && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-950">
                    Negotiation Completed &amp; Customer Agreement Recorded
                  </p>
                  <p className="text-emerald-800 mt-0.5 leading-relaxed">
                    Commercial terms are locked at <strong className="font-mono">₹{selectedQuoteForNegotiation.totalAmount.toLocaleString('en-IN')}</strong>. This quotation has been dispatched to the <strong>Purchase Team Panel</strong> for material indents, supplier POs, delivery tracking, and customer signature receipt. EPC project conversion will unlock after materials arrive.
                  </p>
                </div>
              </div>
            )}

            {/* Current Financials & Recalculated Live Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Live Pricing Recalculator
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Includes 13.8% Statutory Composite Solar GST
                </span>
              </div>

              {/* Discount Input Slider & Box */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Adjust Commercial Discount / Special Concession (₹):
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      disabled={selectedQuoteForNegotiation.status === 'Customer_Accepted'}
                      value={discountAmount}
                      onChange={e => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full pl-8 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:border-amber-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  {selectedQuoteForNegotiation.status !== 'Customer_Accepted' && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {[5000, 10000, 15000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDiscountAmount(amt)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-amber-400 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          +₹{(amt / 1000)}k
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Base Subtotal</span>
                  <span className="text-sm font-mono font-bold text-slate-700">₹{originalSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Discount</span>
                  <span className="text-sm font-mono font-bold text-emerald-700">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">GST (13.8%)</span>
                  <span className="text-sm font-mono font-bold text-slate-700">₹{currentGst.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl">
                  <span className="block text-[10px] text-amber-800 font-bold uppercase">Net Final Contract</span>
                  <span className="text-sm font-mono font-black text-amber-950">₹{currentTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* 90% Advance Highlight Banner */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-900 block">Payment Terms: 90% Advance / 10% On Commissioning</span>
                  <span className="text-[11px] text-emerald-700">90% Advance due upon PO / contract sign-off: <strong className="font-mono text-emerald-950">₹{currentAdvance90.toLocaleString('en-IN')}</strong></span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Balance 10%</span>
                  <span className="font-mono font-bold text-slate-800">₹{currentCommissioning10.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Negotiation / Meeting Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Negotiation Notes &amp; Client Agreement Terms:
              </label>
              <textarea
                rows={3}
                disabled={selectedQuoteForNegotiation.status === 'Customer_Accepted'}
                value={negotiationNotes}
                onChange={e => setNegotiationNotes(e.target.value)}
                placeholder="e.g. Client agreed to pay 90% advance by RTGS tomorrow upon receiving revised V2 quote with ₹10,000 concession..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-amber-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <a
                  href={getQuotationPdfUrl(selectedQuoteForNegotiation.id, true)}
                  download={`AB_Energy_Proposal_${selectedQuoteForNegotiation.quotationNumber || selectedQuoteForNegotiation.id}.pdf`}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Download PDF directly"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download PDF</span>
                </a>
                <a
                  href={getQuotationPdfUrl(selectedQuoteForNegotiation.id, false)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                </a>

                {selectedQuoteForNegotiation.status !== 'Customer_Accepted' && (
                  <button
                    type="button"
                    onClick={handleSaveRevision}
                    disabled={isSubmittingRevision}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isSubmittingRevision ? 'Saving...' : 'Save as New Revision (V2)'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedQuoteForNegotiation.status !== 'Customer_Accepted' ? (
                  <button
                    type="button"
                    onClick={handleClientAgreed}
                    disabled={isAccepting}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isAccepting ? 'Recording...' : 'Client Agreed & Accepted'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuoteForNegotiation(null);
                      if (onNavigateToTab) {
                        onNavigateToTab('purchase-orders');
                      }
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <Truck className="w-4 h-4 text-emerald-100" />
                    <span>Go to Purchase Team Panel &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
