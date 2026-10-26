import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, GitBranch, CalendarClock, FileText, 
  UserCheck, Compass, Calculator, PackageSearch, FolderKanban, 
  Wrench, CheckSquare, Layers, Receipt, CreditCard, DollarSign, 
  Boxes, BarChart3, Truck, ShoppingCart, LifeBuoy, ShieldCheck, 
  Clock, LineChart, Cpu, History, FolderOpen, Briefcase, 
  Settings, ExternalLink, ChevronDown, ChevronRight, SunMedium,
  Handshake
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { getApiUrl } from '../../utils/apiUrl';

export type NavItemKey = 
  | 'dashboard'
  // Sales
  | 'leads'
  | 'pipeline'
  | 'follow-ups'
  | 'quotations'
  | 'negotiations'
  | 'customers'
  // Solar
  | 'site-surveys'
  | 'field-bom'
  | 'solar-calculator'
  | 'solar-packages'
  // Projects
  | 'projects'
  | 'installation'
  | 'project-tasks'
  | 'materials'
  // Finance
  | 'invoices'
  | 'payments'
  | 'expenses'
  // Inventory
  | 'products'
  | 'stock'
  | 'suppliers'
  | 'purchase-orders'
  // Service
  | 'service-tickets'
  | 'warranty'
  | 'amc'
  // Reports
  | 'sales-reports'
  | 'finance-reports'
  | 'project-reports'
  | 'service-reports'
  // Automation
  | 'automation-rules'
  | 'automation-logs'
  // General
  | 'documents'
  | 'employees'
  | 'settings'
  | 'audit-logs'
  | 'customer-portal';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile
}) => {
  const { leads, followUps, projects, tickets, amcs, surveys, quotations, activeRole, currentUser } = useCrm();

  const handleNavClick = (key: NavItemKey) => {
    onSelectTab(key);
    onCloseMobile();
  };

  const pendingFollowupsCount = followUps.filter(f => f.status === 'Pending').length;
  const newLeadsCount = leads.filter(l => l.status === 'New').length;
  const activeProjectsCount = projects.filter(p => p.stage !== 'Completed').length;
  const openTicketsCount = tickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved').length;
  const amcDueCount = amcs.filter(a => a.status === 'Renewal Due').length;
  const pendingReviewsCount = surveys.filter(s => s.status === 'Submitted for Review').length;
  const acceptedQuotesCount = quotations.filter(q => q.status === 'Customer_Accepted').length;
  const activeNegotiationsCount = quotations.filter(q => q.status === 'Sent').length;

  const isSuperAdmin = activeRole === 'Super Admin' || currentUser?.role === 'Super Admin';

  const renderNavButton = (
    key: NavItemKey,
    label: string,
    Icon: React.ElementType,
    badge?: React.ReactNode
  ) => {
    const isActive = currentTab === key;
    return (
      <button
        key={key}
        onClick={() => handleNavClick(key)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all text-xs ${
          isActive
            ? 'bg-emerald-600 text-white shadow-xs font-semibold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400/90'}`} />
          <span className="truncate">{label}</span>
        </div>
        {badge}
      </button>
    );
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    executive: true,
    people: false,
    sales: true,
    projects: false,
    finance: false,
    service: false,
    reports: false,
    settings: false,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Group definitions for Super Admin
  const superAdminGroups: {
    id: string;
    label: string;
    badgeCount?: number;
    items: {
      key: NavItemKey;
      label: string;
      icon: React.ElementType;
      badge?: React.ReactNode;
    }[];
  }[] = [
    {
      id: 'executive',
      label: '1. Dashboard',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      id: 'people',
      label: '2. People & RBAC',
      items: [
        { key: 'employees', label: 'User Directory & RBAC', icon: Users }
      ]
    },
    {
      id: 'sales',
      label: '3. Sales & CRM',
      badgeCount: (newLeadsCount > 0 ? newLeadsCount : 0) + (pendingFollowupsCount > 0 ? pendingFollowupsCount : 0),
      items: [
        {
          key: 'leads',
          label: 'Leads Pipeline',
          icon: UserCheck,
          badge: newLeadsCount > 0 ? (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {newLeadsCount}
            </span>
          ) : null
        },
        { key: 'pipeline', label: 'Deals & Pipeline', icon: GitBranch },
        { key: 'quotations', label: 'Quotations', icon: FileText },
        {
          key: 'follow-ups',
          label: 'Follow-ups',
          icon: CalendarClock,
          badge: pendingFollowupsCount > 0 ? (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingFollowupsCount}
            </span>
          ) : null
        },
        { key: 'customers', label: 'Customers', icon: Users }
      ]
    },
    {
      id: 'projects',
      label: '4. Projects & EPC',
      badgeCount: (activeProjectsCount > 0 ? activeProjectsCount : 0) + (pendingReviewsCount > 0 ? pendingReviewsCount : 0),
      items: [
        {
          key: 'projects',
          label: 'Solar Projects',
          icon: FolderKanban,
          badge: activeProjectsCount > 0 ? (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-300">
              {activeProjectsCount}
            </span>
          ) : null
        },
        {
          key: 'site-surveys',
          label: 'Site Surveys',
          icon: Compass,
          badge: pendingReviewsCount > 0 ? (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {pendingReviewsCount}
            </span>
          ) : null
        },
        { key: 'project-tasks', label: 'Project Tasks', icon: CheckSquare },
        { key: 'materials', label: 'Material Planning / BOM', icon: Layers },
        { key: 'installation', label: 'Installation Dispatch', icon: Wrench }
      ]
    },
    {
      id: 'finance',
      label: '5. Finance & Accounts',
      items: [
        { key: 'invoices', label: 'Invoices', icon: Receipt },
        { key: 'payments', label: 'Payment Receipts', icon: CreditCard },
        { key: 'expenses', label: 'Operating Expenses', icon: DollarSign },
        { key: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart }
      ]
    },
    {
      id: 'service',
      label: '6. Service & Care',
      badgeCount: (openTicketsCount > 0 ? openTicketsCount : 0) + (amcDueCount > 0 ? amcDueCount : 0),
      items: [
        {
          key: 'service-tickets',
          label: 'Service Tickets',
          icon: LifeBuoy,
          badge: openTicketsCount > 0 ? (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
              {openTicketsCount}
            </span>
          ) : null
        },
        { key: 'warranty', label: 'Warranties', icon: ShieldCheck },
        {
          key: 'amc',
          label: 'AMC Contracts',
          icon: Clock,
          badge: amcDueCount > 0 ? (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {amcDueCount} Due
            </span>
          ) : null
        }
      ]
    },
    {
      id: 'reports',
      label: '7. Reports & Analytics',
      items: [
        { key: 'sales-reports', label: 'Sales Analytics', icon: LineChart },
        { key: 'finance-reports', label: 'Financial Reports', icon: Receipt },
        { key: 'project-reports', label: 'Project Reports', icon: FolderOpen },
        { key: 'service-reports', label: 'Service Reports', icon: LifeBuoy }
      ]
    },
    {
      id: 'settings',
      label: '8. Security & Settings',
      items: [
        { key: 'settings', label: 'System Settings', icon: Settings },
        { key: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck },
        { key: 'documents', label: 'Document Vault', icon: Briefcase }
      ]
    }
  ];

  // Auto-expand group containing active tab
  React.useEffect(() => {
    for (const group of superAdminGroups) {
      if (group.items.some(item => item.key === currentTab)) {
        setExpandedGroups(prev => ({
          ...prev,
          [group.id]: true
        }));
        break;
      }
    }
  }, [currentTab]);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile} 
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs" 
        />
      )}

      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-40
        w-64 bg-[#0A1224] text-slate-300 flex flex-col border-r border-slate-800/80 shadow-xl
        transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/70 bg-[#070D1B]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={getApiUrl('/logo.png')} alt="AB Energy Solutions" className="w-full h-full object-contain drop-shadow-[0_1px_6px_rgba(255,255,255,0.2)]" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5">
                <span>AB ENERGY</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SOLAR OS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Solar CRM &amp; Business OS</p>
            </div>
          </div>
        </div>

        {/* Scrollable Role-Specific Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 text-xs">
          {/* 1. CUSTOMER PORTAL */}
          {activeRole === 'Customer' && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Homeowner Portal
              </div>
              {renderNavButton('customer-portal', 'My Solar Station', SunMedium)}
            </div>
          )}

          {/* 2. SUPER ADMIN MENU (9 Expandable Accordion Groups) */}
          {activeRole === 'Super Admin' && (
            <div className="space-y-2">
              {superAdminGroups.map((group) => {
                const isExpanded = !!expandedGroups[group.id];
                const hasActiveChild = group.items.some(item => item.key === currentTab);

                return (
                  <div key={group.id} className="rounded-xl overflow-hidden bg-slate-900/40 border border-slate-800/50">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                        hasActiveChild 
                          ? 'bg-slate-800/80 text-emerald-400 font-semibold' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-bold tracking-wide truncate">
                          {group.label}
                        </span>
                        {!isExpanded && group.badgeCount && group.badgeCount > 0 ? (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                            {group.badgeCount}
                          </span>
                        ) : null}
                      </div>
                      <ChevronDown 
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                          isExpanded ? 'rotate-180 text-emerald-400' : ''
                        }`} 
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-2 py-1.5 space-y-1 bg-slate-950/40 border-t border-slate-800/40">
                        {group.items.map((item) => 
                          renderNavButton(item.key, item.label, item.icon, item.badge)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. SALES MANAGER MENU */}
          {activeRole === 'Sales Manager' && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Sales Management
              </div>
              {renderNavButton('dashboard', 'Sales Dashboard', LayoutDashboard)}
              {renderNavButton('leads', 'Team Leads & Assignment', Users, newLeadsCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {newLeadsCount}
                </span>
              ) : null)}
              {renderNavButton('pipeline', 'Team Pipeline', GitBranch)}
              {renderNavButton('quotations', 'Quotations', FileText)}
              {renderNavButton('negotiations', 'Negotiation Hub', Handshake, activeNegotiationsCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {activeNegotiationsCount}
                </span>
              ) : null)}
              {renderNavButton('follow-ups', 'Team Follow-ups', CalendarClock, pendingFollowupsCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingFollowupsCount}
                </span>
              ) : null)}
              {renderNavButton('customers', 'Customers', UserCheck)}
              {renderNavButton('employees', 'Sales Executives & Team', Users)}
            </div>
          )}

          {/* 4. SALES EXECUTIVE MENU (5 Items) */}
          {activeRole === 'Sales Executive' && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Sales Execution
              </div>
              {renderNavButton('dashboard', 'My Workspace', LayoutDashboard)}
              {renderNavButton('leads', 'My Assigned Leads', Users, newLeadsCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {newLeadsCount}
                </span>
              ) : null)}
              {renderNavButton('pipeline', 'My Pipeline', GitBranch)}
              {renderNavButton('quotations', 'My Quotations', FileText)}
              {renderNavButton('negotiations', 'Negotiations', Handshake, activeNegotiationsCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {activeNegotiationsCount}
                </span>
              ) : null)}
              {renderNavButton('follow-ups', 'My Follow-ups', CalendarClock, pendingFollowupsCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingFollowupsCount}
                </span>
              ) : null)}
            </div>
          )}

          {/* 5. SURVEY ENGINEER MENU (4 Items) */}
          {activeRole === 'Survey Engineer' && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Technical Auditing
              </div>
              {renderNavButton('dashboard', 'Survey Dashboard', LayoutDashboard)}
              {renderNavButton('site-surveys', 'Assigned Site Surveys', Compass, pendingReviewsCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {pendingReviewsCount}
                </span>
              ) : null)}
              {renderNavButton('field-bom', 'Field BOMs & Materials', Layers)}
              {renderNavButton('solar-calculator', 'Solar PV Calculator', Calculator)}
              {renderNavButton('solar-packages', 'Solar Packages', PackageSearch)}
            </div>
          )}

          {/* 6. PROJECT MANAGER MENU */}
          {activeRole === 'Project Manager' && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                EPC Operations
              </div>
              {renderNavButton('dashboard', 'EPC Dashboard', LayoutDashboard)}
              {renderNavButton('projects', 'Solar Projects', FolderKanban, activeProjectsCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-300">
                  {activeProjectsCount}
                </span>
              ) : null)}
              {renderNavButton('quotations', 'Deal Handover & Quotes', FileText, acceptedQuotesCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {acceptedQuotesCount} Active
                </span>
              ) : null)}
              {renderNavButton('site-surveys', 'Technical Survey Reviews', Compass, pendingReviewsCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingReviewsCount} Due
                </span>
              ) : null)}
              {renderNavButton('project-tasks', 'Project Tasks', CheckSquare)}
              {renderNavButton('materials', 'BOM Technical Approvals', Layers)}
              {renderNavButton('installation', 'Installation Oversight', Wrench)}
              {renderNavButton('employees', 'Installation Crew & Team', Users)}
            </div>
          )}

          {/* PURCHASE TEAM MENU */}
          {activeRole === 'Purchase Team' && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Procurement & Supply
              </div>
              {renderNavButton('dashboard', 'Procurement Overview', LayoutDashboard)}
              {renderNavButton('purchase-orders', 'Purchase Orders (POs)', ShoppingCart)}
              {renderNavButton('materials', 'Approved BOM Indents', Layers)}
              {renderNavButton('stock', 'Inventory & Stock', Boxes)}
              {renderNavButton('suppliers', 'Suppliers & Vendors', Truck)}
            </div>
          )}

          {/* 7. INSTALLATION TEAM MENU (4 Items) */}
          {activeRole === 'Installation Team' && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Field Execution
              </div>
              {renderNavButton('dashboard', 'Field Dashboard', LayoutDashboard)}
              {renderNavButton('installation', 'Assigned Site Work Orders', Wrench)}
              {renderNavButton('project-tasks', 'Daily Tasks and Safety Checklist', CheckSquare)}
              {renderNavButton('materials', 'Material Planning / BOM', Layers)}
            </div>
          )}

          {/* 8. ACCOUNTS / FINANCE MENU (5 Items) */}
          {activeRole === 'Accounts' && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Finance &amp; Accounts
              </div>
              {renderNavButton('dashboard', 'Finance Dashboard', LayoutDashboard)}
              {renderNavButton('invoices', 'Invoices', Receipt)}
              {renderNavButton('payments', 'Payment Receipts', CreditCard)}
              {renderNavButton('expenses', 'Expenses', DollarSign)}
              {renderNavButton('purchase-orders', 'Purchase Orders', ShoppingCart)}
            </div>
          )}

          {/* 9. SERVICE TEAM MENU (4 Items) */}
          {activeRole === 'Service Team' && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Service &amp; O&amp;M Care
              </div>
              {renderNavButton('dashboard', 'Service Dashboard', LayoutDashboard)}
              {renderNavButton('service-tickets', 'Service Tickets', LifeBuoy, openTicketsCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {openTicketsCount}
                </span>
              ) : null)}
              {renderNavButton('warranty', 'Warranties', ShieldCheck)}
              {renderNavButton('amc', 'AMC Contracts and Renewals', Clock, amcDueCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {amcDueCount} Due
                </span>
              ) : null)}
            </div>
          )}
        </div>

        {/* Footer: Admin Preview Mode / Status Indicator */}
        <div className="p-3 border-t border-slate-800/70 bg-[#070D1B]">
          {isSuperAdmin && activeRole !== 'Customer' ? (
            <button
              onClick={() => handleNavClick('customer-portal')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                currentTab === 'customer-portal'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'text-slate-300 hover:text-white bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <SunMedium className="w-4 h-4 text-emerald-400" />
                <span>Customer Portal Preview</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <div className="flex items-center justify-between px-2 text-[10px] text-slate-500">
              <span className="font-semibold">{activeRole} Workspace</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
