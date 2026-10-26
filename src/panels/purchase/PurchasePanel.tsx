import React, { useState } from 'react';
import { 
  ShoppingCart, Layers, Boxes, Truck, LayoutDashboard 
} from 'lucide-react';

import { PurchaseDashboard } from './PurchaseDashboard';
import { PurchaseOrdersView } from '../../components/inventory/PurchaseOrdersView';
import { MaterialsPlanningView } from '../../components/projects/MaterialsPlanningView';
import { StockLevelsView } from '../../components/inventory/StockLevelsView';
import { SuppliersView } from '../../components/inventory/SuppliersView';

export interface PurchasePanelProps {
  initialSubTab?: 'dashboard' | 'purchase-orders' | 'materials' | 'stock' | 'suppliers';
  onTabChange?: (tab: string) => void;
}

export const PurchasePanel: React.FC<PurchasePanelProps> = ({
  initialSubTab = 'purchase-orders',
  onTabChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'purchase-orders' | 'materials' | 'stock' | 'suppliers'
  >(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabClick = (tab: string) => {
    setActiveSubTab(tab as any);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub navigation tabs for Purchase Persona */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => handleSubTabClick('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'dashboard'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-emerald-400" />
          <span>Procurement Overview</span>
        </button>

        <button
          onClick={() => handleSubTabClick('purchase-orders')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'purchase-orders'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-emerald-400" />
          <span>Purchase Orders (POs)</span>
        </button>

        <button
          onClick={() => handleSubTabClick('materials')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'materials'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Approved BOM Indents</span>
        </button>

        <button
          onClick={() => handleSubTabClick('stock')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'stock'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4 text-emerald-400" />
          <span>Inventory &amp; Stock</span>
        </button>

        <button
          onClick={() => handleSubTabClick('suppliers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'suppliers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4 text-emerald-400" />
          <span>Suppliers &amp; Vendors</span>
        </button>
      </div>

      {/* Dynamic Sub-tab Body */}
      {activeSubTab === 'dashboard' && (
        <PurchaseDashboard onNavigateToTab={handleSubTabClick} />
      )}
      {activeSubTab === 'purchase-orders' && (
        <PurchaseOrdersView />
      )}
      {activeSubTab === 'materials' && (
        <MaterialsPlanningView />
      )}
      {activeSubTab === 'stock' && (
        <StockLevelsView onNavigateToPo={() => handleSubTabClick('purchase-orders')} />
      )}
      {activeSubTab === 'suppliers' && (
        <SuppliersView onNavigateToPo={() => handleSubTabClick('purchase-orders')} />
      )}
    </div>
  );
};
