import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Search, Filter, Download, RotateCw, 
  ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, 
  XCircle, Clock, Eye, X, Terminal, Database, User, Globe
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  category: string;
  details: string;
  targetEntityId?: string;
  targetEntityType?: string;
  ipAddress: string;
  status: 'Success' | 'Warning' | 'Failed';
  metadata?: any;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const AuditLogsView: React.FC = () => {
  const { authFetch } = useCrm();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Fetch audit logs with pagination and filters
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(category !== 'all' ? { category } : {}),
        ...(status !== 'all' ? { status } : {}),
      });

      const res = await authFetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setLogs(data.data || []);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, page, limit, search, category, status]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle Search submit
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  // CSV Export
  const handleExportCsv = () => {
    if (logs.length === 0) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Log ID,Timestamp,Actor,Role,Action,Category,Target ID,Target Type,Status,IP Address,Details\n';

    logs.forEach(l => {
      csvContent += `"${l.id}","${l.createdAt}","${l.userName}","${l.userRole}","${l.action}","${l.category}","${l.targetEntityId || ''}","${l.targetEntityType || ''}","${l.status}","${l.ipAddress}","${l.details.replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Logs_Page_${pagination.page}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'security':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'sales':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'engineering':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'finance':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'operations':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Success</span>
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Warning</span>
          </span>
        );
      case 'Failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Failed</span>
          </span>
        );
    }
  };

  const startEntry = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endEntry = Math.min(pagination.total, pagination.page * pagination.limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-900 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Security &amp; Compliance Audit Logs</h1>
              <p className="text-xs text-slate-500">Immutable server-recorded authentication, permission, and workflow event records</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by action, user, details, entity ID, or IP..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={handleCategoryChange}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Security">Security &amp; Auth</option>
            <option value="Sales">Sales &amp; CRM</option>
            <option value="Engineering">Engineering &amp; Surveys</option>
            <option value="Finance">Finance &amp; Invoices</option>
            <option value="Operations">Operations &amp; EPC</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={handleStatusChange}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Failed">Failed</option>
          </select>

          {(search || category !== 'all' || status !== 'all') && (
            <button
              onClick={() => { setSearch(''); setCategory('all'); setStatus('all'); setPage(1); }}
              className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Per-Page Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Rows per page:</span>
          <select
            value={limit}
            onChange={handleLimitChange}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor / User</th>
                <th className="p-3">Event Action</th>
                <th className="p-3">Category</th>
                <th className="p-3">Target Entity</th>
                <th className="p-3">Details</th>
                <th className="p-3">Status</th>
                <th className="p-3">IP Address</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No Audit Records Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No system events match the selected search criteria or date filters.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 whitespace-nowrap text-slate-500">
                      <div className="font-semibold text-slate-900">
                        {new Date(log.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.userName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {log.userRole}
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(log.category)}`}>
                        {log.category}
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {log.targetEntityId ? (
                        <div>
                          <span className="font-bold text-slate-900">{log.targetEntityId}</span>
                          {log.targetEntityType && (
                            <div className="text-[10px] text-slate-400">{log.targetEntityType}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="p-3 max-w-xs truncate text-slate-600 font-medium">
                      {log.details}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>

                    <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>{log.ipAddress}</span>
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                        title="View Detailed Payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS (Requested feature!) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Showing <strong className="text-slate-900">{startEntry}</strong> to <strong className="text-slate-900">{endEntry}</strong> of <strong className="text-slate-900">{pagination.total}</strong> audit entries
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            {/* Prev Page Button */}
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={pagination.page <= 1 || isLoading}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Page number buttons */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;

                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      disabled={isLoading}
                      className={`min-w-8 h-8 px-2 rounded-lg font-bold transition-colors cursor-pointer ${
                        p === pagination.page
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            {/* Next Page Button */}
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-900 text-emerald-400 rounded-lg">
                  <Terminal className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Audit Record Inspection</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Event Action</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{selectedLog.action}</div>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Actor / Identity</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedLog.userName}</div>
                  <div className="text-slate-500 text-[11px]">{selectedLog.userRole} • IP: {selectedLog.ipAddress}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Event Summary</div>
                <p className="text-slate-700 text-xs mt-1 leading-relaxed">{selectedLog.details}</p>
                {selectedLog.targetEntityId && (
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">
                    Entity Target: <strong className="text-slate-900">{selectedLog.targetEntityId}</strong> ({selectedLog.targetEntityType || 'Record'})
                  </div>
                )}
              </div>

              {/* JSON Metadata Payload */}
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5">
                  Technical Payload &amp; Context
                </div>
                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] max-h-48 overflow-y-auto">
                  <pre>{JSON.stringify(selectedLog.metadata || { noPayload: true }, null, 2)}</pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
