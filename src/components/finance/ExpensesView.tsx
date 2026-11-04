import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { ExpenseItem } from '../../types';
import { 
  DollarSign, Plus, Search, Filter, Calendar, FileText, 
  CreditCard, CheckCircle2, Clock, AlertCircle, X, Download, Tag,
  Upload, Eye, ShieldCheck, Phone, Send, ImageIcon, Check
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, projects, activeRole, currentUser, sendExpenseToAuditor } = useCrm();

  const isAuditor = activeRole === 'Auditor' || currentUser?.role === 'Auditor';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);

  // New expense form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseItem['category']>('Civil & Structural');
  const [amount, setAmount] = useState<number>(15000);
  const [taxAmount, setTaxAmount] = useState<number>(2700);
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [vendorName, setVendorName] = useState('');
  const [paymentMode, setPaymentMode] = useState<ExpenseItem['paymentMode']>('Bank Transfer');
  const [receiptReference, setReceiptReference] = useState('');
  const [notes, setNotes] = useState('');

  // Invoice Document Upload State
  const [invoiceDoc, setInvoiceDoc] = useState<string>('');
  const [invoiceDocName, setInvoiceDocName] = useState<string>('');

  // Lightbox Document Preview Modal State
  const [selectedDocView, setSelectedDocView] = useState<{ title: string; url: string; fileName?: string } | null>(null);

  // Direct Send to Auditor state
  const [auditorSendingExpId, setAuditorSendingExpId] = useState<string | null>(null);

  const handleDirectSendExpenseToAuditor = async (exp: ExpenseItem) => {
    setAuditorSendingExpId(exp.id);
    try {
      await sendExpenseToAuditor(exp.id);
    } finally {
      setAuditorSendingExpId(null);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.projectName && exp.projectName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    const matchesProject = projectFilter === 'all' || exp.projectId === projectFilter;
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'Sent to Auditor' 
      ? Boolean(exp.sentToAuditor) 
      : exp.status === statusFilter;

    return matchesSearch && matchesCategory && matchesProject && matchesStatus;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + (e.totalAmount || e.amount || 0), 0);
  const totalTaxAmount = filteredExpenses.reduce((sum, e) => sum + (e.taxAmount || 0), 0);
  const paidCount = filteredExpenses.filter(e => e.status === 'Paid').length;
  const pendingCount = filteredExpenses.filter(e => e.status === 'Pending Approval').length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoiceDocName(file.name);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setInvoiceDoc(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const selectedProject = projects.find(p => p.id === projectId);

    addExpense({
      title,
      category,
      amount: Number(amount),
      taxAmount: Number(taxAmount),
      projectId: projectId || undefined,
      projectName: selectedProject ? `${selectedProject.customerName} (${selectedProject.capacityKw} kW)` : 'General Overhead',
      vendorName: vendorName || 'Vendor',
      paymentMode,
      receiptReference: receiptReference || `BILL-${Date.now().toString().slice(-4)}`,
      status: 'Paid',
      recordedBy: activeRole,
      invoiceDocument: invoiceDoc || undefined,
      invoiceFileName: invoiceDocName || undefined,
      notes,
    });

    setTitle('');
    setVendorName('');
    setReceiptReference('');
    setNotes('');
    setInvoiceDoc('');
    setInvoiceDocName('');
    setShowNewExpenseModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <DollarSign className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Project Expenses &amp; Direct Costs</h1>
              <p className="text-xs text-slate-500">Track civil foundation, cranes, DISCOM statutory fees, and verified invoice bills</p>
            </div>
          </div>
        </div>

        {isAuditor ? (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Auditor Access: Read-Only Verification</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowNewExpenseModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Project Expense</span>
            </button>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total EPC Expenses</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            ₹{totalExpenseAmount.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Total project direct expenditure</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Input GST Credit</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">
            ₹{totalTaxAmount.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-emerald-800 font-medium">Eligible for GST input tax credit</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Paid Vouchers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">{paidCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Disbursed via bank / company cards</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 font-mono">{pendingCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Awaiting accounts department audit</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by title, vendor, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">All Expense Categories</option>
              <option value="Civil & Structural">Civil &amp; Structural</option>
              <option value="DISCOM Fees">DISCOM Fees</option>
              <option value="Cranage & Lifting">Cranage &amp; Lifting</option>
              <option value="Freight & Logistics">Freight &amp; Logistics</option>
              <option value="Electrical BOS">Electrical BOS</option>
              <option value="Testing & Inspection">Testing &amp; Inspection</option>
              <option value="Travel & Site Allowance">Travel &amp; Site Allowance</option>
            </select>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.id} - {p.customerName}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Sent to Auditor">Received for Audit</option>
              <option value="Paid">Paid</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Reimbursed">Reimbursed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Mobile Cards (< lg) */}
      <div className="lg:hidden divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <DollarSign className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">No expense records found</p>
          </div>
        ) : (
          filteredExpenses.map(exp => (
            <div key={exp.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-slate-500 font-bold">{exp.expenseNumber}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      exp.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      exp.status === 'Reimbursed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {exp.status}
                    </span>
                    {exp.sentToAuditor && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        <Check className="w-2.5 h-2.5 text-emerald-700" />
                        Sent to Auditor
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">{exp.title}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {exp.paymentDate} &bull; {exp.paymentMode}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-900 text-sm font-mono">
                    ₹{exp.totalAmount.toLocaleString('en-IN')}
                  </div>
                  {exp.taxAmount > 0 && (
                    <div className="text-[10px] text-emerald-700 font-semibold font-mono">
                      GST ₹{exp.taxAmount.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Category:</span>
                  <span className="font-semibold text-slate-800">{exp.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Project:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[180px]">{exp.projectName || exp.projectId || 'General Overhead'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Vendor / Payee:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[180px]">{exp.vendorName}</span>
                </div>
                {exp.receiptReference && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Invoice Ref:</span>
                    <span className="font-mono text-slate-800 font-bold">{exp.receiptReference}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                {exp.invoiceDocument ? (
                  <button
                    type="button"
                    onClick={() => setSelectedDocView({
                      title: exp.title,
                      url: exp.invoiceDocument!,
                      fileName: exp.invoiceFileName
                    })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Bill Doc</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No Bill Uploaded</span>
                )}

                {isAuditor ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{exp.sentToAuditor ? 'Received for Audit ✓' : 'Expense Voucher'}</span>
                  </span>
                ) : exp.sentToAuditor ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg cursor-default">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Sent to Auditor ✓</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={auditorSendingExpId === exp.id}
                    onClick={() => handleDirectSendExpenseToAuditor(exp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{auditorSendingExpId === exp.id ? 'Sending...' : 'Send to Auditor'}</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Expenses Table (Desktop >= lg) */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Expense Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Project Tag</th>
                <th className="py-3.5 px-4">Vendor / Payee</th>
                <th className="py-3.5 px-4">Mode &amp; Date</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                <th className="py-3.5 px-4 text-center">Invoice Bill</th>
                <th className="py-3.5 px-4 text-center">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <DollarSign className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No expense records found</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{exp.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono">{exp.expenseNumber}</span>
                        {exp.receiptReference && (
                          <>
                            <span>&bull;</span>
                            <span className="font-bold text-slate-600">Ref: {exp.receiptReference}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{exp.projectName || 'General Overhead'}</div>
                      {exp.projectId && (
                        <div className="text-[11px] text-emerald-700 font-mono">{exp.projectId}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{exp.vendorName}</div>
                      <div className="text-[10px] text-slate-400">Logged by {exp.recordedBy}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{exp.paymentDate}</div>
                      <div className="text-[10px] text-slate-400">{exp.paymentMode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-slate-900 text-sm font-mono">
                        ₹{exp.totalAmount.toLocaleString('en-IN')}
                      </div>
                      {exp.taxAmount > 0 && (
                        <div className="text-[10px] text-emerald-700 font-semibold font-mono">
                          (GST: ₹{exp.taxAmount.toLocaleString('en-IN')})
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {exp.invoiceDocument ? (
                        <button
                          type="button"
                          onClick={() => setSelectedDocView({
                            title: exp.title,
                            url: exp.invoiceDocument!,
                            fileName: exp.invoiceFileName
                          })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Bill</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[11px] font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isAuditor ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{exp.sentToAuditor ? 'Received ✓' : 'Expense Voucher'}</span>
                        </span>
                      ) : exp.sentToAuditor ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg cursor-default">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Sent to Auditor ✓</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={auditorSendingExpId === exp.id}
                          onClick={() => handleDirectSendExpenseToAuditor(exp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          <span>{auditorSendingExpId === exp.id ? 'Sending...' : 'Send to Auditor'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showNewExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Record Project Expense</h3>
              </div>
              <button 
                onClick={() => setShowNewExpenseModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Title / Item *</label>
                <input
                  type="text"
                  placeholder="e.g. Civil Foundation grouting chemical mortar"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseItem['category'])}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="Civil & Structural">Civil &amp; Structural</option>
                    <option value="DISCOM Fees">DISCOM Fees</option>
                    <option value="Cranage & Lifting">Cranage &amp; Lifting</option>
                    <option value="Freight & Logistics">Freight &amp; Logistics</option>
                    <option value="Electrical BOS">Electrical BOS</option>
                    <option value="Safety & PPE">Safety &amp; PPE</option>
                    <option value="Testing & Inspection">Testing &amp; Inspection</option>
                    <option value="Travel & Site Allowance">Travel &amp; Site Allowance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Link to Solar Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="">General Overhead (No Project)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.id} - {p.customerName} ({p.capacityKw} kW)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Amount (₹) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Tax Amount (₹)</label>
                  <input
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Payee Name</label>
                  <input
                    type="text"
                    placeholder="e.g. BuildCraft Civil Works"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as ExpenseItem['paymentMode'])}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Company Card">Company Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Petty Cash">Petty Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice / Receipt Reference No.</label>
                <input
                  type="text"
                  placeholder="e.g. TAX-INV-88910"
                  value={receiptReference}
                  onChange={(e) => setReceiptReference(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Upload Invoice Image or Document */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Upload Invoice Image or Document (Bill/Receipt)
                </label>
                <p className="text-[11px] text-slate-500">
                  Upload scanned vendor tax invoice, GST bill, or payment receipt image (.jpg, .png, .pdf) for auditor verification.
                </p>

                {invoiceDoc ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-emerald-950 text-xs truncate max-w-[220px]">
                        {invoiceDocName || 'Invoice Bill Attached'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceDoc('');
                        setInvoiceDocName('');
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white rounded-xl cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-emerald-800">Choose Invoice Image / PDF</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Click to browse (.jpg, .png, .pdf)</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Expense &amp; Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Document Viewer Modal */}
      {selectedDocView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-300">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm truncate max-w-md">
                  Expense Invoice Document: {selectedDocView.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocView(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-100 min-h-[350px]">
              {selectedDocView.url.startsWith('data:application/pdf') || selectedDocView.url.endsWith('.pdf') ? (
                <iframe
                  src={selectedDocView.url}
                  title="Invoice PDF"
                  className="w-full h-[500px] rounded-lg border border-slate-300 bg-white"
                />
              ) : (
                <img
                  src={selectedDocView.url}
                  alt={selectedDocView.title}
                  className="max-h-[500px] w-auto max-w-full rounded-lg object-contain shadow-md"
                />
              )}
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500 font-semibold">{selectedDocView.fileName || 'Attached Invoice Bill'}</span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedDocView.url}
                  download={selectedDocView.fileName || 'expense-invoice.png'}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedDocView(null)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
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
