import React, { useState, useEffect } from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Sidebar, NavItemKey } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { LoginView } from './components/auth/LoginView';
import { getApiUrl } from './utils/apiUrl';

// Dedicated Modular Panels
import {
  SuperAdminPanel,
  SalesPanel,
  SurveyPanel,
  ProjectManagerPanel,
  PurchasePanel,
  InstallationPanel,
  AccountsPanel,
  ServicePanel,
  CustomerPanel,
} from './panels';

// Individual Views (available for direct deep-link navigation / super admin drill-down)
import { SmartDashboard } from './components/dashboard/SmartDashboard';
import { LeadsView } from './components/sales/LeadsView';
import { PipelineView } from './components/sales/PipelineView';
import { FollowUpsView } from './components/sales/FollowUpsView';
import { QuotationsView } from './components/sales/QuotationsView';
import { CustomersView } from './components/sales/CustomersView';
import { SiteSurveysView } from './components/solar/SiteSurveysView';
import { SolarCalculatorView } from './components/solar/SolarCalculatorView';
import { SolarPackagesView } from './components/solar/SolarPackagesView';
import { ProjectsView } from './components/projects/ProjectsView';
import { InstallationView } from './components/projects/InstallationView';
import { ProjectTasksView } from './components/projects/ProjectTasksView';
import { MaterialsPlanningView } from './components/projects/MaterialsPlanningView';
import { InvoicesView } from './components/finance/InvoicesView';
import { PaymentsView } from './components/finance/PaymentsView';
import { ExpensesView } from './components/finance/ExpensesView';
import { PurchaseOrdersView } from './components/inventory/PurchaseOrdersView';
import { StockLevelsView } from './components/inventory/StockLevelsView';
import { SuppliersView } from './components/inventory/SuppliersView';
import { DocumentsView } from './components/documents/DocumentsView';
import { SettingsView } from './components/settings/SettingsView';
import { AuditLogsView } from './components/settings/AuditLogsView';
import { ServiceTicketsView } from './components/service/ServiceTicketsView';
import { WarrantyView } from './components/service/WarrantyView';
import { AmcView } from './components/service/AmcView';
import { AutomationCenter } from './components/automation/AutomationCenter';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { TeamView } from './components/team/TeamView';
import { CallTrackingView } from './components/telephony/CallTrackingView';
import { GovtSubsidyMasterView } from './components/solar/GovtSubsidyMasterView';

// Modals
import { NewLeadModal } from './components/modals/NewLeadModal';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { CallDispositionModal } from './components/modals/CallDispositionModal';
import { CallTrackingOnboardingModal } from './components/modals/CallTrackingOnboardingModal';
import { 
  getActiveCallSession, 
  clearActiveCallSession,
  syncCallLogToBackend,
  isCallTrackingEnabled, 
  isTelephonyOnboardingDone,
  ActiveCallSession
} from './utils/telephonyBridge';

// Public Portals
import { CustomerGrnSignPortal } from './components/public/CustomerGrnSignPortal';

const AppContent: React.FC = () => {
  // Check for Public Customer E-Signing Route: /sign-grn/:token or ?sign-grn=:token
  const getSigningTokenFromUrl = (): string | null => {
    const path = window.location.pathname;
    if (path.startsWith('/sign-grn/')) {
      const parts = path.split('/sign-grn/');
      if (parts[1]) return parts[1].split('/')[0].split('?')[0];
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('sign-grn')) {
      return params.get('sign-grn');
    }
    if (params.get('token') && path.includes('sign-grn')) {
      return params.get('token');
    }
    return null;
  };

  const publicSigningToken = getSigningTokenFromUrl();
  if (publicSigningToken) {
    return <CustomerGrnSignPortal token={publicSigningToken} />;
  }

  const { isAuthenticated, isRestoringSession, activeRole, currentUser, employees } = useCrm();
  const [activeNav, setActiveNav] = useState<NavItemKey>(() => {
    if (activeRole === 'Customer') return 'customer-portal';
    if (activeRole === 'Purchase Team') return 'purchase-orders';
    if (activeRole === 'Survey Engineer') return 'site-surveys';
    if (activeRole === 'Project Manager') return 'projects';
    if (activeRole === 'Installation Team') return 'installation';
    if (activeRole === 'Accounts') return 'invoices';
    if (activeRole === 'Service Team') return 'service-tickets';
    return 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const prevRoleRef = React.useRef<string | null>(activeRole);

  // Sync role defaults when activeRole changes (switching roles or session restored)
  useEffect(() => {
    if (prevRoleRef.current !== activeRole) {
      prevRoleRef.current = activeRole;
      if (activeRole === 'Customer') setActiveNav('customer-portal');
      else if (activeRole === 'Survey Engineer') setActiveNav('site-surveys');
      else if (activeRole === 'Sales Executive' || activeRole === 'Sales Manager') setActiveNav('leads');
      else if (activeRole === 'Project Manager') setActiveNav('projects');
      else if (activeRole === 'Purchase Team') setActiveNav('purchase-orders');
      else if (activeRole === 'Installation Team') setActiveNav('installation');
      else if (activeRole === 'Accounts') setActiveNav('invoices');
      else if (activeRole === 'Service Team') setActiveNav('service-tickets');
    }
  }, [activeRole]);

  // Keep Android native tracker synchronized with active employee's phone number
  useEffect(() => {
    const matchedEmp = employees?.find(
      e => (currentUser?.employeeId && e.id === currentUser.employeeId) ||
           (currentUser?.email && e.email.toLowerCase() === currentUser.email.toLowerCase()) ||
           (currentUser?.name && e.name.toLowerCase() === currentUser.name.toLowerCase())
    );
    const empPhone = matchedEmp?.phone || currentUser?.phone;
    if (empPhone && typeof (window as any).AndroidCallTracker?.setEmployeePhone === 'function') {
      try {
        (window as any).AndroidCallTracker.setEmployeePhone(empPhone);
      } catch (err) {
        console.warn('Could not set employee phone on AndroidCallTracker:', err);
      }
    }
  }, [currentUser, employees]);

  // Modals state
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [activeCallSession, setActiveCallSession] = useState<ActiveCallSession | null>(null);
  const [showCallDispositionModal, setShowCallDispositionModal] = useState<boolean>(false);
  const [showTelephonyOnboarding, setShowTelephonyOnboarding] = useState<boolean>(false);

  // In-app telephony visibility & dialer return listener
  useEffect(() => {
    const checkPendingCall = async () => {
      const session = getActiveCallSession();
      if (session && isCallTrackingEnabled()) {
        const elapsed = Math.max(1, Math.round((Date.now() - session.startTime) / 1000));
        // If at least 2 seconds passed since dialing was initiated, auto-record call
        if (elapsed >= 2) {
          clearActiveCallSession();
          setActiveCallSession(session);
          setShowCallDispositionModal(true);

          // Guaranteed auto-sync directly to live database
          try {
            await syncCallLogToBackend({
              employee_id: session.employeeId,
              employee_name: session.employeeName || 'Siva P',
              employee_phone: session.employeePhone || '9655247872',
              customer_phone: session.customerPhone,
              customer_name: session.customerName,
              lead_id: session.leadId,
              call_type: 'OUTGOING',
              call_status: 'ANSWERED',
              duration_seconds: elapsed,
              call_time: new Date(session.startTime).toISOString(),
              notes: `In-app lead call to ${session.customerName || 'Lead'}`
            });
          } catch (err) {
            console.error('Auto-sync call error:', err);
          }
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPendingCall();
      }
    };

    const handleWindowFocus = () => {
      checkPendingCall();
    };

    const handleTriggerDisposition = (e: any) => {
      if (e.detail) {
        setActiveCallSession(e.detail);
        setShowCallDispositionModal(true);
      }
    };

    // Auto-check periodically and on user touch/focus
    const interval = setInterval(checkPendingCall, 2000);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pointerdown', checkPendingCall);
    window.addEventListener('touchstart', checkPendingCall);
    window.addEventListener('trigger-call-disposition', handleTriggerDisposition);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pointerdown', checkPendingCall);
      window.removeEventListener('touchstart', checkPendingCall);
      window.removeEventListener('trigger-call-disposition', handleTriggerDisposition);
    };
  }, []);

  // First-time sales executive onboarding prompt for call tracking
  useEffect(() => {
    if (
      isAuthenticated &&
      currentUser &&
      (currentUser.role === 'Sales Executive' || currentUser.role === 'Sales Manager') &&
      !isTelephonyOnboardingDone()
    ) {
      const timer = setTimeout(() => {
        setShowTelephonyOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, currentUser]);

  const [targetQuoteLeadId, setTargetQuoteLeadId] = useState<string | undefined>(undefined);

  // Cross-navigation handlers

  const handleNavigateToQuotation = (leadId?: string) => {
    setTargetQuoteLeadId(leadId);
    setActiveNav('quotations');
  };

  const handleNavigateToSurvey = (_leadId?: string) => {
    setActiveNav('site-surveys');
  };

  const handleNavigateToProject = (_projectId?: string) => {
    setActiveNav('projects');
  };

  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="p-3 bg-white/95 rounded-2xl mb-4 shadow-xl">
          <img src={getApiUrl('/logo.png')} alt="AB Energy Solutions" className="h-16 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold tracking-wider uppercase">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Restoring Secure Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={(defaultTab) => {
          setActiveNav(defaultTab as NavItemKey);
        }}
      />
    );
  }

  // Render content according to Persona & Active Tab
  const renderMainContent = () => {
    // 1. Customer Persona Panel
    if (activeRole === 'Customer' || activeNav === 'customer-portal') {
      return <CustomerPanel onBackToAdmin={() => setActiveNav('customers')} />;
    }

    // 2. Universal Access Views (Accessible across roles when explicitly selected)
    if (activeNav === 'employees') {
      return <TeamView />;
    }
    if (activeNav === 'settings') {
      return <SettingsView />;
    }
    if (activeNav === 'audit-logs') {
      return <AuditLogsView />;
    }
    if (activeNav === 'documents') {
      return <DocumentsView />;
    }
    if (
      activeNav === 'sales-reports' ||
      activeNav === 'finance-reports' ||
      activeNav === 'project-reports' ||
      activeNav === 'service-reports'
    ) {
      return (
        <AnalyticsView
          key={activeNav}
          initialSection={
            activeNav === 'sales-reports'
              ? 'sales'
              : activeNav === 'finance-reports'
              ? 'finance'
              : activeNav === 'project-reports'
              ? 'projects'
              : activeNav === 'service-reports'
              ? 'service'
              : 'executive'
          }
          onNavigate={(tab) => setActiveNav(tab as NavItemKey)}
        />
      );
    }
    // Purchase Team Persona Panel (Handles all Purchase Team navigation & purchase-orders)
    if (
      activeRole === 'Purchase Team' ||
      (activeRole !== 'Accounts' && activeRole !== 'Project Manager' && activeNav === 'purchase-orders')
    ) {
      let subTab: 'dashboard' | 'purchase-orders' | 'materials' | 'stock' | 'suppliers' = 'purchase-orders';
      if (activeNav === 'dashboard') subTab = 'dashboard';
      else if (activeNav === 'purchase-orders') subTab = 'purchase-orders';
      else if (activeNav === 'materials') subTab = 'materials';
      else if (activeNav === 'stock' || activeNav === 'products') subTab = 'stock';
      else if (activeNav === 'suppliers') subTab = 'suppliers';
      return (
        <PurchasePanel
          initialSubTab={subTab}
          onTabChange={(tab) => setActiveNav(tab as NavItemKey)}
        />
      );
    }

    if (activeNav === 'products' || activeNav === 'stock') {
      return <StockLevelsView onNavigateToPo={() => setActiveNav('purchase-orders')} />;
    }
    if (activeNav === 'suppliers') {
      return <SuppliersView onNavigateToPo={() => setActiveNav('purchase-orders')} />;
    }
    if (activeNav === 'purchase-orders') {
      if (activeRole === 'Accounts') {
        return (
          <AccountsPanel
            initialSubTab="pos"
            onTabChange={(tab) => setActiveNav(tab as NavItemKey)}
          />
        );
      }
      return <PurchaseOrdersView />;
    }

    if (activeNav === 'call-tracker') {
      return <CallTrackingView />;
    }

    if (activeNav === 'subsidies') {
      return <GovtSubsidyMasterView />;
    }

    if (activeNav === 'automation-rules' || activeNav === 'automation-logs') {
      return <AutomationCenter />;
    }

    // 3. Super Admin Executive Dashboard
    if (activeNav === 'dashboard' && (activeRole === 'Super Admin' || !activeRole)) {
      return (
        <SuperAdminPanel
          onOpenNewLead={() => setShowNewLeadModal(true)}
          onNavigateToTab={(tab) => setActiveNav(tab as NavItemKey)}
        />
      );
    }

    // 4. Survey Engineer Persona Panel
    if (
      activeRole === 'Survey Engineer' ||
      activeNav === 'site-surveys' ||
      activeNav === 'field-bom' ||
      activeNav === 'solar-calculator' ||
      activeNav === 'solar-packages'
    ) {
      let subTab: 'dashboard' | 'surveys' | 'field-bom' | 'calculator' | 'packages' = 'dashboard';
      if (activeNav === 'site-surveys') subTab = 'surveys';
      else if (activeNav === 'field-bom') subTab = 'field-bom';
      else if (activeNav === 'solar-calculator') subTab = 'calculator';
      else if (activeNav === 'solar-packages') subTab = 'packages';
      return (
        <SurveyPanel
          initialSubTab={subTab}
          onTabChange={(tab) => setActiveNav(tab as NavItemKey)}
          onNavigateToQuotation={handleNavigateToQuotation}
        />
      );
    }

    // Direct targeted quotation viewer when navigated with targetQuoteLeadId
    if (activeNav === 'quotations' && targetQuoteLeadId) {
      return (
        <SalesPanel
          initialSubTab="quotations"
          targetQuoteLeadId={targetQuoteLeadId}
          onTabChange={(tab) => setActiveNav(tab as NavItemKey)}
          onOpenNewLead={() => setShowNewLeadModal(true)}
          onNavigateToQuotation={handleNavigateToQuotation}
          onNavigateToSurvey={handleNavigateToSurvey}
          onNavigateToProject={handleNavigateToProject}
        />
      );
    }

    // 5. Project Manager Persona Panel (Must evaluate before generic nav keys)
    if (
      activeRole === 'Project Manager' ||
      activeNav === 'projects' ||
      activeNav === 'project-tasks' ||
      activeNav === 'materials'
    ) {
      let subTab: 'dashboard' | 'projects' | 'tasks' | 'materials' | 'installation' | 'handover' = 'dashboard';
      if (activeNav === 'projects') subTab = 'projects';
      else if (activeNav === 'project-tasks') subTab = 'tasks';
      else if (activeNav === 'materials') subTab = 'materials';
      else if (activeNav === 'quotations') subTab = 'handover';
      return (
        <ProjectManagerPanel
          initialSubTab={subTab}
          onTabChange={(tab) => setActiveNav(tab as NavItemKey)}
          onNavigateToTab={(tab) => setActiveNav(tab as NavItemKey)}
        />
      );
    }

    // 6. Sales Persona Panel (Sales Executive / Sales Manager)
    if (
      activeRole === 'Sales Executive' ||
      activeRole === 'Sales Manager' ||
      activeNav === 'leads' ||
      activeNav === 'pipeline' ||
      activeNav === 'follow-ups' ||
      activeNav === 'quotations' ||
      activeNav === 'negotiations' ||
      activeNav === 'customers'
    ) {
      let subTab: 'dashboard' | 'leads' | 'pipeline' | 'followups' | 'quotations' | 'negotiations' | 'customers' = 'dashboard';
      if (activeNav === 'leads') subTab = 'leads';
      else if (activeNav === 'pipeline') subTab = 'pipeline';
      else if (activeNav === 'follow-ups') subTab = 'followups';
      else if (activeNav === 'quotations') subTab = 'quotations';
      else if (activeNav === 'negotiations') subTab = 'negotiations';
      else if (activeNav === 'customers') subTab = 'customers';
      return (
        <SalesPanel
          initialSubTab={subTab}
          targetQuoteLeadId={targetQuoteLeadId}
          onTabChange={(tab) => setActiveNav(tab as NavItemKey)}
          onOpenNewLead={() => setShowNewLeadModal(true)}
          onNavigateToQuotation={handleNavigateToQuotation}
          onNavigateToSurvey={handleNavigateToSurvey}
          onNavigateToProject={handleNavigateToProject}
        />
      );
    }

    // 7. Installation Team Persona Panel
    if (
      activeRole === 'Installation Team' ||
      activeNav === 'installation'
    ) {
      let subTab: 'dashboard' | 'installation' | 'tasks' | 'stock' | 'materials' = 'dashboard';
      if (activeNav === 'installation') subTab = 'installation';
      return (
        <InstallationPanel
          initialSubTab={subTab}
          onTabChange={(tab) => setActiveNav(tab as NavItemKey)}
          onNavigateToTab={(tab) => setActiveNav(tab as NavItemKey)}
        />
      );
    }

    // 8. Accounts Persona Panel
    if (
      activeRole === 'Accounts' ||
      activeNav === 'invoices' ||
      activeNav === 'payments' ||
      activeNav === 'expenses'
    ) {
      let subTab: 'dashboard' | 'invoices' | 'payments' | 'expenses' | 'pos' = 'dashboard';
      if (activeNav === 'invoices') subTab = 'invoices';
      else if (activeNav === 'payments') subTab = 'payments';
      else if (activeNav === 'expenses') subTab = 'expenses';
      return (
        <AccountsPanel
          initialSubTab={subTab}
          onTabChange={(tab) => setActiveNav(tab as NavItemKey)}
        />
      );
    }

    // 9. Service Team Persona Panel
    if (
      activeRole === 'Service Team' ||
      activeNav === 'service-tickets' ||
      activeNav === 'warranty' ||
      activeNav === 'amc'
    ) {
      let subTab: 'dashboard' | 'tickets' | 'warranty' | 'amc' = 'dashboard';
      if (activeNav === 'service-tickets') subTab = 'tickets';
      else if (activeNav === 'warranty') subTab = 'warranty';
      else if (activeNav === 'amc') subTab = 'amc';
      return (
        <ServicePanel
          initialSubTab={subTab}
          onTabChange={(tab) => setActiveNav(tab as NavItemKey)}
        />
      );
    }

    // Fallback: SuperAdminPanel
    return (
      <SuperAdminPanel
        onOpenNewLead={() => setShowNewLeadModal(true)}
        onNavigateToTab={(tab) => setActiveNav(tab as NavItemKey)}
      />
    );
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={activeNav}
        onSelectTab={(tab: NavItemKey) => {
          setActiveNav(tab);
          setIsSidebarOpen(false);
        }}
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onOpenMobileMenu={() => setIsSidebarOpen(true)}
          onOpenSearch={() => setShowGlobalSearch(true)}
          onOpenNewLead={() => setShowNewLeadModal(true)}
        />

        {/* Dynamic Workspace Body */}
        <main className="flex-1 overflow-y-auto p-2.5 sm:p-5 lg:p-6">
          <div className="w-full max-w-[1600px] mx-auto pb-12">
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <NewLeadModal
        isOpen={showNewLeadModal}
        onClose={() => setShowNewLeadModal(false)}
      />


      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onNavigate={(tab) => setActiveNav(tab as NavItemKey)}
      />

      {/* In-App Telephony Modals */}
      <CallDispositionModal
        isOpen={showCallDispositionModal}
        session={activeCallSession}
        onClose={() => {
          setShowCallDispositionModal(false);
          setActiveCallSession(null);
        }}
      />

      <CallTrackingOnboardingModal
        isOpen={showTelephonyOnboarding}
        onClose={() => setShowTelephonyOnboarding(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <CrmProvider>
      <AppContent />
    </CrmProvider>
  );
}

