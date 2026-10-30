import React, { useState, useEffect } from 'react';
import { 
  Rocket, FolderKanban, CheckCircle2, AlertTriangle, FileText, 
  ExternalLink, ArrowRight, User, Phone, MapPin, Zap, 
  Layers, Clock, ShieldCheck, Download, CheckSquare, Eye,
  Send, Sparkles, X, ChevronRight, Check, Truck, CheckCheck
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { getApiUrl } from '../../utils/apiUrl';
import { Quotation } from '../../types';
import { NavItemKey } from '../layout/Sidebar';
import { QuotationProposalModal, getQuotationPdfUrl } from '../common/QuotationProposalModal';

interface ProjectManagerHandoverViewProps {
  onNavigateToTab: (tab: NavItemKey) => void;
  onNavigateToProject?: (projectId?: string) => void;
}

export const ProjectManagerHandoverView: React.FC<ProjectManagerHandoverViewProps> = ({
  onNavigateToTab,
  onNavigateToProject,
}) => {
  const { quotations, projects, acceptQuotation, surveys, currentUser, refreshData } = useCrm();

  // Group quotations by PM lifecycle
  const incomingAcceptedQuotes = quotations.filter(q => q.status === 'Customer_Accepted');
  const bomApprovedQuotes = quotations.filter(q => q.status === 'Draft' || q.status === 'Sent' || q.status === 'Under_Review');
  const convertedQuotes = quotations.filter(q => q.status === 'Converted_To_Project' || q.status === 'Accepted');

  const [activeSubTab, setActiveSubTab] = useState<'quotes' | 'incoming' | 'converted'>(() => {
    return bomApprovedQuotes.length > 0 ? 'quotes' : (incomingAcceptedQuotes.length > 0 ? 'incoming' : 'quotes');
  });

  const [selectedQuoteForKickoff, setSelectedQuoteForKickoff] = useState<Quotation | null>(null);
  const [selectedQuoteForBomView, setSelectedQuoteForBomView] = useState<Quotation | null>(null);
  const [selectedQuoteForProposalPreview, setSelectedQuoteForProposalPreview] = useState<Quotation | null>(null);
  const [kickoffLoading, setKickoffLoading] = useState(false);
  const [kickoffSuccessProject, setKickoffSuccessProject] = useState<any>(null);
  const [handoverToast, setHandoverToast] = useState<string | null>(null);
  const [indentsMap, setIndentsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const token = localStorage.getItem('ab_solar_token') || localStorage.getItem('ab_energy_auth_token') || '';
    fetch('/api/procurement/pending-indents', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.indents) {
          const map: Record<string, any> = {};
          data.indents.forEach((ind: any) => {
            if (ind.quotation_id) map[ind.quotation_id] = ind;
          });
          setIndentsMap(map);
        }
      })
      .catch(err => console.error('Error fetching indents in PM handover:', err));
  }, []);

  // PM KPIs
  const totalAgreedValue = incomingAcceptedQuotes.reduce((sum, q) => sum + q.totalAmount, 0);
  const totalCapacityToBuildKw = incomingAcceptedQuotes.reduce((sum, q) => sum + q.systemCapacityKw, 0);
  const totalDraftValue = bomApprovedQuotes.reduce((sum, q) => sum + q.totalAmount, 0);
  const activeProjectsCount = projects.filter(p => p.stage !== 'Completed').length;

  const handleExecuteProjectKickoff = async (quote: Quotation) => {
    try {
      setKickoffLoading(true);
      const result = await acceptQuotation(quote.id);
      setKickoffLoading(false);
      setSelectedQuoteForKickoff(null);
      if (result?.project) {
        setKickoffSuccessProject(result.project);
      }
      if (refreshData) {
        await refreshData();
      }
    } catch (err: any) {
      setKickoffLoading(false);
      alert(`Error converting project: ${err.message || 'Unknown error'}`);
    }
  };

  const handleHandoverToSales = (quote: Quotation) => {
    setHandoverToast(`Quotation ${quote.quotationNumber} successfully dispatched to Sales Workspace for client commercial negotiation.`);
    setTimeout(() => setHandoverToast(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {handoverToast && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-emerald-700 text-white rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold border border-emerald-600 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{handoverToast}</span>
          <button onClick={() => setHandoverToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PM Handover Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-800 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Project Manager &bull; Deal Handover &amp; Quotes</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              EPC Deal Handover &amp; Quotation Management
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Quotations generated immediately upon Project Manager BOM approval. Review engineering specifications, dispatch to Sales for commercial review, and onboard client-accepted deals into turnkey EPC execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToTab('projects')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FolderKanban className="w-4 h-4 text-emerald-400" />
              <span>Active EPC Projects ({projects.length})</span>
            </button>
          </div>
        </div>

        {/* PM Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div 
            onClick={() => setActiveSubTab('quotes')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              activeSubTab === 'quotes' 
                ? 'bg-emerald-50/80 border-emerald-500 shadow-xs' 
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Approved BOM Quotations</span>
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {bomApprovedQuotes.length} Proposals
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-1">
              Ready for Sales review &amp; negotiation
            </div>
          </div>

          <div 
            onClick={() => setActiveSubTab('incoming')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              activeSubTab === 'incoming' 
                ? 'bg-emerald-50/80 border-emerald-500 shadow-xs' 
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Awaiting EPC Kickoff</span>
              <Rocket className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {incomingAcceptedQuotes.length} Deals
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-1">
              Client-accepted &bull; Ready to onboard
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Handover Pipeline Value</span>
              <span className="text-slate-400 font-mono font-bold text-xs">INR</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ₹{((totalDraftValue + totalAgreedValue) / 100000).toFixed(1)} Lakhs
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              BOM-backed quotation volume
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Live EPC Sites</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {activeProjectsCount} Active
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              Rooftops currently under execution
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Modal when converted */}
      {kickoffSuccessProject && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <span className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </span>
            <div>
              <h4 className="font-black text-emerald-950 text-base">
                Project Successfully Onboarded into EPC Pipeline!
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Project <span className="font-mono font-bold">{kickoffSuccessProject.id}</span> created for <span className="font-bold">{kickoffSuccessProject.customerName}</span>. Material BOM reserved, 8 construction milestones initialized, and 90% advance mobilization milestone invoice raised.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setKickoffSuccessProject(null);
                if (onNavigateToProject) {
                  onNavigateToProject(kickoffSuccessProject.id);
                } else {
                  onNavigateToTab('projects');
                }
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>View Active Project</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setKickoffSuccessProject(null)}
              className="px-3 py-2.5 text-slate-600 hover:bg-slate-200/60 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* PM Lifecycle Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('quotes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'quotes'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>BOM Approved Quotations (PM &rarr; Sales)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeSubTab === 'quotes' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {bomApprovedQuotes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('incoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'incoming'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Incoming Client-Accepted Deals</span>
          {incomingAcceptedQuotes.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeSubTab === 'incoming' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800 animate-pulse'
            }`}>
              {incomingAcceptedQuotes.length} Ready
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('converted')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'converted'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed EPC Handovers ({convertedQuotes.length})</span>
        </button>
      </div>

      {/* TAB 1: BOM APPROVED QUOTATIONS (PM &rarr; SALES HANDOVER) */}
      {activeSubTab === 'quotes' && (
        <div className="space-y-4">
          {bomApprovedQuotes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">No BOM-Approved Quotations in Handover Queue</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Quotations are automatically generated the moment you approve a submitted Bill of Materials under <span className="font-semibold text-slate-800">"BOM Technical Approvals"</span>. Approved proposals appear here immediately with 14 BOM items and official AB Energy specs.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bomApprovedQuotes.map(q => {
                const linkedSurvey = surveys.find(s => s.id === q.surveyId || s.leadId === q.leadId);
                const advanceDue = Math.round(q.totalAmount * 0.90);
                const commissioningDue = q.totalAmount - advanceDue;
                const v = q.versions?.[0];
                const lineItemsCount = v?.items?.length || 14;

                return (
                  <div 
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 p-6 shadow-xs hover:shadow-md transition-all space-y-5"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                            {q.quotationNumber}
                          </span>
                          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>BOM Approved by PM</span>
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            q.status === 'Sent'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {q.status === 'Sent' ? 'Handed Over & Sent to Client' : 'Technical Draft &bull; Ready for Sales'}
                          </span>
                          {linkedSurvey && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded">
                              Survey: {linkedSurvey.id}
                            </span>
                          )}
                        </div>

                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <span>{q.leadName}</span>
                          <span className="text-xs font-normal text-slate-400">({q.customerPhone})</span>
                        </h2>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{q.customerAddress || 'Tamil Nadu, India'}</span>
                        </p>
                      </div>

                      {/* Action Buttons for PM */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedQuoteForProposalPreview(q)}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-700" />
                          <span>View Quotation Details</span>
                        </button>

                        <button
                          onClick={() => setSelectedQuoteForBomView(q)}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-slate-600" />
                          <span>View {lineItemsCount} BOM Items</span>
                        </button>

                        <a
                          href={getQuotationPdfUrl(q.id, true)}
                          download={`AB_Energy_Proposal_${q.quotationNumber || q.id}.pdf`}
                          className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-emerald-200"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Official PDF</span>
                        </a>

                        <button
                          onClick={() => handleHandoverToSales(q)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-white" />
                          <span>Handover to Sales Workspace</span>
                        </button>
                      </div>
                    </div>

                    {/* Engineering & Commercial Specifications Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Approved System Size
                        </span>
                        <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                          {q.systemCapacityKw} kW On-Grid
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Tier: {q.packageTier || 'Commercial EPC'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Contract Value (Gross)
                        </span>
                        <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                          ₹{q.totalAmount.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Incl. 13.8% Composite GST
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          90% Advance Milestone
                        </span>
                        <div className="text-lg font-black text-emerald-800 font-mono mt-0.5">
                          ₹{advanceDue.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Initial Contract Deposit (90%)
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          10% On Commissioning
                        </span>
                        <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                          ₹{commissioningDue.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Final Handover &amp; CEIG
                        </span>
                      </div>
                    </div>

                    {/* Technical Survey Details banner if linked */}
                    {linkedSurvey && (
                      <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold">Verified Roof Audit ({linkedSurvey.id}):</span>
                          <span>{linkedSurvey.roofType || 'RCC Flat'} Roof &bull; Shadow-Free: {linkedSurvey.shadowFreeAreaSqFt || linkedSurvey.roofAreaSqFt || 800} sq.ft &bull; Grid: {linkedSurvey.gridPhase || '3-Phase'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[11px]">Assigned Sales:</span>
                          <span className="font-bold text-slate-800 text-[11px]">{q.salespersonName || 'Vikram Mehta (Sales)'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INCOMING CLIENT-ACCEPTED DEALS (PRIMARY PM KICKOFF QUEUE) */}
      {activeSubTab === 'incoming' && (
        <div className="space-y-4">
          {incomingAcceptedQuotes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">All Handover Deals Have Been Onboarded</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No client-accepted quotations are waiting for PM project conversion. As soon as Sales marks a proposal as accepted by client in the Negotiation Hub, it appears here instantly for EPC kickoff.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {incomingAcceptedQuotes.map(q => {
                const linkedSurvey = surveys.find(s => s.id === q.surveyId || s.leadId === q.leadId);
                const advanceDue = Math.round(q.totalAmount * 0.90);
                const commissioningDue = q.totalAmount - advanceDue;

                return (
                  <div 
                    key={q.id}
                    className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 shadow-sm hover:shadow-md transition-all space-y-5"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                            {q.quotationNumber}
                          </span>
                          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                            Client Accepted &bull; Ready for EPC Kickoff
                          </span>
                          {linkedSurvey && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded">
                              Survey: {linkedSurvey.id}
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <span>{q.leadName}</span>
                          <span className="text-xs text-slate-400 font-normal">({q.customerPhone})</span>
                        </h2>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{q.customerAddress || 'Site Location Confirmed'}</span>
                        </p>
                      </div>

                      {/* Prominent Action Button for PM */}
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setSelectedQuoteForProposalPreview(q)}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-700" />
                          <span>View Quotation Details</span>
                        </button>

                        <a
                          href={getQuotationPdfUrl(q.id, true)}
                          download={`AB_Energy_Proposal_${q.quotationNumber || q.id}.pdf`}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Official PDF</span>
                        </a>

                        {indentsMap[q.id]?.has_signed_grn ? (
                          <button
                            onClick={() => setSelectedQuoteForKickoff(q)}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer animate-pulse"
                          >
                            <CheckCheck className="w-4 h-4 text-emerald-200" />
                            <span>Materials Signed ✓ • Convert to EPC Project &rarr;</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-300 text-amber-900 font-bold rounded-xl text-xs shadow-xs">
                            <Truck className="w-4 h-4 text-amber-600 animate-pulse" />
                            <span>Step 2: Procurement In Progress (Purchase Team) • Site Delivery &amp; Customer Signature Required</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Engineering & Commercial Specifications Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Agreed System Capacity
                        </span>
                        <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                          {q.systemCapacityKw} kW On-Grid
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Tier: {q.packageTier || 'Commercial EPC'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Final Agreed Contract
                        </span>
                        <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                          ₹{q.totalAmount.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Incl. 13.8% Composite GST
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          90% Advance Milestone
                        </span>
                        <div className="text-lg font-black text-emerald-800 font-mono mt-0.5">
                          ₹{advanceDue.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Initial Contract Deposit (90%)
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          10% On Commissioning
                        </span>
                        <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                          ₹{commissioningDue.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Net-metering &amp; Handover
                        </span>
                      </div>
                    </div>

                    {/* Technical Survey Details if linked */}
                    {linkedSurvey && (
                      <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold">Verified Roof Audit ({linkedSurvey.id}):</span>
                          <span>{linkedSurvey.roofType || 'RCC Flat'} Roof &bull; Feasible Area: {linkedSurvey.shadowFreeAreaSqFt || linkedSurvey.roofAreaSqFt || 800} sq.ft &bull; Phase: {linkedSurvey.gridPhase || '3-Phase'}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold uppercase">
                          Technical Feasibility Approved
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETED EPC HANDOVERS */}
      {activeSubTab === 'converted' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm">Converted EPC Projects (Active Turnkey Execution)</h3>
            <p className="text-xs text-slate-500">All deals that have been transitioned from Quotation to active EPC Execution.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {convertedQuotes.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No converted projects found.
              </div>
            ) : (
              convertedQuotes.map(q => (
                <div key={q.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">{q.quotationNumber}</span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="font-bold text-slate-800 text-xs">{q.leadName}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {q.systemCapacityKw} kW &bull; ₹{q.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateToTab('projects')}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Open in Projects</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: VIEW 14 APPROVED BOM ITEMS */}
      {selectedQuoteForBomView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Layers className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    BOM Line Items &bull; {selectedQuoteForBomView.quotationNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Approved technical specifications for {selectedQuoteForBomView.leadName} ({selectedQuoteForBomView.systemCapacityKw} kW On-Grid)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuoteForBomView(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-xs text-slate-600 min-w-[550px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Description &amp; Technical Specs</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(selectedQuoteForBomView.versions?.[0]?.items || []).map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{item.category}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{item.description}</div>
                        {item.makeModel && (
                          <div className="text-[11px] text-slate-500 font-mono">{item.makeModel}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-slate-500">{item.unit || 'Nos'}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">₹{(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500">
                Payment Terms: <span className="font-bold text-emerald-800">90% Advance</span>, 10% on Commissioning. GST: 13.8% Composite.
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getQuotationPdfUrl(selectedQuoteForBomView.id, true)}
                  download={`AB_Energy_Proposal_${selectedQuoteForBomView.quotationNumber || selectedQuoteForBomView.id}.pdf`}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Official PDF</span>
                </a>
                <button
                  onClick={() => setSelectedQuoteForBomView(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL BEFORE PROJECT CONVERSION */}
      {selectedQuoteForKickoff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <span className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                <Rocket className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Confirm EPC Project Kickoff
                </h3>
                <p className="text-xs text-slate-500">
                  Authorize conversion of quotation into a live turnkey solar EPC plant.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Customer Name:</span>
                <span className="font-bold text-slate-900">{selectedQuoteForKickoff.leadName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Quote Reference:</span>
                <span className="font-mono font-bold text-slate-900">{selectedQuoteForKickoff.quotationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">System Capacity:</span>
                <span className="font-bold text-emerald-700">{selectedQuoteForKickoff.systemCapacityKw} kW On-Grid</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Contract Value:</span>
                <span className="font-mono font-bold text-slate-900">₹{selectedQuoteForKickoff.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-700 font-bold">Unpaid Advance Due (90%):</span>
                <span className="font-mono font-black text-emerald-800">
                  ₹{Math.round(selectedQuoteForKickoff.totalAmount * 0.90).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Automatic EPC System Actions:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-800">
                <li>Reserves {Math.ceil((selectedQuoteForKickoff.systemCapacityKw * 1000) / 550)} Tier-1 550W bifacial panels in stock.</li>
                <li>Generates 90% initial mobilization invoice (Unpaid, awaiting customer deposit).</li>
                <li>Initializes DISCOM Net-Metering liaison checklist &amp; rooftop mounting tasks.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedQuoteForKickoff(null)}
                disabled={kickoffLoading}
                className="px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteProjectKickoff(selectedQuoteForKickoff)}
                disabled={kickoffLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {kickoffLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Onboarding EPC Project...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 text-emerald-200" />
                    <span>Authorize &amp; Kick Off Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE PROPOSAL PREVIEW MODAL FOR PROJECT MANAGER */}
      <QuotationProposalModal
        quotation={selectedQuoteForProposalPreview}
        isOpen={Boolean(selectedQuoteForProposalPreview)}
        onClose={() => setSelectedQuoteForProposalPreview(null)}
        onHandoverToSales={handleHandoverToSales}
        onConvertProject={(q) => setSelectedQuoteForKickoff(q)}
        currentUserRole={currentUser?.role}
      />
    </div>
  );
};
