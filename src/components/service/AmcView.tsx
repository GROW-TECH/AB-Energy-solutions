import React, { useState } from 'react';
import { 
  Clock, Plus, Search, Filter, Calendar, CheckCircle2, 
  Wrench, ShieldCheck, ArrowRight, UserCheck 
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export const AmcView: React.FC = () => {
  const { amcs } = useCrm();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAmcs = amcs.filter(a =>
    a.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>Annual Maintenance Contracts (AMC)</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {amcs.length} Contracts
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Preventative maintenance visits, module thermal scanning, and automated contract renewals.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-200 flex items-center gap-2 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search AMC ID, plan name, customer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-hidden text-xs text-slate-800"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 uppercase font-bold text-[10px] text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Contract ID &amp; Plan</th>
                <th className="py-3 px-4">Customer &amp; Capacity</th>
                <th className="py-3 px-4 text-center">Visits Completed</th>
                <th className="py-3 px-4">Next Scheduled Visit</th>
                <th className="py-3 px-4 text-right">Annual Value</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAmcs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Clock className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-bold text-sm text-slate-800">No AMC Contracts Found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {searchTerm
                        ? 'No AMC contracts matched your search.'
                        : 'Preventive maintenance AMC plans will automatically activate as soon as a project completes commissioning.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAmcs.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{a.id}</div>
                      <div className="text-[11px] font-semibold text-emerald-800">{a.planName}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{a.customerName}</div>
                      <div className="text-[10px] text-slate-400">{a.capacityKw} kW System</div>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {a.completedVisits} / {a.visitsPerYear} Visits
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {a.nextScheduledVisit}
                    </td>

                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      ₹{a.annualPrice.toLocaleString('en-IN')}/yr
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        a.status === 'Renewal Due' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
