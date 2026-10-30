import React, { useState, useEffect } from 'react';
import { 
  Layers, CheckCircle2, Clock, AlertTriangle, 
  Search, Filter, ArrowRight, ShieldCheck, 
  X, Check, RotateCcw, FileText, User, 
  Phone, MapPin, Zap, RefreshCw, MessageSquare
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { BomItem } from '../../types';
import { getApiUrl } from '../../utils/apiUrl';

interface ProjectManagerBomViewProps {
  onNavigateToProjects?: () => void;
  onNavigateToHandover?: () => void;
}

export const ProjectManagerBomView: React.FC<ProjectManagerBomViewProps> = ({
  onNavigateToProjects,
  onNavigateToHandover,
}) => {
  const { currentUser, projects, refreshData } = useCrm();

  const [boms, setBoms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Verification Modal State
  const [selectedBom, setSelectedBom] = useState<any | null>(null);
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [approvedNotice, setApprovedNotice] = useState<{ bomId: string; customerName: string; quoteNumber: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const authFetch = (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('ab_solar_token');
    return fetch(getApiUrl(url), {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
  };

  const fetchBoms = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/boms/all');
      const data = await res.json();
      if (data.success && data.boms) {
        setBoms(data.boms);
      }
    } catch (err: any) {
      console.error('Failed to fetch BOMs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoms();
  }, []);

  // Open verification modal
  const handleOpenVerify = async (bom: any) => {
    setSelectedBom(bom);
    setReviewComments(bom.revisionComments || '');
    setIsLoadingItems(true);

    try {
      const res = await authFetch(`/api/boms?surveyId=${bom.surveyId || ''}&projectId=${bom.projectId || ''}`);
      const data = await res.json();
      if (data.success && data.bom && data.bom.items) {
        setBomItems(data.bom.items);
      } else {
        setBomItems([]);
      }
    } catch (err) {
      setBomItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Submit PM Decision (Approve or Request Changes)
  const handleDecision = async (action: 'Approve' | 'Request Changes') => {
    if (!selectedBom) return;
    setIsSubmittingDecision(true);

    try {
      const res = await authFetch(`/api/boms/${selectedBom.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          comments: reviewComments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'Approve') {
          if (refreshData) {
            try { await refreshData(); } catch (e) { /* ignore */ }
          }
          setApprovedNotice({
            bomId: selectedBom.id,
            customerName: selectedBom.customerName,
            quoteNumber: data.quotation?.quotationNumber || 'New Quote',
          });
        }
        showToast(
          action === 'Approve'
            ? 'BOM approved & locked! Quotation generated for Deal Handover & Sales.'
            : 'Changes requested. Sent back to Survey Engineer with your comments.',
          'success'
        );
        setSelectedBom(null);
        fetchBoms();
      } else {
        showToast(data.error || 'Failed to submit decision', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const filteredBoms = boms.filter(b => {
    // Exclude already completed projects
    const isProjectCompleted = projects.some(p =>
      (p.stage === 'Completed' || (p as any).status === 'Completed') && (
        (b.projectId && p.id === b.projectId) ||
        (b.leadId && p.leadId === b.leadId) ||
        (b.customerName && p.customerName.toLowerCase() === b.customerName.toLowerCase())
      )
    );
    if (isProjectCompleted) return false;

    const matchesSearch = 
      (b.customerName && b.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.id && b.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.preparedByName && b.preparedByName.toLowerCase().includes(searchQuery.toLowerCase()));
    // Project Manager only reviews BOMs that have been formally submitted (Submitted, Approved, or Changes Requested)
    // Draft BOMs remain strictly private to the Survey Engineer
    const isSubmittedForPm = b.status === 'Submitted' || b.status === 'Approved' || b.status === 'Changes Requested';
    if (!isSubmittedForPm) return false;

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingReviewCount = boms.filter(b => b.status === 'Submitted').length;
  const approvedCount = boms.filter(b => b.status === 'Approved').length;

  return (
    <div className="space-y-6">
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

      {/* Success notification banner with quick navigation to Deal Handover & Quotes */}
      {approvedNotice && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <h4 className="font-extrabold text-emerald-950 text-sm">
                BOM {approvedNotice.bomId} Approved &bull; Quotation {approvedNotice.quoteNumber} Generated!
              </h4>
              <p className="text-xs text-emerald-800">
                Commercial proposal generated with approved BOM line items for {approvedNotice.customerName}. Available now in Deal Handover &amp; Quotes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToHandover && (
              <button
                onClick={onNavigateToHandover}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Open Deal Handover &amp; Quotes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setApprovedNotice(null)}
              className="px-2.5 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Project Manager — BOM Technical Verification &amp; Indents
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full">
              Engineering Feasibility Desk
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Verify technical specifications, make/brand compliance, and material quantities submitted by Survey Engineers. Approving locks the BOM and initiates procurement for the Purchase Team.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{pendingReviewCount} Awaiting Technical Approval</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{approvedCount} Locked &amp; Approved</span>
          </div>
          <button
            onClick={fetchBoms}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, BOM ID or engineer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="all">All Verification Statuses</option>
            <option value="Submitted">Pending Review (Submitted)</option>
            <option value="Approved">Approved &amp; Locked</option>
            <option value="Changes Requested">Changes Requested</option>
            <option value="Draft">Draft (With Engineer)</option>
          </select>
        </div>
      </div>

      {/* BOM Verification Queue Cards / Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredBoms.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Layers className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">No Bill of Materials matching criteria</h3>
            <p className="text-xs text-slate-400">When Survey Engineers finish site audits and submit their equipment BOMs, they will appear here for your technical approval.</p>
          </div>
        ) : (
          <>
            {/* Mobile BOM Cards (< lg) */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredBoms.map(bom => (
                <div key={bom.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{bom.customerName}</span>
                        {(bom.isEdited || (bom.version && bom.version > 1)) && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                            v{bom.version || 2}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{bom.id} &bull; {bom.phone}</div>
                    </div>
                    <span className="font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs shrink-0">
                      {bom.capacityKw || 5} kWp
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Roof &amp; Structure</span>
                      <span className="font-medium text-slate-700 text-[11px] truncate max-w-[180px]">{bom.roofType || 'RCC Flat Terrace'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Survey Engineer</span>
                      <span className="font-semibold text-slate-800 text-[11px]">{bom.preparedByName || 'Survey Engineer'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        bom.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        bom.status === 'Submitted' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        bom.status === 'Changes Requested' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                        'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {bom.status === 'Submitted' ? 'Needs PM Approval' : bom.status}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenVerify(bom)}
                    className={`w-full py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                      bom.status === 'Submitted'
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{bom.status === 'Submitted' ? 'Verify & Approve' : 'View Approved Materials'}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">BOM ID &amp; Customer</th>
                    <th className="p-3.5">System Capacity</th>
                    <th className="p-3.5">Roof &amp; Structure</th>
                    <th className="p-3.5">Survey Engineer</th>
                    <th className="p-3.5">Items Count</th>
                    <th className="p-3.5">Verification Status</th>
                    <th className="p-3.5 text-right">Technical Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBoms.map(bom => (
                    <tr key={bom.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{bom.customerName}</span>
                          {(bom.isEdited || (bom.version && bom.version > 1)) && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                              Edited v{bom.version || 2}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{bom.id} • {bom.phone}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-xs">
                          {bom.capacityKw || 5} kWp
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        {bom.roofType || 'RCC Flat Terrace'}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        <span className="font-semibold block">{bom.preparedByName || 'Survey Engineer'}</span>
                        <span className="text-[10px] text-slate-400">{new Date(bom.updatedAt).toLocaleDateString('en-IN')}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{bom.itemsCount || 7} line items</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          bom.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          bom.status === 'Submitted' ? 'bg-blue-50 text-blue-800 border border-blue-200 animate-pulse' :
                          bom.status === 'Changes Requested' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                          'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {bom.status === 'Submitted' ? 'Needs PM Approval' : bom.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenVerify(bom)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                            bom.status === 'Submitted'
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{bom.status === 'Submitted' ? 'Verify & Approve' : 'View Approved Materials'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Technical Verification Drawer / Modal */}
      {selectedBom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">
                    Technical Verification: {selectedBom.customerName}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedBom.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    selectedBom.status === 'Submitted' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedBom.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  BOM ID: <span className="font-mono font-bold text-slate-700">{selectedBom.id}</span> • System Capacity: <span className="font-mono font-bold text-emerald-700">{selectedBom.capacityKw || 5} kWp</span> • Engineer: <span className="font-semibold text-slate-700">{selectedBom.preparedByName}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedBom(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Engineering Technical Table - NO PRICING DETAILS SHOWN (As Required) */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between">
                <span className="font-semibold text-slate-700">
                  Engineering Scope: Verify that electrical capacity, cable gauge, structure thickness &amp; inverter specs match DISCOM grid norms.
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Technical Specifications View
                </span>
              </div>

              {isLoadingItems ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  <span>Loading Bill of Materials items...</span>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3 text-center w-12">S.NO</th>
                        <th className="p-3">MATERIALS</th>
                        <th className="p-3">SPECIFICATION</th>
                        <th className="p-3">MAKE</th>
                        <th className="p-3 text-center">UNITS</th>
                        <th className="p-3 text-center">QUANTITY</th>
                        <th className="p-3">REMARKS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {bomItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-900">{item.category || item.itemName}</td>
                          <td className="p-3 text-slate-700">{item.technicalSpecification || 'Standard industrial compliance'}</td>
                          <td className="p-3 font-semibold text-slate-800">{item.brandMake || 'Reputed'}</td>
                          <td className="p-3 text-center font-bold font-mono text-slate-700">{item.unit || 'Nos'}</td>
                          <td className="p-3 text-center">
                            <span className="font-bold font-mono text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 text-[11px]">{item.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Review Comments & Decision Form */}
              {selectedBom.status === 'Approved' ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Approved &amp; verified by <strong>{selectedBom.approvedByName || 'Project Manager'}</strong>. Specifications locked.</span>
                  </div>
                  {selectedBom.revisionComments && (
                    <span className="text-[11px] text-emerald-700 italic">Note: {selectedBom.revisionComments}</span>
                  )}
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Project Manager Technical Notes / Feedback:
                  </label>
                  <textarea
                    rows={2}
                    value={reviewComments}
                    onChange={e => setReviewComments(e.target.value)}
                    placeholder="Enter technical comments or reasons if requesting changes from survey engineer..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-400">
                {selectedBom.status === 'Approved'
                  ? 'This BOM is approved and active for quotation and project execution.'
                  : 'Approving this BOM locks the specifications and authorizes commercial quotation generation.'}
              </span>
              <div className="flex items-center gap-2.5">
                {selectedBom.status === 'Submitted' ? (
                  <>
                    <button
                      type="button"
                      disabled={isSubmittingDecision}
                      onClick={() => handleDecision('Request Changes')}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Request Changes</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingDecision}
                      onClick={() => handleDecision('Approve')}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSubmittingDecision ? 'Processing...' : 'Approve & Lock BOM'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedBom(null)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                  >
                    Close
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
