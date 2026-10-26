import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { ExpenseItem } from '../../types';
import { 
  DollarSign, Plus, Search, Filter, Calendar, FileText, 
  CreditCard, CheckCircle2, Clock, AlertCircle, X, Download, Tag
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, projects, activeRole } = useCrm();

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

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.projectName && exp.projectName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    const matchesProject = projectFilter === 'all' || exp.projectId === projectFilter;
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;

    return matchesSearch && matchesCategory && matchesProject && matchesStatus;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + (e.totalAmount || e.amount || 0), 0);
  const totalTaxAmount = filteredExpenses.reduce((sum, e) => sum + (e.taxAmount || 0), 0);
  const paidCount = filteredExpenses.filter(e => e.status === 'Paid').length;
  const pendingCount = filteredExpenses.filter(e => e.status === 'Pending Approval').length;

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
      notes,
    });

    setTitle('');
    setVendorName('');
    setReceiptReference('');
    setNotes('');
    setShowNewExpenseModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <DollarSign className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Project Expenses & Direct Costs</h1>
              <p className="text-xs text-slate-500">Track civil foundation, cranes, DISCOM statutory fees, and BOS consumables</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNewExpenseModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total EPC Expenses</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ₹{totalExpenseAmount.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Total project direct expenditure</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Input GST Credit</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            ₹{totalTaxAmount.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-blue-700 font-medium">Eligible for GST input tax credit</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Paid Vouchers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{paidCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Disbursed via bank / company cards</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Awaiting accounts department audit</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by title, vendor, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Expense Categories</option>
              <option value="Civil & Structural">Civil & Structural</option>
              <option value="DISCOM Fees">DISCOM Fees</option>
              <option value="Cranage & Lifting">Cranage & Lifting</option>
              <option value="Freight & Logistics">Freight & Logistics</option>
              <option value="Electrical BOS">Electrical BOS</option>
              <option value="Testing & Inspection">Testing & Inspection</option>
              <option value="Travel & Site Allowance">Travel & Site Allowance</option>
            </select>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.id} - {p.customerName}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Reimbursed">Reimbursed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Expense Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Project Tag</th>
                <th className="py-3.5 px-4">Vendor / Payee</th>
                <th className="py-3.5 px-4">Mode & Date</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
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
                            <span>•</span>
                            <span>Ref: {exp.receiptReference}</span>
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
                      <div className="font-bold text-slate-900 text-sm">
                        ₹{exp.totalAmount.toLocaleString('en-IN')}
                      </div>
                      {exp.taxAmount > 0 && (
                        <div className="text-[10px] text-slate-400">
                          (GST: ₹{exp.taxAmount.toLocaleString('en-IN')})
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        exp.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        exp.status === 'Reimbursed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {exp.status}
                      </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Record Project Expense</h3>
              </div>
              <button 
                onClick={() => setShowNewExpenseModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Title / Item *</label>
                <input
                  type="text"
                  placeholder="e.g. Civil Foundation grouting chemical mortar"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseItem['category'])}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Civil & Structural">Civil & Structural</option>
                    <option value="DISCOM Fees">DISCOM Fees</option>
                    <option value="Cranage & Lifting">Cranage & Lifting</option>
                    <option value="Freight & Logistics">Freight & Logistics</option>
                    <option value="Electrical BOS">Electrical BOS</option>
                    <option value="Safety & PPE">Safety & PPE</option>
                    <option value="Testing & Inspection">Testing & Inspection</option>
                    <option value="Travel & Site Allowance">Travel & Site Allowance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Link to Solar Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Tax Amount (₹)</label>
                  <input
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as ExpenseItem['paymentMode'])}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
