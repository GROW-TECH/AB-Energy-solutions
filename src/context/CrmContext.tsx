import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Employee, Lead, Customer, SiteSurvey, SurveyPhoto, Quotation, QuotationVersion, 
  Project, InventoryProduct, Invoice, Payment, ServiceTicket, Warranty, 
  AmcContract, AutomationRule, AutomationLog, ActivityTimelineItem, 
  SystemNotification, FollowUp, Role, InstallationChecklist, ProjectStage,
  ExpenseItem, Supplier, PurchaseOrder, MaterialAllocation, ProjectTask
} from '../types';
import { 
  INITIAL_EMPLOYEES, INITIAL_LEADS, INITIAL_CUSTOMERS, INITIAL_SURVEYS, 
  INITIAL_PRODUCTS, INITIAL_QUOTATIONS, INITIAL_PROJECTS, INITIAL_INVOICES, 
  INITIAL_PAYMENTS, INITIAL_WARRANTIES, INITIAL_AMCS, INITIAL_SERVICE_TICKETS, 
  INITIAL_AUTOMATION_RULES, INITIAL_AUTOMATION_LOGS, INITIAL_FOLLOW_UPS, 
  INITIAL_NOTIFICATIONS, INITIAL_TIMELINE, INITIAL_EXPENSES, INITIAL_SUPPLIERS,
  INITIAL_PURCHASE_ORDERS, INITIAL_MATERIAL_ALLOCATIONS,
} from '../data/initialData';
import { calculateQuotation } from '../utils/quotationEngine';
import { getApiUrl } from '../utils/apiUrl';


export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  username: string;
  customerId?: string;
  employeeId?: string;
  avatar?: string;
}

interface CrmContextType {
  // Auth state & Actions
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isRestoringSession: boolean;
  token: string | null;
  login: (usernameOrData: string | { name: string; email: string; role: Role }, passwordOrNothing?: string) => Promise<{ success: boolean; error?: string; role?: Role; defaultTab?: string }>;
  logout: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;

  // Role & Demo Preview
  activeRole: Role;
  previewRole: Role | null;
  setActiveRole: (role: Role) => void;
  setDemoPreviewRole: (role: Role | null) => void;
  selectedCustomerIdForPortal: string;
  setSelectedCustomerIdForPortal: (id: string) => void;
  employees: Employee[];
  leads: Lead[];
  customers: Customer[];
  surveys: SiteSurvey[];
  quotations: Quotation[];
  projects: Project[];
  products: InventoryProduct[];
  invoices: Invoice[];
  payments: Payment[];
  warranties: Warranty[];
  amcs: AmcContract[];
  tickets: ServiceTicket[];
  automationRules: AutomationRule[];
  automationLogs: AutomationLog[];
  followUps: FollowUp[];
  notifications: SystemNotification[];
  timeline: ActivityTimelineItem[];
  expenses: ExpenseItem[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  materialAllocations: MaterialAllocation[];

  // Actions & Automation Triggers
  createLead: (leadData: Partial<Lead>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (leadId: string) => void;
  autoAssignAllLeads: () => { assignedCount: number; repsCount: number };
  updateProject: (id: string, updates: Partial<Project>) => void;
  assignProject: (projectId: string, installationLeadId: string, installationLeadName: string) => void;
  autoAssignAllProjects: () => { assignedCount: number; crewCount: number };
  qualifyLead: (leadId: string, surveyOptions?: { engineerId?: string; engineerName?: string; scheduledDate?: string; scheduledTime?: string; notes?: string }) => void;
  createSiteSurvey: (surveyData: Partial<SiteSurvey>) => SiteSurvey;
  completeSiteSurvey: (surveyId: string, updates: Partial<SiteSurvey>) => void;
  saveSurveyDraft: (surveyId: string, updates: Partial<SiteSurvey>) => Promise<SiteSurvey | null>;
  uploadSurveyPhoto: (surveyId: string, photoData: {
    category: string;
    fileName: string;
    base64Data: string;
    caption?: string;
    latitude?: number | null;
    longitude?: number | null;
    gpsAccuracyMeters?: number | null;
    capturedAt?: string | null;
  }) => Promise<SurveyPhoto | null>;
  deleteSurveyPhoto: (surveyId: string, photoId: string) => Promise<boolean>;
  submitSurveyForReview: (surveyId: string, comments?: string, bypassWithExceptions?: boolean, updates?: Partial<SiteSurvey>) => Promise<{ success: boolean; error?: string; checklistErrors?: string[] }>;
  reviewSurveyAction: (surveyId: string, decision: 'Approved' | 'Changes Required', comments: string) => Promise<{ success: boolean; error?: string; quotation?: any; quotationError?: string | null }>;
  rescheduleSurveyAction: (surveyId: string, newDate: string, newTime?: string, engineerId?: string, engineerName?: string) => Promise<void>;
  deleteSiteSurvey: (surveyId: string) => Promise<{ success: boolean; error?: string }>;
  reloadSurvey: (surveyId: string) => Promise<SiteSurvey | null>;
  createQuotation: (quoteData: Partial<Quotation>) => Quotation;
  createQuotationRevision: (quotationId: string, revisionData: Partial<Quotation>) => Promise<void>;
  approveQuotationDiscount: (quotationId: string) => Promise<boolean>;
  sendQuotation: (quotationId: string) => void;
  recordCustomerAcceptance: (quotationId: string, acceptanceNotes?: string, clientPoNumber?: string) => Promise<boolean>;
  editQuotationData: (quotationId: string, editPayload: any) => Promise<boolean>;
  acceptQuotation: (quotationId: string) => { customer: Customer; project: Project };
  updateProjectStage: (projectId: string, newStage: ProjectStage) => void;
  updateInstallationChecklist: (projectId: string, checklist: Partial<InstallationChecklist>) => void;
  updateProjectTask: (projectId: string, taskId: string, isCompleted: boolean) => void;
  addProjectTask: (projectId: string, task: Partial<ProjectTask>) => void;
  recordPayment: (paymentData: Partial<Payment>) => Payment;
  createInvoice: (invoiceData: Partial<Invoice>) => Invoice;
  addExpense: (expenseData: Partial<ExpenseItem>) => ExpenseItem;
  addSupplier: (supplierData: Partial<Supplier>) => Supplier;
  createPurchaseOrder: (poData: Partial<PurchaseOrder>) => PurchaseOrder;
  receivePurchaseOrder: (poId: string) => void;
  addProduct: (productData: Partial<InventoryProduct>) => InventoryProduct;
  updateProductStock: (productId: string, currentStock: number, minThreshold?: number) => void;
  deleteProduct: (productId: string) => void;
  addMaterialAllocation: (allocationData: Partial<MaterialAllocation>) => MaterialAllocation;
  updateMaterialAllocationStatus: (allocationId: string, status: MaterialAllocation['status']) => void;
  createServiceTicket: (ticketData: Partial<ServiceTicket>) => ServiceTicket;
  updateServiceTicket: (ticketId: string, updates: Partial<ServiceTicket>) => void;
  createCustomerPortalAccount: (customerId: string, username: string, password: string) => Promise<{ success: boolean; error?: string; username?: string }>;
  completeFollowUp: (followUpId: string, notes?: string) => void;
  createFollowUp: (followUpData: Partial<FollowUp>) => FollowUp;
  toggleAutomationRule: (ruleId: string) => void;
  addAutomationRule: (rule: Partial<AutomationRule>) => AutomationRule;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetAllDemoData: () => void;
  
  // Data Refresh & Health
  refreshData: () => Promise<void>;
  lastRefreshedAt: Date | null;
  isDbConnected: boolean;
  dbError: string | null;

  // Helpers
  globalSearch: (query: string) => {
    leads: Lead[];
    customers: Customer[];
    projects: Project[];
    quotations: Quotation[];
    invoices: Invoice[];
    tickets: ServiceTicket[];
  };
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

const STORAGE_KEY = 'AB_SOLAR_CRM_DATA_V2';

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ab_solar_token'));
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_user`) || localStorage.getItem('AB_SOLAR_CRM_DATA_V1_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('ab_solar_token');
  });
  const [previewRole, setPreviewRole] = useState<Role | null>(null);
  const [activeRoleState, setActiveRoleState] = useState<Role>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_user`);
    return saved ? JSON.parse(saved).role : 'Super Admin';
  });

  const activeRole = previewRole || currentUser?.role || activeRoleState;

  const setActiveRole = (role: Role) => {
    if (currentUser?.role === 'Super Admin') {
      setPreviewRole(role === 'Super Admin' ? null : role);
      setActiveRoleState(role);
    } else {
      console.warn('Unauthorized role switch attempt blocked. Authenticated role is strictly enforced by server.');
    }
  };

  const setDemoPreviewRole = (role: Role | null) => {
    if (currentUser?.role === 'Super Admin') {
      setPreviewRole(role);
      if (role) setActiveRoleState(role);
      else if (currentUser) setActiveRoleState(currentUser.role);
    }
  };

  const logout = async () => {
    try {
      const currentToken = localStorage.getItem('ab_solar_token');
      if (currentToken) {
        await fetch(getApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${currentToken}` }
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('ab_solar_token');
      localStorage.removeItem(`${STORAGE_KEY}_user`);
      localStorage.removeItem(`${STORAGE_KEY}_auth`);
      setToken(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
      setPreviewRole(null);
    }
  };

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const currentToken = localStorage.getItem('ab_solar_token');
    const headers = new Headers(options.headers || {});
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    const resolvedUrl = getApiUrl(url);
    const response = await fetch(resolvedUrl, { ...options, headers });
    if (response.status === 401 && !url.includes('/api/auth/login')) {
      logout();
    }
    return response;
  };

  const login = async (
    usernameOrData: string | { name: string; email: string; role: Role }, 
    passwordOrNothing?: string
  ): Promise<{ success: boolean; error?: string; role?: Role; defaultTab?: string }> => {
    try {
      let username = '';
      let password = '';
      if (typeof usernameOrData === 'string') {
        username = usernameOrData;
        password = passwordOrNothing || '';
      } else {
        username = usernameOrData.email;
        password = passwordOrNothing || '';
      }

      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        return {
          success: false,
          error: res.status === 404
            ? 'Backend API not reachable (404). Please ensure Node.js is started in cPanel.'
            : `Authentication error (${res.status}): ${rawText.slice(0, 100)}`
        };
      }

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || data.message || 'Authentication failed' };
      }

      const user: AuthUser = data.user;
      const newToken = data.token;

      localStorage.setItem('ab_solar_token', newToken);
      localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(user));
      localStorage.setItem(`${STORAGE_KEY}_auth`, 'true');

      setToken(newToken);
      setCurrentUser(user);
      setActiveRoleState(user.role);
      setPreviewRole(null);
      setIsAuthenticated(true);
      if (user.customerId) {
        setSelectedCustomerIdForPortal(user.customerId);
      }

      let defaultTab = 'dashboard';
      if (user.role === 'Customer') defaultTab = 'customer-portal';
      else if (user.role === 'Survey Engineer') defaultTab = 'site-surveys';
      else if (user.role === 'Sales Executive' || user.role === 'Sales Manager') defaultTab = 'pipeline';
      else if (user.role === 'Project Manager') defaultTab = 'projects';
      else if (user.role === 'Purchase Team') defaultTab = 'purchase-orders';
      else if (user.role === 'Installation Team') defaultTab = 'stock';
      else if (user.role === 'Accounts') defaultTab = 'invoices';
      else if (user.role === 'Service Team') defaultTab = 'service-tickets';

      return { success: true, role: user.role, defaultTab };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to connect to authentication server' };
    }
  };

  // Restore session on mount via /api/auth/me
  useEffect(() => {
    const savedToken = localStorage.getItem('ab_solar_token');
    if (!savedToken) {
      setIsRestoringSession(false);
      setIsAuthenticated(false);
      setCurrentUser(null);
      return;
    }

    fetch(getApiUrl('/api/auth/me'), {
      headers: {
        'Authorization': `Bearer ${savedToken}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Session invalid');
        return res.json();
      })
      .then(data => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setActiveRoleState(data.user.role);
          if (data.user.customerId) {
            setSelectedCustomerIdForPortal(data.user.customerId);
          }
          setIsAuthenticated(true);

          fetch(getApiUrl('/api/notifications'), {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          })
            .then(r => r.json())
            .then(nData => {
              if (nData.success && nData.notifications) {
                setNotifications(nData.notifications.map((n: any) => ({
                  id: n.id,
                  title: n.title,
                  message: n.message,
                  type: n.type || 'info',
                  timestamp: n.created_at,
                  isRead: Boolean(n.is_read),
                  link: n.link,
                })));
              }
            })
            .catch(() => {});
        } else {
          throw new Error('User not found');
        }
      })
      .catch(() => {
        localStorage.removeItem('ab_solar_token');
        localStorage.removeItem(`${STORAGE_KEY}_user`);
        localStorage.removeItem(`${STORAGE_KEY}_auth`);
        setToken(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => {
        setIsRestoringSession(false);
      });
  }, []);

  const [selectedCustomerIdForPortal, setSelectedCustomerIdForPortal] = useState<string>('CUST-2026-001');

  // Relational Entities
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_leads`);
    return saved ? JSON.parse(saved) : [];
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : [];
  });
  const [surveys, setSurveys] = useState<SiteSurvey[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_surveys`);
    return saved ? JSON.parse(saved) : [];
  });
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_quotations`);
    return saved ? JSON.parse(saved) : [];
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_projects`);
    return saved ? JSON.parse(saved) : [];
  });
  const [products, setProducts] = useState<InventoryProduct[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_invoices`);
    return saved ? JSON.parse(saved) : [];
  });
  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_payments`);
    return saved ? JSON.parse(saved) : [];
  });
  const [warranties, setWarranties] = useState<Warranty[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_warranties`);
    return saved ? JSON.parse(saved) : [];
  });
  const [amcs, setAmcs] = useState<AmcContract[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_amcs`);
    return saved ? JSON.parse(saved) : [];
  });
  const [tickets, setTickets] = useState<ServiceTicket[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tickets`);
    return saved ? JSON.parse(saved) : [];
  });
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_rules`);
    return saved ? JSON.parse(saved) : INITIAL_AUTOMATION_RULES;
  });
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_logs`);
    const raw: AutomationLog[] = saved ? JSON.parse(saved) : [];
    const seen = new Set<string>();
    return raw.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  });
  const [followUps, setFollowUps] = useState<FollowUp[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_followups`);
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
    return saved ? JSON.parse(saved) : [];
  });
  const [timeline, setTimeline] = useState<ActivityTimelineItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_timeline`);
    return saved ? JSON.parse(saved) : [];
  });
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_suppliers`);
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pos`);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });
  const [materialAllocations, setMaterialAllocations] = useState<MaterialAllocation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_mat_alloc`);
    return saved ? JSON.parse(saved) : INITIAL_MATERIAL_ALLOCATIONS;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_leads`, JSON.stringify(leads));
    localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
    localStorage.setItem(`${STORAGE_KEY}_surveys`, JSON.stringify(surveys));
    localStorage.setItem(`${STORAGE_KEY}_quotations`, JSON.stringify(quotations));
    localStorage.setItem(`${STORAGE_KEY}_projects`, JSON.stringify(projects));
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
    localStorage.setItem(`${STORAGE_KEY}_invoices`, JSON.stringify(invoices));
    localStorage.setItem(`${STORAGE_KEY}_payments`, JSON.stringify(payments));
    localStorage.setItem(`${STORAGE_KEY}_warranties`, JSON.stringify(warranties));
    localStorage.setItem(`${STORAGE_KEY}_amcs`, JSON.stringify(amcs));
    localStorage.setItem(`${STORAGE_KEY}_tickets`, JSON.stringify(tickets));
    localStorage.setItem(`${STORAGE_KEY}_rules`, JSON.stringify(automationRules));
    localStorage.setItem(`${STORAGE_KEY}_logs`, JSON.stringify(automationLogs));
    localStorage.setItem(`${STORAGE_KEY}_followups`, JSON.stringify(followUps));
    localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
    localStorage.setItem(`${STORAGE_KEY}_timeline`, JSON.stringify(timeline));
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
    localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
    localStorage.setItem(`${STORAGE_KEY}_pos`, JSON.stringify(purchaseOrders));
    localStorage.setItem(`${STORAGE_KEY}_mat_alloc`, JSON.stringify(materialAllocations));
  }, [leads, customers, surveys, quotations, projects, products, invoices, payments, warranties, amcs, tickets, automationRules, automationLogs, followUps, notifications, timeline, expenses, suppliers, purchaseOrders, materialAllocations]);

  // Live MySQL connection & refresh metadata
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(new Date());
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const refreshData = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/api/bootstrap');
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) {
        setIsDbConnected(false);
        setDbError(`API error (${res.status})`);
        return;
      }
      const result = await res.json();
      if (result && result.success && result.data) {
        const d = result.data;
        if (d.employees?.length) setEmployees(d.employees);
        if (Array.isArray(d.leads)) setLeads(d.leads);
        if (Array.isArray(d.customers)) setCustomers(d.customers);
        if (Array.isArray(d.surveys)) setSurveys(d.surveys);
        if (Array.isArray(d.quotations)) setQuotations(d.quotations);
        if (Array.isArray(d.projects)) setProjects(d.projects);
        if (d.products?.length) setProducts(d.products);
        if (Array.isArray(d.invoices)) setInvoices(d.invoices);
        if (Array.isArray(d.payments)) setPayments(d.payments);
        if (Array.isArray(d.warranties)) setWarranties(d.warranties);
        if (Array.isArray(d.amcs)) setAmcs(d.amcs);
        if (Array.isArray(d.tickets)) setTickets(d.tickets);
        if (Array.isArray(d.followUps)) setFollowUps(d.followUps);
        if (d.suppliers?.length) setSuppliers(d.suppliers);
        if (Array.isArray(d.expenses)) setExpenses(d.expenses);
        setIsDbConnected(true);
        setDbError(null);
        setLastRefreshedAt(new Date());
      }
    } catch (err: any) {
      console.warn('Note: Could not reach MySQL API, using local state.', err);
      setIsDbConnected(false);
      setDbError(err?.message || 'Connection failed');
    }
  };

  // Initial load: Fetch directly from live MySQL database via authenticated bootstrap
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshData();
    }
  }, [isAuthenticated, token]);

  // Internal log helper
  const addAutomationLog = (ruleName: string, triggerEvent: string, entityId: string, entityName: string, actionSummary: string, status: 'Success' | 'Failed' | 'Warning' = 'Success') => {
    const newLog: AutomationLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ruleName,
      triggerEvent,
      timestamp: new Date().toISOString(),
      targetEntityId: entityId,
      targetEntityName: entityName,
      actionSummary,
      status,
    };
    setAutomationLogs(prev => [newLog, ...prev]);

    // Update rule trigger count
    setAutomationRules(prev => prev.map(r => r.name === ruleName ? {
      ...r,
      actionsExecutedCount: r.actionsExecutedCount + 1,
      lastTriggeredAt: new Date().toISOString()
    } : r));
  };

  const addTimelineItem = (entityType: ActivityTimelineItem['entityType'], entityId: string, title: string, description: string, performedBy: string, iconType: ActivityTimelineItem['iconType']) => {
    const item: ActivityTimelineItem = {
      id: `TL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      title,
      description,
      performedBy,
      iconType,
    };
    setTimeline(prev => [item, ...prev]);
  };

  const addNotification = (title: string, message: string, type: SystemNotification['type'], targetId?: string, targetType?: string) => {
    const notif: SystemNotification = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false,
      targetId,
      targetType,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // 1. AUTOMATION: Create Lead
  const createLead = (leadData: Partial<Lead>): Lead => {
    const existingNums = leads.map(l => {
      const match = l.id.match(/LD-2026-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNum = Math.max(28, ...existingNums, leads.length);
    const leadId = `LD-2026-${String(maxNum + 1).padStart(3, '0')}`;
    
    // Lead Assignment Resolution:
    let assignedEmp: { id: string; name: string };
    if (leadData.assignedToId && leadData.assignedToId !== 'auto') {
      const found = employees.find(e => e.id === leadData.assignedToId || e.name === leadData.assignedToName);
      if (found) {
        assignedEmp = { id: found.id, name: found.name };
      } else {
        assignedEmp = { id: leadData.assignedToId, name: leadData.assignedToName || 'Sales Representative' };
      }
    } else if (currentUser && currentUser.role === 'Sales Executive') {
      // Direct lead created by sales executive belongs to themselves
      assignedEmp = { id: currentUser.employeeId || currentUser.id, name: currentUser.name };
    } else {
      // Intelligent auto-assignment: pick active Sales Executive with fewest leads
      const activeExecs = employees.filter(e => e.role === 'Sales Executive' && e.status !== 'Inactive');
      if (activeExecs.length > 0) {
        const execCounts = activeExecs.map(exec => {
          const count = leads.filter(l => 
            (l.assignedToId === exec.id || l.assignedToId === exec.employeeId || l.assignedToName?.toLowerCase() === exec.name.toLowerCase()) && 
            l.status !== 'Lost'
          ).length;
          return { exec, count };
        });
        execCounts.sort((a, b) => a.count - b.count);
        assignedEmp = { id: execCounts[0].exec.id, name: execCounts[0].exec.name };
      } else {
        const fallback = employees.find(e => e.role === 'Sales Executive') || employees[1];
        assignedEmp = { id: fallback.id, name: fallback.name };
      }
    }
    
    // Estimate KW based on monthly bill (Tariff approx ₹8/kWh, 1kW generates 120 units/mo)
    const bill = leadData.monthlyBill || 0;
    const estKwFromBill = bill > 0 ? Math.round((bill / 8) / 120) : 0;
    const estKw = Math.max(3, estKwFromBill || (leadData.sanctionLoad || 3));
    const estBudget = estKw * 60000;

    const newLead: Lead = {
      id: leadId,
      name: leadData.name || 'Solar Prospect',
      email: leadData.email || '',
      phone: leadData.phone || '',
      city: leadData.city || '',
      state: leadData.state || '',
      address: leadData.address || '',
      pincode: leadData.pincode || '',
      source: leadData.source || 'Website',
      status: leadData.status || 'New',
      surveyId: leadData.surveyId,
      priority: leadData.priority || 'Medium',
      recommendedPriority: leadData.recommendedPriority,
      priorityOverrideReason: leadData.priorityOverrideReason,
      buyingIntent: leadData.buyingIntent,
      assignedToId: assignedEmp.id,
      assignedToName: assignedEmp.name,
      monthlyBill: bill,
      sanctionLoad: leadData.sanctionLoad || Math.ceil(estKw * 1.1),
      roofAreaSqFt: leadData.roofAreaSqFt || (estKw * 100),
      roofType: leadData.roofType || 'RCC Flat',
      recommendedKw: estKw,
      estimatedBudget: estBudget,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: leadData.notes || '',
    };

    setLeads(prev => [newLead, ...prev]);

    // Persist to MySQL
    authFetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLead)
    }).then(async res => {
      if (res.ok) {
        const data = await res.json();
        if (data.lead && data.lead.id && data.lead.id !== leadId) {
          setLeads(prev => prev.map(l => l.id === leadId ? { ...l, id: data.lead.id } : l));
        }
      }
    }).catch(err => console.error('Failed to save lead to MySQL:', err));

    // TRIGGER RULE-01: Auto-assign, create Day 1 follow-up, log activity
    const fup: FollowUp = {
      id: `FUP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      leadId: newLead.id,
      leadName: newLead.name,
      title: `Discovery Call: Verify electricity bill & sanction load for ${newLead.recommendedKw} kW`,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      dueTime: '11:00 AM',
      type: 'Call',
      status: 'Pending',
      priority: newLead.priority,
      assignedToId: assignedEmp.id,
      assignedToName: assignedEmp.name,
      notes: 'Confirm if roof has clear South orientation without shading trees or water tanks.',
      dayInterval: 1,
    };
    setFollowUps(prev => [fup, ...prev]);

    addAutomationLog(
      'Auto-Assign New Lead & Trigger Follow-up',
      'LEAD_CREATED',
      newLead.id,
      newLead.name,
      `Assigned to ${assignedEmp.name}. Created discovery follow-up task. Calculated preliminary ${estKw} kW sizing.`
    );

    addTimelineItem('Lead', newLead.id, 'Lead Created & Auto-Assigned', `Source: ${newLead.source}. Assigned to ${assignedEmp.name}.`, 'Automation Engine', 'lead');
    addNotification('New Solar Lead Created', `${newLead.name}${newLead.city ? ' (' + newLead.city + ')' : ''} added and assigned to ${assignedEmp.name}.`, 'Lead', newLead.id, 'Lead');

    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    const updatedAt = new Date().toISOString();
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates, updatedAt } : l));
    authFetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, updatedAt })
    }).catch(err => console.error('Failed to update lead in MySQL:', err));
  };

  const deleteLead = (leadId: string) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
    authFetch(`/api/leads/${leadId}`, {
      method: 'DELETE',
    }).catch(err => console.error('Failed to delete lead from MySQL:', err));
  };

  const autoAssignAllLeads = () => {
    const activeExecs = employees.filter(e => e.role === 'Sales Executive' && e.status !== 'Inactive');
    if (activeExecs.length === 0) return { assignedCount: 0, repsCount: 0 };

    let execIndex = 0;
    const leadUpdates: { id: string; assignedToId: string; assignedToName: string }[] = [];

    const newLeads = leads.map((lead) => {
      const rep = activeExecs[execIndex % activeExecs.length];
      execIndex++;
      leadUpdates.push({ id: lead.id, assignedToId: rep.id, assignedToName: rep.name });
      return {
        ...lead,
        assignedToId: rep.id,
        assignedToName: rep.name,
        updatedAt: new Date().toISOString()
      };
    });

    setLeads(newLeads);

    Promise.all(leadUpdates.map(u => 
      authFetch(`/api/leads/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: u.assignedToId, assignedToName: u.assignedToName })
      })
    )).catch(err => console.error('Failed to persist auto-assigned leads:', err));

    addNotification(
      'Leads Auto-Distributed',
      `Evenly distributed ${leads.length} leads across ${activeExecs.length} active Sales Executives.`,
      'Lead',
      'all',
      'Lead'
    );

    return { assignedCount: leads.length, repsCount: activeExecs.length };
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    authFetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(err => console.error('Failed to update project in MySQL:', err));
  };

  const assignProject = (projectId: string, installationLeadId: string, installationLeadName: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (proj && proj.stage === 'Completed') {
      console.warn(`Cannot assign crew to project ${projectId}: project is already Completed.`);
      return;
    }
    updateProject(projectId, { installationLeadId, installationLeadName });
  };

  const autoAssignAllProjects = () => {
    const activeCrew = employees.filter(e => e.role === 'Installation Team' && e.status !== 'Inactive');
    if (activeCrew.length === 0) return { assignedCount: 0, crewCount: 0 };

    let crewIndex = 0;
    const projectUpdates: { id: string; installationLeadId: string; installationLeadName: string }[] = [];

    const newProjects = projects.map(proj => {
      // Do not reassign crew to completed projects
      if (proj.stage === 'Completed') {
        return proj;
      }
      const member = activeCrew[crewIndex % activeCrew.length];
      crewIndex++;
      projectUpdates.push({ id: proj.id, installationLeadId: member.id, installationLeadName: member.name });
      return {
        ...proj,
        installationLeadId: member.id,
        installationLeadName: member.name,
      };
    });

    setProjects(newProjects);

    Promise.all(projectUpdates.map(u => 
      authFetch(`/api/projects/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installationLeadId: u.installationLeadId, installationLeadName: u.installationLeadName })
      })
    )).catch(err => console.error('Failed to persist auto-assigned projects:', err));

    addNotification(
      'Projects Auto-Distributed',
      `Evenly balanced ${projectUpdates.length} active installation projects across ${activeCrew.length} crew technicians.`,
      'Installation',
      'all',
      'Project'
    );

    return { assignedCount: projectUpdates.length, crewCount: activeCrew.length };
  };

  // 2. AUTOMATION: Qualify Lead -> Auto-schedule Site Survey (RULE-02)
  const qualifyLead = (
    leadId: string, 
    surveyOptions?: { 
      engineerId?: string; 
      engineerName?: string; 
      scheduledDate?: string; 
      scheduledTime?: string; 
      notes?: string;
      leadData?: Partial<Lead>;
    }
  ) => {
    let lead = leads.find(l => l.id === leadId) || (surveyOptions?.leadData ? (surveyOptions.leadData as Lead) : undefined);
    if (!lead) return;

    // Protection against duplicate survey creation
    if (lead.surveyId) {
      const existing = surveys.find(s => s.id === lead.surveyId || s.leadId === lead.id);
      if (existing) {
        console.warn('Site survey already exists for this lead:', lead.surveyId);
        return;
      }
    }

    let surveyEng = employees.find(e => e.id === surveyOptions?.engineerId);
    if (!surveyEng) {
      surveyEng = employees.find(e => e.role === 'Survey Engineer') || employees[2];
    }

    const surveyId = lead.surveyId || `SRV-2026-${String(surveys.length + 1).padStart(3, '0')}`;
    const scheduledDate = surveyOptions?.scheduledDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    const scheduledTime = surveyOptions?.scheduledTime || '10:00 AM - 12:00 PM';

    const newSurvey: SiteSurvey = {
      id: surveyId,
      leadId: lead.id,
      leadName: lead.name,
      customerName: lead.name,
      phone: lead.phone,
      address: `${lead.address || ''}${lead.city ? (lead.address ? ', ' : '') + lead.city : ''}`,
      scheduledDate,
      scheduledTime,
      engineerId: surveyEng.id,
      engineerName: surveyEng.name,
      status: 'Scheduled',
      roofAreaSqFt: lead.roofAreaSqFt || 0,
      shadowFreeAreaSqFt: 0,
      roofType: lead.roofType || 'RCC Flat',
      azimuthAngle: 180,
      tiltAngle: 15,
      existingSanctionLoadKw: lead.sanctionLoad || 0,
      gridPhase: (lead.sanctionLoad || 0) > 5 ? 'Three Phase' : 'Single Phase',
      distanceToLtPanelMeters: 0,
      recommendedKw: lead.recommendedKw || 0,
      panelQuantity: 0,
      estimatedGenerationUnitsPerYear: 0,
      estimatedAnnualSavings: 0,
      estimatedCost: 0,
      paybackYears: 0,
      co2ReductionTonsPerYear: 0,
      photosUploaded: [],
      billPhotoUploaded: false,
      notes: surveyOptions?.notes || 'Scheduled site audit. Inspect shadow obstructions, laser measure roof area, and verify LT meter board.',
    };

    setSurveys(prev => [newSurvey, ...prev]);
    updateLead(lead.id, { status: 'Site Survey Scheduled', surveyId });

    // Persist Site Survey to MySQL
    authFetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSurvey)
    }).catch(err => console.error('Failed to save survey to MySQL:', err));

    addAutomationLog(
      'Schedule Site Survey on Lead Qualification',
      'LEAD_QUALIFIED',
      lead.id,
      lead.name,
      `Created Site Survey ${surveyId} assigned to ${surveyEng.name} for ${scheduledDate} (${scheduledTime}).`
    );

    addTimelineItem('Lead', lead.id, 'Lead Qualified → Site Survey Scheduled', `Assigned to ${surveyEng.name}. Date: ${scheduledDate} (${scheduledTime}).`, 'Automation Engine', 'survey');
    addNotification('Site Survey Scheduled', `Survey for ${lead.name} assigned to ${surveyEng.name} on ${scheduledDate} (${scheduledTime}).`, 'Task', surveyId, 'Survey');
  };

  const createSiteSurvey = (surveyData: Partial<SiteSurvey>): SiteSurvey => {
    // Check if survey already exists for this lead
    if (surveyData.leadId) {
      const existing = surveys.find(s => s.leadId === surveyData.leadId);
      if (existing) {
        return existing;
      }
    }

    const surveyId = surveyData.id || `SRV-2026-${String(surveys.length + 1).padStart(3, '0')}`;
    const newSurvey = {
      ...surveyData,
      id: surveyId,
      scheduledTime: surveyData.scheduledTime || '10:00 AM - 12:00 PM',
      status: surveyData.status || 'Scheduled',
      photosUploaded: surveyData.photosUploaded || [],
      photos: surveyData.photos || [],
      reviewHistory: surveyData.reviewHistory || [],
    } as SiteSurvey;
    setSurveys(prev => [newSurvey, ...prev]);

    // Persist Site Survey to backend (backend will generate or verify unique ID)
    authFetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSurvey)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.survey) {
          setSurveys(prev => prev.map(s => s.id === surveyId ? data.survey : s));
        }
      })
      .catch(err => console.error('Failed to save survey to backend:', err));

    return newSurvey;
  };

  const saveSurveyDraft = async (surveyId: string, updates: Partial<SiteSurvey>): Promise<SiteSurvey | null> => {
    try {
      const res = await authFetch(`/api/surveys/${surveyId}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, isDraft: true }),
      });
      const data = await res.json();
      if (data.success && data.survey) {
        setSurveys(prev => prev.map(s => s.id === surveyId ? data.survey : s));
        return data.survey;
      }
    } catch (err) {
      console.error('Failed to save survey draft:', err);
    }
    return null;
  };

  const uploadSurveyPhoto = async (surveyId: string, photoData: {
    category: string;
    fileName: string;
    base64Data: string;
    caption?: string;
    latitude?: number | null;
    longitude?: number | null;
    gpsAccuracyMeters?: number | null;
    capturedAt?: string | null;
  }): Promise<SurveyPhoto | null> => {
    try {
      const res = await authFetch(`/api/surveys/${surveyId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photoData),
      });
      const data = await res.json();
      if (data.success && data.photo) {
        setSurveys(prev => prev.map(s => {
          if (s.id === surveyId) {
            const currentPhotos = s.photos || [];
            return {
              ...s,
              photos: [...currentPhotos, data.photo],
            };
          }
          return s;
        }));
        return data.photo;
      }
    } catch (err) {
      console.error('Failed to upload survey photo:', err);
    }
    return null;
  };

  const deleteSurveyPhoto = async (surveyId: string, photoId: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/surveys/${surveyId}/photos/${photoId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSurveys(prev => prev.map(s => {
          if (s.id === surveyId) {
            return {
              ...s,
              photos: (s.photos || []).filter(p => p.id !== photoId),
            };
          }
          return s;
        }));
        return true;
      }
    } catch (err) {
      console.error('Failed to delete survey photo:', err);
    }
    return false;
  };

  const submitSurveyForReview = async (surveyId: string, comments?: string, bypassWithExceptions?: boolean, updates?: Partial<SiteSurvey>) => {
    try {
      const res = await authFetch(`/api/surveys/${surveyId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments, bypassWithExceptions, updates }),
      });
      const data = await res.json();
      if (data.success && data.survey) {
        setSurveys(prev => prev.map(s => s.id === surveyId ? data.survey : s));
        addTimelineItem('Lead', data.survey.leadId || surveyId, 'Survey Submitted for Review', `Survey ${surveyId} submitted by ${data.survey.engineerName}.`, data.survey.engineerName, 'survey');
        addNotification('Survey Submitted for Review', `Survey for ${data.survey.customerName} submitted for review.`, 'Task', surveyId, 'Survey');
        return { success: true };
      }
      return { success: false, error: data.error, checklistErrors: data.checklistErrors };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const reviewSurveyAction = async (surveyId: string, decision: 'Approved' | 'Changes Required', comments: string) => {
    try {
      const res = await authFetch(`/api/surveys/${surveyId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comments }),
      });
      const data = await res.json();
      if (data.success && data.survey) {
        setSurveys(prev => prev.map(s => s.id === surveyId ? data.survey : s));
        if (data.quotation) {
          setQuotations(prev => {
            const exists = prev.some(q => q.id === data.quotation.id);
            if (exists) {
              return prev.map(q => q.id === data.quotation.id ? data.quotation : q);
            }
            return [data.quotation, ...prev];
          });
        }
        if (decision === 'Approved') {
          if (data.survey.leadId) {
            updateLead(data.survey.leadId, {
              status: 'Survey Completed',
              recommendedKw: data.survey.recommendedKw,
              roofAreaSqFt: data.survey.roofAreaSqFt,
              quotationId: data.quotation?.id || data.survey.quotationId,
            });
          }
          const quoteText = data.quotation ? ` Quotation draft ${data.quotation.quotationNumber || data.quotation.id} automatically created.` : '';
          addTimelineItem('Lead', data.survey.leadId || surveyId, 'Site Survey Approved', `Approved with ${data.survey.recommendedKw}kW verified capacity.${quoteText}`, 'Reviewer', 'survey');
          addNotification('Site Survey Approved', `Survey for ${data.survey.customerName} approved.${quoteText}`, 'Task', surveyId, 'Survey');
        } else {
          addTimelineItem('Lead', data.survey.leadId || surveyId, 'Survey Changes Requested', comments, 'Reviewer', 'survey');
          addNotification('Survey Changes Requested', `Corrections needed for ${data.survey.customerName}: ${comments}`, 'Task', surveyId, 'Survey');
        }
        return { success: true, quotation: data.quotation, quotationError: data.quotationError };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const rescheduleSurveyAction = async (surveyId: string, newDate: string, newTime?: string, engineerId?: string, engineerName?: string) => {
    try {
      const res = await authFetch(`/api/surveys/${surveyId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: newDate, scheduledTime: newTime, engineerId, engineerName }),
      });
      const data = await res.json();
      if (data.success && data.survey) {
        setSurveys(prev => prev.map(s => s.id === surveyId ? { 
          ...s, 
          scheduledDate: newDate, 
          scheduledTime: newTime || s.scheduledTime, 
          engineerName: engineerName || s.engineerName 
        } : s));
        addTimelineItem('Lead', data.survey.leadId || surveyId, 'Survey Rescheduled', `Rescheduled to ${newDate} (${newTime || 'Standard Slot'}).`, 'System', 'survey');
      }
    } catch (err) {
      console.error('Failed to reschedule survey:', err);
    }
  };

  const deleteSiteSurvey = async (surveyId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const surveyToDelete = surveys.find(s => s.id === surveyId);
      if (surveyToDelete && surveyToDelete.status !== 'Approved') {
        return { success: false, error: 'Only Approved site surveys can be deleted.' };
      }

      const res = await authFetch(`/api/surveys/${surveyId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to delete survey' };
      }

      setSurveys(prev => prev.filter(s => s.id !== surveyId));
      if (surveyToDelete?.leadId) {
        setLeads(prev => prev.map(l => l.id === surveyToDelete.leadId ? { ...l, surveyId: undefined } : l));
      }
      addTimelineItem('Lead', surveyToDelete?.leadId || surveyId, 'Survey Deleted', `Site survey ${surveyId} was deleted.`, 'System', 'survey');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete survey:', err);
      return { success: false, error: err.message || 'Network error deleting survey' };
    }
  };


  const reloadSurvey = async (surveyId: string): Promise<SiteSurvey | null> => {
    try {
      const res = await authFetch(`/api/surveys/${surveyId}`);
      const data = await res.json();
      if (data.success && data.survey) {
        setSurveys(prev => prev.map(s => s.id === surveyId ? data.survey : s));
        return data.survey;
      }
    } catch (err) {
      console.error('Failed to reload survey:', err);
    }
    return null;
  };

  // 3. AUTOMATION: Complete Site Survey -> Solar Calculation & Quotation ready (RULE-03)
  const completeSiteSurvey = (surveyId: string, updates: Partial<SiteSurvey>) => {
    // Persist updates to MySQL
    authFetch(`/api/surveys/${surveyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Completed', completedAt: new Date().toISOString(), ...updates })
    }).catch(err => console.error('Failed to update survey in MySQL:', err));

    setSurveys(prev => prev.map(s => {
      if (s.id === surveyId) {
        const completed: SiteSurvey = {
          ...s,
          ...updates,
          status: 'Completed',
          completedAt: new Date().toISOString(),
        };

        // Update Lead status to Survey Completed
        if (completed.leadId) {
          updateLead(completed.leadId, { 
            status: 'Survey Completed', 
            recommendedKw: completed.recommendedKw,
            roofAreaSqFt: completed.roofAreaSqFt 
          });

          addAutomationLog(
            'Auto-Generate Solar Calculation on Survey Completion',
            'SURVEY_COMPLETED',
            surveyId,
            completed.customerName,
            `Solar ROI verified: ${completed.recommendedKw} kW (${completed.panelQuantity} panels), ₹${completed.estimatedAnnualSavings.toLocaleString('en-IN')}/yr savings. Quotation generator unlocked.`
          );

          addTimelineItem('Lead', completed.leadId, 'Site Survey Completed', `Detailed calculation generated by ${completed.engineerName}. 1-click Quotation ready.`, completed.engineerName, 'survey');
          addNotification('Survey Completed & Calculated', `${completed.customerName} survey completed. Ready for Quotation.`, 'Task', surveyId, 'Survey');
        }
        return completed;
      }
      return s;
    }));
  };

  // 4. AUTOMATION: Create Quotation (Authoritative Shared Engine)
  const createQuotation = (quoteData: Partial<Quotation>): Quotation => {
    // Determine highest existing ID to avoid collisions
    let maxNum = 20;
    for (const q of quotations) {
      const match = q.id.match(/QT-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const qNumber = `QT-2026-${String(maxNum + 1).padStart(5, '0')}`;
    const versionNumber = `${qNumber}-V1`;

    const capacity = quoteData.systemCapacityKw || 5;
    const tier = quoteData.packageTier || 'Premium Bifacial';
    const rawDiscount = quoteData.discountAmount || 0;

    // Check if linked to an approved survey
    const linkedSurvey = surveys.find(s => s.leadId === quoteData.leadId);
    const isSurveyApproved = linkedSurvey?.status === 'Approved' || linkedSurvey?.status === 'Completed';

    // Authoritative calculation
    const calc = calculateQuotation({
      leadId: quoteData.leadId,
      leadName: quoteData.leadName,
      customerPhone: quoteData.customerPhone,
      customerAddress: quoteData.customerAddress,
      systemCapacityKw: capacity,
      packageTier: tier,
      discountAmount: rawDiscount,
      surveyId: linkedSurvey?.id,
      isSurveyApproved,
    });

    const v1: QuotationVersion = {
      version: 1,
      quotationNumber: versionNumber,
      createdAt: new Date().toISOString(),
      items: calc.items as any,
      subtotal: calc.subtotal,
      subsidyDeduction: calc.subsidyAmount,
      discount: calc.discountAmount,
      taxableAmount: calc.taxableAmount,
      gstRate: calc.gstRate,
      gstAmount: calc.gstAmount,
      taxMode: calc.taxMode,
      taxType: calc.taxType,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
      igstAmount: calc.igstAmount,
      amountInWords: calc.amountInWords,
      netTotal: calc.finalContractAmount,
      terms: calc.terms,
      notes: isSurveyApproved 
        ? `Techno-Commercial Proposal based on approved Technical Site Survey ${linkedSurvey?.id}.` 
        : `Preliminary indicative solar estimate. Final capacity subject to on-site roof audit.`,
    };

    const validUntil = new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0];
    const newQuotation: Quotation = {
      id: qNumber,
      quotationNumber: versionNumber,
      leadId: quoteData.leadId || '',
      leadName: quoteData.leadName || 'Solar Client',
      customerPhone: quoteData.customerPhone || '+91 98000-00000',
      customerAddress: quoteData.customerAddress || 'Bengaluru',
      systemCapacityKw: calc.systemCapacityKw,
      currentVersion: 1,
      versions: [v1],
      status: 'Draft',
      validUntil,
      salespersonId: quoteData.salespersonId || employees[1].id,
      salespersonName: quoteData.salespersonName || employees[1].name,
      createdAt: new Date().toISOString(),
      totalAmount: calc.finalContractAmount,
      proposalType: calc.proposalType,
      packageTier: calc.packageTier,
      approvalStatus: calc.approvalStatus,
      discountAmount: calc.discountAmount,
      subsidyAmount: calc.subsidyAmount,
      taxableAmount: calc.taxableAmount,
      gstRate: calc.gstRate,
      gstAmount: calc.gstAmount,
      taxMode: calc.taxMode,
      totalCgst: calc.cgstAmount,
      totalSgst: calc.sgstAmount,
      totalIgst: calc.igstAmount,
      amountInWords: calc.amountInWords,
      pdfUrl: `/uploads/proposals/Quotation_${versionNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
      surveyId: linkedSurvey?.id,
    };

    setQuotations(prev => [newQuotation, ...prev]);

    // Persist Quotation to MySQL
    authFetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQuotation)
    }).catch(err => console.error('Failed to save quotation to MySQL:', err));

    if (newQuotation.leadId) {
      updateLead(newQuotation.leadId, { quotationId: newQuotation.id });
      addTimelineItem('Lead', newQuotation.leadId, `Quotation ${versionNumber} Generated`, `Total: ₹${calc.finalContractAmount.toLocaleString('en-IN')} for ${capacity} kW.`, 'Automation Engine', 'quote');
    }

    return newQuotation;
  };

  // Create Quotation Revision (V2, V3, ...)
  const createQuotationRevision = async (quotationId: string, revisionData: Partial<Quotation>) => {
    try {
      const res = await authFetch(`/api/quotations/${quotationId}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(revisionData)
      });
      const data = await res.json();
      if (data.success && data.version) {
        setQuotations(prev => prev.map(q => {
          if (q.id === quotationId) {
            const nextVersions = [...q.versions, data.version];
            return {
              ...q,
              quotationNumber: data.quotationNumber,
              currentVersion: data.version.version,
              versions: nextVersions,
              totalAmount: data.version.netTotal,
              pdfUrl: data.pdfUrl || q.pdfUrl,
            };
          }
          return q;
        }));
      }
    } catch (err) {
      console.error('Failed to create revision on server:', err);
    }
  };

  // Approve Quotation Discount
  const approveQuotationDiscount = async (quotationId: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/quotations/${quotationId}/approve`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (data.success) {
        setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, approvalStatus: 'Approved' } : q));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to approve discount on server:', err);
      return false;
    }
  };

  // 5. AUTOMATION: Send Quotation -> Schedule Day 1, 3, 7, 14 Follow-ups (RULE-04)
  const sendQuotation = (quotationId: string) => {
    // Persist Quotation status update to MySQL
    authFetch(`/api/quotations/${quotationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Sent' })
    }).catch(err => console.error('Failed to update quotation in MySQL:', err));

    setQuotations(prev => prev.map(q => {
      if (q.id === quotationId) {
        const updated: Quotation = {
          ...q,
          status: 'Sent',
          sentDate: new Date().toISOString(),
        };

        if (q.leadId) {
          updateLead(q.leadId, { status: 'Quotation Sent' });
          
          // Schedule Follow-up reminders (Day 1, 3, 7, 14)
          const days = [1, 3, 7, 14];
          const newFollowups: FollowUp[] = days.map(d => ({
            id: `FUP-${Date.now().toString().slice(-6)}-${d}`,
            leadId: q.leadId,
            leadName: q.leadName,
            quotationId: q.id,
            title: `Quotation Follow-up (Day ${d}): Contact ${q.leadName} regarding ${q.quotationNumber}`,
            dueDate: new Date(Date.now() + 86400000 * d).toISOString().split('T')[0],
            dueTime: '02:00 PM',
            type: d === 1 ? 'WhatsApp' : d === 3 ? 'Call' : d === 7 ? 'Site Visit' : 'Call',
            status: 'Pending',
            priority: d === 1 ? 'Urgent' : 'High',
            assignedToId: q.salespersonId,
            assignedToName: q.salespersonName,
            notes: `Verify if customer had questions regarding the ₹${q.totalAmount.toLocaleString('en-IN')} proposal and PM Surya Ghar subsidy claim.`,
            dayInterval: d,
          }));

          setFollowUps(prevFups => [...newFollowups, ...prevFups]);

          addAutomationLog(
            'Multi-Day Quotation Follow-up Schedule',
            'QUOTATION_SENT',
            q.id,
            q.leadName,
            `Sent quotation ${q.quotationNumber}. Automatically scheduled follow-ups for Day 1, 3, 7, and 14.`
          );

          addTimelineItem('Lead', q.leadId, 'Quotation Sent to Customer', `Shared via WhatsApp & Email. Multi-day follow-up automation active.`, 'Sales Engine', 'quote');
          addNotification('Quotation Sent', `${q.quotationNumber} sent to ${q.leadName}. Follow-ups scheduled.`, 'Sales', q.id, 'Quotation');
        }
        return updated;
      }
      return q;
    }));
  };

  // 5B. Stage-Gate: Record Customer Acceptance
  const recordCustomerAcceptance = async (quotationId: string, acceptanceNotes?: string, clientPoNumber?: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/quotations/${quotationId}/customer-accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptanceNotes, clientPoNumber }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.quotation) {
          setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, ...data.quotation, status: 'Customer_Accepted' } : q));
          const q = quotations.find(item => item.id === quotationId);
          if (q?.leadId) {
            addTimelineItem('Lead', q.leadId, 'Customer Accepted Quotation', `Client accepted quotation. Ready for Project Manager EPC project handover.`, 'Sales Engine', 'quote');
            addNotification('Customer Acceptance', `${q.leadName} accepted quotation ${q.quotationNumber}. Project Manager can now convert to Project.`, 'Project', q.id, 'Quotation');
          }
          return true;
        }
      }
      // Fallback client state update
      setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: 'Customer_Accepted' } : q));
      return true;
    } catch (err) {
      console.error('Failed to record customer acceptance:', err);
      setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: 'Customer_Accepted' } : q));
      return true;
    }
  };

  // 5C. Interactive Quotation & Custom BOM Edit
  const editQuotationData = async (quotationId: string, editPayload: any): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/quotations/${quotationId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPayload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.quotation) {
          setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, ...data.quotation } : q));
          addNotification('Quotation Updated', `Quotation ${data.quotation.quotationNumber} BOM & pricing updated.`, 'Sales', quotationId, 'Quotation');
          return true;
        }
      }

      // Fallback: Calculate and update in client state
      const existing = quotations.find(q => q.id === quotationId);
      const calc = calculateQuotation({
        systemCapacityKw: editPayload.systemCapacityKw || existing?.systemCapacityKw || 5,
        packageTier: editPayload.packageTier || existing?.packageTier || 'Premium Bifacial',
        discountAmount: editPayload.discountAmount !== undefined ? editPayload.discountAmount : existing?.discountAmount,
        customItems: editPayload.customItems,
      });

      setQuotations(prev => prev.map(q => {
        if (q.id === quotationId) {
          const v = q.versions[0] || {};
          const updatedVer = {
            ...v,
            items: calc.items,
            subtotal: calc.subtotal,
            discount: calc.discountAmount,
            taxableAmount: calc.taxableAmount,
            gstAmount: calc.gstAmount,
            netTotal: calc.finalContractAmount,
            amountInWords: calc.amountInWords,
            notes: editPayload.notes || v.notes,
          };
          return {
            ...q,
            systemCapacityKw: calc.systemCapacityKw,
            packageTier: calc.packageTier,
            discountAmount: calc.discountAmount,
            totalAmount: calc.finalContractAmount,
            subtotal: calc.subtotal,
            taxableAmount: calc.taxableAmount,
            gstAmount: calc.gstAmount,
            amountInWords: calc.amountInWords,
            versions: [updatedVer, ...q.versions.slice(1)],
          };
        }
        return q;
      }));

      return true;
    } catch (err) {
      console.error('Failed to edit quotation:', err);
      return false;
    }
  };

  // 6. AUTOMATION: Deal Conversion -> Quotation Accepted (RULE-05, RULE-06)
  // CRITICAL DEFECT FIX: Idempotent project conversion, UNPAID advance invoice, ZERO fake payments!
  const acceptQuotation = (quotationId: string) => {
    const quote = quotations.find(q => q.id === quotationId);
    if (!quote) throw new Error('Quotation not found');

    // 1. Idempotency Check: Return existing project if already converted
    if (quote.convertedToProjectId) {
      const existingProject = projects.find(p => p.id === quote.convertedToProjectId);
      const existingCustomer = customers.find(c => c.id === existingProject?.customerId);
      if (existingProject && existingCustomer) {
        return { customer: existingCustomer, project: existingProject };
      }
    }

    // 2. Resolve or create Customer (Advance NOT marked as paid)
    let customer = customers.find(c => c.convertedFromLeadId === quote.leadId || c.phone === quote.customerPhone);
    const advanceAmount = Math.round(quote.totalAmount * 0.90);

    if (!customer) {
      let maxCustNum = 20;
      for (const c of customers) {
        const match = c.id.match(/CUST-2026-(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxCustNum) maxCustNum = n;
        }
      }
      const custId = `CUST-2026-${String(maxCustNum + 1).padStart(3, '0')}`;

      customer = {
        id: custId,
        name: quote.leadName,
        email: `${quote.leadName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: quote.customerPhone,
        address: quote.customerAddress,
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        consumerNumberDiscom: `DISCOM-${Math.floor(1000000 + Math.random() * 9000000)}`,
        discomName: 'BESCOM',
        convertedFromLeadId: quote.leadId,
        totalSystemKw: quote.systemCapacityKw,
        totalOrderValue: quote.totalAmount,
        paidAmount: 0, // ZERO upfront until recorded by Accounts
        balanceAmount: quote.totalAmount,
        createdAt: new Date().toISOString(),
        status: 'Under Installation',
      };
      setCustomers(prev => [customer!, ...prev]);
    }

    // 3. Create Project
    let maxProjNum = 20;
    for (const p of projects) {
      const match = p.id.match(/PROJECT-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxProjNum) maxProjNum = n;
      }
    }
    const projId = `PROJECT-2026-${String(maxProjNum + 1).padStart(3, '0')}`;
    const pm = employees.find(e => e.role === 'Project Manager') || employees[3];

    // Reserve products
    const requiredPanels = Math.ceil((quote.systemCapacityKw * 1000) / 550);
    setProducts(prev => prev.map(p => {
      if (p.category === 'Solar Panels') {
        const reserved = Math.min(p.availableStock, requiredPanels);
        return {
          ...p,
          reservedStock: p.reservedStock + reserved,
          availableStock: Math.max(0, p.availableStock - reserved),
        };
      }
      return p;
    }));

    const newProject: Project = {
      id: projId,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      quotationId: quote.id,
      capacityKw: quote.systemCapacityKw,
      totalAmount: quote.totalAmount,
      stage: 'Booking',
      startDate: new Date().toISOString().split('T')[0],
      targetCompletionDate: new Date(Date.now() + 86400000 * 25).toISOString().split('T')[0],
      projectManagerId: pm.id,
      projectManagerName: pm.name,
      installationLeadId: pm.id,
      installationLeadName: pm.name,
      inventoryReserved: true,
      materialShortageFlag: false,
      warrantyActivated: false,
      amcInitiated: false,
      discomSanctionNumber: `BESCOM/SANCTION/${Date.now().toString().slice(-4)}`,
      notes: `Converted deal from Quotation ${quote.quotationNumber}. 90% Advance invoice issued (Unpaid).`,
      tasks: [
        { id: `PT-${Date.now()}-1`, title: 'DISCOM Net-metering application & sanction', stage: 'Documentation', isCompleted: false, assignedRole: 'Project Manager', assignedToName: pm.name, dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] },
        { id: `PT-${Date.now()}-2`, title: 'Warehouse material packing and dispatch check', stage: 'Material Ready', isCompleted: false, assignedRole: 'Project Manager', assignedToName: pm.name, dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0] },
        { id: `PT-${Date.now()}-3`, title: 'HDG structure foundation & anchor bolting', stage: 'Installation Scheduled', isCompleted: false, assignedRole: 'Installation Team', assignedToName: 'Solar Tech Crew', dueDate: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0] },
        { id: `PT-${Date.now()}-4`, title: 'Module mounting & DC string conduit wiring', stage: 'Installation In Progress', isCompleted: false, assignedRole: 'Installation Team', assignedToName: 'Solar Tech Crew', dueDate: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0] },
      ],
      checklist: {
        structureFastening: false,
        moduleClampingTorque: false,
        inverterWallMounting: false,
        dcWiringConduit: false,
        acWiringArmoured: false,
        chemicalEarthingPits: false,
        lightningArrester: false,
        dcdbProtectionFuses: false,
        acdbMccbIsolator: false,
        remoteMonitoringConfigured: false,
        vocAndIscTesting: false,
        safetySignagesAffixed: false,
        photosUploaded: [],
      },
    };

    setProjects(prev => [newProject, ...prev]);

    // 4. Create 90% Advance Invoice (CRITICAL: Marked UNPAID, NO FAKE PAYMENT)
    let maxInvNum = 20;
    for (const inv of invoices) {
      const match = inv.id.match(/INV-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxInvNum) maxInvNum = n;
      }
    }
    const invId = `INV-2026-${String(maxInvNum + 1).padStart(3, '0')}`;
    const newInvoice: Invoice = {
      id: invId,
      invoiceNumber: `INV-2026-00${String(maxInvNum + 1).padStart(3, '0')}`,
      projectId: newProject.id,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      subtotal: Math.round(advanceAmount / 1.138),
      cgst: Math.round((advanceAmount - Math.round(advanceAmount / 1.138)) / 2),
      sgst: Math.round((advanceAmount - Math.round(advanceAmount / 1.138)) / 2),
      igst: 0,
      totalAmount: advanceAmount,
      paidAmount: 0, // UNPAID!
      balanceDue: advanceAmount,
      status: 'Sent', // UNPAID pending payment!
      items: [
        { description: `90% Milestone Advance for ${quote.systemCapacityKw} kW Solar Plant`, hsnCode: '995465', quantity: 1, rate: Math.round(advanceAmount / 1.138), amount: Math.round(advanceAmount / 1.138) }
      ],
    };
    setInvoices(prev => [newInvoice, ...prev]);

    // Update Quotation & Lead state
    setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: 'Converted_To_Project', convertedToProjectId: newProject.id } : q));
    if (quote.leadId) {
      updateLead(quote.leadId, { status: 'Won', customerId: customer.id, projectId: newProject.id });
    }

    // Call transactional backend endpoint
    authFetch(`/api/quotations/${quotationId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.projectId) {
          setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: 'Converted_To_Project', convertedToProjectId: data.projectId } : q));
        }
      }
    }).catch(err => console.error('Failed to accept quotation in MySQL transaction:', err));

    addTimelineItem('Lead', quote.leadId, 'Quotation Accepted & Deal Won', `Project ${newProject.id} initialized. 40% Advance invoice issued (Unpaid).`, 'Sales Engine', 'project');
    addNotification('Deal Won', `Quotation ${quote.quotationNumber} accepted. Project ${newProject.id} scheduled.`, 'Sales', newProject.id, 'Project');

    return { customer, project: newProject };
  };

  // 7. AUTOMATION: Update Project Stage & Trigger Milestones
  const updateProjectStage = (projectId: string, newStage: ProjectStage) => {
    authFetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage })
    }).catch(err => console.error('Failed to update project stage in MySQL:', err));

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updated: Project = { ...p, stage: newStage };

        // Milestone triggers
        if (newStage === 'Installation Completed') {
          addAutomationLog(
            'Commissioning & Net-Metering Handover',
            'INSTALLATION_COMPLETED',
            p.id,
            p.customerName,
            'All installation checklist items verified. Net-metering sync requested with DISCOM.'
          );
          addTimelineItem('Project', p.id, 'Installation Completed', '12-point technical checklist completed with geo-tagged photos.', 'Installation Lead', 'install');
          addNotification('Installation Completed', `${p.customerName} solar plant is ready for CEIG / DISCOM inspection.`, 'Installation', p.id, 'Project');
        }

        if (newStage === 'Completed') {
          updated.warrantyActivated = true;
          updated.amcInitiated = true;
          updated.commissioningDate = new Date().toISOString().split('T')[0];
          updated.netMeterInstalledDate = new Date().toISOString().split('T')[0];

          // Auto-activate Warranties (RULE-08)
          const panelWar: Warranty = {
            id: `WAR-${Date.now().toString().slice(-4)}-1`,
            projectId: p.id,
            customerId: p.customerId,
            customerName: p.customerName,
            equipmentType: 'Solar Panels (Performance)',
            makeModel: 'Waaree 550W Bifacial TOPCon',
            serialNumber: `WAR-2026-${Math.floor(100000 + Math.random() * 900000)}`,
            warrantyPeriodYears: 25,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 86400000 * 365 * 25).toISOString().split('T')[0],
            daysRemaining: 365 * 25,
            status: 'Active',
          };

          const invWar: Warranty = {
            id: `WAR-${Date.now().toString().slice(-4)}-2`,
            projectId: p.id,
            customerId: p.customerId,
            customerName: p.customerName,
            equipmentType: 'Solar Inverter',
            makeModel: 'Sungrow Grid-Tied Inverter',
            serialNumber: `SG-INV-${Math.floor(100000 + Math.random() * 900000)}`,
            warrantyPeriodYears: 10,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 86400000 * 365 * 10).toISOString().split('T')[0],
            daysRemaining: 365 * 10,
            status: 'Active',
          };

          setWarranties(prevW => [panelWar, invWar, ...prevW]);

          // Persist Warranties to MySQL
          authFetch('/api/warranties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(panelWar)
          }).catch(err => console.error('Failed to save panel warranty to MySQL:', err));

          authFetch('/api/warranties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invWar)
          }).catch(err => console.error('Failed to save inverter warranty to MySQL:', err));

          // Auto-provision AMC Opportunity
          const newAmc: AmcContract = {
            id: `AMC-2026-${String(amcs.length + 1).padStart(3, '0')}`,
            customerId: p.customerId,
            customerName: p.customerName,
            customerPhone: p.customerPhone,
            customerAddress: p.customerAddress,
            projectId: p.id,
            capacityKw: p.capacityKw,
            planName: p.capacityKw >= 20 ? 'Commercial Max Performance' : 'Gold Annual Care',
            annualPrice: p.capacityKw * 1000,
            visitsPerYear: 4,
            completedVisits: 0,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0],
            status: 'Active',
            nextScheduledVisit: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
          };

          setAmcs(prevA => [newAmc, ...prevA]);

          addAutomationLog(
            'Warranty Activation & AMC Opportunity Generator',
            'COMMISSIONING_COMPLETED',
            p.id,
            p.customerName,
            `Activated 25-Year Panel Warranty and 10-Year Inverter Warranty. Provisioned 4-visit AMC Contract ${newAmc.id}.`
          );

          addTimelineItem('Customer', p.customerId, 'Plant Commissioned & Warranties Activated', 'System producing clean solar power. Net-meter verified.', 'Automation Engine', 'warranty');
          addNotification('Plant Commissioned', `${p.customerName} system is live! Warranties & AMC activated.`, 'Service', p.id, 'Project');
        }

        return updated;
      }
      return p;
    }));
  };

  const updateInstallationChecklist = (projectId: string, checklistUpdates: Partial<InstallationChecklist>) => {
    authFetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklist: checklistUpdates })
    }).catch(err => console.error('Failed to update project checklist in MySQL:', err));

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          checklist: {
            ...p.checklist,
            ...checklistUpdates,
          },
        };
      }
      return p;
    }));
  };

  // 8. AUTOMATION: Record Payment -> Update Invoice, Balance, Alert if Overdue cleared
  const recordPayment = (paymentData: Partial<Payment>): Payment => {
    const paymentId = `PAY-2026-${String(payments.length + 1).padStart(3, '0')}`;
    const pNumber = `PAY-2026-000${String(payments.length + 1).padStart(2, '0')}`;

    const newPayment: Payment = {
      id: paymentId,
      paymentNumber: pNumber,
      invoiceId: paymentData.invoiceId || '',
      projectId: paymentData.projectId || '',
      customerId: paymentData.customerId || '',
      customerName: paymentData.customerName || 'Customer',
      amount: paymentData.amount || 0,
      paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
      paymentMode: paymentData.paymentMode || 'NEFT/RTGS',
      transactionReference: paymentData.transactionReference || `TXN-${Date.now().toString().slice(-6)}`,
      bankName: paymentData.bankName || 'Bank',
      status: 'Verified',
      recordedBy: activeRole,
    };

    setPayments(prev => [newPayment, ...prev]);

    // Persist Payment to MySQL
    authFetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPayment)
    }).catch(err => console.error('Failed to save payment to MySQL:', err));

    // Update Invoice balance in local state and MySQL
    if (newPayment.invoiceId) {
      setInvoices(prev => prev.map(inv => {
        if (inv.id === newPayment.invoiceId) {
          const newPaid = inv.paidAmount + newPayment.amount;
          const newBal = Math.max(0, inv.totalAmount - newPaid);
          const newStatus = newBal === 0 ? 'Paid' : 'Partially Paid';

          authFetch(`/api/invoices/${inv.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paidAmount: newPaid, balanceDue: newBal, status: newStatus })
          }).catch(err => console.error('Failed to update invoice in MySQL:', err));

          return {
            ...inv,
            paidAmount: newPaid,
            balanceDue: newBal,
            status: newStatus,
          };
        }
        return inv;
      }));
    }

    // Update Customer balance in local state and MySQL
    if (newPayment.customerId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === newPayment.customerId) {
          const newPaid = c.paidAmount + newPayment.amount;
          const newBal = Math.max(0, c.totalOrderValue - newPaid);

          authFetch(`/api/customers/${c.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paidAmount: newPaid, balanceAmount: newBal })
          }).catch(err => console.error('Failed to update customer balance in MySQL:', err));

          return {
            ...c,
            paidAmount: newPaid,
            balanceAmount: newBal,
          };
        }
        return c;
      }));

      addTimelineItem('Customer', newPayment.customerId, `Payment Received: ₹${newPayment.amount.toLocaleString('en-IN')}`, `Ref: ${newPayment.transactionReference} via ${newPayment.paymentMode}.`, 'Accounts Dept', 'payment');
    }

    addNotification('Payment Received', `₹${newPayment.amount.toLocaleString('en-IN')} verified for ${newPayment.customerName}.`, 'Payment', newPayment.id, 'Payment');

    return newPayment;
  };

  const createInvoice = (invoiceData: Partial<Invoice>): Invoice => {
    const invId = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;
    const newInv = {
      ...invoiceData,
      id: invId,
      invoiceNumber: `INV-2026-00${String(invoices.length + 1).padStart(3, '0')}`,
      status: invoiceData.status || 'Sent',
    } as Invoice;
    setInvoices(prev => [newInv, ...prev]);

    // Persist Invoice to MySQL
    authFetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInv)
    }).catch(err => console.error('Failed to save invoice to MySQL:', err));

    return newInv;
  };

  // 9. AUTOMATION: Service Desk & Ticket Routing
  const createServiceTicket = (ticketData: Partial<ServiceTicket>): ServiceTicket => {
    const ticketId = `TKT-2026-${String(tickets.length + 1).padStart(3, '0')}`;
    const tNumber = `TKT-2026-000${String(tickets.length + 1).padStart(2, '0')}`;
    const serviceTech = employees.find(e => e.role === 'Service Team') || employees[4];

    const newTicket: ServiceTicket = {
      id: ticketId,
      ticketNumber: tNumber,
      customerId: ticketData.customerId || '',
      customerName: ticketData.customerName || 'Solar Customer',
      customerPhone: ticketData.customerPhone || '+91 98000-00000',
      customerAddress: ticketData.customerAddress || 'Bengaluru',
      projectId: ticketData.projectId,
      issueCategory: ticketData.issueCategory || 'Inverter Error / Offline',
      severity: ticketData.severity || 'High',
      status: 'Assigned',
      technicianId: serviceTech.id,
      technicianName: serviceTech.name,
      description: ticketData.description || 'Solar generation anomaly or fault alert.',
      createdAt: new Date().toISOString(),
      scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    };

    setTickets(prev => [newTicket, ...prev]);

    // Persist Service Ticket to MySQL
    authFetch('/api/service-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket)
    }).catch(err => console.error('Failed to save service ticket to MySQL:', err));

    addTimelineItem('Customer', newTicket.customerId, `Service Ticket Created: ${newTicket.issueCategory}`, `Assigned to ${serviceTech.name}. Scheduled for tomorrow.`, 'Service Automation', 'service');
    addNotification('Service Ticket Assigned', `${tNumber} (${newTicket.issueCategory}) assigned to ${serviceTech.name}.`, 'Service', newTicket.id, 'Ticket');

    return newTicket;
  };

  const updateServiceTicket = (ticketId: string, updates: Partial<ServiceTicket>) => {
    // Persist updates to MySQL
    authFetch(`/api/service-tickets/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(err => console.error('Failed to update service ticket in MySQL:', err));

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const updated = { ...t, ...updates };
        if (updates.status === 'Resolved' && !t.resolvedAt) {
          updated.resolvedAt = new Date().toISOString();
        }
        return updated;
      }
      return t;
    }));
  };

  const createCustomerPortalAccount = async (customerId: string, username: string, password: string): Promise<{ success: boolean; error?: string; username?: string }> => {
    try {
      const res = await authFetch(`/api/customers/${customerId}/portal-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to configure portal account' };
      }

      const activeUsername = data.portalAccount?.username || username.trim().toLowerCase();
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, portalUsername: activeUsername } : c));
      addNotification('Portal Access Created', `Customer portal credentials generated for ${data.portalAccount?.customerName || customerId}.`, 'Customer', customerId, 'User');
      addTimelineItem('Customer', customerId, 'Portal Access Generated', `Login ID: ${activeUsername}. Credentials ready to share with customer.`, 'Super Admin', 'system');

      return { success: true, username: activeUsername };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // 10. Follow-up helpers
  const completeFollowUp = (followUpId: string, notes?: string) => {
    setFollowUps(prev => prev.map(f => {
      if (f.id === followUpId) {
        return {
          ...f,
          status: 'Completed',
          completedAt: new Date().toISOString(),
          notes: notes ? `${f.notes} | Note: ${notes}` : f.notes,
        };
      }
      return f;
    }));
  };

  const createFollowUp = (followUpData: Partial<FollowUp>): FollowUp => {
    const fup: FollowUp = {
      id: `FUP-${Date.now().toString().slice(-6)}`,
      title: followUpData.title || 'Follow-up Task',
      dueDate: followUpData.dueDate || new Date().toISOString().split('T')[0],
      dueTime: followUpData.dueTime || '11:00 AM',
      type: followUpData.type || 'Call',
      status: 'Pending',
      priority: followUpData.priority || 'Medium',
      assignedToId: followUpData.assignedToId || employees[1].id,
      assignedToName: followUpData.assignedToName || employees[1].name,
      notes: followUpData.notes || '',
      leadId: followUpData.leadId,
      leadName: followUpData.leadName,
      customerId: followUpData.customerId,
      customerName: followUpData.customerName,
      quotationId: followUpData.quotationId,
    };
    setFollowUps(prev => [fup, ...prev]);
    return fup;
  };

  const toggleAutomationRule = (ruleId: string) => {
    setAutomationRules(prev => prev.map(r => r.id === ruleId ? { ...r, isActive: !r.isActive } : r));
  };

  // 11. Project Tasks
  const updateProjectTask = (projectId: string, taskId: string, isCompleted: boolean) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updatedTasks = p.tasks.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              isCompleted,
              completedAt: isCompleted ? new Date().toISOString() : undefined,
            };
          }
          return t;
        });
        return { ...p, tasks: updatedTasks };
      }
      return p;
    }));
  };

  const addProjectTask = (projectId: string, taskData: Partial<ProjectTask>) => {
    const newTask: ProjectTask = {
      id: `TSK-${Date.now().toString().slice(-6)}`,
      title: taskData.title || 'New Project Task',
      stage: taskData.stage || 'Material Ready',
      isCompleted: false,
      assignedRole: taskData.assignedRole || 'Project Manager',
      assignedToName: taskData.assignedToName || employees[3].name,
      dueDate: taskData.dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    };

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: [...p.tasks, newTask],
        };
      }
      return p;
    }));
  };

  // 12. Expenses
  const addExpense = (expenseData: Partial<ExpenseItem>): ExpenseItem => {
    const expId = `EXP-${Date.now().toString().slice(-6)}`;
    const newExp: ExpenseItem = {
      id: expId,
      expenseNumber: `EXP-2026-${String(expenses.length + 1).padStart(4, '0')}`,
      projectId: expenseData.projectId,
      projectName: expenseData.projectName || 'General Overhead',
      title: expenseData.title || 'Solar EPC Expense',
      category: expenseData.category || 'Civil & Structural',
      amount: expenseData.amount || 0,
      taxAmount: expenseData.taxAmount || 0,
      totalAmount: (expenseData.amount || 0) + (expenseData.taxAmount || 0),
      vendorName: expenseData.vendorName || 'Vendor',
      paymentMode: expenseData.paymentMode || 'Bank Transfer',
      paymentDate: expenseData.paymentDate || new Date().toISOString().split('T')[0],
      status: expenseData.status || 'Paid',
      receiptReference: expenseData.receiptReference || `RCPT-${Date.now().toString().slice(-4)}`,
      recordedBy: expenseData.recordedBy || activeRole,
      notes: expenseData.notes || '',
    };
    setExpenses(prev => [newExp, ...prev]);

    if (newExp.projectId) {
      addTimelineItem('Customer', newExp.projectId, `Expense Logged: ₹${newExp.totalAmount.toLocaleString('en-IN')}`, `${newExp.title} (${newExp.category}) via ${newExp.paymentMode}.`, activeRole, 'payment');
    }

    return newExp;
  };

  // 13. Suppliers & Purchase Orders
  const addSupplier = (supplierData: Partial<Supplier>): Supplier => {
    const supId = `SUP-${String(suppliers.length + 1).padStart(2, '0')}`;
    const newSup: Supplier = {
      id: supId,
      supplierCode: `VEN-${(supplierData.name || 'SUP').toUpperCase().slice(0, 6)}`,
      name: supplierData.name || 'Solar Supplier',
      category: supplierData.category || 'Solar Panels',
      rating: supplierData.rating || 4.8,
      gstin: supplierData.gstin || '29AAACW0000A1Z0',
      contactPerson: supplierData.contactPerson || 'Vendor Manager',
      email: supplierData.email || 'orders@vendor.com',
      phone: supplierData.phone || '+91 98000-00000',
      city: supplierData.city || 'Bengaluru',
      state: supplierData.state || 'Karnataka',
      paymentTerms: supplierData.paymentTerms || '30 Days Net',
      leadTimeDays: supplierData.leadTimeDays || 5,
      activeOrdersCount: 0,
      isPreferred: supplierData.isPreferred ?? true,
    };
    setSuppliers(prev => [newSup, ...prev]);
    return newSup;
  };

  const createPurchaseOrder = (poData: Partial<PurchaseOrder>): PurchaseOrder => {
    const poId = `PO-${Date.now().toString().slice(-6)}`;
    const newPo: PurchaseOrder = {
      id: poId,
      poNumber: `PO-2026-00${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      supplierId: poData.supplierId || suppliers[0]?.id || 'SUP-01',
      supplierName: poData.supplierName || suppliers[0]?.name || 'Waaree Energies Ltd',
      orderDate: poData.orderDate || new Date().toISOString().split('T')[0],
      expectedDeliveryDate: poData.expectedDeliveryDate || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      deliveryWarehouse: poData.deliveryWarehouse || 'Central Bengaluru Hub',
      items: poData.items || [],
      subtotal: poData.subtotal || 0,
      taxAmount: poData.taxAmount || 0,
      grandTotal: poData.grandTotal || 0,
      status: poData.status || 'Issued',
      notes: poData.notes || '',
    };
    setPurchaseOrders(prev => [newPo, ...prev]);

    setSuppliers(prev => prev.map(s => s.id === newPo.supplierId ? { ...s, activeOrdersCount: s.activeOrdersCount + 1 } : s));
    addNotification('Purchase Order Issued', `${newPo.poNumber} sent to ${newPo.supplierName} for ₹${newPo.grandTotal.toLocaleString('en-IN')}.`, 'Inventory', newPo.id, 'Project');
    return newPo;
  };

  const receivePurchaseOrder = (poId: string) => {
    const grnNumber = `GRN-2026-00${String(Date.now()).slice(-4)}`;
    const receivedDate = new Date().toISOString().split('T')[0];

    let targetPo: PurchaseOrder | undefined;

    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        targetPo = {
          ...po,
          status: 'Received',
          grnNumber,
          receivedDate,
        };
        return targetPo;
      }
      return po;
    }));

    if (targetPo) {
      const currentPo = targetPo as PurchaseOrder;
      setProducts(prev => prev.map(prod => {
        const item = currentPo.items.find(i => i.sku === prod.sku);
        if (item) {
          return {
            ...prod,
            currentStock: prod.currentStock + item.quantity,
            availableStock: prod.availableStock + item.quantity,
          };
        }
        return prod;
      }));

      setSuppliers(prev => prev.map(s => s.id === currentPo.supplierId ? { ...s, activeOrdersCount: Math.max(0, s.activeOrdersCount - 1) } : s));

      addAutomationLog(
        'Automated GRN & Warehouse Stock Inwarding',
        'GOODS_RECEIVED',
        currentPo.id,
        currentPo.supplierName,
        `Goods Receipt Note ${grnNumber} issued. Automatically replenished warehouse stock for ${currentPo.items.length} SKU line items.`
      );

      addNotification('Goods Received (GRN)', `${currentPo.poNumber} verified at warehouse. Stock levels automatically updated.`, 'Inventory', currentPo.id, 'Project');
    }
  };

  const addProduct = (productData: Partial<InventoryProduct>): InventoryProduct => {
    const sku = productData.sku || `SKU-${Date.now().toString().slice(-6)}`;
    const newProd: InventoryProduct = {
      id: `PROD-${Date.now().toString().slice(-6)}`,
      sku,
      name: productData.name || 'Solar Equipment',
      category: (productData.category as any) || 'Solar Panels',
      brand: productData.brand || 'Tier-1 Solar',
      specifications: productData.specifications || '',
      unit: productData.unit || 'Nos',
      currentStock: Number(productData.currentStock ?? 100),
      reservedStock: Number(productData.reservedStock ?? 0),
      availableStock: Number(productData.availableStock ?? (productData.currentStock ?? 100)),
      minThreshold: Number(productData.minThreshold ?? 20),
      unitCost: Number(productData.unitCost ?? 0),
      supplierName: productData.supplierName || (suppliers[0]?.name || 'Waaree Energies Ltd'),
    };
    setProducts(prev => [newProd, ...prev]);
    addNotification('New SKU Cataloged', `Equipment ${newProd.name} (${newProd.sku}) added to inventory.`, 'Inventory', newProd.id, 'Project');
    return newProd;
  };

  const updateProductStock = (productId: string, currentStock: number, minThreshold?: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId || p.sku === productId) {
        const nextAvail = Math.max(0, currentStock - p.reservedStock);
        return {
          ...p,
          currentStock,
          availableStock: nextAvail,
          minThreshold: minThreshold !== undefined ? minThreshold : p.minThreshold,
        };
      }
      return p;
    }));
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId && p.sku !== productId));
  };

  const addMaterialAllocation = (allocationData: Partial<MaterialAllocation>): MaterialAllocation => {
    const allocId = `ALLOC-${Date.now().toString().slice(-6)}`;
    const newAlloc: MaterialAllocation = {
      id: allocId,
      projectId: allocationData.projectId || (projects[0]?.id || 'PROJECT-2026-001'),
      projectName: allocationData.projectName || (projects[0]?.customerName || 'Solar Installation'),
      sku: allocationData.sku || (products[0]?.sku || 'MOD-550'),
      productName: allocationData.productName || (products[0]?.name || '550W Mono PERC Bifacial Modules'),
      category: allocationData.category || 'Solar Panels',
      requiredQuantity: Number(allocationData.requiredQuantity || 10),
      allocatedQuantity: Number(allocationData.allocatedQuantity || allocationData.requiredQuantity || 10),
      unit: allocationData.unit || 'Nos',
      status: allocationData.status || 'Indented',
      warehouseLocation: allocationData.warehouseLocation || 'Central Bengaluru Hub',
      dispatchDate: allocationData.dispatchDate,
    };
    setMaterialAllocations(prev => [newAlloc, ...prev]);
    addNotification('Material Indent Created', `Allocated ${newAlloc.requiredQuantity} ${newAlloc.unit} of ${newAlloc.productName} for ${newAlloc.projectName}.`, 'Inventory', newAlloc.id, 'Project');
    return newAlloc;
  };

  const updateMaterialAllocationStatus = (allocationId: string, status: MaterialAllocation['status']) => {
    setMaterialAllocations(prev => prev.map(m => m.id === allocationId ? { ...m, status, dispatchDate: status === 'Dispatched' ? new Date().toISOString().split('T')[0] : m.dispatchDate } : m));
  };

  const addAutomationRule = (ruleData: Partial<AutomationRule>): AutomationRule => {
    const newRule: AutomationRule = {
      id: `RULE-${String(automationRules.length + 1).padStart(2, '0')}`,
      name: ruleData.name || 'Custom Solar Automation Rule',
      triggerEvent: ruleData.triggerEvent || 'LEAD_QUALIFIED',
      whenText: ruleData.whenText || 'Trigger event fired',
      conditionText: ruleData.conditionText || 'All system criteria met',
      actionText: ruleData.actionText || 'Execute autonomous task sequence',
      isActive: true,
      actionsExecutedCount: 0,
      lastTriggeredAt: undefined,
    };
    setAutomationRules(prev => [newRule, ...prev]);
    return newRule;
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    const currentToken = localStorage.getItem('ab_solar_token');
    if (currentToken) {
      fetch(getApiUrl(`/api/notifications/${id}/read`), {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${currentToken}` }
      }).catch(() => {});
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const resetAllDemoData = () => {
    setLeads(INITIAL_LEADS);
    setCustomers(INITIAL_CUSTOMERS);
    setSurveys(INITIAL_SURVEYS);
    setQuotations(INITIAL_QUOTATIONS);
    setProjects(INITIAL_PROJECTS);
    setProducts(INITIAL_PRODUCTS);
    setInvoices(INITIAL_INVOICES);
    setPayments(INITIAL_PAYMENTS);
    setWarranties(INITIAL_WARRANTIES);
    setAmcs(INITIAL_AMCS);
    setTickets(INITIAL_SERVICE_TICKETS);
    setAutomationRules(INITIAL_AUTOMATION_RULES);
    setAutomationLogs(INITIAL_AUTOMATION_LOGS);
    setFollowUps(INITIAL_FOLLOW_UPS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setTimeline(INITIAL_TIMELINE);
    setExpenses(INITIAL_EXPENSES);
    setSuppliers(INITIAL_SUPPLIERS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setMaterialAllocations(INITIAL_MATERIAL_ALLOCATIONS);
    localStorage.clear();
  };

  // Global search across all entities
  const globalSearch = (query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return { leads: [], customers: [], projects: [], quotations: [], invoices: [], tickets: [] };
    }
    return {
      leads: leads.filter(l => l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.id.toLowerCase().includes(q) || l.city.toLowerCase().includes(q)),
      customers: customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.id.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)),
      projects: projects.filter(p => p.id.toLowerCase().includes(q) || p.customerName.toLowerCase().includes(q) || (p.discomSanctionNumber && p.discomSanctionNumber.toLowerCase().includes(q))),
      quotations: quotations.filter(qt => qt.id.toLowerCase().includes(q) || qt.quotationNumber.toLowerCase().includes(q) || qt.leadName.toLowerCase().includes(q)),
      invoices: invoices.filter(inv => inv.invoiceNumber.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q)),
      tickets: tickets.filter(t => t.ticketNumber.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) || t.issueCategory.toLowerCase().includes(q)),
    };
  };

  return (
    <CrmContext.Provider value={{
      currentUser,
      isAuthenticated,
      isRestoringSession,
      token,
      login,
      logout,
      authFetch,
      activeRole,
      previewRole,
      setActiveRole,
      setDemoPreviewRole,
      selectedCustomerIdForPortal,
      setSelectedCustomerIdForPortal,
      employees,
      leads,
      customers,
      surveys,
      quotations,
      projects,
      products,
      invoices,
      payments,
      warranties,
      amcs,
      tickets,
      automationRules,
      automationLogs,
      followUps,
      notifications,
      timeline,
      expenses,
      suppliers,
      purchaseOrders,
      materialAllocations,
      createLead,
      updateLead,
      deleteLead,
      autoAssignAllLeads,
      updateProject,
      assignProject,
      autoAssignAllProjects,
      qualifyLead,
      createSiteSurvey,
      completeSiteSurvey,
      saveSurveyDraft,
      uploadSurveyPhoto,
      deleteSurveyPhoto,
      submitSurveyForReview,
      reviewSurveyAction,
      rescheduleSurveyAction,
      deleteSiteSurvey,
      reloadSurvey,
      createQuotation,
      createQuotationRevision,
      approveQuotationDiscount,
      sendQuotation,
      recordCustomerAcceptance,
      editQuotationData,
      acceptQuotation,
      updateProjectStage,
      updateInstallationChecklist,
      updateProjectTask,
      addProjectTask,
      recordPayment,
      createInvoice,
      addExpense,
      addSupplier,
      createPurchaseOrder,
      receivePurchaseOrder,
      addProduct,
      updateProductStock,
      deleteProduct,
      addMaterialAllocation,
      updateMaterialAllocationStatus,
      createServiceTicket,
      updateServiceTicket,
      createCustomerPortalAccount,
      completeFollowUp,
      createFollowUp,
      toggleAutomationRule,
      addAutomationRule,
      markNotificationRead,
      markAllNotificationsRead,
      resetAllDemoData,
      globalSearch,
      refreshData,
      lastRefreshedAt,
      isDbConnected,
      dbError,
    }}>
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) throw new Error('useCrm must be used within a CrmProvider');
  return context;
};
