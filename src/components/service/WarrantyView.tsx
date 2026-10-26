import React, { useState } from 'react';
import { 
  ShieldCheck, Search, Filter, AlertTriangle, CheckCircle2, 
  Calendar, FileText, ArrowRight, Shield, Sun, Clock
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export const WarrantyView: React.FC = () => {
  const { warranties } = useCrm();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const filteredWarranties = warranties.filter(w => {
    const matchesSearch = 
      w.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.equipmentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || w.equipmentType === typeFilter;
    return matchesSearch && matchesType;
  });

  const panelCount = warranties.filter(w => w.equipmentType.toLowerCase().includes('panel') || w.equipmentType.toLowerCase().includes('module')).length;
  const inverterCount = warranties.filter(w => w.equipmentType.toLowerCase().includes('inverter')).length;
  const bosCount = warranties.filter(w => !w.equipmentType.toLowerCase().includes('panel') && !w.equipmentType.toLowerCase().includes('inverter')).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Operations &amp; Maintenance
            </span>
            <span className="text-xs text-slate-400 font-medium">OEM Guarantee Registry</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Solar Equipment Warranty Tracker</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-activated upon project commissioning: 25-year panel performance, 10-year inverter, 5-year BOS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Coverage Status:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            100% Active Protection
          </span>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Warranties</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{warranties.length}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Zero claims pending
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">PV Modules (25-Yr)</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{panelCount}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Tier-1 linear degradation</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Inverters (10-Yr)</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{inverterCount}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">OEM swap guarantee</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">BOS &amp; Structure (5-Yr)</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{bosCount}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Galvanized GI structures</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search equipment, serial number, customer or project..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-hidden text-xs text-slate-900 placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-500">Equipment Type:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">All Equipment</option>
            <option value="Solar PV Modules">Solar PV Modules</option>
            <option value="Solar Inverter">Solar Inverter</option>
            <option value="Mounting Structure">Mounting Structure</option>
          </select>
        </div>
      </div>

      {/* Main High-Density Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 uppercase font-extrabold text-[10px] text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Equipment &amp; Make / Model</th>
                <th className="py-3.5 px-4">Serial Number</th>
                <th className="py-3.5 px-4">Customer &amp; Project ID</th>
                <th className="py-3.5 px-4">Coverage Period</th>
                <th className="py-3.5 px-4">End Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredWarranties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-bold text-sm text-slate-800">No Warranties Registered</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {searchTerm
                        ? 'No warranties matched your search.'
                        : 'Warranties will auto-generate with 25-yr panel and 10-yr inverter OEM coverage once a project is commissioned.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredWarranties.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{w.equipmentType}</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">{w.makeModel}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded text-[11px] font-bold">
                        {w.serialNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{w.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{w.projectId}</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {w.warrantyPeriodYears} Years Full OEM Coverage
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {w.endDate}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {w.status}
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
