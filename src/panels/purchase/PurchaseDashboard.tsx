import React from 'react';
import { 
  ShoppingCart, Layers, Boxes, Truck, CheckCircle2, 
  Clock, AlertTriangle, ArrowRight, IndianRupee, 
  FileText, ShieldCheck, Warehouse, ArrowUpRight
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface PurchaseDashboardProps {
  onNavigateToTab: (tab: string) => void;
}

export const PurchaseDashboard: React.FC<PurchaseDashboardProps> = ({
  onNavigateToTab,
}) => {
  const { purchaseOrders, suppliers, products, materialAllocations } = useCrm();

  const totalPoValue = purchaseOrders.reduce((sum, po) => sum + (po.grandTotal || 0), 0);
  const openPos = purchaseOrders.filter(po => po.status === 'Draft' || po.status === 'Issued' || po.status === 'In-Transit');
  const receivedPos = purchaseOrders.filter(po => po.status === 'Received');
  const pendingIndents = materialAllocations.filter(m => m.status === 'Planning' || m.status === 'Indented');
  const lowStockCount = products.filter(p => p.availableStock <= p.minThreshold).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Purchase &amp; Supply Chain Desk</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Procurement, Vendor POs &amp; GRN Inwarding Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Directly connected to Site Survey BOMs, PM approvals, vendor procurement, and warehouse stock receipts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onNavigateToTab('materials')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>View BOM Indents</span>
            </button>
            <button
              onClick={() => onNavigateToTab('purchase-orders')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Issue Purchase Order</span>
            </button>
          </div>
        </div>

        {/* 4 Procurement KPI Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div 
            onClick={() => onNavigateToTab('purchase-orders')}
            className="p-4 bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/80 rounded-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-emerald-700">Issued PO Value</span>
              <IndianRupee className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">₹{(totalPoValue / 100000).toFixed(2)}L</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center justify-between">
              <span>{purchaseOrders.length} Purchase Orders</span>
              <span className="text-emerald-700 font-bold group-hover:underline flex items-center gap-0.5">
                Manage <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          <div 
            onClick={() => onNavigateToTab('purchase-orders')}
            className="p-4 bg-slate-50 hover:bg-amber-50/40 border border-slate-200/80 rounded-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-amber-700">Open / Active POs</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600">{openPos.length}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center justify-between">
              <span>{receivedPos.length} Inwarded (GRN)</span>
              <span className="text-amber-700 font-bold group-hover:underline flex items-center gap-0.5">
                Track <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          <div 
            onClick={() => onNavigateToTab('materials')}
            className="p-4 bg-slate-50 hover:bg-blue-50/40 border border-slate-200/80 rounded-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-blue-700">BOM Indents Waiting</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{pendingIndents.length}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center justify-between">
              <span>Approved by Project Managers</span>
              <span className="text-blue-700 font-bold group-hover:underline flex items-center gap-0.5">
                Procure <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          <div 
            onClick={() => onNavigateToTab('suppliers')}
            className="p-4 bg-slate-50 hover:bg-teal-50/40 border border-slate-200/80 rounded-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-teal-700">Active Tier-1 Suppliers</span>
              <Truck className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{suppliers.length}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center justify-between">
              <span>{lowStockCount > 0 ? `${lowStockCount} items low stock` : 'Healthy stock levels'}</span>
              <span className="text-teal-700 font-bold group-hover:underline flex items-center gap-0.5">
                Directory <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Purchase Orders */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <ShoppingCart className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900">Recent Purchase Orders (POs)</h2>
            </div>
            <button
              onClick={() => onNavigateToTab('purchase-orders')}
              className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>View All POs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {purchaseOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No Purchase Orders recorded yet.</p>
              <button
                onClick={() => onNavigateToTab('purchase-orders')}
                className="mt-3 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Create First Purchase Order
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-2">PO #</th>
                    <th className="pb-2">Supplier</th>
                    <th className="pb-2">Warehouse</th>
                    <th className="pb-2">Grand Total</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.slice(0, 6).map(po => (
                    <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-bold font-mono text-slate-900">{po.poNumber}</td>
                      <td className="py-2.5 font-medium text-slate-800">{po.supplierName}</td>
                      <td className="py-2.5 text-slate-600 truncate max-w-[140px]">{po.deliveryWarehouse || 'Central Warehouse'}</td>
                      <td className="py-2.5 font-bold font-mono text-slate-900">
                        ₹{(po.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          po.status === 'Received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          po.status === 'In-Transit' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          po.status === 'Issued' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onNavigateToTab('purchase-orders')}
                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: End-to-End Solar EPC Supply Workflow */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-slate-900">Procurement Workflow</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Site Survey &amp; Field BOM</span>
              </div>
              <p className="text-[11px] text-slate-500 pl-7">
                Survey engineer captures site details, customer proof docs, and builds preliminary Bill of Materials.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>PM Technical BOM Approval</span>
              </div>
              <p className="text-[11px] text-slate-500 pl-7">
                Project Manager reviews technical feasibility, locks final BOM, and indents materials for procurement.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-950">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">3</span>
                <span>Purchase Team PO &amp; GRN</span>
              </div>
              <p className="text-[11px] text-emerald-800 pl-7">
                Purchase Team issues PO to vendors (Panels, Inverter, Structure) and records Goods Receipt Note (GRN) on delivery.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span className="w-5 h-5 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px]">4</span>
                <span>Installation Readiness</span>
              </div>
              <p className="text-[11px] text-slate-500 pl-7">
                Installation team verifies 100% material delivery on site and executes mounting, wiring &amp; commissioning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
