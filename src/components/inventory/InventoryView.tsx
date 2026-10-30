import React, { useState } from 'react';
import { 
  Boxes, Plus, Search, Filter, AlertTriangle, CheckCircle2, 
  Truck, ArrowUpRight, ShoppingCart, RefreshCw, ShieldCheck
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { InventoryProduct } from '../../types';

export const InventoryView: React.FC = () => {
  const { products } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [items, setItems] = useState<InventoryProduct[]>(products);
  const [restockAlert, setRestockAlert] = useState<string | null>(null);

  const categories = ['All', 'Solar Panels', 'Inverters', 'Mounting Structures', 'DC/AC Cables', 'Protection BOS'];

  const filteredItems = items.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalValuation = items.reduce((acc, p) => acc + (p.currentStock * p.unitCost), 0);
  const totalReserved = items.reduce((acc, p) => acc + p.reservedStock, 0);
  const shortageCount = items.filter(p => p.availableStock <= p.minThreshold).length;

  const handleRestock = (sku: string, addQty: number) => {
    setItems(prev => prev.map(p => {
      if (p.sku === sku) {
        return {
          ...p,
          currentStock: p.currentStock + addQty,
          availableStock: p.availableStock + addQty,
        };
      }
      return p;
    }));
    setRestockAlert(`Restocked +${addQty} units for SKU ${sku}`);
    setTimeout(() => setRestockAlert(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Supply Chain &amp; Logistics
            </span>
            <span className="text-xs text-slate-400 font-medium">BOM Warehouse Registry</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Solar Inventory &amp; BOM Warehouse</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock reservation upon quotation approval, automated shortage alerts, and procurement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Warehouse Status:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Central Hub Operational
          </span>
        </div>
      </div>

      {restockAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{restockAlert}</span>
        </div>
      )}

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Inventory Value</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{(totalValuation / 100000).toFixed(2)}L
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">At landed purchase cost</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SKUs Registered</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{items.length}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Across 6 BOM categories</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reserved for EPC</div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{totalReserved} Units</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Locked to active projects</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Shortage Alerts</div>
          <div className={`text-2xl font-black font-mono mt-1 ${shortageCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {shortageCount}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Below minimum threshold</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKU code, brand, or model..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-hidden text-xs text-slate-900 placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                categoryFilter === cat 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-600 hover:bg-slate-100 bg-slate-50 border border-slate-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products: Mobile Cards (< lg) & Desktop Table (>= lg) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Mobile Cards (< lg) */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredItems.map(p => {
            const isShort = p.availableStock <= p.minThreshold;
            return (
              <div key={p.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{p.name}</h4>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{p.sku}</span>
                      <span>&bull;</span>
                      <span className="text-emerald-700 font-semibold">{p.category}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    isShort 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {isShort ? <AlertTriangle className="w-3 h-3 text-red-600" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    <span>{p.availableStock} {p.unit}</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Physical</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{p.currentStock} {p.unit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Reserved</span>
                    <span className="font-mono font-bold text-amber-700 text-xs">{p.reservedStock} {p.unit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Unit Cost</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">₹{p.unitCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Brand: {p.brand}</span>
                  <button
                    onClick={() => handleRestock(p.sku, 50)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-500" />
                    <span>Restock +50</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View (>= lg) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 uppercase font-extrabold text-[10px] text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">SKU &amp; Product Specification</th>
                <th className="py-3.5 px-4">Category &amp; Brand</th>
                <th className="py-3.5 px-4 text-center">Physical Stock</th>
                <th className="py-3.5 px-4 text-center">Project Reserved</th>
                <th className="py-3.5 px-4 text-center">Available Stock</th>
                <th className="py-3.5 px-4 text-right">Landed Unit Cost</th>
                <th className="py-3.5 px-4 text-right">Procurement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredItems.map(p => {
                const isShort = p.availableStock <= p.minThreshold;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{p.category}</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">{p.brand}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                      {p.currentStock} {p.unit}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-amber-700 font-mono">
                      {p.reservedStock} {p.unit}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isShort 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isShort ? <AlertTriangle className="w-3 h-3 text-red-600" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {p.availableStock} {p.unit}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                      ₹{p.unitCost.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRestock(p.sku, 50)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 text-slate-400" />
                        <span>Restock +50</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
