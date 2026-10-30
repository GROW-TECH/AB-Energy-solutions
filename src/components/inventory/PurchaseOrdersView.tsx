import React, { useState, useEffect, useRef } from 'react';
import { useCrm } from '../../context/CrmContext';
import { 
  ShoppingCart, Plus, Search, Filter, Calendar, Truck, 
  CheckCircle2, Clock, FileText, AlertCircle, X, Download, Eye, Warehouse, 
  ClipboardList, CheckCheck, PackageCheck, AlertTriangle, ArrowRight,
  ShieldCheck, User, Phone, MapPin, Sparkles, RefreshCw, Eraser,
  Copy, ExternalLink, Link as LinkIcon, Send, Share2, Ban, Trash2
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiUrl';

export const PurchaseOrdersView: React.FC = () => {
  const { suppliers: contextSuppliers } = useCrm();

  const [activeTab, setActiveTab] = useState<'orders' | 'indents' | 'grns'>('indents');
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [pendingIndents, setPendingIndents] = useState<any[]>([]);
  const [grnsList, setGrnsList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>(contextSuppliers || []);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [grnStatusFilter, setGrnStatusFilter] = useState('all');
  const [showNewPoModal, setShowNewPoModal] = useState(false);
  const [viewingPo, setViewingPo] = useState<any | null>(null);

  // GRN Modal State
  const [grnTargetPo, setGrnTargetPo] = useState<any | null>(null);
  const [signingMode, setSigningMode] = useState<'remote' | 'in_person'>('remote');
  const [copiedGrnId, setCopiedGrnId] = useState<string | null>(null);
  const [deliveryChallanNo, setDeliveryChallanNo] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [grnWarehouse, setGrnWarehouse] = useState('Central Warehouse');
  const [grnItems, setGrnItems] = useState<any[]>([]);
  const [grnNotes, setGrnNotes] = useState('');
  const [isSubmittingGrn, setIsSubmittingGrn] = useState(false);
  const [grnSuccessResult, setGrnSuccessResult] = useState<any | null>(null);

  // Customer Signature in GRN Modal
  const [customerSigName, setCustomerSigName] = useState('');
  const [customerSigPhone, setCustomerSigPhone] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // New PO Form state
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
  const [selectedQuotationNumber, setSelectedQuotationNumber] = useState<string>('');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedBomId, setSelectedBomId] = useState<string>('');
  const [supplierId, setSupplierId] = useState(suppliersList[0]?.id || '');
  const [supplierName, setSupplierName] = useState(suppliersList[0]?.name || 'Waaree Solar Tech');
  const [deliveryWarehouse, setDeliveryWarehouse] = useState('Central Warehouse');
  const [expectedDate, setExpectedDate] = useState(new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]);
  const [poNotes, setPoNotes] = useState('');
  const [poFormItems, setPoFormItems] = useState<any[]>([
    { sku: 'MOD-550', name: '550W Mono PERC Bifacial Solar Modules', category: 'Solar PV Modules', quantity: 20, unit: 'Nos', unitPrice: 8500 }
  ]);
  const [isCreatingPo, setIsCreatingPo] = useState(false);
  const [isPoModalReadOnly, setIsPoModalReadOnly] = useState(false);
  const [selectedIndentCompleted, setSelectedIndentCompleted] = useState(false);

  // EPC Project Conversion State
  const [convertingIndentId, setConvertingIndentId] = useState<string | null>(null);
  const [conversionSuccess, setConversionSuccess] = useState<any | null>(null);

  const token = localStorage.getItem('ab_solar_token') || localStorage.getItem('ab_energy_auth_token') || '';
  const authFetch = (url: string, opts: any = {}) => {
    const fullUrl = url.startsWith('http') ? url : getApiUrl(url);
    const headers = { 
      ...(opts.headers || {}), 
      Authorization: `Bearer ${token}` 
    };
    return fetch(fullUrl, { ...opts, headers });
  };

  const safeJson = async (res: Response | null) => {
    if (!res || !res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    try {
      return await res.json();
    } catch (_) {
      return null;
    }
  };

  const fetchOrdersAndIndents = async () => {
    setIsLoading(true);
    try {
      const [poRes, indRes, grnRes] = await Promise.all([
        authFetch('/api/procurement/orders').catch(() => null),
        authFetch('/api/procurement/pending-indents').catch(() => null),
        authFetch('/api/procurement/grns').catch(() => null)
      ]);

      const poData = await safeJson(poRes);
      if (poData && poData.success && poData.purchaseOrders) {
        setPurchaseOrders(poData.purchaseOrders);
      }

      const indData = await safeJson(indRes);
      if (indData && indData.success && indData.indents) {
        setPendingIndents(indData.indents);
      }

      const grnData = await safeJson(grnRes);
      if (grnData && grnData.success && grnData.grns) {
        setGrnsList(grnData.grns);
      }
    } catch (err) {
      console.warn('Procurement API unavailable, using offline fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedGrnId(id);
    setTimeout(() => setCopiedGrnId(null), 2500);
  };

  const handleShareWhatsApp = (phone: string, customerName: string, grnNumber: string, url: string) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : (cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone);
    const message = encodeURIComponent(
      `Hello ${customerName || 'Valued Customer'}, greetings from AB Energy Solutions! Please review and electronically sign your Solar Material Delivery Receipt (${grnNumber}) by clicking this secure link: ${url}`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

  const handleResendLink = async (grnId: string) => {
    try {
      const res = await authFetch(`/api/procurement/grn/${grnId}/resend-link`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Signing link has been refreshed and validity extended by 7 days.');
        fetchOrdersAndIndents();
      } else {
        alert(data.error || 'Failed to refresh signing link');
      }
    } catch (err: any) {
      alert(err.message || 'Error refreshing link');
    }
  };

  const handleRevokeLink = async (grnId: string, grnNumber: string) => {
    if (!window.confirm(`Are you sure you want to revoke the customer signing link for GRN ${grnNumber}? The customer will no longer be able to sign using that link.`)) {
      return;
    }
    try {
      const res = await authFetch(`/api/procurement/grn/${grnId}/revoke-link`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Signing link for GRN ${grnNumber} has been revoked.`);
        fetchOrdersAndIndents();
      } else {
        alert(data.error || 'Failed to revoke link');
      }
    } catch (err: any) {
      alert(err.message || 'Error revoking link');
    }
  };

  const handleDeletePurchaseOrder = async (poId: string, poNum: string) => {
    if (!window.confirm(`Are you sure you want to delete Purchase Order ${poNum}? This will remove the PO and associated items.`)) {
      return;
    }
    try {
      const res = await authFetch(`/api/procurement/orders/${poId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPurchaseOrders(prev => prev.filter(p => p.id !== poId));
      } else {
        alert(data.error || 'Failed to delete purchase order');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting purchase order');
    }
  };

  const handleDeleteIndent = async (indentId: string, quoteNum: string) => {
    if (!window.confirm(`Are you sure you want to remove/archive this procurement indent (${quoteNum})?`)) {
      return;
    }
    try {
      const res = await authFetch(`/api/procurement/indents/${indentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPendingIndents(prev => prev.filter(i => i.indent_id !== indentId && i.quotation_id !== indentId));
      } else {
        alert(data.error || 'Failed to remove indent');
      }
    } catch (err: any) {
      alert(err.message || 'Error removing indent');
    }
  };

  const handleClearClosedIndents = async () => {
    if (!window.confirm('Are you sure you want to clear all closed and completed procurement indents from this view?')) {
      return;
    }
    try {
      const res = await authFetch('/api/procurement/indents-closed/all', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPendingIndents(prev => prev.filter(i => !i.is_completed && i.project_stage !== 'Completed'));
      } else {
        alert(data.error || 'Failed to clear closed indents');
      }
    } catch (err: any) {
      alert(err.message || 'Error clearing closed indents');
    }
  };

  useEffect(() => {
    fetchOrdersAndIndents();
  }, []);

  // Filter Purchase Orders
  const filteredPos = purchaseOrders.filter(po => {
    const pNum = po.poNumber || po.po_number || '';
    const sName = po.supplierName || po.supplier_name || '';
    const gNum = po.grnNumber || po.grn_number || '';
    const cName = po.customer_name || '';
    const matchesSearch = pNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gNum.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPoValue = filteredPos.reduce((sum, p) => sum + (Number(p.grandTotal || p.grand_total) || 0), 0);
  const receivedCount = filteredPos.filter(p => p.status === 'Delivered' || p.status === 'Received').length;
  const inTransitCount = filteredPos.filter(p => p.status === 'In-Transit' || p.status === 'Partial Delivered').length;
  const pendingCount = filteredPos.filter(p => p.status === 'Issued' || p.status === 'Draft').length;

  // Open PO Modal from Indent (supports readOnly mode for completed projects / issued POs)
  const handleOpenIndentPoModal = (indent: any, readOnly = false) => {
    const isCompleted = Boolean(indent.is_completed || indent.project_stage === 'Completed');
    const hasExistingPo = (indent.purchase_orders?.length || 0) > 0;
    const shouldBeReadOnly = readOnly || isCompleted || (hasExistingPo && indent.procurement_status !== 'Partial Shortage');

    setIsPoModalReadOnly(shouldBeReadOnly);
    setSelectedIndentCompleted(isCompleted);
    setSelectedQuotationId(indent.quotation_id || '');
    setSelectedQuotationNumber(indent.quotation_number || '');
    setSelectedCustomerName(indent.customer_name || '');
    setSelectedCustomerPhone(indent.customer_phone || '');
    setSelectedProjectId(indent.converted_to_project_id || '');
    setSelectedBomId(indent.bom_id || '');
    setPoNotes(`Procurement for Quotation ${indent.quotation_number || indent.quotation_id} - Client: ${indent.customer_name}`);
    
    if (indent.items && indent.items.length > 0) {
      setPoFormItems(indent.items.map((it: any) => ({
        sku: it.item_name ? `BOM-${it.item_name.substring(0, 3).toUpperCase()}` : 'SOL-MAT',
        name: it.item_name,
        category: it.category || 'Solar BOS',
        quantity: Number(it.quantity) || 1,
        unit: it.unit || 'Nos',
        unitPrice: Number(it.estimated_unit_cost || it.unit_price) || 1000
      })));
    }
    setShowNewPoModal(true);
  };

  // Submit PO Creation
  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPoModalReadOnly || selectedIndentCompleted) {
      alert('Cannot issue Purchase Order: This project is already Completed and procurement is locked.');
      return;
    }
    try {
      setIsCreatingPo(true);
      const res = await authFetch('/api/procurement/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId: selectedQuotationId || undefined,
          quotationNumber: selectedQuotationNumber || undefined,
          customerName: selectedCustomerName || undefined,
          customerPhone: selectedCustomerPhone || undefined,
          projectId: selectedProjectId || undefined,
          bomId: selectedBomId || undefined,
          supplierId,
          supplierName,
          deliveryWarehouse,
          expectedDeliveryDate: expectedDate,
          items: poFormItems,
          notes: poNotes
        })
      });
      const data = await res.json();
      setIsCreatingPo(false);
      if (data.success) {
        setShowNewPoModal(false);
        setActiveTab('orders');
        fetchOrdersAndIndents();
      } else {
        alert(data.error || 'Failed to create PO');
      }
    } catch (err: any) {
      setIsCreatingPo(false);
      alert(err.message);
    }
  };

  // Open GRN Inwarding Modal
  const handleOpenGrnModal = (po: any) => {
    setGrnTargetPo(po);
    setSigningMode('remote');
    setDeliveryChallanNo(`DC-${Date.now().toString().slice(-5)}`);
    setSupplierInvoiceNo(`INV-${Date.now().toString().slice(-5)}`);
    setGrnWarehouse(po.deliveryWarehouse || po.delivery_warehouse || 'Customer Installation Site');
    setCustomerSigName(po.customer_name || 'Site Owner');
    setCustomerSigPhone(po.customer_phone || '');
    setHasSignature(false);

    const items = (po.items || []).map((it: any) => ({
      id: it.id,
      name: it.name || it.item_name,
      category: it.category,
      orderedQuantity: Number(it.quantity) || 1,
      receivedQuantity: Number(it.quantity) || 1,
      acceptedQuantity: Number(it.quantity) || 1,
      rejectedQuantity: 0,
      unit: it.unit || 'Nos',
      remarks: 'Inspected and verified'
    }));
    setGrnItems(items);
  };

  // Signature Canvas Helpers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Submit GRN with Signature or Remote Link
  const handleSubmitGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnTargetPo) return;
    try {
      setIsSubmittingGrn(true);
      const signatureDataUrl = (signingMode === 'in_person' && canvasRef.current) 
        ? canvasRef.current.toDataURL('image/png') 
        : '';

      if (signingMode === 'in_person' && !hasSignature) {
        setIsSubmittingGrn(false);
        alert('Please draw the signature on the pad or switch to Send Secure Signing Link.');
        return;
      }

      const res = await authFetch('/api/procurement/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poId: grnTargetPo.id,
          quotationId: grnTargetPo.quotation_id,
          deliveryChallanNumber: deliveryChallanNo,
          supplierInvoiceNumber: supplierInvoiceNo,
          deliveryWarehouse: grnWarehouse,
          receivedDate: new Date().toISOString().split('T')[0],
          items: grnItems,
          notes: grnNotes,
          signingMethod: signingMode,
          customerSignatureData: signatureDataUrl || undefined,
          customerSignatureName: customerSigName,
          customerSignaturePhone: customerSigPhone,
        })
      });
      const data = await res.json();
      setIsSubmittingGrn(false);
      if (data.success) {
        setGrnSuccessResult({
          ...data.grn,
          signingUrl: data.signingUrl || data.grn?.signingUrl,
          signingToken: data.signingToken || data.grn?.signingToken,
          signingMethod: signingMode,
        });
        setGrnTargetPo(null);
        fetchOrdersAndIndents();
      } else {
        alert(data.error || 'Failed to generate GRN');
      }
    } catch (err: any) {
      setIsSubmittingGrn(false);
      alert(err.message);
    }
  };

  // Convert Indent to EPC Project (Step 5)
  const handleConvertToEpcProject = async (indent: any) => {
    if (!indent.has_signed_grn) {
      alert('Cannot convert to EPC project: Required material receipt and customer digital signature conditions are not yet satisfied.');
      return;
    }
    try {
      setConvertingIndentId(indent.quotation_id);
      const res = await authFetch('/api/procurement/convert-to-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId: indent.quotation_id,
          projectManagerName: 'Karthik Raja',
          installationLeadName: 'Muthu Vel',
        })
      });
      const data = await res.json();
      setConvertingIndentId(null);
      if (data.success) {
        setConversionSuccess(data.project);
        fetchOrdersAndIndents();
      } else {
        alert(data.error || 'Failed to convert deal to EPC project');
      }
    } catch (err: any) {
      setConvertingIndentId(null);
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Procurement &amp; Material Management</h1>
              <p className="text-xs text-slate-500">Tier-1 vendor supply orders, BOM material indents, site delivery tracking, and digital customer signature GRNs</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOrdersAndIndents}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh procurement data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setSelectedQuotationId('');
              setSelectedQuotationNumber('');
              setSelectedCustomerName('');
              setSelectedCustomerPhone('');
              setSelectedProjectId('');
              setSelectedBomId('');
              setPoNotes('');
              setShowNewPoModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Success Notification Modal / Alert for Project Conversion */}
      {conversionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">🎉 Deal Successfully Converted to EPC Project: {conversionSuccess.id}!</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                All quotation, BOM, PO, and digitally signed GRN records have been linked to <strong>{conversionSuccess.customerName}</strong>. 
                Assigned to Project Manager Karthik Raja. Awaiting PM site readiness confirmation before installation commences.
              </p>
              {conversionSuccess.signedGrnPdfUrl && (
                <a
                  href={conversionSuccess.signedGrnPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline mt-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Signed Material Handover Receipt (PDF)</span>
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => setConversionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Notification & Share Box for GRN generation */}
      {grnSuccessResult && (
        <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-300 rounded-2xl shadow-sm animate-in fade-in duration-200 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                {grnSuccessResult.signingUrl ? <Share2 className="w-5 h-5" /> : <CheckCheck className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">
                  {grnSuccessResult.signingUrl 
                    ? `✓ GRN ${grnSuccessResult.grnNumber} Created — Customer E-Signature Link Ready!`
                    : `✓ Goods Receipt Note ${grnSuccessResult.grnNumber} Inwarded with Immediate Signature!`}
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  PO: <strong>{grnSuccessResult.poNumber}</strong> • Client: <strong>{grnSuccessResult.customerName}</strong> • Status:{' '}
                  <span className="font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    {grnSuccessResult.status || 'Pending_Signature'}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setGrnSuccessResult(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* If Remote Signing Link is available */}
          {grnSuccessResult.signingUrl && (
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all overflow-hidden text-ellipsis">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                  <span className="truncate">{grnSuccessResult.signingUrl}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(grnSuccessResult.signingUrl, 'success-box')}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedGrnId === 'success-box' ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(
                      grnSuccessResult.customerPhone,
                      grnSuccessResult.customerName,
                      grnSuccessResult.grnNumber,
                      grnSuccessResult.signingUrl
                    )}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Share WhatsApp</span>
                  </button>

                  <a
                    href={grnSuccessResult.signingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Open customer signing portal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Portal</span>
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Single-use link valid for 7 days. Customer does not need a password or account.</span>
                </span>
                {grnSuccessResult.previewPdfUrl && (
                  <a
                    href={grnSuccessResult.previewPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Document</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Download Signed PDF if in-person signed */}
          {!grnSuccessResult.signingUrl && grnSuccessResult.signedPdfUrl && (
            <div className="pt-1">
              <a
                href={grnSuccessResult.signedPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Signed GRN Challan PDF</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('indents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'indents'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Approved Quotations &amp; Indents ({pendingIndents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'orders'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Purchase Orders &amp; Delivery Tracking ({purchaseOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('grns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'grns'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Goods Receipt Notes &amp; E-Signatures ({grnsList.length})</span>
        </button>
      </div>

      {activeTab === 'indents' && (
        /* PENDING BOM INDENTS TAB */
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <ClipboardList className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950">
                <span className="font-bold block text-sm">Step 2: Purchase Team Procurement Workflow</span>
                Manage material requirements from accepted quotations/BOMs, issue supplier POs, track site arrivals, capture customer electronic signatures against material delivery, and convert to EPC projects.
              </div>
            </div>

            {pendingIndents.some(i => i.is_completed || i.project_stage === 'Completed') && (
              <button
                onClick={handleClearClosedIndents}
                className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Clear all completed closed procurement cards from this view"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear Closed Procurement</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingIndents.length === 0 ? (
              <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <p className="font-bold text-slate-700 text-sm">All accepted quotations are fully procured!</p>
                <p className="text-xs text-slate-400 mt-1">No pending material indents found.</p>
              </div>
            ) : (
              pendingIndents.map(ind => {
                const isConverted = !!ind.converted_to_project_id;
                const canConvert = ind.has_signed_grn && !isConverted;
                const isProjectCompleted = Boolean(ind.is_completed || ind.project_stage === 'Completed');
                const hasIssuedPo = (ind.purchase_orders?.length || 0) > 0;

                return (
                  <div key={ind.indent_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between relative group">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-mono font-bold">
                              {ind.quotation_number || ind.quotation_id}
                            </span>
                            <span className="text-xs font-bold text-emerald-700">
                              {ind.system_size_kw} kW System
                            </span>
                          </div>
                          <h3 className="font-black text-slate-900 text-base">{ind.customer_name}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{ind.customer_phone || 'Phone verified'}</span>
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{ind.customer_address || 'Delivery Site Location'}</span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isProjectCompleted ? 'bg-slate-100 text-slate-700 border-slate-300' :
                            ind.procurement_status === 'Materials Delivered & Signed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            ind.procurement_status === 'Partial Shortage' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            ind.procurement_status === 'PO Issued / In-Transit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {ind.procurement_status}
                          </span>
                          <div className="text-sm font-bold text-slate-900 font-mono mt-1">
                            ₹{Number(ind.total_amount || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {/* Equipment List */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="font-bold text-slate-700 flex justify-between">
                          <span>BOM Requirements ({ind.items?.length || 0} line items)</span>
                          <span className="text-emerald-700 font-semibold">{ind.purchase_orders?.length || 0} POs issued</span>
                        </div>
                        <div className="divide-y divide-slate-200/60 text-[11px] text-slate-600 max-h-32 overflow-y-auto">
                          {(ind.items || []).map((it: any, i: number) => (
                            <div key={i} className="py-1 flex justify-between">
                              <span>{it.item_name} ({it.category || 'BOS'})</span>
                              <span className="font-bold text-slate-900">{it.quantity} {it.unit || 'Nos'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Signed GRN Badge if Available */}
                      {ind.has_signed_grn && ind.signed_grn && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                          <div className="flex items-center gap-1.5">
                            <CheckCheck className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold">Materials Delivered &amp; Signed ({ind.signed_grn.grn_number})</span>
                          </div>
                          {ind.signed_grn.signed_pdf_url && (
                            <a
                              href={ind.signed_grn.signed_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>PDF</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                      {isProjectCompleted ? (
                        <>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenIndentPoModal(ind, true)}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                              title="Project is Completed. View BOM items and materials in read-only mode."
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Materials</span>
                            </button>

                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Project Completed</span>
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteIndent(ind.quotation_id, ind.quotation_number || ind.quotation_id)}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            title="Delete / Dismiss this closed procurement card"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </>
                      ) : hasIssuedPo && ind.procurement_status !== 'Partial Shortage' ? (
                        <>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenIndentPoModal(ind, true)}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                              title="PO already issued. View BOM line items."
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Materials</span>
                            </button>

                            {isConverted ? (
                              <span className="px-3 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                                <span>Converted: {ind.converted_to_project_id}</span>
                              </span>
                            ) : canConvert ? (
                              <button
                                onClick={() => handleConvertToEpcProject(ind)}
                                disabled={convertingIndentId === ind.quotation_id}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg transition-all animate-pulse"
                                title="Convert to turnkey EPC project after verifying signed material receipt"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                                <span>{convertingIndentId === ind.quotation_id ? 'Converting...' : 'Convert to EPC Project &rarr;'}</span>
                              </button>
                            ) : (
                              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-[11px] font-semibold flex items-center gap-1" title="Materials must be delivered and customer signature captured first">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>Awaiting Delivery &amp; Signature</span>
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteIndent(ind.quotation_id, ind.quotation_number || ind.quotation_id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete / Archive this indent"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenIndentPoModal(ind, false)}
                              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Issue PO</span>
                            </button>

                            {isConverted ? (
                              <span className="px-3 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                                <span>Converted: {ind.converted_to_project_id}</span>
                              </span>
                            ) : canConvert ? (
                              <button
                                onClick={() => handleConvertToEpcProject(ind)}
                                disabled={convertingIndentId === ind.quotation_id}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg transition-all animate-pulse"
                                title="Convert to turnkey EPC project after verifying signed material receipt"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                                <span>{convertingIndentId === ind.quotation_id ? 'Converting...' : 'Convert to EPC Project &rarr;'}</span>
                              </button>
                            ) : (
                              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-[11px] font-semibold flex items-center gap-1" title="Materials must be delivered and customer signature captured first">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>Awaiting Delivery &amp; Signature</span>
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteIndent(ind.quotation_id, ind.quotation_number || ind.quotation_id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete / Archive this indent"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        /* PURCHASE ORDERS TABLE TAB */
        <div className="space-y-4">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Total PO Volume</span>
                <ShoppingCart className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                ₹{totalPoValue.toLocaleString('en-IN')}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Committed procurement capital</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Received &amp; Signed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-600">{receivedCount}</div>
              <div className="mt-1 text-[11px] text-emerald-700 font-medium">Customer signature captured</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>In-Transit / Partial</span>
                <Truck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-600">{inTransitCount}</div>
              <div className="mt-1 text-[11px] text-slate-400">En route to installation sites</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Pending Delivery</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-600">{pendingCount}</div>
              <div className="mt-1 text-[11px] text-slate-400">Issued to vendor</div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by PO Number, Customer name, Supplier, or GRN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="all">All PO Statuses</option>
                  <option value="Issued">Issued</option>
                  <option value="In-Transit">In-Transit</option>
                  <option value="Partial Delivered">Partial Delivered</option>
                  <option value="Delivered">Delivered &amp; Signed (GRN)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Purchase Orders Mobile Cards (< lg) */}
          <div className="lg:hidden divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredPos.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-medium text-slate-600">No purchase orders found</p>
              </div>
            ) : (
              filteredPos.map(po => {
                const poId = po.id;
                const pNum = po.poNumber || po.po_number || poId;
                const sName = po.supplierName || po.supplier_name;
                const gNum = po.grnNumber || po.grn_number;
                const grandTotal = Number(po.grandTotal || po.grand_total) || 0;
                const warehouse = po.deliveryWarehouse || po.delivery_warehouse || 'Site Delivery';
                const items = po.items || [];
                const isDelivered = po.status === 'Delivered' || po.status === 'Received';
                const hasGrnChallan = po.delivery_challan_url || (po.grns && po.grns[0]?.signed_pdf_url);

                return (
                  <div key={poId} className="p-4 hover:bg-slate-50/80 transition-colors space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{pNum}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            po.status === 'Partial Delivered' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            po.status === 'In-Transit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {po.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {po.created_at ? new Date(po.created_at).toLocaleDateString() : ''}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-slate-900 text-sm font-mono">
                          ₹{grandTotal.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400">Incl. GST</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Customer:</span>
                        <span className="font-semibold text-slate-900 truncate max-w-[180px]">{po.customer_name || 'Client Site'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Supplier:</span>
                        <span className="font-semibold text-slate-900 truncate max-w-[180px]">{sName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Destination:</span>
                        <span className="text-slate-700 truncate max-w-[180px]">{warehouse}</span>
                      </div>
                      {gNum && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-emerald-700 font-bold">GRN Ref:</span>
                          <span className="font-mono text-emerald-700 font-bold">{gNum}</span>
                        </div>
                      )}
                    </div>

                    {items.length > 0 && (
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        {items.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="truncate max-w-[200px] text-slate-800">{item.name || item.itemName}</span>
                            <span className="font-bold text-slate-600 shrink-0">× {item.quantity} {item.unit}</span>
                          </div>
                        ))}
                        {items.length > 2 && (
                          <div className="text-[10px] text-slate-400 font-medium">+{items.length - 2} more items</div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      {!isDelivered ? (
                        <button
                          onClick={() => handleOpenGrnModal(po)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer mr-auto"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Inward (GRN)</span>
                        </button>
                      ) : (
                        hasGrnChallan && (
                          <a
                            href={hasGrnChallan}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors inline-flex items-center gap-1 mr-auto"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>GRN Receipt</span>
                          </a>
                        )
                      )}
                      <button
                        onClick={() => setViewingPo(po)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDeletePurchaseOrder(po.id, pNum)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Purchase Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Purchase Orders Table (Desktop >= lg) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">PO Number &amp; Date</th>
                    <th className="py-3.5 px-4">Customer &amp; Destination</th>
                    <th className="py-3.5 px-4">Tier-1 Supplier</th>
                    <th className="py-3.5 px-4">Key Equipment Ordered</th>
                    <th className="py-3.5 px-4 text-right">Grand Total (₹)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-medium text-slate-600">No purchase orders found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPos.map(po => {
                      const poId = po.id;
                      const pNum = po.poNumber || po.po_number || poId;
                      const sName = po.supplierName || po.supplier_name;
                      const gNum = po.grnNumber || po.grn_number;
                      const grandTotal = Number(po.grandTotal || po.grand_total) || 0;
                      const warehouse = po.deliveryWarehouse || po.delivery_warehouse || 'Site Delivery';
                      const items = po.items || [];
                      const isDelivered = po.status === 'Delivered' || po.status === 'Received';
                      const hasGrnChallan = po.delivery_challan_url || (po.grns && po.grns[0]?.signed_pdf_url);

                      return (
                        <tr key={poId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{pNum}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {po.created_at ? new Date(po.created_at).toLocaleDateString() : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{po.customer_name || 'Client Site'}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Warehouse className="w-3 h-3 text-slate-400" />
                              <span>{warehouse}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{sName}</div>
                            {gNum && (
                              <div className="text-[10px] text-emerald-700 font-mono font-bold flex items-center gap-1 mt-0.5">
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                                <span>GRN: {gNum}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {items.length === 0 ? (
                              <span className="text-slate-400">Materials order</span>
                            ) : (
                              items.slice(0, 2).map((item: any, idx: number) => (
                                <div key={idx} className="text-[11px]">
                                  <span className="font-medium text-slate-900">{item.name || item.itemName}</span>
                                  <span className="text-[10px] text-slate-500 ml-1 font-bold">
                                    × {item.quantity} {item.unit}
                                  </span>
                                </div>
                              ))
                            )}
                            {items.length > 2 && (
                              <span className="text-[10px] text-slate-400 font-semibold">+{items.length - 2} more items</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-bold text-slate-900 text-sm font-mono">
                              ₹{grandTotal.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Incl. GST
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              po.status === 'Partial Delivered' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              po.status === 'In-Transit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isDelivered ? (
                                <button
                                  onClick={() => handleOpenGrnModal(po)}
                                  className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Inward materials and capture customer digital signature"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  <span>Inward (GRN)</span>
                                </button>
                              ) : (
                                hasGrnChallan && (
                                  <a
                                    href={hasGrnChallan}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                                    title="Download Signed Customer Delivery Receipt (PDF)"
                                  >
                                    <Download className="w-4 h-4 text-emerald-600" />
                                  </a>
                                )
                              )}
                              <button
                                onClick={() => setViewingPo(po)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="View PO Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePurchaseOrder(po.id, pNum)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Delete Purchase Order"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'grns' && (
        /* GOODS RECEIPT NOTES & CUSTOMER E-SIGNATURES TAB */
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Total GRNs Issued</span>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{grnsList.length}</div>
              <div className="mt-1 text-[11px] text-slate-400">Material handover manifests</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-amber-700 font-medium">
                <span>Pending E-Signature</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-600">
                {grnsList.filter(g => g.signing_link_status === 'Pending').length}
              </div>
              <div className="mt-1 text-[11px] text-amber-700">Awaiting customer touch sign</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span>Verified &amp; Signed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-600">
                {grnsList.filter(g => g.signing_link_status === 'Signed').length}
              </div>
              <div className="mt-1 text-[11px] text-emerald-700">Certified delivery receipts</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Expired / Revoked</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-rose-600">
                {grnsList.filter(g => g.signing_link_status === 'Expired' || g.signing_link_status === 'Cancelled').length}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Can be refreshed &amp; resent</div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by GRN #, PO #, Customer Name, or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={grnStatusFilter}
                onChange={(e) => setGrnStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Signing Statuses</option>
                <option value="Pending">Pending Customer Signature</option>
                <option value="Signed">Electronically Signed</option>
                <option value="Expired">Link Expired</option>
                <option value="Cancelled">Revoked / Cancelled</option>
              </select>
            </div>
          </div>

          {/* GRN Manifests List */}
          <div className="space-y-3">
            {grnsList
              .filter(grn => {
                const gNum = grn.grn_number || '';
                const pNum = grn.po_number || '';
                const cName = grn.customer_signature_name || '';
                const cPhone = grn.customer_signature_phone || '';
                const matchesSearch = gNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  pNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  cName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  cPhone.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = grnStatusFilter === 'all' || grn.signing_link_status === grnStatusFilter;
                return matchesSearch && matchesStatus;
              })
              .map(grn => {
                const isPending = grn.signing_link_status === 'Pending';
                const isSigned = grn.signing_link_status === 'Signed';
                const isExpired = grn.signing_link_status === 'Expired' || grn.is_expired;

                return (
                  <div
                    key={grn.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          isSigned ? 'bg-emerald-100 text-emerald-700' :
                          isPending ? 'bg-amber-100 text-amber-700' :
                          isExpired ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm font-mono">{grn.grn_number}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSigned ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              isPending ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' :
                              isExpired ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {isSigned ? '✓ Signed by Customer' :
                               isPending ? '⏳ Awaiting Customer E-Signature' :
                               isExpired ? '⚠️ Link Expired' : '🚫 Link Revoked'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Linked to PO: <strong className="text-slate-800 font-mono">{grn.po_number || grn.po_id}</strong> • Inwarded: {grn.received_date} • By: {grn.verified_by || 'Store Officer'}
                          </p>
                        </div>
                      </div>

                      {/* Right metadata */}
                      <div className="text-right text-xs">
                        <span className="text-slate-400 block text-[10px]">Client / Recipient:</span>
                        <strong className="text-slate-900">{grn.customer_signature_name || 'Client'}</strong>
                        {grn.customer_signature_phone && (
                          <span className="text-slate-500 block font-mono text-[11px]">{grn.customer_signature_phone}</span>
                        )}
                      </div>
                    </div>

                    {/* Details row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Delivery Destination:</span>
                        <span className="text-slate-700 font-medium">{grn.delivery_location || grn.delivery_warehouse || 'Site Delivery'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Challan &amp; Invoice Reference:</span>
                        <span className="text-slate-700 font-mono">DC #{grn.delivery_challan_no || 'N/A'} • Inv #{grn.supplier_invoice_no || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Audit Log:</span>
                        {isSigned ? (
                          <span className="text-emerald-700 font-bold block">
                            Signed on {new Date(grn.signed_at || grn.customer_signature_date).toLocaleDateString()} {grn.signing_ip ? `(IP: ${grn.signing_ip})` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-500 block">
                            Expires: {grn.signing_expires_at ? new Date(grn.signing_expires_at).toLocaleDateString() : '7 Days'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Link Sharing Box if Pending */}
                    {isPending && grn.signing_url && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden text-xs font-mono text-amber-900 bg-white px-3 py-1.5 rounded-lg border border-amber-200">
                          <LinkIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate select-all">{grn.signing_url}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(grn.signing_url, grn.id)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copiedGrnId === grn.id ? 'Copied!' : 'Copy Link'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(
                              grn.customer_signature_phone,
                              grn.customer_signature_name,
                              grn.grn_number,
                              grn.signing_url
                            )}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          <a
                            href={grn.signing_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Test Portal</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {grn.signed_pdf_url && (
                          <a
                            href={grn.signed_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all ${
                              isSigned
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer'
                            }`}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isSigned ? 'Download Signed Delivery Receipt (PDF)' : 'Preview Delivery Challan (PDF)'}</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleResendLink(grn.id)}
                              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                              title="Refresh link validity for another 7 days"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Refresh Validity</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevokeLink(grn.id, grn.grn_number)}
                              className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                              title="Revoke signing link"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Revoke Link</span>
                            </button>
                          </>
                        )}

                        {isExpired && (
                          <button
                            type="button"
                            onClick={() => handleResendLink(grn.id)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Refresh &amp; Extend Link (7 Days)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            {grnsList.length === 0 && (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700 text-sm">No Goods Receipt Notes generated yet</p>
                <p className="text-xs text-slate-400 mt-1">Inward purchase orders to generate customer delivery manifests and e-signing links.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / VIEW PO MODAL */}
      {showNewPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                {isPoModalReadOnly ? (
                  <ClipboardList className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                )}
                <div>
                  <h3 className="font-bold text-sm">
                    {isPoModalReadOnly ? 'Equipment BOM & Material Specifications' : 'Create Equipment Purchase Order'}
                  </h3>
                  {selectedQuotationNumber && (
                    <p className="text-[11px] text-emerald-300">
                      Linked Quotation: {selectedQuotationNumber} • {selectedCustomerName}
                      {selectedIndentCompleted && ' • Project Completed (Procurement Closed)'}
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setShowNewPoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="p-5 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              {/* Completed / Read-only Warning Banner */}
              {selectedIndentCompleted ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Project {selectedProjectId || 'Completed'} has reached the <strong>Completed</strong> stage. Procurement is finalized and closed; new purchase orders cannot be created.
                  </span>
                </div>
              ) : isPoModalReadOnly ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Purchase Order already issued for this quotation. Viewing material requirements in read-only mode.
                  </span>
                </div>
              ) : null}

              {isPoModalReadOnly ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Supplier / Channel</span>
                    <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{supplierName || 'Waaree Solar Tech'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Destination Warehouse / Site</span>
                    <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{deliveryWarehouse}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Supplier *</label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={e => setSupplierName(e.target.value)}
                      placeholder="e.g. Waaree Solar / Solis Inverters / Polycab Cables"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Warehouse / Site</label>
                    <select
                      value={deliveryWarehouse}
                      onChange={(e) => setDeliveryWarehouse(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                    >
                      <option value="Direct to Customer Site">Direct to Customer Site (Preferred)</option>
                      <option value="Central Warehouse">Central Bengaluru Hub</option>
                      <option value="Hubli Regional Depot">Hubli Regional Depot</option>
                      <option value="Chennai Regional Depot">Chennai Regional Depot</option>
                    </select>
                  </div>
                </div>
              )}

              {!isPoModalReadOnly && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Delivery Date (ETA)</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              )}

              {/* Items Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">Order Line Items ({poFormItems.length})</h4>
                  {!isPoModalReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setPoFormItems([
                          ...poFormItems,
                          { sku: 'ITEM-NEW', name: 'Material Line Item', category: 'General BOS', quantity: 1, unit: 'Nos', unitPrice: 1000 }
                        ]);
                      }}
                      className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px] cursor-pointer"
                    >
                      + Add Item
                    </button>
                  )}
                </div>

                {isPoModalReadOnly ? (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto divide-y divide-slate-200/60">
                    {poFormItems.map((item, idx) => (
                      <div key={idx} className="pt-1.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-900 block">{item.name}</span>
                          <span className="text-[10px] text-slate-500">{item.category || 'Solar BOS'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 block">{item.quantity} {item.unit || 'Nos'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {poFormItems.map((item, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => {
                              const next = [...poFormItems];
                              next[idx].name = e.target.value;
                              setPoFormItems(next);
                            }}
                            className="w-full p-1 border border-slate-200 rounded text-xs font-semibold"
                            placeholder="Item Name"
                          />
                        </div>
                        <div className="col-span-3 flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => {
                              const next = [...poFormItems];
                              next[idx].quantity = Number(e.target.value);
                              setPoFormItems(next);
                            }}
                            className="w-14 p-1 border border-slate-200 rounded text-xs font-bold text-center"
                          />
                          <span className="text-[10px] text-slate-500">{item.unit || 'Nos'}</span>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => {
                              const next = [...poFormItems];
                              next[idx].unitPrice = Number(e.target.value);
                              setPoFormItems(next);
                            }}
                            className="w-full p-1 border border-slate-200 rounded text-xs text-right font-mono"
                            placeholder="Rate ₹"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => setPoFormItems(poFormItems.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-600 font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!isPoModalReadOnly ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PO Notes &amp; Delivery Instructions</label>
                  <textarea
                    rows={2}
                    value={poNotes}
                    onChange={e => setPoNotes(e.target.value)}
                    placeholder="Delivery timing, unloading requirements, contact person on site..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Delivery Notes</span>
                  <p>{poNotes || 'Standard site delivery instructions recorded.'}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                {isPoModalReadOnly ? (
                  <>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {selectedIndentCompleted ? 'Procurement Closed (Project Completed)' : 'PO Issued • Read Only'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNewPoModal(false)}
                      className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-end gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => setShowNewPoModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingPo}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {isCreatingPo ? 'Issuing PO...' : 'Issue Purchase Order'}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GOODS RECEIPT NOTE (GRN) MODAL WITH CUSTOMER DIGITAL SIGNATURE */}
      {grnTargetPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 bg-emerald-950 text-white">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Goods Receipt Note (GRN) &amp; Customer Signature Handover</h3>
                  <p className="text-[10px] text-emerald-300">PO: {grnTargetPo.poNumber || grnTargetPo.po_number || grnTargetPo.id} • Customer: {grnTargetPo.customer_name || 'Client'}</p>
                </div>
              </div>
              <button 
                onClick={() => setGrnTargetPo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitGrn} className="p-5 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Challan Number *</label>
                  <input
                    type="text"
                    required
                    value={deliveryChallanNo}
                    onChange={e => setDeliveryChallanNo(e.target.value)}
                    placeholder="e.g. DC-2026-9921"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Tax Invoice Number</label>
                  <input
                    type="text"
                    value={supplierInvoiceNo}
                    onChange={e => setSupplierInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-88912"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Receiving Warehouse / Site Destination</label>
                <input
                  type="text"
                  value={grnWarehouse}
                  onChange={e => setGrnWarehouse(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs"
                />
              </div>

              {/* Items Verification Table */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Verify Line Items (Record Actual Quantities &amp; Discrepancies)
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 font-bold text-[11px] text-slate-600">
                      <tr>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5 text-center">Ordered</th>
                        <th className="p-2.5 text-center">Accepted</th>
                        <th className="p-2.5 text-center">Rejected / Short</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {grnItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-semibold text-slate-800">{item.name}</td>
                          <td className="p-2.5 text-center font-bold text-slate-600">{item.orderedQuantity} {item.unit}</td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min={0}
                              max={item.orderedQuantity}
                              value={item.acceptedQuantity}
                              onChange={e => {
                                const next = [...grnItems];
                                const val = Number(e.target.value) || 0;
                                next[idx].acceptedQuantity = val;
                                next[idx].rejectedQuantity = item.orderedQuantity - val;
                                setGrnItems(next);
                              }}
                              className="w-16 p-1 border border-slate-200 rounded text-xs font-bold text-center text-emerald-700"
                            />
                          </td>
                          <td className="p-2.5 text-center font-bold">
                            {item.rejectedQuantity > 0 ? (
                              <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">{item.rejectedQuantity} Short</span>
                            ) : (
                              <span className="text-emerald-700">0 Nil</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Signing Workflow Selection */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Customer E-Signature &amp; Site Handover</h4>
                    <p className="text-[11px] text-slate-500">Choose remote mobile signing link or immediate on-device signature</p>
                  </div>
                  
                  {/* Mode Selector */}
                  <div className="flex bg-slate-200 p-0.5 rounded-xl border border-slate-300 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSigningMode('remote')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        signingMode === 'remote'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Send Signing Link (Recommended)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSigningMode('in_person')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        signingMode === 'in_person'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Sign In-Person Now</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Customer / Signatory Name *</label>
                    <input
                      type="text"
                      required
                      value={customerSigName}
                      onChange={e => setCustomerSigName(e.target.value)}
                      placeholder="Customer Full Name"
                      className="w-full p-2 bg-white rounded-xl border border-slate-300 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Customer WhatsApp / Mobile *</label>
                    <input
                      type="text"
                      required
                      value={customerSigPhone}
                      onChange={e => setCustomerSigPhone(e.target.value)}
                      placeholder="+91 Mobile number"
                      className="w-full p-2 bg-white rounded-xl border border-slate-300 font-semibold text-xs"
                    />
                  </div>
                </div>

                {signingMode === 'remote' ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Secure Mobile Touch Signing (No Account Required)</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      The GRN will be saved as <strong>Pending Customer Signature</strong>. A unique 256-bit encrypted link valid for 7 days will be generated for the customer ({customerSigName || 'Client'}). They can review the complete material manifest on their mobile or desktop browser and sign using their finger. You can share the link via WhatsApp with 1 click.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Sign on Screen (Touch or Mouse) *
                      </label>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg cursor-pointer"
                      >
                        <Eraser className="w-3 h-3 text-slate-500" />
                        <span>Clear</span>
                      </button>
                    </div>

                    {/* HTML5 Signature Canvas */}
                    <div className="border-2 border-dashed border-slate-300 bg-white rounded-xl overflow-hidden relative">
                      <canvas
                        ref={canvasRef}
                        width={580}
                        height={130}
                        className="w-full h-28 cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      {!hasSignature && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                          <span>Sign here using touch screen, stylus, or mouse ✍️</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Inwarding Remarks &amp; QA Inspection Notes</label>
                <textarea
                  rows={2}
                  value={grnNotes}
                  onChange={e => setGrnNotes(e.target.value)}
                  placeholder="Physical inspection condition, manufacturer serial batch numbers, packaging seal..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGrnTargetPo(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGrn}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingGrn ? (
                    <span>Processing GRN...</span>
                  ) : signingMode === 'remote' ? (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Issue GRN &amp; Generate Customer Signing Link</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve GRN &amp; Certify In-Person Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PO MODAL */}
      {viewingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-sm">Purchase Order: {viewingPo.poNumber || viewingPo.po_number || viewingPo.id}</h3>
                <p className="text-[11px] text-slate-400">Created: {viewingPo.created_at ? new Date(viewingPo.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <button 
                onClick={() => setViewingPo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="font-bold text-slate-900 text-sm">AB ENERGY SOLUTIONS PVT LTD</div>
                  <div className="text-[11px] text-slate-500">Destination: {viewingPo.deliveryWarehouse || viewingPo.delivery_warehouse}</div>
                  {viewingPo.customer_name && (
                    <div className="text-[11px] text-emerald-800 font-semibold mt-1">Client: {viewingPo.customer_name}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-700">Vendor:</div>
                  <div className="font-semibold text-slate-900">{viewingPo.supplierName || viewingPo.supplier_name}</div>
                  <div className="text-[11px] text-slate-500">Status: <span className="font-semibold">{viewingPo.status}</span></div>
                  {(viewingPo.grnNumber || viewingPo.grn_number) && (
                    <div className="text-[11px] text-emerald-700 font-bold">GRN: {viewingPo.grnNumber || viewingPo.grn_number}</div>
                  )}
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Rate</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(viewingPo.items || []).map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium">{it.name || it.item_name}</td>
                      <td className="p-2.5 text-center font-bold">{it.quantity} {it.unit}</td>
                      <td className="p-2.5 text-right">₹{Number(it.unitPrice || it.unit_price).toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-right font-bold">₹{Number(it.totalAmount || it.total_amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bg-slate-50 p-3 rounded-xl flex justify-between font-bold text-slate-900 text-sm">
                <span>Grand Total:</span>
                <span>₹{Number(viewingPo.grandTotal || viewingPo.grand_total).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewingPo(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
