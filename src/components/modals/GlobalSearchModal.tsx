import React, { useState, useEffect } from 'react';
import { 
  Search, X, User, UserCheck, FolderKanban, FileText, 
  Receipt, LifeBuoy, ArrowRight 
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { NavItemKey } from '../layout/Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavItemKey) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { globalSearch } = useCrm();
  const [query, setQuery] = useState('');

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const results = globalSearch(query);
  const totalResults = 
    results.leads.length + 
    results.customers.length + 
    results.projects.length + 
    results.quotations.length + 
    results.invoices.length + 
    results.tickets.length;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in zoom-in-95 duration-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by customer name, lead ID, phone, city, sanction no..."
            className="flex-1 text-sm bg-transparent border-none outline-hidden text-slate-900 placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button 
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Clear search text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-[11px] font-mono text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Close Search (ESC)"
          >
            <span>ESC</span>
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs divide-y divide-slate-100">
          {!query.trim() && (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <Search className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-500">Quickly find anything in AB Energy OS</p>
              <p className="text-[11px]">Type &quot;98450&quot;, &quot;Bangalore&quot;, &quot;Ramesh&quot;, &quot;INV&quot;, &quot;5kW&quot;, or &quot;Project&quot;</p>
            </div>
          )}

          {query.trim() && totalResults === 0 && (
            <div className="py-10 text-center text-slate-400">
              No matching records found for &quot;{query}&quot;
            </div>
          )}

          {/* Leads */}
          {results.leads.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Leads ({results.leads.length})</span>
              </div>
              <div className="space-y-1">
                {results.leads.map(l => (
                  <div
                    key={l.id}
                    onClick={() => { onNavigate('leads'); onClose(); }}
                    className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-700">
                        {l.name} <span className="text-slate-400 font-normal">({l.id})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {l.phone} • {l.city} • {l.recommendedKw} kW • Status: <span className="font-medium text-slate-700">{l.status}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transform group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div className="pt-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Customers ({results.customers.length})</span>
              </div>
              <div className="space-y-1">
                {results.customers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => { onNavigate('customers'); onClose(); }}
                    className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-700">
                        {c.name} <span className="text-slate-400 font-normal">({c.id})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.phone} • {c.totalSystemKw} kW Installed • Value: ₹{c.totalOrderValue.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transform group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {results.projects.length > 0 && (
            <div className="pt-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-emerald-600" />
                <span>Projects ({results.projects.length})</span>
              </div>
              <div className="space-y-1">
                {results.projects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => { onNavigate('projects'); onClose(); }}
                    className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-700">
                        {p.id} - {p.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {p.capacityKw} kW • Stage: <span className="font-medium text-emerald-700">{p.stage}</span> • PM: {p.projectManagerName}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transform group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotations */}
          {results.quotations.length > 0 && (
            <div className="pt-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quotations ({results.quotations.length})</span>
              </div>
              <div className="space-y-1">
                {results.quotations.map(q => (
                  <div
                    key={q.id}
                    onClick={() => { onNavigate('quotations'); onClose(); }}
                    className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-700">
                        {q.quotationNumber} - {q.leadName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {q.systemCapacityKw} kW • Total: ₹{q.totalAmount.toLocaleString('en-IN')} • Status: {q.status}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transform group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {results.invoices.length > 0 && (
            <div className="pt-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>Invoices ({results.invoices.length})</span>
              </div>
              <div className="space-y-1">
                {results.invoices.map(inv => (
                  <div
                    key={inv.id}
                    onClick={() => { onNavigate('invoices'); onClose(); }}
                    className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-700">
                        {inv.invoiceNumber} - {inv.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Total: ₹{inv.totalAmount.toLocaleString('en-IN')} • Balance Due: ₹{inv.balanceDue.toLocaleString('en-IN')} • Status: {inv.status}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transform group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tickets */}
          {results.tickets.length > 0 && (
            <div className="pt-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LifeBuoy className="w-3.5 h-3.5 text-emerald-600" />
                <span>Service Tickets ({results.tickets.length})</span>
              </div>
              <div className="space-y-1">
                {results.tickets.map(t => (
                  <div
                    key={t.id}
                    onClick={() => { onNavigate('service-tickets'); onClose(); }}
                    className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-700">
                        {t.ticketNumber} - {t.issueCategory}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {t.customerName} • Severity: {t.severity} • Status: {t.status} • Tech: {t.technicianName}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transform group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
