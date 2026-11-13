import React, { useState } from 'react';
import { 
  Receipt, Plus, Search, Filter, Printer, Download, 
  CheckCircle2, Clock, AlertTriangle, ArrowRight, ArrowLeft,
  CreditCard, Check, IndianRupee, ShieldCheck, Sparkles, Building, Zap, Calendar, User, CheckCircle,
  Phone, Send, X, Pencil, Trash2
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { getApiUrl } from '../../utils/apiUrl';
import { Invoice } from '../../types';

export const InvoicesView: React.FC = () => {
  const { invoices, recordPayment, createInvoice, updateInvoice, projects, customers, sendInvoiceToAuditor, activeRole, currentUser } = useCrm();

  const isAuditor = activeRole === 'Auditor' || currentUser?.role === 'Auditor';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [milestoneFilter, setMilestoneFilter] = useState<'All' | '90_advance' | '10_commissioning'>('All');
  const [activeViewMode, setActiveViewMode] = useState<'grid' | 'document'>('grid');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices[0] || null);

  // Quick payment recording state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(selectedInvoice?.balanceDue || 0);
  const [payMode, setPayMode] = useState<any>('NEFT/RTGS');
  const [payRef, setPayRef] = useState(`NEFT-${Date.now().toString().slice(-6)}`);

  // Direct Sent to Auditor State
  const [auditorSendingId, setAuditorSendingId] = useState<string | null>(null);

  const handleDirectSendToAuditor = async (inv: Invoice) => {
    setAuditorSendingId(inv.id);
    try {
      await sendInvoiceToAuditor(inv.id);
      if (selectedInvoice?.id === inv.id) {
        setSelectedInvoice({
          ...selectedInvoice,
          sentToAuditor: true,
          sentToAuditorAt: new Date().toISOString()
        });
      }
      setInvoiceIssueSuccess(`Invoice ${inv.invoiceNumber} successfully forwarded to Auditor Panel.`);
      setTimeout(() => setInvoiceIssueSuccess(null), 3000);
    } finally {
      setAuditorSendingId(null);
    }
  };

  // Edit Invoice State & Handlers
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const handleStartEditInvoice = (inv: Invoice) => {
    setEditingInvoice(JSON.parse(JSON.stringify(inv)));
  };

  const handleSaveEditInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const subtotal = editingInvoice.items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const cgst = Number(editingInvoice.cgst) ?? Math.round(subtotal * 0.069);
    const sgst = Number(editingInvoice.sgst) ?? Math.round(subtotal * 0.069);
    const igst = Number(editingInvoice.igst) || 0;
    const totalAmount = subtotal + cgst + sgst + igst;
    const paidAmount = Number(editingInvoice.paidAmount) || 0;
    const balanceDue = Math.max(0, totalAmount - paidAmount);

    const updated: Invoice = {
      ...editingInvoice,
      subtotal,
      cgst,
      sgst,
      igst,
      totalAmount,
      paidAmount,
      balanceDue,
      status: balanceDue === 0 ? 'Paid' : (paidAmount > 0 ? 'Partially Paid' : (editingInvoice.status || 'Sent')),
    };

    updateInvoice(editingInvoice.id, updated);
    if (selectedInvoice?.id === editingInvoice.id) {
      setSelectedInvoice(updated);
    }
    setEditingInvoice(null);
    setInvoiceIssueSuccess(`Invoice ${updated.invoiceNumber} updated successfully!`);
    setTimeout(() => setInvoiceIssueSuccess(null), 3000);
  };

  const handleUpdateLineItem = (index: number, field: string, val: any) => {
    if (!editingInvoice) return;
    const newItems = [...editingInvoice.items];
    const current = { ...newItems[index], [field]: val };
    if (field === 'quantity' || field === 'unitRate') {
      const q = field === 'quantity' ? Number(val) : Number(current.quantity);
      const r = field === 'unitRate' ? Number(val) : Number(current.unitRate);
      current.amount = Math.round(q * r);
    }
    newItems[index] = current;
    const newSubtotal = newItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const newCgst = Math.round(newSubtotal * 0.069);
    const newSgst = Math.round(newSubtotal * 0.069);
    const newTotal = newSubtotal + newCgst + newSgst + (Number(editingInvoice.igst) || 0);
    const curPaid = Number(editingInvoice.paidAmount) || 0;
    setEditingInvoice({
      ...editingInvoice,
      items: newItems,
      subtotal: newSubtotal,
      cgst: newCgst,
      sgst: newSgst,
      totalAmount: newTotal,
      balanceDue: Math.max(0, newTotal - curPaid),
    });
  };

  const handleAddLineItem = () => {
    if (!editingInvoice) return;
    const newItem = {
      description: 'Solar System Components / EPC Milestone Service',
      quantity: 1,
      unitRate: 10000,
      amount: 10000
    };
    const newItems = [...editingInvoice.items, newItem];
    const newSubtotal = newItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const newCgst = Math.round(newSubtotal * 0.069);
    const newSgst = Math.round(newSubtotal * 0.069);
    const newTotal = newSubtotal + newCgst + newSgst + (Number(editingInvoice.igst) || 0);
    const curPaid = Number(editingInvoice.paidAmount) || 0;
    setEditingInvoice({
      ...editingInvoice,
      items: newItems,
      subtotal: newSubtotal,
      cgst: newCgst,
      sgst: newSgst,
      totalAmount: newTotal,
      balanceDue: Math.max(0, newTotal - curPaid),
    });
  };

  const handleRemoveLineItem = (index: number) => {
    if (!editingInvoice || editingInvoice.items.length <= 1) return;
    const newItems = editingInvoice.items.filter((_, i) => i !== index);
    const newSubtotal = newItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const newCgst = Math.round(newSubtotal * 0.069);
    const newSgst = Math.round(newSubtotal * 0.069);
    const newTotal = newSubtotal + newCgst + newSgst + (Number(editingInvoice.igst) || 0);
    const curPaid = Number(editingInvoice.paidAmount) || 0;
    setEditingInvoice({
      ...editingInvoice,
      items: newItems,
      subtotal: newSubtotal,
      cgst: newCgst,
      sgst: newSgst,
      totalAmount: newTotal,
      balanceDue: Math.max(0, newTotal - curPaid),
    });
  };

  // Issue 10% Commissioning Invoice modal state
  const [showIssue10Modal, setShowIssue10Modal] = useState(false);
  const [selectedProjectIdFor10, setSelectedProjectIdFor10] = useState<string>('');
  const [custom10Amount, setCustom10Amount] = useState<number>(0);
  const [custom10DueDate, setCustom10DueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [custom10Desc, setCustom10Desc] = useState<string>('');
  const [invoiceIssueSuccess, setInvoiceIssueSuccess] = useState<string | null>(null);

  // Milestone classification helpers
  const is90Advance = (inv: Invoice) => {
    const text = (inv.items?.map(it => it.description).join(' ') || '') + ' ' + (inv.invoiceNumber || '');
    return text.includes('90%') || text.toLowerCase().includes('advance') || text.toLowerCase().includes('mobilization');
  };

  const is10Commissioning = (inv: Invoice) => {
    const text = (inv.items?.map(it => it.description).join(' ') || '') + ' ' + (inv.invoiceNumber || '');
    return text.includes('10%') || text.toLowerCase().includes('commission') || text.toLowerCase().includes('net meter') || text.toLowerCase().includes('handover') || text.toLowerCase().includes('final');
  };

  // Automatically ensure all customers who have a 90% advance invoice have their 10% Commissioning Invoice available
  React.useEffect(() => {
    const advInvoices = invoices.filter(is90Advance);
    for (const adv of advInvoices) {
      const has10 = invoices.some(other => is10Commissioning(other) && (other.projectId === adv.projectId || other.customerId === adv.customerId));
      if (!has10) {
        const cust = customers.find(c => c.id === adv.customerId || c.phone === adv.customerPhone);
        const proj = projects.find(p => p.id === adv.projectId);
        const totalVal = cust?.totalOrderValue || Math.round(adv.totalAmount / 0.9);
        const amt10 = (cust?.balanceAmount !== undefined && cust.balanceAmount > 0) ? cust.balanceAmount : Math.max(1, totalVal - adv.totalAmount);
        const subtotal10 = Math.round(amt10 / 1.138);
        const gstHalf10 = Math.round((amt10 - subtotal10) / 2);
        const numDigits = adv.invoiceNumber.replace(/\D/g, '').slice(-3) || '001';

        createInvoice({
          id: `INV-10-${adv.projectId || adv.id}`,
          invoiceNumber: `INV-2026-F${numDigits}`,
          projectId: adv.projectId,
          customerId: adv.customerId,
          customerName: adv.customerName,
          customerPhone: adv.customerPhone,
          customerGstin: adv.customerGstin || '',
          issueDate: adv.issueDate || new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
          subtotal: subtotal10,
          cgst: gstHalf10,
          sgst: gstHalf10,
          igst: 0,
          totalAmount: amt10,
          paidAmount: cust?.balanceAmount === 0 ? amt10 : 0,
          balanceDue: cust?.balanceAmount === 0 ? 0 : amt10,
          status: cust?.balanceAmount === 0 ? 'Paid' : 'Sent',
          items: [
            {
              description: `10% Final Milestone: System Commissioning, Net Metering & Plant Handover for ${proj?.capacityKw || cust?.totalSystemKw || 5} kW Solar EPC Plant`,
              hsnCode: '995465',
              quantity: 1,
              rate: subtotal10,
              amount: subtotal10
            }
          ]
        });
      }
    }
  }, [invoices.length, customers.length, projects.length]);

  const countAll = invoices.length;
  const count90 = invoices.filter(is90Advance).length;
  const count10 = invoices.filter(is10Commissioning).length;
  const countSentToAuditor = invoices.filter(i => i.sentToAuditor).length;

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    const matchesMilestone = 
      milestoneFilter === 'All' ? true :
      milestoneFilter === 'auditor_received' ? Boolean(inv.sentToAuditor) :
      milestoneFilter === '90_advance' ? is90Advance(inv) :
      is10Commissioning(inv);
    return matchesSearch && matchesStatus && matchesMilestone;
  });

  // KPI Calculations
  const totalBilled = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalBalanceDue = invoices.reduce((sum, i) => sum + i.balanceDue, 0);
  const totalGst = invoices.reduce((sum, i) => sum + (i.cgst + i.sgst + i.igst), 0);

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.balanceDue);
  };

  const handleOpenRecordPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.balanceDue);
    setShowPaymentModal(true);
  };

  const handleOpenIssue10Modal = (projectId?: string) => {
    const defaultProj = (projectId ? projects.find(p => p.id === projectId) : null) || projects[0];
    if (defaultProj) {
      setSelectedProjectIdFor10(defaultProj.id);
      const cust = customers.find(c => c.id === defaultProj.customerId);
      const existing90 = invoices.find(i => (i.projectId === defaultProj.id || i.customerId === defaultProj.customerId) && is90Advance(i));
      const totalOrderVal = cust?.totalOrderValue || (existing90 ? Math.round(existing90.totalAmount / 0.9) : defaultProj.capacityKw * 40000);
      const pendingBal = (cust?.balanceAmount !== undefined && cust.balanceAmount > 0)
        ? cust.balanceAmount
        : Math.round(totalOrderVal * 0.1);

      setCustom10Amount(pendingBal);
      setCustom10Desc(`10% Final Milestone: System Commissioning, Net Metering & Plant Handover for ${defaultProj.capacityKw} kW Solar EPC Plant`);
    }
    setShowIssue10Modal(true);
  };

  const handleSelectProjectFor10 = (projId: string) => {
    setSelectedProjectIdFor10(projId);
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    const cust = customers.find(c => c.id === proj.customerId);
    const existing90 = invoices.find(i => (i.projectId === proj.id || i.customerId === proj.customerId) && is90Advance(i));
    const totalOrderVal = cust?.totalOrderValue || (existing90 ? Math.round(existing90.totalAmount / 0.9) : proj.capacityKw * 40000);
    const pendingBal = (cust?.balanceAmount !== undefined && cust.balanceAmount > 0)
      ? cust.balanceAmount
      : Math.round(totalOrderVal * 0.1);

    setCustom10Amount(pendingBal);
    setCustom10Desc(`10% Final Milestone: System Commissioning, Net Metering & Plant Handover for ${proj.capacityKw} kW Solar EPC Plant`);
  };

  const handleCreate10Invoice = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find(p => p.id === selectedProjectIdFor10);
    if (!proj) return;
    const cust = customers.find(c => c.id === proj.customerId);

    const amt = Number(custom10Amount);
    if (amt <= 0) return;

    const subtotal = Math.round(amt / 1.138);
    const totalGst = amt - subtotal;
    const cgst = Math.round(totalGst / 2);
    const sgst = totalGst - cgst;

    const newInv = createInvoice({
      projectId: proj.id,
      customerId: cust?.id || proj.customerId,
      customerName: cust?.name || proj.customerName,
      customerPhone: cust?.phone || proj.customerPhone,
      customerGstin: cust?.gstin || '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: custom10DueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      subtotal: subtotal,
      cgst: cgst,
      sgst: sgst,
      igst: 0,
      totalAmount: amt,
      paidAmount: 0,
      balanceDue: amt,
      status: 'Sent',
      items: [
        {
          description: custom10Desc || `10% Final Milestone: System Commissioning, Net Metering & Plant Handover for ${proj.capacityKw} kW Solar EPC Plant`,
          hsnCode: '995465',
          quantity: 1,
          rate: subtotal,
          amount: subtotal
        }
      ]
    });

    setShowIssue10Modal(false);
    setMilestoneFilter('10_commissioning');
    setSelectedInvoice(newInv);
    setInvoiceIssueSuccess(`Successfully issued 10% Commissioning Invoice ${newInv.invoiceNumber} for ${newInv.customerName} (₹${amt.toLocaleString('en-IN')})`);
    setTimeout(() => setInvoiceIssueSuccess(null), 6000);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    recordPayment({
      invoiceId: selectedInvoice.id,
      projectId: selectedInvoice.projectId,
      customerId: selectedInvoice.customerId,
      customerName: selectedInvoice.customerName,
      amount: payAmount,
      paymentMode: payMode,
      transactionReference: payRef,
      bankName: 'HDFC Bank',
    });

    setShowPaymentModal(false);
    setSelectedInvoice({
      ...selectedInvoice,
      paidAmount: selectedInvoice.paidAmount + payAmount,
      balanceDue: Math.max(0, selectedInvoice.balanceDue - payAmount),
      status: Math.max(0, selectedInvoice.balanceDue - payAmount) === 0 ? 'Paid' : 'Partially Paid',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Print Specific CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-tax-invoice, #printable-tax-invoice * {
            visibility: visible;
          }
          #printable-tax-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* VIEW MODE 1: DEDICATED FULL-PAGE A4 GST TAX INVOICE */}
      {activeViewMode === 'document' && selectedInvoice && (
        <div className="space-y-4">
          {/* Top Control Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs no-print">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveViewMode('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Invoices</span>
              </button>

              <div className="h-4 w-px bg-slate-200" />

              <span className="font-mono font-bold text-slate-900 text-xs">
                {selectedInvoice.invoiceNumber}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-medium">{selectedInvoice.customerName}</span>
            </div>

            <div className="flex items-center gap-2">
              {isAuditor ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg text-xs bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{selectedInvoice.sentToAuditor ? 'Received in Auditor Panel ✓' : 'Statutory Invoice'}</span>
                </span>
              ) : selectedInvoice.sentToAuditor ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Sent to Auditor ✓</span>
                </span>
              ) : (
                <button
                  type="button"
                  disabled={auditorSendingId === selectedInvoice.id}
                  onClick={() => handleDirectSendToAuditor(selectedInvoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg shadow-xs transition-colors cursor-pointer text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                  title="Forward invoice to Auditor panel"
                >
                  <Send className="w-4 h-4" />
                  <span>{auditorSendingId === selectedInvoice.id ? 'Sending...' : 'Send to Auditor'}</span>
                </button>
              )}

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Tax Invoice</span>
              </button>

              {!isAuditor && (
                <button
                  type="button"
                  onClick={() => handleStartEditInvoice(selectedInvoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 font-bold text-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer text-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Invoice</span>
                </button>
              )}

              {!isAuditor && selectedInvoice.balanceDue > 0 && (
                <button
                  onClick={() => {
                    setPayAmount(selectedInvoice.balanceDue);
                    setShowPaymentModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              )}
            </div>
          </div>

          {/* Full-Width Formal A4 Tax Invoice Letterhead */}
          <div id="printable-tax-invoice" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-5xl mx-auto space-y-6 text-xs text-slate-800">
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
              <div className="flex items-center gap-4">
                <img
                  src={getApiUrl('/logo.png')}
                  alt="AB Energy Solutions"
                  className="h-16 w-auto object-contain"
                />
                <div>
                  <h2 className="text-xl font-black tracking-tight text-emerald-950">
                    AB ENERGY SOLUTIONS
                  </h2>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    Certified Solar EPC &amp; Grid-Tied Renewable Power Systems
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                    No 13, Thammampatty Main Road, Maheswari Theatre Opposite Street, Vazhapadi, Salem, Tamil Nadu - 636115
                  </p>
                  <p className="text-[11px] font-mono font-bold text-slate-700 mt-0.5">
                    GSTIN: 33FSQPA3244H1ZU &bull; State: Tamil Nadu (33) &bull; Phone: +91 95664 99678 &bull; abenergysolutiontn@gmail.com
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tax Invoice
                </div>
                <div className="text-sm font-mono font-bold text-emerald-700 mt-0.5">
                  {selectedInvoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Issue Date: {selectedInvoice.issueDate}
                </div>
                <div className="text-xs text-slate-500">
                  Due Date: {selectedInvoice.dueDate}
                </div>
              </div>
            </div>

            {/* Billed To & Project Details */}
            <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Billed To (Client Details)
                </span>
                <div className="font-bold text-slate-900 text-sm">{selectedInvoice.customerName}</div>
                <div className="text-slate-600 mt-0.5">Contact: {selectedInvoice.customerPhone}</div>
                {selectedInvoice.customerGstin && (
                  <div className="text-slate-700 font-mono text-[11px] mt-1 font-semibold">
                    Client GSTIN: {selectedInvoice.customerGstin}
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  EPC Project Details
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  Project Ref: {selectedInvoice.projectId}
                </div>
                <div className="text-slate-600 mt-0.5">SAC Code: 995465 (Solar Turnkey EPC Contract)</div>
                <div className="text-slate-600">Reverse Charge: No</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Description of Goods / Services</th>
                    <th className="p-3 text-center">HSN/SAC</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Taxable Rate (₹)</th>
                    <th className="p-3 text-right">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedInvoice.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-900">{item.description}</td>
                      <td className="p-3 text-center font-mono text-slate-500">{item.hsnCode}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right font-mono">₹{item.rate.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & GST Breakdown */}
            <div className="flex justify-between items-start pt-2">
              {/* Bank Details */}
              <div className="max-w-xs p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                  Bank Payment Details (NEFT / RTGS)
                </span>
                <p>Account Name: <strong>AB Energy Solutions</strong></p>
                <p>Account No: <strong>50200084920192</strong></p>
                <p>Bank: <strong>HDFC Bank, Vazhapadi / Salem Branch</strong></p>
                <p>IFSC: <strong>HDFC0001248</strong></p>
                <p>UPI ID: <strong>abenergysolutiontn@okaxis</strong></p>
              </div>

              {/* Total Calculation */}
              <div className="w-80 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Subtotal (Taxable Amount)</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ₹{selectedInvoice.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Composite Solar GST (CGST + SGST)</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ₹{(selectedInvoice.cgst + selectedInvoice.sgst + selectedInvoice.igst).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-extrabold text-slate-900 bg-slate-50 px-3 rounded-lg border border-slate-200">
                  <span>Total Invoice Amount</span>
                  <span className="font-mono text-slate-900 text-base">
                    ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-slate-600">
                  <span>Amount Paid to Date</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    - ₹{selectedInvoice.paidAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-t border-slate-200 bg-emerald-50 px-3 rounded-lg border border-emerald-300 font-extrabold text-xs text-slate-900">
                  <span>Balance Due</span>
                  <span className="font-mono text-emerald-800 text-sm">
                    ₹{selectedInvoice.balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-12 text-xs text-slate-600">
              <div>
                <p className="text-[11px] text-slate-500">
                  Declaration: This invoice shows the actual price of goods and services described and that all particulars are true and correct.
                </p>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 mb-12">For AB Energy Solutions:</div>
                <div className="border-t border-slate-400 pt-1.5 w-48 ml-auto font-semibold text-slate-800">
                  Authorized Signatory &amp; Stamp
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: FULL-WIDTH HIGH-DENSITY INVOICE GRID */}
      {activeViewMode === 'grid' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Tax Invoices &amp; GST Billing
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Automated milestone invoices, 13.8% composite solar GST compliance, and payment reconciliations.
              </p>
            </div>
            {isAuditor ? (
              <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Auditor Access: Read-Only Verification</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenIssue10Modal()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue 10% Commissioning Invoice</span>
                </button>
              </div>
            )}
          </div>

          {invoiceIssueSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{invoiceIssueSuccess}</span>
            </div>
          )}

          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total Invoiced (Gross)
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                ₹{(totalBilled / 100000).toFixed(1)} Lakhs
              </div>
              <span className="text-[11px] font-semibold text-slate-500 block">
                {invoices.length} Milestone Invoices
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Collections Received
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                ₹{(totalPaid / 100000).toFixed(1)} Lakhs
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 block">
                Reconciled Bank Deposits
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Outstanding Balance Due
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                ₹{(totalBalanceDue / 100000).toFixed(1)} Lakhs
              </div>
              <span className="text-[11px] font-semibold text-amber-600 block">
                Pending Milestone Collections
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Composite Solar GST
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                ₹{(totalGst / 100000).toFixed(1)} Lakhs
              </div>
              <span className="text-[11px] font-semibold text-slate-500 block">
                13.8% Statutory Remittance
              </span>
            </div>
          </div>

          {/* Full-Width High-Density Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 space-y-3.5 text-xs">
              {/* Milestone Segmented Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMilestoneFilter('All')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      milestoneFilter === 'All'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Invoices ({countAll})
                  </button>
                  {isAuditor && (
                    <button
                      type="button"
                      onClick={() => setMilestoneFilter('auditor_received')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        milestoneFilter === 'auditor_received'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${milestoneFilter === 'auditor_received' ? 'bg-white' : 'bg-emerald-500'}`} />
                      <span>Received for Audit ({countSentToAuditor})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMilestoneFilter('90_advance')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      milestoneFilter === '90_advance'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${milestoneFilter === '90_advance' ? 'bg-white' : 'bg-emerald-500'}`} />
                    <span>90% Mobilization Advance ({count90})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMilestoneFilter('10_commissioning')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      milestoneFilter === '10_commissioning'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${milestoneFilter === '10_commissioning' ? 'bg-white' : 'bg-emerald-400'}`} />
                    <span>10% Commissioning &amp; Handover ({count10})</span>
                  </button>
                </div>

                <div className="text-[11px] font-semibold text-slate-500 hidden sm:block">
                  {milestoneFilter === 'All' && 'Viewing all milestone invoices across lifecycle'}
                  {milestoneFilter === '90_advance' && 'Viewing initial 90% advance mobilization invoices recorded at booking'}
                  {milestoneFilter === '10_commissioning' && 'Viewing 10% final commissioning, net-metering & handover invoices'}
                </div>
              </div>

              {/* Search & Status Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search invoice number, client name, phone..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Sent">Sent (Payment Due)</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile Card List (< lg) */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <div className="py-12 text-center text-slate-400 p-4 text-xs">
                  No invoices match your current search or status filter.
                </div>
              ) : (
                filteredInvoices.map(inv => {
                  const gstTotal = inv.cgst + inv.sgst + inv.igst;
                  const milestoneDesc = inv.items[0]?.description || 'EPC Milestone';

                  return (
                    <div
                      key={inv.id}
                      onClick={() => {
                        handleSelectInvoice(inv);
                        setActiveViewMode('document');
                      }}
                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-xs text-slate-900 block truncate">
                            {inv.invoiceNumber}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm truncate mt-0.5">{inv.customerName}</h4>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-slate-500 font-mono">
                              Project: {inv.projectId}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Project Completed</span>
                            </span>
                          </div>
                        </div>

                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          inv.status === 'Partially Paid' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg space-y-1">
                        <div className="flex items-center gap-1.5">
                          {is10Commissioning(inv) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              10% Commissioning &amp; Handover
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              90% Mobilization Advance
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-900">{milestoneDesc}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Total Amount</span>
                          <span className="font-bold text-slate-900 font-mono text-sm block">
                            ₹{inv.totalAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            Taxable: ₹{inv.subtotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Balance Due</span>
                          <span className="font-extrabold text-amber-700 font-mono text-sm block">
                            ₹{inv.balanceDue.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            GST: ₹{gstTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap" onClick={e => e.stopPropagation()}>
                        {isAuditor ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{inv.sentToAuditor ? 'Received for Audit ✓' : 'Statutory Invoice'}</span>
                          </span>
                        ) : inv.sentToAuditor ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg cursor-default">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sent to Auditor ✓</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={auditorSendingId === inv.id}
                            onClick={() => handleDirectSendToAuditor(inv)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{auditorSendingId === inv.id ? 'Sending...' : 'Send to Auditor'}</span>
                          </button>
                        )}
                        {!isAuditor && inv.balanceDue > 0 && (
                          <button
                            onClick={() => handleOpenRecordPayment(inv)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                          >
                            Record Payment
                          </button>
                        )}
                        {!isAuditor && (
                          <button
                            type="button"
                            onClick={() => handleStartEditInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Invoice"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleSelectInvoice(inv);
                            setActiveViewMode('document');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs ml-auto cursor-pointer"
                        >
                          View Invoice
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop High-Density Data Table (>= md) */}
            {/* Desktop Table (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Invoice Number</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Project Ref</th>
                    <th className="py-3 px-4">Milestone Description</th>
                    <th className="py-3 px-4 text-right">Taxable Base</th>
                    <th className="py-3 px-4 text-right">GST (13.8%)</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No invoices match your current search or status filter.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => {
                      const gstTotal = inv.cgst + inv.sgst + inv.igst;
                      const milestoneDesc = inv.items[0]?.description || 'EPC Milestone';

                      return (
                        <tr 
                          key={inv.id}
                          onClick={() => {
                            handleSelectInvoice(inv);
                            setActiveViewMode('document');
                          }}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-emerald-700">
                            <div>{inv.invoiceNumber}</div>
                            {inv.sentToAuditor && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 mt-0.5">
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                                Auditor Sent
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{inv.customerName}</div>
                            <div className="text-[11px] text-slate-400">{inv.customerPhone}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-xs font-bold text-slate-800">{inv.projectId}</div>
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Project Completed</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-medium max-w-xs">
                            <div className="flex items-center gap-1.5 mb-1">
                              {is10Commissioning(inv) ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  10% Commissioning &amp; Handover
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  90% Mobilization
                                </span>
                              )}
                            </div>
                            <div className="truncate text-xs font-semibold text-slate-900">{milestoneDesc}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                            ₹{inv.subtotal.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                            ₹{gstTotal.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            ₹{inv.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700">
                            ₹{inv.balanceDue.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              inv.status === 'Partially Paid' ? 'bg-amber-50 text-amber-900 border border-amber-300' :
                              'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {isAuditor ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{inv.sentToAuditor ? 'Received for Audit ✓' : 'Statutory Invoice'}</span>
                                </span>
                              ) : inv.sentToAuditor ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg cursor-default">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Sent to Auditor ✓</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={auditorSendingId === inv.id}
                                  onClick={() => handleDirectSendToAuditor(inv)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                  title="Send invoice directly to Auditor panel"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>{auditorSendingId === inv.id ? 'Sending...' : 'Send to Auditor'}</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  handleSelectInvoice(inv);
                                  setActiveViewMode('document');
                                }}
                                className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                View Doc
                              </button>
                              {!isAuditor && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditInvoice(inv)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Invoice"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {!isAuditor && inv.balanceDue > 0 && (
                                <button
                                  onClick={() => {
                                    handleSelectInvoice(inv);
                                    setShowPaymentModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                  Pay
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
              <span>Showing {filteredInvoices.length} of {invoices.length} invoices</span>
              <div className="flex items-center gap-1 font-semibold text-slate-600">
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Record Client Payment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Against {selectedInvoice.invoiceNumber} • {selectedInvoice.customerName}
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount to Record (₹) *</label>
                <input
                  type="number"
                  max={selectedInvoice.balanceDue}
                  min={1}
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Remaining Balance: ₹{selectedInvoice.balanceDue.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={e => setPayMode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="NEFT/RTGS">NEFT / RTGS Bank Transfer</option>
                  <option value="UPI">UPI / QR Payment</option>
                  <option value="Cheque">Bank Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">UTR / Cheque / Transaction Ref *</label>
                <input
                  type="text"
                  required
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="e.g. UTR-HDFC9842019"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirm &amp; Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue 10% Commissioning & Net Metering Balance Invoice Modal */}
      {showIssue10Modal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Final 10% Milestone
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Issue 10% Commissioning Invoice</h3>
                <p className="text-xs text-slate-500">
                  Generate statutory GST invoice for net-metering commissioning &amp; final handover.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIssue10Modal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate10Invoice} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Solar Project / Client *</label>
                <select
                  value={selectedProjectIdFor10}
                  onChange={e => handleSelectProjectFor10(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-800"
                >
                  {projects.map(p => {
                    const cust = customers.find(c => c.id === p.customerId);
                    const bal = cust?.balanceAmount !== undefined ? cust.balanceAmount : Math.round((p.capacityKw * 40000) * 0.1);
                    const isCompleted = p.stage === 'Completed';
                    return (
                      <option key={p.id} value={p.id}>
                        {isCompleted ? '✓ [Project Completed]' : '[90% Advance Paid]'} • {p.customerName} ({p.capacityKw} kW, {p.id}) — Balance 10%: ₹{bal.toLocaleString('en-IN')}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected Project Financial Breakdown */}
              {(() => {
                const proj = projects.find(p => p.id === selectedProjectIdFor10);
                const cust = customers.find(c => c.id === proj?.customerId);
                const existing90 = invoices.find(i => (i.projectId === proj?.id || i.customerId === proj?.customerId) && is90Advance(i));
                const totalOrderVal = cust?.totalOrderValue || (existing90 ? Math.round(existing90.totalAmount / 0.9) : (proj?.capacityKw || 5) * 40000);
                const existing10 = invoices.find(i => (i.projectId === proj?.id || i.customerId === proj?.customerId) && is10Commissioning(i));

                return (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-[11px] pb-1 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Project Lifecycle Status:</span>
                      {proj?.stage === 'Completed' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ Project Completed (Ready for 10% Handover Invoice)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          90% Advance Paid • Stage: {proj?.stage || 'In Progress'}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-600">
                      <span>Total EPC Order Value:</span>
                      <strong className="font-mono text-slate-900">₹{totalOrderVal.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-600">
                      <span>90% Advance Mobilization (Invoiced):</span>
                      <span className="font-mono font-semibold text-emerald-700">
                        {existing90 ? `₹${existing90.totalAmount.toLocaleString('en-IN')} (${existing90.status})` : `₹${Math.round(totalOrderVal * 0.9).toLocaleString('en-IN')}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-200 font-bold text-slate-900">
                      <span>10% Handover Balance Due:</span>
                      <span className="font-mono text-emerald-800 font-extrabold text-sm">
                        ₹{(cust?.balanceAmount !== undefined ? cust.balanceAmount : Math.round(totalOrderVal * 0.1)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {existing10 && (
                      <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-medium">
                        Notice: A 10% invoice ({existing10.invoiceNumber}) already exists for this project. Status: {existing10.status}.
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">10% Milestone Amount (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={custom10Amount}
                    onChange={e => setCustom10Amount(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={custom10DueDate}
                    onChange={e => setCustom10DueDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Invoice Line Item Description *</label>
                <input
                  type="text"
                  required
                  value={custom10Desc}
                  onChange={e => setCustom10Desc(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                />
              </div>

              {/* Statutory GST Math Preview */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-[11px]">
                <div className="flex justify-between text-emerald-950 font-bold">
                  <span>SAC Code: 995465</span>
                  <span>Composite Solar GST: 13.8%</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Base Subtotal:</span>
                  <span className="font-mono font-semibold">₹{Math.round(custom10Amount / 1.138).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST (6.9%) + SGST (6.9%):</span>
                  <span className="font-mono font-semibold">
                    ₹{(custom10Amount - Math.round(custom10Amount / 1.138)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t border-emerald-200">
                  <span>Gross Invoice Total:</span>
                  <span className="font-mono text-emerald-900">₹{custom10Amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIssue10Modal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate &amp; Issue 10% Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 bg-emerald-950 text-white">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Edit Tax Invoice ({editingInvoice.invoiceNumber})</h3>
                  <p className="text-[10px] text-emerald-300">Milestone EPC &amp; GST Tax Compliance Editor</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingInvoice(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditInvoice} className="p-5 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              {/* Row 1: Invoice metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    value={editingInvoice.invoiceNumber}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, invoiceNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date *</label>
                  <input
                    type="date"
                    value={editingInvoice.issueDate}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, issueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={editingInvoice.dueDate}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, dueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Status</label>
                  <select
                    value={editingInvoice.status}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Customer Details */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-900 block text-xs">Customer / Client Information</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      value={editingInvoice.customerName}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, customerName: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editingInvoice.customerPhone}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, customerPhone: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Client GSTIN</label>
                    <input
                      type="text"
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      value={editingInvoice.customerGstin || ''}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, customerGstin: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Installation Site Address</label>
                  <input
                    type="text"
                    value={editingInvoice.customerAddress || ''}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, customerAddress: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    placeholder="Full installation site address"
                  />
                </div>
              </div>

              {/* Row 3: Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Milestone Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 w-20 text-center">Qty</th>
                        <th className="p-2.5 w-32 text-right">Unit Rate (₹)</th>
                        <th className="p-2.5 w-32 text-right">Amount (₹)</th>
                        <th className="p-2.5 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editingInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                              className="w-full p-1.5 rounded border border-slate-300 text-xs font-medium"
                              required
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateLineItem(idx, 'quantity', e.target.value)}
                              className="w-full p-1.5 rounded border border-slate-300 text-xs text-center font-mono"
                              required
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={item.rate || item.unitRate || 0}
                              onChange={(e) => handleUpdateLineItem(idx, 'unitRate', e.target.value)}
                              className="w-full p-1.5 rounded border border-slate-300 text-xs text-right font-mono"
                              required
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            ₹{(Number(item.amount) || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 text-center">
                            {editingInvoice.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                title="Remove line item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 4: Tax Calculation Breakdown & Payments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Notes / Payment Terms</label>
                  <textarea
                    rows={4}
                    value={editingInvoice.notes || ''}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                    placeholder="Statutory payment instructions, bank details, or delivery remarks..."
                  />
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{editingInvoice.items.reduce((s, it) => s + (Number(it.amount) || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">CGST (6.9%)</label>
                      <input
                        type="number"
                        value={editingInvoice.cgst}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, cgst: Number(e.target.value) })}
                        className="w-full p-1.5 rounded border border-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">SGST (6.9%)</label>
                      <input
                        type="number"
                        value={editingInvoice.sgst}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, sgst: Number(e.target.value) })}
                        className="w-full p-1.5 rounded border border-slate-300 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-slate-900 font-extrabold text-sm">
                    <span>Total Amount (₹):</span>
                    <span className="font-mono text-emerald-800 text-base">
                      ₹{(
                        editingInvoice.items.reduce((s, it) => s + (Number(it.amount) || 0), 0) +
                        (Number(editingInvoice.cgst) || 0) +
                        (Number(editingInvoice.sgst) || 0) +
                        (Number(editingInvoice.igst) || 0)
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Amount Paid (₹)</label>
                      <input
                        type="number"
                        value={editingInvoice.paidAmount}
                        onChange={(e) => {
                          const p = Number(e.target.value) || 0;
                          const sub = editingInvoice.items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
                          const tot = sub + (Number(editingInvoice.cgst) || 0) + (Number(editingInvoice.sgst) || 0) + (Number(editingInvoice.igst) || 0);
                          setEditingInvoice({
                            ...editingInvoice,
                            paidAmount: p,
                            balanceDue: Math.max(0, tot - p),
                          });
                        }}
                        className="w-full p-1.5 rounded border border-slate-300 font-mono text-xs font-semibold text-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Balance Due (₹)</label>
                      <div className="p-1.5 rounded bg-emerald-50 border border-emerald-300 font-mono text-xs font-bold text-emerald-900">
                        ₹{(
                          Math.max(0, (
                            editingInvoice.items.reduce((s, it) => s + (Number(it.amount) || 0), 0) +
                            (Number(editingInvoice.cgst) || 0) +
                            (Number(editingInvoice.sgst) || 0) +
                            (Number(editingInvoice.igst) || 0)
                          ) - (Number(editingInvoice.paidAmount) || 0))
                        ).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Invoice Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
