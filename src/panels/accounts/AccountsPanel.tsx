import React, { useState } from 'react';
import { 
  Receipt, CreditCard, DollarSign, ShoppingCart, 
  IndianRupee, TrendingUp, AlertCircle, LayoutDashboard 
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

// Existing Views & Role Dashboard
import { AccountsDashboard } from './AccountsDashboard';
import { InvoicesView } from '../../components/finance/InvoicesView';
import { PaymentsView } from '../../components/finance/PaymentsView';
import { ExpensesView } from '../../components/finance/ExpensesView';
import { PurchaseOrdersView } from '../../components/inventory/PurchaseOrdersView';

interface AccountsPanelProps {
  initialSubTab?: 'dashboard' | 'invoices' | 'payments' | 'expenses' | 'pos';
  onTabChange?: (tab: string) => void;
}

export const AccountsPanel: React.FC<AccountsPanelProps> = ({
  initialSubTab = 'dashboard',
  onTabChange,
}) => {
  const { invoices } = useCrm();
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'invoices' | 'payments' | 'expenses' | 'pos'
  >(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabClick = (tab: 'dashboard' | 'invoices' | 'payments' | 'expenses' | 'pos') => {
    setActiveSubTab(tab);
    if (onTabChange) {
      const navMap: Record<string, string> = {
        dashboard: 'dashboard',
        invoices: 'invoices',
        payments: 'payments',
        expenses: 'expenses',
        pos: 'purchase-orders',
      };
      onTabChange(navMap[tab] || tab);
    }
  };

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const paidTotal = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.totalAmount, 0);
  const pendingTotal = invoices.filter(i => i.status === 'Sent' || i.status === 'Overdue').reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Accounts & Finance Panel Header - Shown on Dashboard */}
      {activeSubTab === 'dashboard' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-emerald-700 text-white rounded-lg">
                  <Receipt className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Accounts, GST &amp; Subsidy Finance Panel
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full">
                  Billing, Collections &amp; Vendor Procurement
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage client milestone billing, GST compliance (12% solar panels / 18% inverters), PM Surya Ghar subsidy tracking, and supplier POs.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-semibold text-emerald-800">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                <span>₹{(paidTotal / 100000).toFixed(2)}L Collected</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs font-semibold text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>₹{(pendingTotal / 100000).toFixed(2)}L Receivable</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view Content */}
      <div>
        {activeSubTab === 'dashboard' && (
          <AccountsDashboard
            onNavigateToTab={(tab) => {
              if (tab === 'invoices' || tab === 'payments' || tab === 'expenses' || tab === 'pos') {
                handleSubTabClick(tab as any);
              } else if (onTabChange) {
                onTabChange(tab);
              }
            }}
          />
        )}

        {activeSubTab === 'invoices' && <InvoicesView />}

        {activeSubTab === 'payments' && <PaymentsView />}

        {activeSubTab === 'expenses' && <ExpensesView />}

        {activeSubTab === 'pos' && <PurchaseOrdersView />}
      </div>
    </div>
  );
};
