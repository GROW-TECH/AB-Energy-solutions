import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Printer, Send, 
  Copy, Check, MessageSquare, ArrowLeft,
  Download, Filter, ChevronLeft, ChevronRight, CheckCircle2,
  Share2, ShieldCheck, FileSpreadsheet, X, Clock,
  Pencil, Sparkles, CheckCircle, AlertCircle, Layers,
  ExternalLink, Truck
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Quotation } from '../../types';
import { calculateQuotation, convertNumberToWords, QUOTATION_CONFIG } from '../../utils/quotationEngine';
import { getApiUrl } from '../../utils/apiUrl';
import { EditQuotationModal } from './EditQuotationModal';
import { getQuotationPdfUrl } from '../common/QuotationProposalModal';

interface QuotationsViewProps {
  initialLeadId?: string;
  onNavigateToProject?: (projectId: string) => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  initialLeadId,
  onNavigateToProject,
}) => {
  const { 
    quotations, leads, surveys, projects, sendQuotation, acceptQuotation, 
    createQuotation, approveQuotationDiscount, recordCustomerAcceptance,
    editQuotationData, currentUser 
  } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [activeViewMode, setActiveViewMode] = useState<'grid' | 'document'>('grid');
  const [selectedQuoteForPreview, setSelectedQuoteForPreview] = useState<Quotation | null>(quotations[0] || null);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState<number>(0);

  // Active version for document preview
  const activeVer = selectedQuoteForPreview?.versions?.[selectedVersionIdx] || selectedQuoteForPreview?.versions?.[selectedQuoteForPreview.versions.length - 1] || selectedQuoteForPreview?.versions?.[0];

  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [acceptanceNotes, setAcceptanceNotes] = useState('');
  const [clientPoNumber, setClientPoNumber] = useState('');
  const [recordingAcceptance, setRecordingAcceptance] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [proposalDocTab, setProposalDocTab] = useState<'proposal' | 'tax_audit'>('proposal');

  // New quote modal fields
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLeadId || leads[0]?.id || '');
  const [capacityKw, setCapacityKw] = useState<number>(5);
  const [discountAmount, setDiscountAmount] = useState<number>(10000);
  const [packageTier, setPackageTier] = useState<'Standard' | 'Premium Bifacial' | 'Commercial Heavy Duty'>('Premium Bifacial');

  // Handle initialLeadId prop passed from Leads view or Survey view
  useEffect(() => {
    if (initialLeadId) {
      const linkedSurvey = surveys.find(s => s.leadId === initialLeadId || s.id === initialLeadId);
      const existing = quotations.find(q => q.leadId === initialLeadId || (linkedSurvey && q.surveyId === linkedSurvey.id));
      if (existing) {
        setSelectedQuoteForPreview(existing);
        setActiveViewMode('document');
      } else {
        setSelectedLeadId(initialLeadId);
        if (linkedSurvey && (linkedSurvey.status === 'Approved' || linkedSurvey.status === 'Completed')) {
          setCapacityKw(linkedSurvey.recommendedKw);
        } else {
          const l = leads.find(item => item.id === initialLeadId);
          if (l?.recommendedKw) {
            setCapacityKw(l.recommendedKw);
          }
        }
        setShowNewQuoteModal(true);
      }
    }
  }, [initialLeadId, surveys, quotations]);

  const getLinkedProject = (q: Quotation) => {
    return projects.find(p => p.id === q.convertedToProjectId || p.quotationId === q.id || p.leadId === q.leadId);
  };

  // Workflow Category Counts
  const pmDraftsCount = quotations.filter(q => q.status === 'Draft' && !!q.surveyId).length;
  const managerApprovalCount = quotations.filter(q => q.status === 'Draft' && (q.discountAmount || 0) > 15000 && q.approvalStatus === 'Pending_Approval').length;
  const sentCount = quotations.filter(q => q.status === 'Sent').length;
  const acceptedCount = quotations.filter(q => q.status === 'Customer_Accepted').length;
  const liveCount = quotations.filter(q => {
    if (q.status !== 'Converted_To_Project' && q.status !== 'Accepted') return false;
    const p = getLinkedProject(q);
    return p?.stage !== 'Completed';
  }).length;
  const completedCount = quotations.filter(q => {
    const p = getLinkedProject(q);
    return p?.stage === 'Completed';
  }).length;

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = 
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerPhone.includes(searchTerm);
    
    let matchesStatus = true;
    if (statusFilter === 'pm_drafts') {
      matchesStatus = q.status === 'Draft' && !!q.surveyId;
    } else if (statusFilter === 'manager_approval') {
      matchesStatus = q.status === 'Draft' && (q.discountAmount || 0) > 15000 && q.approvalStatus === 'Pending_Approval';
    } else if (statusFilter === 'Customer_Accepted') {
      matchesStatus = q.status === 'Customer_Accepted';
    } else if (statusFilter === 'Sent') {
      matchesStatus = q.status === 'Sent';
    } else if (statusFilter === 'live') {
      const p = getLinkedProject(q);
      matchesStatus = (q.status === 'Converted_To_Project' || q.status === 'Accepted') && p?.stage !== 'Completed';
    } else if (statusFilter === 'completed') {
      const p = getLinkedProject(q);
      matchesStatus = p?.stage === 'Completed';
    } else if (statusFilter !== 'All') {
      matchesStatus = q.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Sort actionable quotes (Customer_Accepted, Sent, Draft) to the top
    const getPriority = (status: string) => {
      if (status === 'Customer_Accepted') return 1;
      if (status === 'Sent') return 2;
      if (status === 'Draft') return 3;
      return 4;
    };
    const pA = getPriority(a.status);
    const pB = getPriority(b.status);
    if (pA !== pB) return pA - pB;
    return (b.id || '').localeCompare(a.id || '');
  });

  // KPI Calculations
  const totalProposalValue = quotations.reduce((sum, q) => sum + q.totalAmount, 0);
  const totalKw = quotations.reduce((sum, q) => sum + q.systemCapacityKw, 0);
  const avgKw = quotations.length > 0 ? (totalKw / quotations.length).toFixed(1) : '0';
  const totalSubsidiesClaimed = quotations.reduce((sum, q) => {
    const v = q.versions[0];
    return sum + (v?.subsidyDeduction || 0);
  }, 0);
  const wonQuotes = quotations.filter(q => q.status === 'Accepted' || q.status === 'Converted_To_Project' || q.status === 'Customer_Accepted').length;
  const winRate = quotations.length > 0 ? Math.round((wonQuotes / quotations.length) * 100) : 0;

  // Authoritative calculations for modal using shared Quotation Engine
  const targetLead = leads.find(l => l.id === selectedLeadId);
  const linkedSurvey = surveys.find(s => s.leadId === selectedLeadId);
  const isSurveyApproved = linkedSurvey?.status === 'Approved' || linkedSurvey?.status === 'Completed';

  const modalCalc = calculateQuotation({
    leadId: selectedLeadId,
    leadName: targetLead?.name,
    customerPhone: targetLead?.phone,
    customerAddress: targetLead?.address || targetLead?.city,
    systemCapacityKw: capacityKw,
    packageTier: packageTier,
    discountAmount: discountAmount,
    surveyId: linkedSurvey?.id,
    isSurveyApproved,
  });

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLead) return;

    const newQ = createQuotation({
      leadId: targetLead.id,
      leadName: targetLead.name,
      customerPhone: targetLead.phone,
      customerAddress: targetLead.address || targetLead.city,
      systemCapacityKw: capacityKw,
      packageTier: packageTier,
      discountAmount: discountAmount,
      surveyId: linkedSurvey?.id,
    });

    setShowNewQuoteModal(false);
    setSelectedQuoteForPreview(newQ);
    setSelectedVersionIdx(0);
    setActiveViewMode('document');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    if (!selectedQuoteForPreview) return;
    const q = selectedQuoteForPreview;
    const v = q.versions[0];
    const text = `AB ENERGY SOLUTIONS - SOLAR PROPOSAL
----------------------------------------
Quote Ref: ${q.quotationNumber}
Client: ${q.leadName} (${q.customerPhone})
Capacity: ${q.systemCapacityKw} kW On-Grid Solar Plant
Modules: Tier-1 550W Half-Cut Bifacial ALMM
Inverter: Sungrow / Growatt Dual-MPPT Cloud Unit
Gross Plant Cost: INR ${v?.subtotal.toLocaleString('en-IN')}
PM Surya Ghar Subsidy: - INR ${v?.subsidyDeduction.toLocaleString('en-IN')}
Net Customer Investment: INR ${q.totalAmount.toLocaleString('en-IN')} (incl. 13.8% GST)
Estimated 25-Year Savings: INR ${Math.round(q.systemCapacityKw * 1450 * 8.2 * 25).toLocaleString('en-IN')}
----------------------------------------
AB Energy Solutions | support@abenergy.in | Bengaluru`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!selectedQuoteForPreview) return;
    const q = selectedQuoteForPreview;
    const cleanPhone = q.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = encodeURIComponent(`Hello ${q.leadName}, here is your official solar quotation ${q.quotationNumber} from AB Energy Solutions. System Size: ${q.systemCapacityKw} kW. Net Investment after PM Surya Ghar subsidy is Rs. ${q.totalAmount.toLocaleString('en-IN')}. Please review the attached specification.`);
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Print Specific CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #FFFFFF !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-solar-proposal, #printable-solar-proposal * {
            visibility: visible;
          }
          #printable-solar-proposal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
          }
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            border: 1px solid #CBD5E1 !important;
            border-radius: 0 !important;
            margin-bottom: 0 !important;
            min-height: 275mm;
            padding: 24px !important;
            background: #FFFFFF !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* VIEW MODE 1: FULL-PAGE EXECUTIVE DOCUMENT PREVIEW */}
      {activeViewMode === 'document' && selectedQuoteForPreview && (
        <div className="space-y-4">
          {/* Document Top Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs no-print">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveViewMode('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Proposals</span>
              </button>

              <div className="h-4 w-px bg-slate-200" />

              <span className="font-mono font-bold text-slate-900 text-xs">
                {selectedQuoteForPreview.quotationNumber}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-medium">{selectedQuoteForPreview.leadName} ({selectedQuoteForPreview.systemCapacityKw} kW)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print PDF</span>
              </button>

              <a
                href={getQuotationPdfUrl(selectedQuoteForPreview.id, true)}
                download={`AB_Energy_Proposal_${selectedQuoteForPreview.quotationNumber || selectedQuoteForPreview.id}.pdf`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 font-semibold text-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Download Authentic Official PDF directly"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download PDF</span>
              </a>

              <a
                href={getQuotationPdfUrl(selectedQuoteForPreview.id, false)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Open PDF viewer in new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Open in Tab</span>
              </a>

              {/* EDIT BOM & PRICING (Sales Executive / Sales Manager / Admin) */}
              {selectedQuoteForPreview.status !== 'Converted_To_Project' && selectedQuoteForPreview.status !== 'Accepted' && (currentUser?.role === 'Sales Executive' || currentUser?.role === 'Sales Manager' || currentUser?.role === 'Super Admin') && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-50 font-semibold text-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Manually edit BOM line items, quantities, and prices"
                >
                  <Pencil className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit BOM &amp; Pricing</span>
                </button>
              )}

              {/* APPROVE DISCOUNT (Sales Manager / Super Admin) */}
              {selectedQuoteForPreview.approvalStatus === 'Pending_Approval' && (currentUser?.role === 'Sales Manager' || currentUser?.role === 'Super Admin') && (
                <button
                  onClick={async () => {
                    const ok = await approveQuotationDiscount(selectedQuoteForPreview.id);
                    if (ok) {
                      setSelectedQuoteForPreview({ ...selectedQuoteForPreview, approvalStatus: 'Approved' });
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Approve Discount</span>
                </button>
              )}

              {/* SEND TO CLIENT (Sales Executive / Sales Manager / Super Admin) */}
              {selectedQuoteForPreview.status === 'Draft' && selectedQuoteForPreview.approvalStatus !== 'Pending_Approval' && (
                <button
                  onClick={() => {
                    sendQuotation(selectedQuoteForPreview.id);
                    setSelectedQuoteForPreview({ ...selectedQuoteForPreview, status: 'Sent' });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Proposal to Client</span>
                </button>
              )}

              {/* RECORD CUSTOMER ACCEPTANCE (Sales Executive / Sales Manager / Super Admin) */}
              {selectedQuoteForPreview.status === 'Sent' && (currentUser?.role === 'Sales Executive' || currentUser?.role === 'Sales Manager' || currentUser?.role === 'Super Admin') && (
                <button
                  onClick={() => {
                    setAcceptanceNotes('');
                    setClientPoNumber('');
                    setShowAcceptanceModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Record Customer Acceptance</span>
                </button>
              )}

              {/* WORKFLOW STEP 2: PROCUREMENT IN PROGRESS IN PURCHASE TEAM PANEL */}
              {selectedQuoteForPreview.status === 'Customer_Accepted' && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold rounded-lg shadow-xs">
                  <Truck className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Customer Accepted • Procurement In Progress (Purchase Team) • Site Delivery &amp; Customer Signature Required</span>
                </div>
              )}

              {/* ALREADY CONVERTED BADGE */}
              {(selectedQuoteForPreview.status === 'Converted_To_Project' || selectedQuoteForPreview.status === 'Accepted') && (() => {
                const p = getLinkedProject(selectedQuoteForPreview);
                if (p?.stage === 'Completed') {
                  return (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>EPC Project Completed ✓</span>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-100 text-teal-900 border border-teal-300 text-xs font-bold rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                    <span>EPC Project Live: {p?.stage || 'In Progress'}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Toggle between 4-Page Corporate Proposal and Statutory GST Audit Breakdown */}
          <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl max-w-lg mx-auto border border-slate-200 shadow-2xs mb-2 no-print">
            <button
              onClick={() => setProposalDocTab('proposal')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                proposalDocTab === 'proposal'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <FileText className="w-4 h-4 text-black" />
              <span>Official 4-Page Proposal (Client View)</span>
            </button>
            <button
              onClick={() => setProposalDocTab('tax_audit')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                proposalDocTab === 'tax_audit'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Statutory GST Audit (Internal Breakdown)</span>
            </button>
          </div>

          {/* TAB 1: AUTHENTIC 6-PAGE AB ENERGY PROPOSAL DOCUMENT */}
          {proposalDocTab === 'proposal' && (
            <div id="printable-solar-proposal" className="space-y-6 max-w-4xl mx-auto">
              
              {/* PAGE 1: COVER PAGE */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-5 print-page-break">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <img
                    src={getApiUrl('/logo.png')}
                    alt="AB Energy Solutions"
                    className="h-12 w-auto object-contain"
                  />
                  <div className="text-right">
                    <span className="font-mono font-black text-black text-xs block">
                      GST: 33FSQPA3244H1ZU
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">Turnkey Solar EPC &bull; Electrical Infrastructure &bull; O&amp;M</span>
                  </div>
                </div>

                <div className="text-center pt-1">
                  <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                    Quotation for {selectedQuoteForPreview.systemCapacityKw} kW Grid-Connected Rooftop Solar Power System
                  </h1>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    Turnkey Engineering, Procurement, Installation &amp; Commissioning Proposal
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1">
                  <span>Quotation No.: <span className="font-mono text-black font-black">{selectedQuoteForPreview.quotationNumber}</span></span>
                  <span className="text-slate-500 font-normal">Package Tier: <strong>{activeVer?.packageTier || 'Premium Tier-1'}</strong></span>
                  <span>Date: <span className="text-black font-black">{new Date(selectedQuoteForPreview.createdAt).toLocaleDateString('en-GB')}</span></span>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                  <img
                    src={getApiUrl('/solar-roof-cover.jpg')}
                    alt="Solar Rooftop Plant"
                    className="w-full h-64 sm:h-72 object-cover"
                  />
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <h3 className="font-black text-black text-xs uppercase tracking-wider mb-2">Customer Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800">
                    <div><span className="font-bold text-black">Client Name:</span> {selectedQuoteForPreview.leadName}</div>
                    <div><span className="font-bold text-black">Contact Phone:</span> {selectedQuoteForPreview.customerPhone || 'N/A'}</div>
                    <div><span className="font-bold text-black">Service Number:</span> 045310081264 / {selectedQuoteForPreview.systemCapacityKw}KWp</div>
                    <div><span className="font-bold text-black">Site Address:</span> {selectedQuoteForPreview.customerAddress || 'West Rajapalayam, P.N palayam, TN'}</div>
                    <div><span className="font-bold text-black">Quoted Capacity:</span> {selectedQuoteForPreview.systemCapacityKw} kW On-Grid</div>
                    <div><span className="font-bold text-black">Proposal Type:</span> Grid-Tied Rooftop EPC</div>
                  </div>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Plant Capacity</span>
                    <span className="text-sm font-black text-emerald-700 font-mono">{selectedQuoteForPreview.systemCapacityKw} kW On-Grid</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Estimated Annual Yield</span>
                    <span className="text-sm font-black text-emerald-700 font-mono">~{Math.round(selectedQuoteForPreview.systemCapacityKw * 1500).toLocaleString('en-IN')} Units</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Module Performance</span>
                    <span className="text-sm font-black text-emerald-700">25-30 Years Tier-1</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100">
                  Page 1 of 6 &bull; AB Energy Solutions Techno-Commercial Proposal
                </div>
              </div>

              {/* PAGE 2: CORPORATE PROFILE & LETTER */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-6 text-xs text-slate-700 leading-relaxed print-page-break">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <img src={getApiUrl('/logo.png')} alt="AB" className="h-7 w-auto" />
                    <div>
                      <span className="font-black text-black text-xs block">AB ENERGY SOLUTIONS</span>
                      <span className="text-[9px] text-slate-500">Corporate Profile &amp; Letter</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-500">
                    Quote: <strong className="text-emerald-700">{selectedQuoteForPreview.quotationNumber}</strong> &bull; GST: 33FSQPA3244H1ZU
                  </div>
                </div>

                <div>
                  <h2 className="font-black text-black text-sm mb-3">
                    Subject: Proposal for Supply, Installation, Testing &amp; Commissioning of {selectedQuoteForPreview.systemCapacityKw} kW Grid-Connected Rooftop Solar Power System
                  </h2>
                  <p className="mb-2 font-medium">Dear Sir,</p>
                  <p className="mb-2">
                    Thank you for giving us the opportunity to submit our quotation for your {selectedQuoteForPreview.systemCapacityKw} kW Solar Rooftop Project. We are pleased to offer our professional turnkey services as detailed below.
                  </p>
                  <p>
                    The quotation includes the complete supply, installation, testing, and commissioning of a Grid-Connected Solar Rooftop System.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-black text-black mb-3 tracking-tight uppercase">
                    ABOUT AB ENERGY SOLUTION
                  </h3>
                  <div className="space-y-3 text-slate-700 leading-relaxed">
                    <p>
                      AB Energy Solution is a trusted Solar EPC &amp; Electrical Engineering Company specializing in Project Management Consultancy (PMC), Owner's Engineer Services, Solar EPC, Installation, Testing &amp; Commissioning (I&amp;C), HT/LT Electrical Works, and Solar Material Supply.
                    </p>
                    <p>
                      With <strong>12+ years of industry experience</strong>, we have successfully completed <strong>50+ Solar &amp; Electrical Projects</strong> across Residential, Commercial, Industrial, and Agricultural sectors. Our team includes <strong>TNEB C Licence Certified Engineers</strong> and experienced professionals dedicated to delivering projects with the highest standards of <strong>Quality, Safety, and On-Time Delivery</strong>.
                    </p>
                    <p>
                      We provide complete end-to-end solar solutions, from Site Survey, Design, Engineering, Procurement, Installation, Testing &amp; Commissioning to Net Metering, CEIG Documentation, and Annual Maintenance (O&amp;M).
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-black text-black text-xs uppercase tracking-wider">
                    Quality &amp; Compliance Assurance
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    All engineering designs, structural fabrications, module installations, and electrical grid synchronizations are performed strictly complying with MNRE standards, CEA technical regulations, DISCOM grid codes, and TANGEDCO net-metering protocols.
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100">
                  Page 2 of 6 &bull; AB Energy Solutions Techno-Commercial Proposal
                </div>
              </div>

              {/* PAGE 3: SERVICES, ADVANTAGES & VISION */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-6 text-xs text-slate-700 leading-relaxed print-page-break">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <img src={getApiUrl('/logo.png')} alt="AB" className="h-7 w-auto" />
                    <div>
                      <span className="font-black text-black text-xs block">AB ENERGY SOLUTIONS</span>
                      <span className="text-[9px] text-slate-500">Services &amp; Why Choose Us</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-500">
                    Quote: <strong className="text-emerald-700">{selectedQuoteForPreview.quotationNumber}</strong> &bull; GST: 33FSQPA3244H1ZU
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-black mb-3 tracking-tight uppercase">
                    OUR SERVICES
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 font-medium">
                    <div>&bull; Solar Rooftop EPC Projects</div>
                    <div>&bull; HT &amp; LT Electrical Works</div>
                    <div>&bull; Ground Mounted Solar Power Plants</div>
                    <div>&bull; Transmission Line &amp; Pole Yard Works</div>
                    <div>&bull; Project Management Consultancy (PMC)</div>
                    <div>&bull; Net Metering &amp; CEIG Approval Support</div>
                    <div>&bull; Owner's Engineer Services</div>
                    <div>&bull; Comprehensive Operation &amp; Maintenance (O&amp;M)</div>
                    <div>&bull; Installation, Testing &amp; Commissioning (I&amp;C)</div>
                    <div>&bull; Solar Material Supply</div>
                    <div>&bull; Solar Water Pump Systems</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-black text-black mb-3 tracking-tight uppercase">
                    WHY CHOOSE AB ENERGY SOLUTION?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-medium">
                    {[
                      '12+ Years of Industry Experience',
                      'Professional Project Management',
                      '50+ Successfully Completed Projects',
                      'On-Time Project Delivery',
                      'TNEB C Licence Certified Engineers',
                      'Transparent Communication',
                      'Quality Workmanship & Safety Standards',
                      'Reliable After-Sales Support'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-emerald-600 font-black text-sm">✔</span>
                        <span className="font-semibold text-slate-900">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div>
                    <span className="font-black text-black text-xs uppercase block">Our Commitment</span>
                    <span className="text-slate-700 text-xs font-semibold">Quality &bull; Safety &bull; Innovation &bull; Integrity &bull; Customer Satisfaction</span>
                  </div>
                  <div>
                    <span className="font-black text-black text-xs uppercase block">Our Vision</span>
                    <span className="text-slate-600 text-[11px] italic">
                      "To deliver sustainable, reliable, and high-quality solar energy solutions that create long-term value for our customers and contribute to a greener future."
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100">
                  Page 3 of 6 &bull; AB Energy Solutions Techno-Commercial Proposal
                </div>
              </div>

              {/* PAGE 4: SCOPE OF WORK & DYNAMIC BILL OF MATERIALS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-5 text-xs text-slate-700 leading-relaxed print-page-break">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <img src={getApiUrl('/logo.png')} alt="AB" className="h-7 w-auto" />
                    <div>
                      <span className="font-black text-black text-xs block">AB ENERGY SOLUTIONS</span>
                      <span className="text-[9px] text-slate-500">Technical Scope &amp; BOM</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-500">
                    Quote: <strong className="text-emerald-700">{selectedQuoteForPreview.quotationNumber}</strong> &bull; GST: 33FSQPA3244H1ZU
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-black mb-2 tracking-tight uppercase">
                    Scope of Work
                  </h3>
                  <p className="text-slate-600 mb-2">We will execute the complete following turnkey EPC activities:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1 text-slate-900 font-medium">
                    <div>&bull; Site Survey</div>
                    <div>&bull; Complete Installation</div>
                    <div>&bull; Engineering Support</div>
                    <div>&bull; Testing &amp; Commissioning</div>
                    <div>&bull; Supply of Material</div>
                    <div>&bull; Service Support</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-black tracking-tight uppercase">
                      Bill Of Materials
                    </h3>
                    <span className="text-[10px] text-black font-black bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
                      Populated dynamically from Database BOM ({((selectedQuoteForPreview.versions[selectedVersionIdx] || selectedQuoteForPreview.versions[0])?.items || []).length} Line Items)
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-2xs">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-900 text-white font-black text-[10px] uppercase border-b border-slate-300">
                        <tr>
                          <th className="py-2 px-3 text-center w-12">S.NO</th>
                          <th className="py-2 px-3 w-40">MATERIALS</th>
                          <th className="py-2 px-3">SPECIFICATION</th>
                          <th className="py-2 px-3 w-36">MAKE</th>
                          <th className="py-2 px-3 text-center w-16">UNITS</th>
                          <th className="py-2 px-3 text-center w-16">QUANTITY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        {(() => {
                          const actVer = selectedQuoteForPreview.versions[selectedVersionIdx] || selectedQuoteForPreview.versions[0];
                          const bItems = (actVer?.items || []) as any[];

                          if (bItems.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="py-4 text-center text-slate-400">
                                  No BOM items found.
                                </td>
                              </tr>
                            );
                          }

                          return bItems.map((item, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="py-2 px-3 text-center font-mono text-slate-500 font-bold">{idx + 1}</td>
                              <td className="py-2 px-3 font-bold text-slate-900">{item.category || item.description}</td>
                              <td className="py-2 px-3 text-slate-700 font-mono text-[11px]">
                                {item.specification || item.description || item.makeModel}
                              </td>
                              <td className="py-2 px-3 text-slate-800 font-semibold">{item.make || item.makeModel?.split(' ')[0] || 'Reputed'}</td>
                              <td className="py-2 px-3 text-center text-slate-600">{item.unit || 'Nos'}</td>
                              <td className="py-2 px-3 text-center font-mono font-black text-black">{item.quantity}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] font-bold">
                    Note: As this project is proposed under the Government Subsidy Scheme, all supplied solar modules must comply with the Domestic Content Requirement (DCR) guidelines.
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100">
                  Page 4 of 6 &bull; AB Energy Solutions Techno-Commercial Proposal
                </div>
              </div>

              {/* PAGE 5: CLIENT SCOPE, FEATURES & WARRANTY, SYSTEM CAPACITY & PRICING */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-5 text-xs text-slate-700 leading-relaxed print-page-break">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <img src={getApiUrl('/logo.png')} alt="AB" className="h-7 w-auto" />
                    <div>
                      <span className="font-black text-black text-xs block">AB ENERGY SOLUTIONS</span>
                      <span className="text-[9px] text-slate-500">Client Scope &amp; Commercial Pricing</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-500">
                    Quote: <strong className="text-emerald-700">{selectedQuoteForPreview.quotationNumber}</strong> &bull; GST: 33FSQPA3244H1ZU
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-black mb-2 tracking-tight uppercase">
                    Client Scope
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-800">
                    <div>➢ Provide a shadow-free installation area.</div>
                    <div>➢ Minor civil works, if required.</div>
                    <div>➢ Statutory charges for the Bi-Directional Net Meter.</div>
                    <div>➢ Non-statutory charges related to Net Metering.</div>
                    <div>➢ Additional charges for elevated structures (if applicable).</div>
                    <div>➢ SIM card for the Wi-Fi monitoring dongle / APFC.</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-sm font-black text-black mb-2 tracking-tight uppercase">
                    Features and Warranty
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-800">
                    <div>- Tier-1 High-Efficiency Solar Modules</div>
                    <div>- Workmanship Warranty: 1 Year</div>
                    <div>- Inverter Warranty: Up to 8 Years</div>
                    <div>- Estimated Energy Generation: ~{Math.round(selectedQuoteForPreview.systemCapacityKw * 5)} kWh/day</div>
                    <div>- Solar Module Product Warranty: 12 Years</div>
                    <div>- Non DCR / DCR Solar Panels as applicable</div>
                    <div>- Solar Module Performance Warranty: Up to 30 Years</div>
                    <div>- Compliant with MNRE and DISCOM Standards</div>
                  </div>
                </div>

                {/* System Capacity & Pricing Box */}
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-sm font-black text-black mb-2 tracking-tight uppercase">
                    System Capacity &amp; Pricing
                  </h3>
                  <div className="overflow-x-auto border border-slate-300 rounded-xl">
                    <table className="w-full text-center text-xs">
                      <thead className="bg-slate-900 text-white font-black border-b border-slate-300">
                        <tr>
                          <th className="py-2.5 px-4 w-1/3">System Capacity</th>
                          <th className="py-2.5 px-4 w-1/3">Domestic Price<br /><span className="text-[10px] font-normal text-slate-300">(Including GST)</span></th>
                          <th className="py-2.5 px-4 w-1/3">{selectedQuoteForPreview.subsidyEligible ? 'Govt Subsidy / Net Cost' : 'Estimated ROI'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="divide-x divide-slate-200">
                          <td className="py-3 px-4 font-bold text-black">
                            {selectedQuoteForPreview.systemCapacityKw}KW On-grid Solar System
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-black text-base">
                            ₹{selectedQuoteForPreview.totalAmount.toLocaleString('en-IN')}/-
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {selectedQuoteForPreview.subsidyEligible && (selectedQuoteForPreview.subsidyAmount > 0) ? (
                              <div>
                                <span className="text-emerald-700 font-black block">Subsidy: ₹{Math.round(selectedQuoteForPreview.subsidyAmount).toLocaleString('en-IN')}</span>
                                <span className="text-slate-900 text-xs block">Net Cost: ₹{Math.round(selectedQuoteForPreview.indicativeNetCustomerCost || (selectedQuoteForPreview.totalAmount - selectedQuoteForPreview.subsidyAmount)).toLocaleString('en-IN')}/-</span>
                              </div>
                            ) : (
                              <span>3.5 - 4.0 Years</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-sm font-black text-black mb-1.5 tracking-tight uppercase">
                    Payment Terms
                  </h3>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-bold text-black text-xs">
                    <div>&bull; 90% Advance Payment with Purchase Order / Agreement</div>
                    <div>&bull; 10% After Successful Commissioning &amp; Grid Synchronization</div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100">
                  Page 5 of 6 &bull; AB Energy Solutions Techno-Commercial Proposal
                </div>
              </div>

              {/* PAGE 6: TERMS & CONDITIONS, CONTACT CARD & SIGNATORY */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-5 text-xs text-slate-700 leading-relaxed print-page-break">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <img src={getApiUrl('/logo.png')} alt="AB" className="h-7 w-auto" />
                    <div>
                      <span className="font-black text-black text-xs block">AB ENERGY SOLUTIONS</span>
                      <span className="text-[9px] text-slate-500">Commercial Terms &amp; Authorization</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-500">
                    Quote: <strong className="text-emerald-700">{selectedQuoteForPreview.quotationNumber}</strong> &bull; GST: 33FSQPA3244H1ZU
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-black mb-2 tracking-tight uppercase">
                    Terms &amp; Conditions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700 text-[11px]">
                    <div>&bull; Quotation Validity: 7 Days from issue date.</div>
                    <div>&bull; GST is included in the above price.</div>
                    <div>&bull; Additional civil work will be charged extra 800/kW.</div>
                    <div>&bull; Net Meter approval is subject to TANGEDCO / DISCOM regulations.</div>
                    <div>&bull; Delivery is subject to material readiness and site access.</div>
                    <div>&bull; Any additional work outside the quoted scope will be charged extra.</div>
                    <div>&bull; Elevated above 4 Feet mounting structures extra 2500/kW.</div>
                    <div>&bull; Force majeure conditions and grid outages are excluded.</div>
                  </div>
                </div>

                {/* Valued Opportunity Thank You Note */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-900 font-bold text-xs">
                  Thank you for your valuable opportunity. We look forward to delivering a reliable solar solution and building a long-term partnership with you.
                </div>

                {/* Contact Details & Visiting Card */}
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-sm font-black text-black mb-2 tracking-tight uppercase">
                    Contact Details
                  </h3>
                  <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-base font-black tracking-tight text-white">A Boopathi BE.,</div>
                      <div className="text-xs font-bold text-emerald-400">CEO &amp; Managing Director &bull; AB ENERGY SOLUTIONS</div>
                      <div className="text-xs text-slate-300 font-mono pt-0.5">
                        Phone: <strong className="text-white">+91 95664 99678</strong> | Email: abenergysolutiontn@gmail.com
                      </div>
                      <div className="text-xs text-slate-300">
                        1/359, Maruthi Nagar, Chinnakavandanur, Namakkal, TN - 636202
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold pt-0.5">
                        12+ Years Solar Experience &bull; TNEB C-Licence Certified Enterprise
                      </div>
                    </div>

                    <div className="bg-white text-black p-3 rounded-xl border border-slate-200 text-center shrink-0 w-48">
                      <div className="text-[10px] font-black uppercase text-black">For AB Energy Solutions</div>
                      <div className="h-10 border-b border-dashed border-slate-300 my-1" />
                      <div className="text-[10px] text-slate-500 font-semibold">Authorized Signatory</div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100">
                  Page 6 of 6 &bull; AB Energy Solutions Techno-Commercial Proposal
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DETAILED STATUTORY GST BREAKDOWN (INTERNAL AUDIT VIEW) */}
          {proposalDocTab === 'tax_audit' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-5xl mx-auto space-y-6 text-xs text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Statutory Item-Wise GST &amp; Material Cost Breakdown
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Internal calculation table: <strong>5% GST</strong> applied on Solar Modules and Inverters, and <strong>18% GST</strong> applied on Balance of System, Structures, and Cabling.
                  </p>
                </div>
                <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold font-mono">
                  Quotation: {selectedQuoteForPreview.quotationNumber}
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="w-full text-left text-[11px] border-collapse min-w-[760px]">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[9px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 text-center w-8">Sl.</th>
                      <th className="p-2.5 w-16">HSN/SAC</th>
                      <th className="p-2.5">Material Description</th>
                      <th className="p-2.5 text-center w-16">Qty</th>
                      <th className="p-2.5 text-right w-20">Unit Rate (₹)</th>
                      <th className="p-2.5 text-right w-24">Taxable Base (₹)</th>
                      <th className="p-2.5 text-center w-14">GST %</th>
                      <th className="p-2.5 text-right w-20">CGST (₹)</th>
                      <th className="p-2.5 text-right w-20">SGST (₹)</th>
                      <th className="p-2.5 text-right w-24 font-bold">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(() => {
                      const activeVer = selectedQuoteForPreview.versions[selectedVersionIdx] || selectedQuoteForPreview.versions[0];
                      const items = (activeVer?.items || []) as any[];

                      return items.map((item, idx) => {
                        const hsn = item.hsnSacCode || (item.gstRate === 5 ? '8541' : '8544');
                        const rate = item.gstRate !== undefined ? item.gstRate : 18;
                        const unitPrice = item.unitPrice !== undefined ? item.unitPrice : Math.round(item.totalPrice / (item.quantity || 1));
                        const taxable = item.taxableAmount !== undefined ? item.taxableAmount : Math.round(item.quantity * unitPrice);
                        const cgst = item.cgstAmount !== undefined ? item.cgstAmount : Math.round(taxable * (rate / 200));
                        const sgst = item.sgstAmount !== undefined ? item.sgstAmount : Math.round(taxable * (rate / 200));
                        const lineTotal = item.totalPrice !== undefined ? item.totalPrice : (taxable + cgst + sgst);

                        return (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="p-2.5 text-center font-mono text-slate-500 font-bold">{idx + 1}</td>
                            <td className="p-2.5 font-mono text-[10px] text-slate-600 font-semibold">{hsn}</td>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{item.description}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {item.specification || item.makeModel}
                              </div>
                            </td>
                            <td className="p-2.5 text-center font-medium font-mono">{item.quantity} {item.unit}</td>
                            <td className="p-2.5 text-right font-mono text-slate-700">₹{unitPrice.toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-right font-mono font-semibold text-slate-900">₹{taxable.toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rate === 5 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'}`}>
                                {rate}%
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-700">₹{cgst.toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-right font-mono text-slate-700">₹{sgst.toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">₹{lineTotal.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Tax Audit Financial Summary */}
              {(() => {
                const activeVer = selectedQuoteForPreview.versions[selectedVersionIdx] || selectedQuoteForPreview.versions[0];
                const subtotal = activeVer?.subtotal || selectedQuoteForPreview.subtotal || 0;
                const items = (activeVer?.items || []) as any[];
                const totalCgst = items.reduce((s, i) => s + (i.cgstAmount || 0), 0) || Math.round(subtotal * 0.069);
                const totalSgst = items.reduce((s, i) => s + (i.sgstAmount || 0), 0) || Math.round(subtotal * 0.069);
                const totalGst = totalCgst + totalSgst;
                const contractTotal = selectedQuoteForPreview.totalAmount || (subtotal + totalGst);
                const advance90 = Math.round(contractTotal * 0.90);
                const balance10 = contractTotal - advance90;

                return (
                  <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-slate-200">
                    <div className="space-y-2 text-xs">
                      <div className="font-bold text-slate-800">Verified Payment Milestones:</div>
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                        <div className="flex justify-between font-bold text-emerald-900">
                          <span>90% Advance Mobilization:</span>
                          <span className="font-mono">₹{advance90.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-[11px]">
                          <span>10% on Commissioning &amp; Net-Metering:</span>
                          <span className="font-mono">₹{balance10.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-80 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Taxable Base Value:</span>
                        <span className="font-mono font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Central GST (CGST):</span>
                        <span className="font-mono font-semibold text-slate-900">₹{totalCgst.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>State GST (SGST):</span>
                        <span className="font-mono font-semibold text-slate-900">₹{totalSgst.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-700 font-bold border-t border-slate-200 pt-1">
                        <span>Total GST Amount:</span>
                        <span className="font-mono text-slate-900">₹{totalGst.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between bg-slate-900 text-white p-3 rounded-xl font-bold text-sm">
                        <span>FINAL PAYABLE AMOUNT:</span>
                        <span className="font-mono text-emerald-400">₹{contractTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: FULL-WIDTH HIGH-DENSITY PROFESSIONAL DATA GRID */}
      {activeViewMode === 'grid' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Solar Proposals &amp; Quotations
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Formal EPC estimates, statutory 13.8% composite GST, and PM Surya Ghar central subsidies.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Generated via Approved BOM &amp; PM Handover</span>
            </div>
          </div>

          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Active Proposals Value
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                ₹{(totalProposalValue / 100000).toFixed(1)} Lakhs
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 block">
                {quotations.length} Active System Quotes
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Average System Capacity
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {avgKw} kW
              </div>
              <span className="text-[11px] font-semibold text-slate-500 block">
                Total Capacity: {totalKw} kW
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                PM Surya Ghar Subsidies
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                ₹{(totalSubsidiesClaimed / 100000).toFixed(1)} Lakhs
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 block">
                Central Subsidies Processed
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Proposal Win Rate
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {winRate}%
              </div>
              <span className="text-[11px] font-semibold text-slate-500 block">
                {wonQuotes} Won Projects Converted
              </span>
            </div>
          </div>

          {/* Interactive Workflow Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'All'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Proposals ({quotations.length})
            </button>

            <button
              onClick={() => setStatusFilter('pm_drafts')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'pm_drafts'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-purple-800 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Drafts from PM ({pmDraftsCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('manager_approval')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'manager_approval'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Needs Manager Approval ({managerApprovalCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('Sent')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'Sent'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-800 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Sent to Client ({sentCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('Customer_Accepted')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'Customer_Accepted'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Client Accepted ({acceptedCount})</span>
              {acceptedCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  statusFilter === 'Customer_Accepted' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800 animate-pulse'
                }`}>
                  Ready for PM
                </span>
              )}
            </button>

            <button
              onClick={() => setStatusFilter('live')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'live'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-teal-800 hover:bg-teal-50 border border-teal-200'
              }`}
            >
              <span>Project Live ({liveCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Project Completed ({completedCount})</span>
            </button>
          </div>

          {/* Full-Width High-Density Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Header Filter Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search quote reference, client name, phone..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-800">{filteredQuotations.length}</span> of {quotations.length} proposals
              </div>
            </div>

            {/* High-Density Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Quote Number</th>
                    <th className="py-3 px-4">Customer &amp; Location</th>
                    <th className="py-3 px-4">Capacity</th>
                    <th className="py-3 px-4">Inverter / Modules</th>
                    <th className="py-3 px-4 text-right">Gross Amount</th>
                    <th className="py-3 px-4 text-right">Central Subsidy</th>
                    <th className="py-3 px-4 text-right">Net Investment</th>
                    <th className="py-3 px-4 text-center">Lifecycle &amp; Stage</th>
                    <th className="py-3 px-4 text-right">Sales Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No quotations match your current search or status filter.
                      </td>
                    </tr>
                  ) : (
                    filteredQuotations.map(q => {
                      const v = q.versions[0];
                      const panelItem = v?.items?.find((i: any) => i.category === 'Panels');
                      const inverterItem = v?.items?.find((i: any) => i.category === 'Inverter');
                      const specSummary = `${inverterItem?.makeModel?.split(' ')[0] || 'Sungrow'} / ${panelItem?.makeModel?.split(' ')[0] || 'Waaree 550W'}`;

                      return (
                        <tr 
                          key={q.id}
                          onClick={() => {
                            setSelectedQuoteForPreview(q);
                            setActiveViewMode('document');
                          }}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                            q.status === 'Customer_Accepted' ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-emerald-700">
                            <div className="flex items-center gap-1.5">
                              {q.status === 'Customer_Accepted' && (
                                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping shrink-0" />
                              )}
                              <span>{q.quotationNumber}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{q.leadName}</div>
                            <div className="text-[11px] text-slate-400">{q.customerAddress || 'Bengaluru, KA'} • {q.customerPhone}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 font-mono">{q.systemCapacityKw} kW</span>
                            {q.surveyId && (
                              <div className="text-[10px] text-blue-600 font-medium">Survey: {q.surveyId}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            {specSummary}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                            ₹{(v?.subtotal || q.totalAmount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                            ₹{(v?.subsidyDeduction || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            ₹{q.totalAmount.toLocaleString('en-IN')}
                          </td>

                          {/* Explicit Lifecycle Stage Badge */}
                          <td className="py-3.5 px-4 text-center">
                            {q.status === 'Customer_Accepted' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                                <Truck className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                <span>Accepted • Sourcing Materials</span>
                              </span>
                            ) : q.status === 'Converted_To_Project' || q.status === 'Accepted' ? (
                              (() => {
                                const p = getLinkedProject(q);
                                if (p?.stage === 'Completed') {
                                  return (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                      <span>Project Completed</span>
                                    </span>
                                  );
                                }
                                return (
                                  <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-300">
                                    {p?.stage ? `EPC: ${p.stage}` : 'Project Live in EPC'}
                                  </span>
                                );
                              })()
                            ) : q.status === 'Sent' ? (
                              <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-300">
                                Sent to Client
                              </span>
                            ) : q.approvalStatus === 'Pending_Approval' || ((q.discountAmount || 0) > 15000 && !q.discountApprovedBy) ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                Needs Manager Sign-off
                              </span>
                            ) : q.surveyId ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-300">
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                PM Technical Draft
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                Sales Draft
                              </span>
                            )}
                          </td>

                          {/* Quick Inline Actions */}
                          <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* If Sent: Quick button to record client acceptance directly from list */}
                              {q.status === 'Sent' && (
                                <button
                                  onClick={() => {
                                    setSelectedQuoteForPreview(q);
                                    setShowAcceptanceModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Mark Client Accepted"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Client Accepted</span>
                                </button>
                              )}

                              {/* If Draft: Quick button to send or edit */}
                              {q.status === 'Draft' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedQuoteForPreview(q);
                                      setShowEditModal(true);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                                    title="Edit BOM & Pricing"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  {q.approvalStatus !== 'Pending_Approval' && (
                                    <button
                                      onClick={async () => {
                                        await sendQuotation(q.id);
                                      }}
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Send to Client"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>Send</span>
                                    </button>
                                  )}
                                </>
                              )}

                              {/* If Customer Accepted: Show indicator that deal is in procurement */}
                              {q.status === 'Customer_Accepted' && (
                                <span className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1">
                                  <Truck className="w-3 h-3 text-emerald-600" />
                                  <span>In Procurement</span>
                                </span>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedQuoteForPreview(q);
                                  setActiveViewMode('document');
                                }}
                                className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                View Doc
                              </button>

                              <a
                                href={getQuotationPdfUrl(q.id, true)}
                                download={`AB_Energy_Proposal_${q.quotationNumber || q.id}.pdf`}
                                className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Download Official PDF directly"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-600" />
                              </a>

                              <a
                                href={getQuotationPdfUrl(q.id, false)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Open PDF in new tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Record Count */}
            <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
              <span>Showing {filteredQuotations.length} of {quotations.length} quotations</span>
              <div className="flex items-center gap-1 font-semibold text-slate-600">
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate New Quotation Modal */}
      {showNewQuoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Generate Solar Proposal</h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated technical sizing &amp; PM Surya Ghar central subsidy</p>
              </div>
              <button
                onClick={() => setShowNewQuoteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Lead / Client *</label>
                <select
                  value={selectedLeadId}
                  onChange={e => {
                    const newLeadId = e.target.value;
                    setSelectedLeadId(newLeadId);
                    const survey = surveys.find(s => s.leadId === newLeadId);
                    if (survey && (survey.status === 'Approved' || survey.status === 'Completed')) {
                      setCapacityKw(survey.recommendedKw);
                    } else {
                      const l = leads.find(item => item.id === newLeadId);
                      if (l?.recommendedKw) setCapacityKw(l.recommendedKw);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} - {l.recommendedKw} kW ({l.city} - {l.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Survey Integration Status */}
              {(() => {
                const linkedSurvey = surveys.find(s => s.leadId === selectedLeadId);
                if (!linkedSurvey) {
                  return (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center justify-between">
                      <span>No engineering site survey recorded for this customer yet.</span>
                      <span className="font-semibold text-amber-700">Preliminary Inquiry Sizing</span>
                    </div>
                  );
                }
                if (linkedSurvey.status === 'Approved' || linkedSurvey.status === 'Completed') {
                  return (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-emerald-900">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Approved Engineering Survey Linked: {linkedSurvey.id}</span>
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-mono text-[10px]">
                          {linkedSurvey.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-800 font-medium">
                        Verified Capacity: <strong>{linkedSurvey.recommendedKw} kW</strong> ({linkedSurvey.panelQuantity} Panels) • Shadow-Free: <strong>{linkedSurvey.shadowFreeAreaSqFt} sq.ft</strong> ({linkedSurvey.roofType}) • Inverter: <strong>{linkedSurvey.inverterRecommendation || '15kW 3-Phase String Inverter'}</strong> • Mounting: <strong>{linkedSurvey.mountingStructureType || 'Standard Elevated'}</strong>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Site Survey {linkedSurvey.id} is {linkedSurvey.status}</span>
                      </span>
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-mono text-[10px]">
                        Pending Review
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-800">
                      Final engineering quotation is pending review. Current proposal values are based on customer preliminary estimates.
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Capacity (kW) *</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={0.5}
                    value={capacityKw}
                    onChange={e => setCapacityKw(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Package Tier</label>
                  <select
                    value={packageTier}
                    onChange={e => setPackageTier(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Premium Bifacial">Premium Bifacial 550W</option>
                    <option value="Standard">Standard Monocrystalline</option>
                    <option value="Commercial Heavy Duty">Commercial Heavy Duty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Commercial Discount (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={discountAmount}
                  onChange={e => setDiscountAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              {/* Dynamic Engineering & Financial Summary in Modal (Authoritative Item-Wise GST Engine) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-700 text-xs">
                <div className="flex justify-between items-center font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span>Authoritative Solar Metrics</span>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-bold">
                      {modalCalc.taxType === 'IGST' ? 'Interstate (IGST)' : 'Intrastate (CGST+SGST)'}
                    </span>
                  </span>
                  <span className="font-mono text-emerald-700">{modalCalc.systemCapacityKw} kW System ({modalCalc.actualCapacityKwp} kWp)</span>
                </div>
                <div className="flex justify-between">
                  <span>Modules Required:</span>
                  <span className="font-mono font-semibold text-slate-900">{modalCalc.panelCount} × {modalCalc.moduleWattageW}W Tier-1 ALMM</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Turnkey Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-900">₹{modalCalc.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {modalCalc.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Commercial Discount:</span>
                    <span className="font-mono font-semibold">- ₹{modalCalc.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Taxable Base Value:</span>
                  <span className="font-mono font-semibold text-slate-900">₹{modalCalc.taxableAmount.toLocaleString('en-IN')}</span>
                </div>
                
                {/* Item-Wise Tax Breakdown display in modal */}
                <div className="py-1 px-2.5 bg-white border border-slate-200 rounded-lg space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>• PV Modules (5% GST):</span>
                    <span className="font-mono">₹{(modalCalc.items.find(i => i.category === 'Panels')?.taxAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>• Solar Inverter (5% GST):</span>
                    <span className="font-mono">₹{(modalCalc.items.find(i => i.category === 'Inverter')?.taxAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>• BOS, Structure &amp; Labour (18% GST):</span>
                    <span className="font-mono">
                      ₹{modalCalc.items.filter(i => i.category !== 'Panels' && i.category !== 'Inverter').reduce((s, i) => s + (i.taxAmount || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800 border-t border-slate-100 pt-0.5">
                    <span>Total GST Amount:</span>
                    <span className="font-mono">₹{modalCalc.gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900 text-xs">
                  <span>Final Contract Value:</span>
                  <span className="font-mono text-slate-900 font-extrabold text-sm">₹{modalCalc.finalContractAmount.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="text-[11px] text-emerald-800 font-medium italic">
                  In Words: {modalCalc.amountInWords}
                </div>

                {modalCalc.subsidyEligible && modalCalc.subsidyAmount > 0 && (
                  <div className="flex justify-between border-t border-dashed border-emerald-300 pt-1.5 font-bold text-emerald-800 text-xs">
                    <span>Indicative Net after PM Surya Ghar:</span>
                    <span className="font-mono text-emerald-700 font-extrabold text-sm">₹{modalCalc.indicativeNetCustomerCost.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Est. Annual Generation:</span>
                  <span className="font-mono">{modalCalc.annualGenerationKwh.toLocaleString('en-IN')} kWh/yr (~{modalCalc.simplePaybackYears} yr payback)</span>
                </div>
                {modalCalc.requiresApproval && (
                  <div className="p-2 bg-amber-50 border border-amber-300 rounded text-[11px] text-amber-800">
                    ⚠️ Discount exceeds ₹15,000 threshold and will require Sales Manager approval before sending.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewQuoteModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Generate &amp; Preview Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Quotation & Custom BOM Modal */}
      {showEditModal && selectedQuoteForPreview && (
        <EditQuotationModal
          quotation={selectedQuoteForPreview}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={async (payload) => {
            const ok = await editQuotationData(selectedQuoteForPreview.id, payload);
            if (ok) {
              const updated = quotations.find(q => q.id === selectedQuoteForPreview.id);
              if (updated) setSelectedQuoteForPreview(updated);
            }
            return ok;
          }}
        />
      )}

      {/* Record Customer Acceptance Modal */}
      {showAcceptanceModal && selectedQuoteForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Customer Acceptance</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm client signoff for Quote <span className="font-mono font-bold text-slate-800">{selectedQuoteForPreview.quotationNumber}</span> ({selectedQuoteForPreview.leadName})
                </p>
              </div>
              <button onClick={() => setShowAcceptanceModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
              <div className="flex justify-between font-bold">
                <span>Contract Amount:</span>
                <span>₹{selectedQuoteForPreview.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Recording acceptance locks this proposal as won and dispatches it directly to the Purchase Team panel for material indents, supplier POs, and site delivery.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer PO / Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={clientPoNumber}
                  onChange={e => setClientPoNumber(e.target.value)}
                  placeholder="e.g. PO-2026-8891 or WhatsApp Ref"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Acceptance Notes / Proof of Confirmation
                </label>
                <textarea
                  value={acceptanceNotes}
                  onChange={e => setAcceptanceNotes(e.target.value)}
                  placeholder="e.g. Client confirmed proposal on call; signed copy received via WhatsApp; advance payment promised via NEFT."
                  rows={3}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAcceptanceModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={recordingAcceptance}
                onClick={async () => {
                  setRecordingAcceptance(true);
                  try {
                    const ok = await recordCustomerAcceptance(selectedQuoteForPreview.id, acceptanceNotes, clientPoNumber);
                    if (ok) {
                      setSelectedQuoteForPreview({ ...selectedQuoteForPreview, status: 'Customer_Accepted' });
                      setShowAcceptanceModal(false);
                    }
                  } finally {
                    setRecordingAcceptance(false);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{recordingAcceptance ? 'Recording...' : 'Confirm Acceptance & Handover'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
