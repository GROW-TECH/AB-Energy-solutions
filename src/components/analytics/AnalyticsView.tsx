import React, { useState, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, SunMedium, UserCheck, 
  Leaf, Download, ArrowUpRight, ArrowDownRight, Calendar, 
  Filter, FileText, Wrench, ShieldCheck, LifeBuoy, Users, 
  Printer, CheckCircle2, AlertTriangle, Layers, Clock, 
  CreditCard, Receipt, FolderOpen, ExternalLink, ChevronRight, Zap
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { NavItemKey } from '../layout/Sidebar';

interface AnalyticsViewProps {
  initialSection?: 'executive' | 'sales' | 'projects' | 'finance' | 'service';
  onNavigate?: (tab: NavItemKey) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  initialSection = 'executive',
  onNavigate,
}) => {
  const { 
    leads, 
    projects, 
    invoices, 
    payments, 
    customers, 
    quotations, 
    surveys, 
    tickets, 
    amcs, 
    expenses,
    employees 
  } = useCrm();

  const [activeReportTab, setActiveReportTab] = useState<
    'executive' | 'sales' | 'projects' | 'finance' | 'service'
  >(initialSection);

  // Synchronize report tab whenever the sidebar navigation prop changes
  React.useEffect(() => {
    if (initialSection) {
      setActiveReportTab(initialSection);
      setStatusFilter('all');
    }
  }, [initialSection]);

  const handleSelectReportTab = (tab: 'executive' | 'sales' | 'projects' | 'finance' | 'service') => {
    setActiveReportTab(tab);
    setStatusFilter('all');
    if (onNavigate) {
      if (tab === 'sales') onNavigate('sales-reports');
      else if (tab === 'finance') onNavigate('finance-reports');
      else if (tab === 'projects') onNavigate('project-reports');
      else if (tab === 'service') onNavigate('service-reports');
    }
  };

  // Global Date Filter
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'quarter' | 'year'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Format currency
  const formatCurrency = (amount: number): string => {
    if (!amount || amount === 0) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Date filter helper
  const now = new Date();
  const isDateMatching = (dateStr?: string): boolean => {
    if (!dateStr || dateFilter === 'all') return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    if (dateFilter === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (dateFilter === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const recordQuarter = Math.floor(d.getMonth() / 3);
      return currentQuarter === recordQuarter && d.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'year') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchDate = isDateMatching(l.createdAt);
      const matchOwner = selectedEmployee === 'all' || l.assignedToId === selectedEmployee || l.assignedToName === selectedEmployee;
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchDate && matchOwner && matchStatus;
    });
  }, [leads, dateFilter, selectedEmployee, statusFilter]);

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchDate = isDateMatching(q.createdAt);
      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchDate && matchStatus;
    });
  }, [quotations, dateFilter, statusFilter]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchDate = isDateMatching(p.startDate);
      const matchOwner = selectedEmployee === 'all' || p.projectManagerId === selectedEmployee || p.projectManagerName === selectedEmployee;
      const matchStatus = statusFilter === 'all' || p.stage === statusFilter;
      return matchDate && matchOwner && matchStatus;
    });
  }, [projects, dateFilter, selectedEmployee, statusFilter]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => {
      const matchDate = isDateMatching(i.issueDate);
      const matchStatus = statusFilter === 'all' || i.status === statusFilter;
      return matchDate && matchStatus;
    });
  }, [invoices, dateFilter, statusFilter]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => isDateMatching(p.paymentDate));
  }, [payments, dateFilter]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => isDateMatching(e.date));
  }, [expenses, dateFilter]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchDate = isDateMatching(t.createdAt);
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchDate && matchStatus;
    });
  }, [tickets, dateFilter, statusFilter]);

  // Rollup Aggregations (from actual DB records)
  const totalKwSold = filteredProjects.reduce((acc, p) => acc + (p.capacityKw || 0), 0);
  const totalContractedRevenue = filteredProjects.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const totalInvoicedAmount = filteredInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalPaymentsCollected = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalOutstandingReceivables = filteredInvoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);
  const totalCommissionedKw = filteredProjects.filter(p => p.stage === 'Completed').reduce((acc, p) => acc + (p.capacityKw || 0), 0);
  const totalEpcExpenses = filteredExpenses.reduce((acc, e) => acc + (e.totalAmount || 0), 0);

  const wonLeadsCount = filteredLeads.filter(l => l.status === 'Won').length;
  const leadWinRate = filteredLeads.length > 0 ? Math.round((wonLeadsCount / filteredLeads.length) * 100) : 0;
  const collectionRatio = totalInvoicedAmount > 0 ? Math.round((totalPaymentsCollected / totalInvoicedAmount) * 100) : 0;

  // CSV Export Handler
  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = `AB_Energy_Report_${activeReportTab}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeReportTab === 'sales') {
      csvContent += 'Lead ID,Name,Phone,City,Source,Capacity kW,Status,Assigned To,Created Date\n';
      filteredLeads.forEach(l => {
        csvContent += `"${l.id}","${l.name}","${l.phone}","${l.city}","${l.source || ''}","${l.recommendedKw || 0}","${l.status}","${l.assignedToName || ''}","${l.createdAt || ''}"\n`;
      });
    } else if (activeReportTab === 'projects') {
      csvContent += 'Project ID,Customer Name,Capacity kW,Contract Value,Stage,Target Completion Date,Project Manager\n';
      filteredProjects.forEach(p => {
        csvContent += `"${p.id}","${p.customerName}","${p.capacityKw}","${p.totalAmount}","${p.stage}","${p.targetCompletionDate || ''}","${p.projectManagerName || ''}"\n`;
      });
    } else if (activeReportTab === 'finance') {
      csvContent += 'Invoice Number,Project ID,Customer Name,Issue Date,Due Date,Total Amount,Paid Amount,Balance Due,Status\n';
      filteredInvoices.forEach(i => {
        csvContent += `"${i.invoiceNumber}","${i.projectId}","${i.customerName}","${i.issueDate}","${i.dueDate}","${i.totalAmount}","${i.paidAmount}","${i.balanceDue}","${i.status}"\n`;
      });
    } else if (activeReportTab === 'service') {
      csvContent += 'Ticket ID,Customer Name,Issue Category,Priority,Status,Assigned Tech,Created Date\n';
      filteredTickets.forEach(t => {
        csvContent += `"${t.id}","${t.customerName}","${t.issueCategory || ''}","${t.priority}","${t.status}","${t.assignedTechnicianName || ''}","${t.createdAt || ''}"\n`;
      });
    } else {
      csvContent += 'Metric,Value\n';
      csvContent += `"Total Leads","${filteredLeads.length}"\n`;
      csvContent += `"Contracted Capacity kW","${totalKwSold}"\n`;
      csvContent += `"Contracted Revenue","${totalContractedRevenue}"\n`;
      csvContent += `"Total Invoiced","${totalInvoicedAmount}"\n`;
      csvContent += `"Total Collections","${totalPaymentsCollected}"\n`;
      csvContent += `"Outstanding Receivables","${totalOutstandingReceivables}"\n`;
      csvContent += `"Commissioned Capacity kW","${totalCommissionedKw}"\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Global Report Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Reports &amp; Business Analytics</h1>
              <p className="text-xs text-slate-500">Live operational auditing, cashflow ledger, and EPC delivery analytics</p>
            </div>
          </div>
        </div>

        {/* Global Export & Print Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => window.print()}
            title="Print or Save as PDF"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleExportCsv}
            title="Download CSV Table"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Module Navigation Subtabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => handleSelectReportTab('executive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReportTab === 'executive'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Executive Summary</span>
        </button>

        <button
          onClick={() => handleSelectReportTab('sales')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReportTab === 'sales'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Sales &amp; CRM Reports</span>
          <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 text-[10px] rounded-full">
            {filteredLeads.length}
          </span>
        </button>

        <button
          onClick={() => handleSelectReportTab('projects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReportTab === 'projects'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FolderOpen className="w-4 h-4 text-blue-400" />
          <span>Projects &amp; EPC Reports</span>
          <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 text-[10px] rounded-full">
            {filteredProjects.length}
          </span>
        </button>

        <button
          onClick={() => handleSelectReportTab('finance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReportTab === 'finance'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-400" />
          <span>Finance &amp; Accounts Reports</span>
          <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 text-[10px] rounded-full">
            {filteredInvoices.length}
          </span>
        </button>

        <button
          onClick={() => handleSelectReportTab('service')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReportTab === 'service'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <LifeBuoy className="w-4 h-4 text-rose-400" />
          <span>Service &amp; Care Reports</span>
          <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 text-[10px] rounded-full">
            {filteredTickets.length}
          </span>
        </button>
      </div>

      {/* Global Interactive Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Reporting Filter:</span>
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Financial Year</option>
          </select>

          {/* Employee Filter */}
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Team Members</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
            ))}
          </select>

          {/* Reset button */}
          {(dateFilter !== 'all' || selectedEmployee !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => { setDateFilter('all'); setSelectedEmployee('all'); setStatusFilter('all'); }}
              className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          Reporting Window: <strong className="text-slate-700 capitalize">{dateFilter}</strong>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. EXECUTIVE SUMMARY VIEW */}
      {/* ========================================================= */}
      {activeReportTab === 'executive' && (
        <div className="space-y-6">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Contracted Capacity</span>
                <SunMedium className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{totalKwSold} kW</div>
              <div className="text-[10px] text-slate-500 mt-1">
                Across {filteredProjects.length} solar installations
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Contracted Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">{formatCurrency(totalContractedRevenue)}</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-1">
                {formatCurrency(totalPaymentsCollected)} collected ({collectionRatio}%)
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Lead Win Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{leadWinRate}%</div>
              <div className="text-[10px] text-slate-500 mt-1">
                {wonLeadsCount} won out of {filteredLeads.length} leads
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Grid Commissioned</span>
                <Zap className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600">{totalCommissionedKw} kW</div>
              <div className="text-[10px] text-slate-500 mt-1">
                Generating green solar units
              </div>
            </div>
          </div>

          {/* Departmental Health Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Departmental Delivery Audit</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Department</th>
                    <th className="p-3">Total Volume</th>
                    <th className="p-3">In-Progress Queue</th>
                    <th className="p-3">Completed / Realized</th>
                    <th className="p-3">Financial Value</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>Sales &amp; Business Development</span>
                    </td>
                    <td className="p-3 font-semibold">{filteredLeads.length} Enquiries</td>
                    <td className="p-3 text-blue-600 font-semibold">{filteredLeads.filter(l => l.status !== 'Won' && l.status !== 'Lost').length} Active</td>
                    <td className="p-3 text-emerald-600 font-semibold">{wonLeadsCount} Deals Won</td>
                    <td className="p-3 font-black text-slate-900">{formatCurrency(filteredLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0))}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => setActiveReportTab('sales')} className="text-emerald-600 font-bold hover:underline cursor-pointer">
                        View Report →
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-blue-600" />
                      <span>Projects &amp; Rooftop EPC</span>
                    </td>
                    <td className="p-3 font-semibold">{filteredProjects.length} Projects</td>
                    <td className="p-3 text-blue-600 font-semibold">{filteredProjects.filter(p => p.stage !== 'Completed').length} Installing</td>
                    <td className="p-3 text-emerald-600 font-semibold">{filteredProjects.filter(p => p.stage === 'Completed').length} Commissioned</td>
                    <td className="p-3 font-black text-slate-900">{formatCurrency(totalContractedRevenue)}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => setActiveReportTab('projects')} className="text-emerald-600 font-bold hover:underline cursor-pointer">
                        View Report →
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      <span>Finance &amp; Collections</span>
                    </td>
                    <td className="p-3 font-semibold">{filteredInvoices.length} Invoices</td>
                    <td className="p-3 text-rose-600 font-semibold">{formatCurrency(totalOutstandingReceivables)} Due</td>
                    <td className="p-3 text-emerald-600 font-semibold">{formatCurrency(totalPaymentsCollected)} Received</td>
                    <td className="p-3 font-black text-slate-900">{formatCurrency(totalInvoicedAmount)}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => setActiveReportTab('finance')} className="text-emerald-600 font-bold hover:underline cursor-pointer">
                        View Report →
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <LifeBuoy className="w-4 h-4 text-rose-600" />
                      <span>Service &amp; O&amp;M Maintenance</span>
                    </td>
                    <td className="p-3 font-semibold">{filteredTickets.length} Tickets</td>
                    <td className="p-3 text-rose-600 font-semibold">{filteredTickets.filter(t => t.status !== 'Closed').length} Unresolved</td>
                    <td className="p-3 text-emerald-600 font-semibold">{filteredTickets.filter(t => t.status === 'Closed').length} Resolved</td>
                    <td className="p-3 font-black text-slate-900">{amcs.length} AMCs Live</td>
                    <td className="p-3 text-right">
                      <button onClick={() => setActiveReportTab('service')} className="text-emerald-600 font-bold hover:underline cursor-pointer">
                        View Report →
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SALES & CRM REPORTS */}
      {/* ========================================================= */}
      {activeReportTab === 'sales' && (
        <div className="space-y-6">
          {/* Sales Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Inquiries</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{filteredLeads.length}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Captured leads in filter</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Active Pipeline</div>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {filteredLeads.filter(l => l.status !== 'Won' && l.status !== 'Lost').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Under follow-up &amp; quote</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Deals Won</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{wonLeadsCount}</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">{leadWinRate}% conversion rate</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Quotations Issued</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{filteredQuotations.length}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Commercial proposals</div>
            </div>
          </div>

          {/* Leads Master Report Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Leads Pipeline Audit</h3>
                <p className="text-xs text-slate-400">All registered prospect records from database</p>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('leads')}
                  className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Leads Manager</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {filteredLeads.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Leads Found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No records match the current filter. Create a new lead to start populating this report.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5">Lead ID</th>
                      <th className="p-2.5">Customer Name</th>
                      <th className="p-2.5">Location</th>
                      <th className="p-2.5">Capacity (kW)</th>
                      <th className="p-2.5">Source</th>
                      <th className="p-2.5">Stage / Status</th>
                      <th className="p-2.5">Assigned Executive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-bold text-slate-900">{lead.id}</td>
                        <td className="p-2.5 font-medium text-slate-900">
                          <div>{lead.name}</div>
                          <div className="text-[10px] text-slate-400">{lead.phone}</div>
                        </td>
                        <td className="p-2.5">{lead.city}</td>
                        <td className="p-2.5 font-bold text-slate-900">{lead.recommendedKw || 0} kW</td>
                        <td className="p-2.5 text-slate-500">{lead.source || 'Direct'}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            lead.status === 'Won' ? 'bg-emerald-100 text-emerald-800' :
                            lead.status === 'Qualified' ? 'bg-blue-100 text-blue-800' :
                            lead.status === 'Lost' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-2.5 font-medium text-slate-700">{lead.assignedToName || 'Unassigned'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PROJECTS & EPC REPORTS */}
      {/* ========================================================= */}
      {activeReportTab === 'projects' && (
        <div className="space-y-6">
          {/* Projects Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total EPC Projects</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{filteredProjects.length}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Active installations</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Under Installation</div>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {filteredProjects.filter(p => p.stage !== 'Completed').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Mounting &amp; wiring</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Commissioned Plants</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {filteredProjects.filter(p => p.stage === 'Completed').length}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">{totalCommissionedKw} kW verified</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Order Value</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalContractedRevenue)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Contracted EPC value</div>
            </div>
          </div>

          {/* Projects Master Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">EPC Projects Execution Report</h3>
                <p className="text-xs text-slate-400">Milestone stages, target completion dates, and project managers</p>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('projects')}
                  className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Projects View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {filteredProjects.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Projects Found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Projects are generated upon customer quotation acceptance. No records match the current filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5">Project ID</th>
                      <th className="p-2.5">Customer Name</th>
                      <th className="p-2.5">System Capacity</th>
                      <th className="p-2.5">Contract Value</th>
                      <th className="p-2.5">Current Stage</th>
                      <th className="p-2.5">Target Completion</th>
                      <th className="p-2.5">Project Manager</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredProjects.map(proj => (
                      <tr key={proj.id} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-bold text-slate-900">{proj.id}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{proj.customerName}</td>
                        <td className="p-2.5 font-bold text-slate-900">{proj.capacityKw} kW</td>
                        <td className="p-2.5 font-black text-emerald-700">{formatCurrency(proj.totalAmount)}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            proj.stage === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            proj.stage === 'Installation In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {proj.stage}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500">{proj.targetCompletionDate || 'Not Set'}</td>
                        <td className="p-2.5 font-medium text-slate-700">{proj.projectManagerName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. FINANCE & ACCOUNTS REPORTS */}
      {/* ========================================================= */}
      {activeReportTab === 'finance' && (
        <div className="space-y-6">
          {/* Finance Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Invoiced</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalInvoicedAmount)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across {filteredInvoices.length} invoices</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Payments Collected</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(totalPaymentsCollected)}</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">{collectionRatio}% collection ratio</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Outstanding Receivables</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(totalOutstandingReceivables)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Pending customer dues</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Direct Site Expenses</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalEpcExpenses)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Civil, crane &amp; DISCOM fees</div>
            </div>
          </div>

          {/* Invoices Master Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Invoices &amp; Receivables Ledger</h3>
                <p className="text-xs text-slate-400">All customer tax invoices and current balances</p>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('invoices')}
                  className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Invoices</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Invoices Found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tax invoices generated for advance or milestone billing will be listed here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5">Invoice #</th>
                      <th className="p-2.5">Project ID</th>
                      <th className="p-2.5">Customer Name</th>
                      <th className="p-2.5">Issue Date</th>
                      <th className="p-2.5">Due Date</th>
                      <th className="p-2.5">Total Amount</th>
                      <th className="p-2.5">Paid Amount</th>
                      <th className="p-2.5">Balance Due</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="p-2.5 text-slate-500">{inv.projectId}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{inv.customerName}</td>
                        <td className="p-2.5 text-slate-500">{inv.issueDate}</td>
                        <td className="p-2.5 text-slate-500">{inv.dueDate}</td>
                        <td className="p-2.5 font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                        <td className="p-2.5 font-semibold text-emerald-700">{formatCurrency(inv.paidAmount)}</td>
                        <td className="p-2.5 font-bold text-rose-600">{formatCurrency(inv.balanceDue)}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                            inv.status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                            inv.status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. SERVICE & CARE REPORTS */}
      {/* ========================================================= */}
      {activeReportTab === 'service' && (
        <div className="space-y-6">
          {/* Service Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Service Tickets</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{filteredTickets.length}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Logged customer issues</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Open Tickets</div>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {filteredTickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Awaiting resolution</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Resolved Tickets</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {filteredTickets.filter(t => t.status === 'Closed' || t.status === 'Resolved').length}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Successfully closed</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Active AMC Contracts</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{amcs.length}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Annual maintenance plans</div>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Service &amp; O&amp;M Tickets</h3>
                <p className="text-xs text-slate-400">Field breakdown support requests</p>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('service-tickets')}
                  className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Service Desk</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <LifeBuoy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Service Tickets Found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Customer breakdown or maintenance support tickets will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5">Ticket ID</th>
                      <th className="p-2.5">Customer Name</th>
                      <th className="p-2.5">Issue Category</th>
                      <th className="p-2.5">Priority</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Assigned Technician</th>
                      <th className="p-2.5">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredTickets.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-bold text-slate-900">{t.id}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{t.customerName}</td>
                        <td className="p-2.5 text-slate-600">{t.issueCategory}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                            t.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="p-2.5 font-semibold">{t.status}</td>
                        <td className="p-2.5 font-medium text-slate-700">{t.assignedTechnicianName || 'Unassigned'}</td>
                        <td className="p-2.5 text-slate-500">{t.createdAt?.split('T')[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
