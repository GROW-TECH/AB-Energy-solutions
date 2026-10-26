import React, { useState } from 'react';
import { 
  Receipt, Plus, Search, Filter, Printer, Download, 
  CheckCircle2, Clock, AlertTriangle, ArrowRight, ArrowLeft,
  CreditCard, Check, IndianRupee, ShieldCheck
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { getApiUrl } from '../../utils/apiUrl';
import { Invoice } from '../../types';

export const InvoicesView: React.FC = () => {
  const { invoices, recordPayment } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeViewMode, setActiveViewMode] = useState<'grid' | 'document'>('grid');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices[0] || null);

  // Quick payment recording state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(selectedInvoice?.balanceDue || 0);
  const [payMode, setPayMode] = useState<any>('NEFT/RTGS');
  const [payRef, setPayRef] = useState(`NEFT-${Date.now().toString().slice(-6)}`);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
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
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Tax Invoice</span>
              </button>

              {selectedInvoice.balanceDue > 0 && (
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
                  <h2 className="text-xl font-black tracking-tight text-slate-900">
                    AB ENERGY SOLUTIONS
                  </h2>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    Certified Solar EPC &amp; Grid-Tied Renewable Power Systems
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    GSTIN: 29AABCS1429B1Z8 • Indiranagar, Bengaluru, KA 560038 • support@abenergy.in
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
                <p>Account Name: <strong>AB Energy Solutions Pvt Ltd</strong></p>
                <p>Account No: <strong>50200084920192</strong></p>
                <p>Bank: <strong>HDFC Bank, Indiranagar Branch</strong></p>
                <p>IFSC: <strong>HDFC0001248</strong></p>
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
          </div>

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
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
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
                  <option value="All">All Invoices</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Sent">Sent (Payment Due)</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            {/* High-Density Data Table */}
            <div className="overflow-x-auto">
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
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{inv.customerName}</div>
                            <div className="text-[11px] text-slate-400">{inv.customerPhone}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {inv.projectId}
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-medium truncate max-w-xs">
                            {milestoneDesc}
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
                              inv.status === 'Partially Paid' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                              'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  handleSelectInvoice(inv);
                                  setActiveViewMode('document');
                                }}
                                className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                View Doc
                              </button>
                              {inv.balanceDue > 0 && (
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
    </div>
  );
};
