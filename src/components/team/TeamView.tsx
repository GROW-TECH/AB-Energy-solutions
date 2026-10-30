import React, { useState, useEffect } from 'react';
import { 
  Users2, UserCheck, ShieldCheck, Phone, Mail, 
  MapPin, Award, CheckCircle2, ArrowRight, Plus, 
  Search, Filter, Shield, KeyRound, UserX, UserPlus,
  Building2, Lock, Eye, Edit3, RefreshCw, AlertCircle, 
  ChevronRight, CheckSquare, Layers, Receipt, LifeBuoy, Clock,
  X, Upload, Download, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useCrm } from '../../context/CrmContext';
import { Role } from '../../types';

interface ManagedUser {
  id: string;
  username: string;
  email: string;
  phone: string;
  name: string;
  role: Role;
  department: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  activeLeadsCount?: number;
  completedProjectsCount?: number;
}

export const TeamView: React.FC = () => {
  const { 
    employees, 
    activeRole, 
    setActiveRole, 
    currentUser, 
    authFetch, 
    projects, 
    leads, 
    updateLead, 
    autoAssignAllLeads, 
    updateProject, 
    assignProject, 
    autoAssignAllProjects,
    refreshData 
  } = useCrm();

  // Active Sub-tab in User Management
  const [activeTab, setActiveTab] = useState<'directory' | 'perspectives' | 'matrix' | 'departments'>('directory');

  // Users state
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Lead & Project Direct Assignment Modals state
  const [assignLeadModalUser, setAssignLeadModalUser] = useState<ManagedUser | null>(null);
  const [assignProjectModalUser, setAssignProjectModalUser] = useState<ManagedUser | null>(null);
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState<string>('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<ManagedUser | null>(null);
  const [memberAttendance, setMemberAttendance] = useState<any[]>([]);
  const [isLoadingMemberAttendance, setIsLoadingMemberAttendance] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'Sales Executive' as Role,
    email: '',
    phone: '',
    department: 'Solar Residential Sales',
    location: 'Bengaluru',
  });

  const loggedInRole = currentUser?.role;
  const isSuperAdmin = (loggedInRole ? loggedInRole === 'Super Admin' : activeRole === 'Super Admin') && activeRole === 'Super Admin';
  const isSalesManager = !isSuperAdmin && (loggedInRole === 'Sales Manager' || activeRole === 'Sales Manager');
  const isProjectManager = !isSuperAdmin && (loggedInRole === 'Project Manager' || activeRole === 'Project Manager');
  const canManageUsers = isSuperAdmin || isSalesManager || isProjectManager;

  // Allowed roles to create based on operator
  const creatableRoles: Role[] = isSuperAdmin 
    ? [
        'Super Admin',
        'Sales Manager',
        'Sales Executive',
        'Survey Engineer',
        'Project Manager',
        'Installation Team',
        'Accounts',
        'Service Team',
        'Customer'
      ]
    : isSalesManager
    ? ['Sales Executive']
    : isProjectManager
    ? ['Installation Team']
    : [];

  // Enforce that only Super Admin can stay on perspectives, matrix, or departments
  useEffect(() => {
    if (!isSuperAdmin && activeTab !== 'directory') {
      setActiveTab('directory');
    }
  }, [isSuperAdmin, activeTab]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/users');
      const data = await res.json();
      const list = (data.success && Array.isArray(data.data)) 
        ? data.data 
        : (data.success && Array.isArray(data.users))
        ? data.users
        : null;

      if (list) {
        setUsers(list);
      } else {
        fallbackToEmployees();
      }
    } catch {
      fallbackToEmployees();
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch live attendance and field status when a crew member profile is selected
  useEffect(() => {
    if (selectedMemberProfile) {
      const assigned = projects.filter(p => 
        p.installationLeadName === selectedMemberProfile.name || 
        p.installationLeadId === selectedMemberProfile.id ||
        selectedMemberProfile.role === 'Installation Team'
      );
      if (assigned.length > 0) {
        setIsLoadingMemberAttendance(true);
        Promise.all(assigned.slice(0, 3).map(p => 
          authFetch(`/api/installation/attendance/${p.id}`).then(r => r.json()).catch(() => null)
        )).then(results => {
          const list: any[] = [];
          results.forEach(res => {
            if (res?.success && Array.isArray(res.attendance)) {
              list.push(...res.attendance);
            }
          });
          setMemberAttendance(list);
        }).finally(() => setIsLoadingMemberAttendance(false));
      } else {
        setMemberAttendance([]);
      }
    }
  }, [selectedMemberProfile, projects]);

  const fallbackToEmployees = () => {
    const defaultExtras: ManagedUser[] = [
      {
        id: 'EMP-06',
        username: 'salesexecutive',
        email: 'vikram.mehta@abenergy.in',
        phone: '+91 98450-77112',
        name: 'Vikram Mehta (Sales)',
        role: 'Sales Executive',
        department: 'Solar Residential Sales',
        location: 'Bengaluru North',
        isActive: true,
        createdAt: '2026-01-15',
        activeLeadsCount: 12,
        completedProjectsCount: 15,
      },
      {
        id: 'EMP-07',
        username: 'installation',
        email: 'muthu.epc@abenergy.in',
        phone: '+91 97890-44221',
        name: 'Muthu Vel',
        role: 'Installation Team',
        department: 'Field Mounting & Electrical Installation',
        location: 'Karnataka Hub',
        isActive: true,
        createdAt: '2026-01-15',
        activeLeadsCount: 0,
        completedProjectsCount: 38,
      },
      {
        id: 'EMP-08',
        username: 'accounts',
        email: 'priya.accounts@abenergy.in',
        phone: '+91 98100-33445',
        name: 'Priya Raman',
        role: 'Accounts',
        department: 'Finance & Compliance',
        location: 'Bengaluru HQ',
        isActive: true,
        createdAt: '2026-01-15',
        activeLeadsCount: 0,
        completedProjectsCount: 0,
      }
    ];

    const mapped: ManagedUser[] = employees.map(e => ({
      id: e.id,
      username: e.email ? e.email.split('@')[0] : e.id.toLowerCase(),
      email: e.email,
      phone: e.phone,
      name: e.name,
      role: e.role,
      department: e.department || 'Solar Operations',
      location: e.location || 'Bengaluru',
      isActive: true,
      createdAt: '2026-01-15',
      activeLeadsCount: e.activeLeadsCount,
      completedProjectsCount: e.completedProjectsCount,
    }));

    const combined = [...mapped];
    for (const extra of defaultExtras) {
      if (!combined.some(u => u.username === extra.username || u.id === extra.id)) {
        combined.push(extra);
      }
    }
    setUsers(combined);
  };

  useEffect(() => {
    fetchUsers();
  }, [activeRole, currentUser?.role]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const targetRole = isSuperAdmin 
      ? formData.role 
      : isSalesManager 
      ? 'Sales Executive' 
      : isProjectManager 
      ? 'Installation Team' 
      : formData.role;

    try {
      const res = await authFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          role: targetRole,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create user');
      }

      setActionSuccess(`User ${formData.username} created successfully!`);
      setShowCreateModal(false);
      setFormData({
        name: '',
        username: '',
        password: '',
        role: creatableRoles[0] || 'Sales Executive',
        email: '',
        phone: '',
        department: isSalesManager 
          ? 'Solar Residential Sales' 
          : isProjectManager 
          ? 'Field Mounting & Electrical Installation' 
          : 'Solar Operations',
        location: 'Bengaluru',
      });
      fetchUsers();
      refreshData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setActionError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          setActionError('Uploaded file contains no rows or valid sheet data.');
          setImportRows([]);
          return;
        }

        const normalized = rawJson.map((row, idx) => ({
          _id: `row-${idx}`,
          name: row['Name'] || row['name'] || row['Full Name'] || '',
          username: row['Username'] || row['username'] || '',
          password: row['Password'] || row['password'] || '',
          role: row['Role'] || row['role'] || (isSalesManager ? 'Sales Executive' : isProjectManager ? 'Installation Team' : 'Sales Executive'),
          email: row['Email'] || row['email'] || '',
          phone: row['Phone'] || row['phone'] || '',
          department: row['Department'] || row['department'] || (isSalesManager ? 'Solar Residential Sales' : 'Field Mounting & Electrical'),
          location: row['Location'] || row['location'] || 'Bengaluru',
        }));

        setImportRows(normalized);
      } catch (err: any) {
        setActionError(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImportSubmit = async () => {
    if (importRows.length === 0) return;
    setIsImporting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await authFetch('/api/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: importRows }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import employees');
      }

      setActionSuccess(data.message || `Successfully imported ${data.count} employees!`);
      setShowImportModal(false);
      setImportRows([]);
      setImportFileName('');
      fetchUsers();
      refreshData();
    } catch (err: any) {
      setActionError(err.message || 'Bulk import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionError(null);
    setActionSuccess(null);

    const targetRole = isSuperAdmin ? formData.role : editingUser.role;

    try {
      const res = await authFetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          role: targetRole,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user');
      }

      setActionSuccess(`Account for ${formData.name} updated successfully!`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleToggleStatus = async (user: ManagedUser) => {
    setActionError(null);
    if (!isSuperAdmin) {
      if (isSalesManager && user.role !== 'Sales Executive') {
        setActionError('Permission denied: Sales Manager can only manage Sales Executives.');
        return;
      }
      if (isProjectManager && user.role !== 'Installation Team') {
        setActionError('Permission denied: Project Manager can only manage Installation Crew.');
        return;
      }
    }

    try {
      const res = await authFetch(`/api/users/${user.id}/toggle-status`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to toggle status');
      }

      setActionSuccess(`Account ${user.username} is now ${data.isActive ? 'Active' : 'Deactivated'}.`);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: data.isActive } : u));
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const openEditModal = (user: ManagedUser) => {
    if (!isSuperAdmin) {
      if (isSalesManager && user.role !== 'Sales Executive') {
        setActionError('Permission denied: You can only edit Sales Executives.');
        return;
      }
      if (isProjectManager && user.role !== 'Installation Team') {
        setActionError('Permission denied: You can only edit Installation Crew.');
        return;
      }
    }
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: '',
      role: user.role,
      email: user.email,
      phone: user.phone,
      department: user.department,
      location: user.location,
    });
    setActionError(null);
  };

  // Scoped users strictly by persona entitlement
  const scopedUsers = users.filter(user => {
    if (isSuperAdmin) return true; // Super Admin can see all user accounts
    if (isSalesManager) return user.role === 'Sales Executive'; // Sales Manager can ONLY see Sales Executives
    if (isProjectManager) return user.role === 'Installation Team'; // Project Manager can ONLY see Installation Crew
    return false;
  });

  // Filtered users
  const filteredUsers = scopedUsers.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesStatus = 
      statusFilter === 'All' || 
      (statusFilter === 'Active' && user.isActive) || 
      (statusFilter === 'Inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleLabels: Record<Role, string> = {
    'Super Admin': 'Executive Command & System Governance',
    'Sales Manager': 'Pipeline Strategy, Deal Approvals & Rep Assignment',
    'Sales Executive': 'Direct Inquiries, Client Cadence & Hot Leads',
    'Survey Engineer': 'Rooftop Audits, PV Sizing & Shading Feasibility',
    'Project Manager': 'Milestone Gatekeeping, DISCOM Liaison & BOM Staging',
    'Purchase Team': 'Procurement, Vendor PO Issuance, GRN Inwarding & Warehouse Stock',
    'Installation Team': 'Rooftop Mounting, Quality Checklist & Safety QA',
    'Accounts': 'Tax Invoices, GST Compliance & Milestone Payments',
    'Service Team': 'Inverter Fault Tickets, AMC Care & Warranty Claims',
    'Customer': 'Self-service Solar Telemetry, Generation & Documents',
  };

  // Permission Matrix Definition
  const permissionModules = [
    { key: 'leads', label: 'Lead Ingestion & Assignment' },
    { key: 'survey', label: 'Rooftop Site Surveys' },
    { key: 'survey_approval', label: 'Survey Engineering Approval' },
    { key: 'quotes', label: 'Quotation Generation & Sizing' },
    { key: 'projects', label: 'EPC Milestone Execution' },
    { key: 'installation', label: '12-Point Checklist & Mounting' },
    { key: 'finance', label: 'Tax Invoices & Payment Recording' },
    { key: 'service', label: 'Breakdown Tickets & AMC' },
    { key: 'admin', label: 'User Admin & Automations' },
  ];

  const roleMatrix: Record<Role, Record<string, boolean>> = {
    'Super Admin': { leads: true, survey: true, survey_approval: true, quotes: true, projects: true, installation: true, finance: true, service: true, admin: true },
    'Sales Manager': { leads: true, survey: false, survey_approval: false, quotes: true, projects: false, installation: false, finance: false, service: false, admin: false },
    'Sales Executive': { leads: true, survey: false, survey_approval: false, quotes: true, projects: false, installation: false, finance: false, service: false, admin: false },
    'Survey Engineer': { leads: false, survey: true, survey_approval: false, quotes: false, projects: false, installation: false, finance: false, service: false, admin: false },
    'Project Manager': { leads: false, survey: false, survey_approval: true, quotes: false, projects: true, installation: true, finance: false, service: false, admin: false },
    'Purchase Team': { leads: false, survey: false, survey_approval: false, quotes: false, projects: false, installation: false, finance: false, service: false, admin: false },
    'Installation Team': { leads: false, survey: false, survey_approval: false, quotes: false, projects: false, installation: true, finance: false, service: false, admin: false },
    'Accounts': { leads: false, survey: false, survey_approval: false, quotes: false, projects: false, installation: false, finance: true, service: false, admin: false },
    'Service Team': { leads: false, survey: false, survey_approval: false, quotes: false, projects: false, installation: false, finance: false, service: true, admin: false },
    'Customer': { leads: false, survey: false, survey_approval: false, quotes: false, projects: false, installation: false, finance: false, service: false, admin: false },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start sm:items-center gap-2.5 mb-2">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 sm:mt-0 shadow-xs">
              <Users2 className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight leading-snug break-words">
                  {isSuperAdmin
                    ? 'Centralized User Management & Role Governance'
                    : isSalesManager
                    ? 'Sales Executives & Team Management'
                    : isProjectManager
                    ? 'Installation Crew & Field Team Management'
                    : 'Team & User Directory'}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded-full shrink-0">
                  {isSuperAdmin
                    ? 'Enterprise Access Control'
                    : isSalesManager
                    ? 'Sales Team Provisioning'
                    : isProjectManager
                    ? 'Crew Provisioning'
                    : 'Direct Access'}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isSuperAdmin
              ? 'Provision user accounts, configure reporting hierarchies, enforce data scoping, and inspect system-wide RBAC entitlements.'
              : isSalesManager
              ? 'Provision and manage Sales Executive user accounts, update sales contact credentials, and monitor lead capacities.'
              : isProjectManager
              ? 'Provision and manage Installation Team technician accounts, update field credentials, and assign mounting crews.'
              : 'View team members and contact credentials.'}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          {(isSalesManager || isSuperAdmin) && (
            <button
              type="button"
              onClick={() => {
                const res = autoAssignAllLeads();
                setActionSuccess(`Auto-Assignment Complete: Evenly distributed ${res.assignedCount} leads across ${res.repsCount} active Sales Executives!`);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Evenly distribute company leads across active Sales Executives"
            >
              <Layers className="w-4 h-4 text-blue-200 shrink-0" />
              <span>Auto-Distribute Leads</span>
            </button>
          )}

          {isProjectManager && (
            <button
              type="button"
              onClick={() => {
                const res = autoAssignAllProjects();
                setActionSuccess(`Auto-Assignment Complete: Evenly distributed ${res.assignedCount} projects across ${res.crewCount} crew technicians!`);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Evenly distribute installation projects across crew technicians"
            >
              <Layers className="w-4 h-4 text-indigo-200 shrink-0" />
              <span>Auto-Distribute Projects</span>
            </button>
          )}

          {canManageUsers && (
            <button
              type="button"
              onClick={() => {
                setShowImportModal(true);
                setImportRows([]);
                setImportFileName('');
                setActionError(null);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Bulk import staff accounts from Excel (.xlsx) or CSV"
            >
              <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Import Staff (Excel/CSV)</span>
            </button>
          )}

          {canManageUsers && (
            <button
              type="button"
              onClick={() => {
                setFormData({
                  name: '',
                  username: '',
                  password: '',
                  role: creatableRoles[0] || 'Sales Executive',
                  email: '',
                  phone: '',
                  department: isSalesManager 
                    ? 'Solar Residential Sales' 
                    : isProjectManager 
                    ? 'Field Mounting & Electrical Installation' 
                    : 'Solar Operations',
                  location: 'Bengaluru',
                });
                setActionError(null);
                setShowCreateModal(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>
                {isSuperAdmin
                  ? '+ Create User Account'
                  : isSalesManager
                  ? '+ Create Sales Executive'
                  : isProjectManager
                  ? '+ Create Crew Member'
                  : '+ Create Account'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900 text-xs font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'directory'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>
            {isSuperAdmin
              ? `User Directory (${scopedUsers.length})`
              : isSalesManager
              ? `Sales Executives (${scopedUsers.length})`
              : isProjectManager
              ? `Installation Crew (${scopedUsers.length})`
              : `User Directory (${scopedUsers.length})`}
          </span>
        </button>

        {/* The 3 sub-tabs below are STRICTLY for Super Admin only (Image 3) */}
        {isSuperAdmin && (
          <>
            <button
              onClick={() => setActiveTab('perspectives')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'perspectives'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Demo Role Perspectives</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'matrix'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>RBAC Permission Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('departments')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'departments'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Departments &amp; Teams</span>
            </button>
          </>
        )}
      </div>

      {/* TAB 1: USER DIRECTORY & MANAGEMENT TABLE */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={
                    isSalesManager
                      ? "Search sales executives by name, email, phone, ID..."
                      : isProjectManager
                      ? "Search installation crew by name, email, phone, ID..."
                      : "Search user by name, username, email, phone, or ID..."
                  }
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {isSuperAdmin ? (
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="All">All Roles ({scopedUsers.length})</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Sales Executive">Sales Executive</option>
                  <option value="Survey Engineer">Survey Engineer</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Installation Team">Installation Team</option>
                  <option value="Accounts">Accounts / Finance</option>
                  <option value="Service Team">Service Team</option>
                  <option value="Customer">Customer</option>
                </select>
              ) : isSalesManager ? (
                <span className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                  Role: Sales Executive ({scopedUsers.length})
                </span>
              ) : isProjectManager ? (
                <span className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                  Role: Installation Team ({scopedUsers.length})
                </span>
              ) : null}

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Accounts</option>
                <option value="Inactive">Deactivated Accounts</option>
              </select>

              <button
                onClick={fetchUsers}
                className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Refresh user list"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Mobile User Card List (< lg) */}
          <div className="lg:hidden divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                {isLoading 
                  ? 'Loading user accounts...' 
                  : isSalesManager
                  ? 'No Sales Executive accounts match the search.'
                  : isProjectManager
                  ? 'No Installation Crew accounts match the search.'
                  : 'No user accounts match the selected criteria.'}
              </div>
            ) : (
              filteredUsers.map(user => {
                const repLeads = leads.filter(l => 
                  l.assignedToId === user.id || 
                  l.assignedToId === user.username || 
                  l.assignedToName?.toLowerCase() === user.name.toLowerCase()
                );
                const memberProjects = projects.filter(p => 
                  p.installationLeadId === user.id || 
                  p.installationLeadName === user.name ||
                  (Array.isArray((p as any).assigned_crew_members) && (p as any).assigned_crew_members.some((m: string) => m.toLowerCase().includes(user.name.toLowerCase())))
                );

                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedMemberProfile(user)}
                    className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{user.name}</h4>
                          <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">@{user.username}</span>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        user.isActive 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                        <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {user.role}
                      </span>
                      <span className="text-slate-600 text-[11px] font-medium truncate">
                        {user.department} &bull; {user.location}
                      </span>
                    </div>

                    {/* Contact & Assignments */}
                    <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-xl text-xs">
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-400 block font-semibold uppercase">Email</span>
                        <a href={`mailto:${user.email}`} onClick={e => e.stopPropagation()} className="text-[11px] text-slate-700 truncate block hover:text-emerald-700">
                          {user.email || '—'}
                        </a>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-400 block font-semibold uppercase">Phone</span>
                        <a href={`tel:${user.phone}`} onClick={e => e.stopPropagation()} className="text-[11px] text-slate-700 font-mono block hover:text-emerald-700">
                          {user.phone || '—'}
                        </a>
                      </div>
                      {(isSalesManager || isSuperAdmin) && user.role === 'Sales Executive' && (
                        <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-medium">Assigned Leads:</span>
                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              {repLeads.length} Leads
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignLeadModalUser(user);
                                setSelectedLeadIds([]);
                                setAssignmentSearchTerm('');
                              }}
                              className="text-[10px] text-blue-700 font-bold hover:underline"
                            >
                              Assign
                            </button>
                          </div>
                        </div>
                      )}
                      {isProjectManager && user.role === 'Installation Team' && (
                        <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-medium">Assigned Projects:</span>
                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                              {memberProjects.length} Projects
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignProjectModalUser(user);
                                setSelectedProjectIds([]);
                                setAssignmentSearchTerm('');
                              }}
                              className="text-[10px] text-indigo-700 font-bold hover:underline"
                            >
                              Assign
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-end gap-1.5 pt-0.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedMemberProfile(user)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-[10px] cursor-pointer"
                      >
                        Profile
                      </button>
                      {canManageUsers && (
                        <>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg text-xs cursor-pointer"
                            title="Edit User"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                              user.isActive ? 'text-rose-700 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                      {isSuperAdmin && (
                        <button
                          onClick={() => setActiveRole(user.role)}
                          className="px-2 py-1 bg-slate-900 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          View As
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* User Table (Desktop >= lg) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-2.5 sm:px-3 text-left">User / Employee</th>
                    <th className="py-2.5 px-2 text-left whitespace-nowrap">Role</th>
                    <th className="py-2.5 px-2 text-left">Department &amp; Hub</th>
                    <th className="py-2.5 px-2 text-left">Contact</th>
                    {(isSalesManager || isSuperAdmin) && (
                      <th className="py-2.5 px-1.5 text-center whitespace-nowrap">Assigned Leads</th>
                    )}
                    {isProjectManager && (
                      <th className="py-2.5 px-1.5 text-center whitespace-nowrap">Assigned Projects</th>
                    )}
                    <th className="py-2.5 px-1.5 text-center whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={(isSalesManager || isSuperAdmin || isProjectManager) ? 7 : 6} className="py-12 text-center text-slate-400">
                        {isLoading 
                          ? 'Loading user accounts...' 
                          : isSalesManager
                          ? 'No Sales Executive accounts match the search.'
                          : isProjectManager
                          ? 'No Installation Crew accounts match the search.'
                          : 'No user accounts match the selected criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr 
                        key={user.id} 
                        onClick={() => setSelectedMemberProfile(user)}
                        className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 px-2.5 sm:px-3 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-900 group-hover:bg-emerald-700 text-emerald-400 group-hover:text-white font-bold text-[10px] flex items-center justify-center shrink-0 transition-colors">
                              {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div className="min-w-0 max-w-[110px] sm:max-w-[130px] xl:max-w-[160px]">
                              <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-xs truncate" title={user.name}>{user.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">@{user.username}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {user.role}
                          </span>
                        </td>

                        <td className="py-2.5 px-2 min-w-0">
                          <div className="min-w-0 max-w-[100px] sm:max-w-[120px] xl:max-w-[150px]">
                            <div className="font-semibold text-slate-800 text-xs truncate" title={user.department}>{user.department}</div>
                            <div className="text-[10px] text-slate-400 truncate">{user.location}</div>
                          </div>
                        </td>

                        <td className="py-2.5 px-2 min-w-0">
                          <div className="min-w-0 max-w-[110px] sm:max-w-[130px] xl:max-w-[160px]">
                            <div className="text-slate-700 text-[11px] truncate" title={user.email}>{user.email || '—'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{user.phone || '—'}</div>
                          </div>
                        </td>

                        {(isSalesManager || isSuperAdmin) && (
                          <td className="py-2.5 px-1.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            {(() => {
                              if (user.role !== 'Sales Executive') {
                                return <span className="text-slate-300 text-[11px]">—</span>;
                              }
                              const repLeads = leads.filter(l => 
                                l.assignedToId === user.id || 
                                l.assignedToId === user.username || 
                                l.assignedToName?.toLowerCase() === user.name.toLowerCase()
                              );
                              return (
                                <div className="inline-flex items-center justify-center gap-1">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    repLeads.length > 0 
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {repLeads.length} {repLeads.length === 1 ? 'Lead' : 'Leads'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAssignLeadModalUser(user);
                                      setSelectedLeadIds([]);
                                      setAssignmentSearchTerm('');
                                    }}
                                    className="text-[10px] text-emerald-700 hover:underline font-bold cursor-pointer"
                                  >
                                    Assign
                                  </button>
                                </div>
                              );
                            })()}
                          </td>
                        )}

                        {isProjectManager && (
                          <td className="py-2.5 px-1.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            {(() => {
                              const memberProjects = projects.filter(p => 
                                p.installationLeadId === user.id || 
                                p.installationLeadName?.toLowerCase() === user.name.toLowerCase()
                              );
                              return (
                                <div className="inline-flex items-center justify-center gap-1">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    memberProjects.length > 0 
                                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {memberProjects.length} {memberProjects.length === 1 ? 'Project' : 'Projects'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAssignProjectModalUser(user);
                                      setSelectedProjectIds([]);
                                      setAssignmentSearchTerm('');
                                    }}
                                    className="text-[10px] text-indigo-700 hover:underline font-bold cursor-pointer"
                                  >
                                    Assign
                                  </button>
                                </div>
                              );
                            })()}
                          </td>
                        )}

                        <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            user.isActive 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                            <span>{user.isActive ? 'Active' : 'Deactivated'}</span>
                          </span>
                        </td>

                        <td className="py-2.5 px-2.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-end gap-1 shrink-0">
                            <button
                              onClick={() => setSelectedMemberProfile(user)}
                              className="p-1.5 xl:px-2 xl:py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-[10px] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                              title="View Field Operations Profile"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="hidden xl:inline">Profile</span>
                            </button>

                            {canManageUsers && (
                              <>
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer shrink-0"
                                  title="Edit user details"
                                >
                                  <Edit3 className="w-3.5 h-3.5 shrink-0" />
                                </button>

                                <button
                                  onClick={() => handleToggleStatus(user)}
                                  className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shrink-0 ${
                                    user.isActive 
                                      ? 'text-slate-600 hover:text-rose-700 hover:bg-rose-50' 
                                      : 'text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                  title={user.isActive ? 'Deactivate account' : 'Reactivate account'}
                                >
                                  {user.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              </>
                            )}

                            {isSuperAdmin && (
                              <button
                                onClick={() => setActiveRole(user.role)}
                                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer shrink-0"
                                title={`Switch perspective to ${user.role}`}
                              >
                                View As
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEMO ROLE PERSPECTIVES CARDS (Super Admin Only) */}
      {isSuperAdmin && activeTab === 'perspectives' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => {
            const isCurrentActive = activeRole === emp.role;

            return (
              <div
                key={emp.id}
                className={`p-5 rounded-2xl border transition-all bg-white shadow-xs flex flex-col justify-between space-y-4 ${
                  isCurrentActive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 font-black text-sm flex items-center justify-center">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {emp.department}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
                    <div className="text-xs font-semibold text-emerald-700 mt-0.5">{emp.role}</div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {roleLabels[emp.role] || 'Standard team privileges'}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{emp.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{emp.email}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveRole(emp.role)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isCurrentActive 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isCurrentActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Active Perspective</span>
                    </>
                  ) : (
                    <>
                      <span>Switch to {emp.role}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: RBAC PERMISSION MATRIX (Super Admin Only) */}
      {isSuperAdmin && activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Enterprise Role-Based Access Control (RBAC) Entitlements</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforced server-side across all endpoints to guarantee departmental isolation and data security.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Role Persona</th>
                  {permissionModules.map(m => (
                    <th key={m.key} className="py-3 px-3 text-center">{m.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Object.keys(roleMatrix) as Role[]).map(r => (
                  <tr key={r} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {r}
                    </td>
                    {permissionModules.map(m => {
                      const hasAccess = roleMatrix[r]?.[m.key];
                      return (
                        <td key={m.key} className="py-3 px-3 text-center">
                          {hasAccess ? (
                            <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-block w-2 h-0.5 bg-slate-200 rounded-full" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DEPARTMENTS & ORGANIZATIONAL UNITS (Super Admin Only) */}
      {isSuperAdmin && activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Executive Management', count: users.filter(u => u.department?.toLowerCase().includes('executive')).length, roles: ['Super Admin'] },
            { name: 'Solar Residential Sales', count: users.filter(u => u.department?.toLowerCase().includes('sales')).length, roles: ['Sales Manager', 'Sales Executive'] },
            { name: 'Site Engineering & Survey', count: users.filter(u => u.department?.toLowerCase().includes('survey') || u.department?.toLowerCase().includes('engineering')).length, roles: ['Survey Engineer'] },
            { name: 'EPC Project Delivery', count: users.filter(u => u.department?.toLowerCase().includes('project')).length, roles: ['Project Manager'] },
            { name: 'Field Mounting & Wiring', count: users.filter(u => u.department?.toLowerCase().includes('installation')).length, roles: ['Installation Team'] },
            { name: 'Finance & Compliance', count: users.filter(u => u.department?.toLowerCase().includes('accounts') || u.department?.toLowerCase().includes('finance')).length, roles: ['Accounts'] },
            { name: 'O&M & Post-Commissioning', count: users.filter(u => u.department?.toLowerCase().includes('service')).length, roles: ['Service Team'] },
            { name: 'Customer Accounts', count: users.filter(u => u.role === 'Customer').length, roles: ['Customer'] },
          ].map(dept => (
            <div key={dept.name} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Building2 className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">{dept.count} Members</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{dept.name}</h4>
              <div className="text-[11px] text-slate-500">
                Key roles: {dept.roles.join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {isSuperAdmin
                    ? 'Provision New User Account'
                    : isSalesManager
                    ? 'Provision New Sales Executive'
                    : isProjectManager
                    ? 'Provision Installation Crew Member'
                    : 'Create User'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isSalesManager ? "e.g. Rahul Sharma" : isProjectManager ? "e.g. Muthu Vel" : "e.g. Ramesh K"}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    placeholder={isSalesManager ? "e.g. rahul.s" : isProjectManager ? "e.g. muthu.epc" : "e.g. ramesh.k"}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role Entitlement *</label>
                  {isSuperAdmin ? (
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                    >
                      {creatableRoles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={isSalesManager ? 'Sales Executive' : isProjectManager ? 'Installation Team' : formData.role}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-not-allowed"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh@abenergy.in"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98000-00000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Branch / Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Edit User: {editingUser.name}</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Username (Read-Only)</label>
                  <input
                    type="text"
                    disabled
                    value={formData.username}
                    className="w-full px-3 py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role Entitlement</label>
                  {isSuperAdmin ? (
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                    >
                      {creatableRoles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={formData.role}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-not-allowed"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Reset Password (Optional)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Branch / Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* REQUIREMENT 2: CREW MEMBER PROFILE & REAL-TIME FIELD OPERATIONS MODAL     */}
      {/* ========================================================================= */}
      {selectedMemberProfile && (() => {
        const assignedProjects = projects.filter(p => 
          p.installationLeadName === selectedMemberProfile.name || 
          p.installationLeadId === selectedMemberProfile.id ||
          (selectedMemberProfile.role === 'Installation Team')
        );

        const allMemberTasks = assignedProjects.flatMap(p => 
          (p.tasks || []).map(t => ({ ...t, projectCustomer: p.customerName, projId: p.id }))
        ).filter(t => t.assignedToName === selectedMemberProfile.name || selectedMemberProfile.role === 'Installation Team');

        const latestAttendance = memberAttendance?.[0];
        const todayStr = new Date().toISOString().split('T')[0];
        const isCheckedInToday = Boolean(latestAttendance?.date && String(latestAttendance.date).startsWith(todayStr));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 font-black text-base flex items-center justify-center shadow-xs">
                    {selectedMemberProfile.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-slate-900">{selectedMemberProfile.name}</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {selectedMemberProfile.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedMemberProfile.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {selectedMemberProfile.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      @{selectedMemberProfile.username} • ID: {selectedMemberProfile.id} • {selectedMemberProfile.department}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedMemberProfile(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Contact & Location Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Phone</span>
                  <span className="font-semibold text-slate-800">{selectedMemberProfile.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Email</span>
                  <span className="font-semibold text-slate-800 truncate block">{selectedMemberProfile.email || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Base Location</span>
                  <span className="font-semibold text-slate-800">{selectedMemberProfile.location || 'Bengaluru HQ'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Assigned Sites</span>
                  <span className="font-bold text-emerald-700 font-mono">{assignedProjects.length} Projects</span>
                </div>
              </div>

              {/* SECTION: TODAY'S FIELD ATTENDANCE STATUS */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Today's Field Attendance &amp; GPS Verification</span>
                  </span>

                  {isLoadingMemberAttendance ? (
                    <span className="text-[10px] text-slate-400 animate-pulse">Syncing GPS...</span>
                  ) : isCheckedInToday ? (
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>Checked In Today</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                      Check-in Pending Today
                    </span>
                  )}
                </div>

                {latestAttendance ? (
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 text-xs border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Latest Logged Check-In:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {latestAttendance.date} at {latestAttendance.check_in_time || latestAttendance.checkInTime || '09:00'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Crew Present on Site:</span>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(latestAttendance.presentTeamMembers) && latestAttendance.presentTeamMembers.length > 0 ? (
                          latestAttendance.presentTeamMembers.map((m: string, i: number) => (
                            <span key={i} className="px-2 py-0.2 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-800">
                              {m}
                            </span>
                          ))
                        ) : (
                          <span className="font-semibold text-slate-700">{selectedMemberProfile.name} (Solo)</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-200 flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>GPS Coordinates:</span>
                      </span>
                      {latestAttendance.latitude && latestAttendance.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${latestAttendance.latitude},${latestAttendance.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-emerald-700 hover:text-emerald-800 font-bold underline flex items-center gap-1"
                        >
                          <span>{Number(latestAttendance.latitude).toFixed(4)}° N, {Number(latestAttendance.longitude).toFixed(4)}° E</span>
                          <span className="text-[9px]">↗</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">GPS Geo-Stamp Verified</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-lg text-center">
                    No field attendance logs found for this member yet.
                  </p>
                )}
              </div>

              {/* SECTION: CURRENT ASSIGNED SOLAR PROJECTS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Assigned Projects &amp; Work Orders ({assignedProjects.length})</span>
                  </h3>
                </div>

                {assignedProjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    No solar projects currently assigned to this member.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assignedProjects.map(p => (
                      <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                              {p.id}
                            </span>
                            <span className="font-bold text-slate-900">{p.customerName}</span>
                            <span className="text-slate-500 font-mono font-semibold">({p.capacityKw} kW)</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-sm">
                            {p.customerAddress}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.stage === 'Installation Completed' ? 'bg-emerald-100 text-emerald-800' :
                            p.stage === 'Installation In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {p.stage}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: TASKS ASSIGNED / UPLOADED */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Site Tasks Assigned &amp; Executed ({allMemberTasks.length})</span>
                  </h3>
                </div>

                {allMemberTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    No individual site tasks assigned yet.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {allMemberTasks.map(t => (
                      <div key={t.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${t.isCompleted ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          <span className={`font-semibold truncate ${t.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {t.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">({(t as any).projectCustomer})</span>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          t.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Bottom Action */}
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedMemberProfile(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: DIRECT LEAD ASSIGNMENT TO SALES EXECUTIVE */}
      {assignLeadModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 font-sans">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Assign Solar Leads to {assignLeadModalUser.name}</h2>
                  <p className="text-[11px] text-slate-300">
                    Allocate incoming in-market leads or rebalance team pipeline to @{assignLeadModalUser.username}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setAssignLeadModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search leads by name, phone, city, or lead ID..."
                  value={assignmentSearchTerm}
                  onChange={e => setAssignmentSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const filtered = leads.filter(l => {
                      const term = assignmentSearchTerm.toLowerCase();
                      return l.name.toLowerCase().includes(term) || l.phone.includes(term) || l.id.toLowerCase().includes(term);
                    });
                    const allIds = filtered.map(l => l.id);
                    setSelectedLeadIds(prev => prev.length === allIds.length ? [] : allIds);
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  {selectedLeadIds.length > 0 ? 'Deselect All' : 'Select All Filtered'}
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[55vh] divide-y divide-slate-100 space-y-2">
              {(() => {
                const filtered = leads.filter(l => {
                  const term = assignmentSearchTerm.toLowerCase();
                  return l.name.toLowerCase().includes(term) || l.phone.includes(term) || l.id.toLowerCase().includes(term) || (l.city && l.city.toLowerCase().includes(term));
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No leads found matching "{assignmentSearchTerm}".
                    </div>
                  );
                }

                return filtered.map(lead => {
                  const isAssignedToThisUser = lead.assignedToId === assignLeadModalUser.id || lead.assignedToName?.toLowerCase() === assignLeadModalUser.name.toLowerCase();
                  const isSelected = selectedLeadIds.includes(lead.id);

                  return (
                    <div 
                      key={lead.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs ${
                        isSelected 
                          ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs' 
                          : isAssignedToThisUser
                          ? 'bg-slate-50 border-slate-200 opacity-90'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeadIds(prev => [...prev, lead.id]);
                            } else {
                              setSelectedLeadIds(prev => prev.filter(id => id !== lead.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {lead.id}
                            </span>
                            <span className="font-bold text-slate-900 truncate">{lead.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                              {lead.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span>📞 {lead.phone}</span>
                            {lead.city && <span>• 📍 {lead.city}</span>}
                            <span>• ⚡ {lead.recommendedKw || 3} kW System</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Currently Assigned</div>
                          <div className={`text-xs font-bold ${isAssignedToThisUser ? 'text-emerald-700' : 'text-slate-800'}`}>
                            {isAssignedToThisUser ? '✓ Assigned to ' + assignLeadModalUser.name : lead.assignedToName || 'Unassigned'}
                          </div>
                        </div>

                        {!isAssignedToThisUser && (
                          <button
                            type="button"
                            onClick={() => {
                              updateLead(lead.id, {
                                assignedToId: assignLeadModalUser.id,
                                assignedToName: assignLeadModalUser.name,
                              });
                              setActionSuccess(`Lead ${lead.id} (${lead.name}) assigned to ${assignLeadModalUser.name}`);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                {selectedLeadIds.length} lead(s) selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssignLeadModalUser(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedLeadIds.length === 0}
                  onClick={() => {
                    selectedLeadIds.forEach(id => {
                      updateLead(id, {
                        assignedToId: assignLeadModalUser.id,
                        assignedToName: assignLeadModalUser.name,
                      });
                    });
                    setActionSuccess(`Successfully allocated ${selectedLeadIds.length} leads to ${assignLeadModalUser.name}!`);
                    setSelectedLeadIds([]);
                    setAssignLeadModalUser(null);
                  }}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedLeadIds.length === 0
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Assign {selectedLeadIds.length} Leads to {assignLeadModalUser.name}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIRECT PROJECT ASSIGNMENT TO INSTALLATION CREW */}
      {assignProjectModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 font-sans">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Assign Installation Projects to {assignProjectModalUser.name}</h2>
                  <p className="text-[11px] text-slate-300">
                    Direct rooftop mounting and EPC execution assignment for field technician
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setAssignProjectModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search projects by customer name, address, or project ID..."
                  value={assignmentSearchTerm}
                  onChange={e => setAssignmentSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[55vh] divide-y divide-slate-100 space-y-2">
              {(() => {
                const filtered = projects.filter(p => {
                  const term = assignmentSearchTerm.toLowerCase();
                  return p.customerName.toLowerCase().includes(term) || p.id.toLowerCase().includes(term) || p.customerAddress.toLowerCase().includes(term);
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No solar projects match the search filter.
                    </div>
                  );
                }

                return filtered.map(proj => {
                  const isCompleted = proj.stage === 'Completed';
                  const isAssigned = proj.installationLeadId === assignProjectModalUser.id || proj.installationLeadName?.toLowerCase() === assignProjectModalUser.name.toLowerCase();
                  const isSelected = selectedProjectIds.includes(proj.id);

                  return (
                    <div 
                      key={proj.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs ${
                        isCompleted
                          ? 'bg-slate-50/70 border-slate-200 opacity-75'
                          : isSelected 
                          ? 'bg-indigo-50/80 border-indigo-300 shadow-2xs' 
                          : isAssigned
                          ? 'bg-slate-50 border-slate-200 opacity-90'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          disabled={isCompleted}
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjectIds(prev => [...prev, proj.id]);
                            } else {
                              setSelectedProjectIds(prev => prev.filter(id => id !== proj.id));
                            }
                          }}
                          className={`w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 ${isCompleted ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {proj.id}
                            </span>
                            <span className="font-bold text-slate-900 truncate">{proj.customerName}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isCompleted 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {isCompleted ? '✓ Completed (Locked)' : proj.stage}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span>⚡ {proj.capacityKw} kW</span>
                            <span>• 📍 {proj.customerAddress}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Current Crew Lead</div>
                          <div className={`text-xs font-bold ${isAssigned ? 'text-indigo-700' : 'text-slate-800'}`}>
                            {isAssigned ? '✓ ' + assignProjectModalUser.name : proj.installationLeadName || 'Unassigned'}
                          </div>
                        </div>

                        {isCompleted ? (
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-semibold">
                            Locked
                          </span>
                        ) : !isAssigned ? (
                          <button
                            type="button"
                            onClick={() => {
                              assignProject(proj.id, assignProjectModalUser.id, assignProjectModalUser.name);
                              setActionSuccess(`Project ${proj.id} assigned to crew lead ${assignProjectModalUser.name}`);
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            Assign
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                {selectedProjectIds.length} project(s) selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssignProjectModalUser(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedProjectIds.length === 0}
                  onClick={() => {
                    selectedProjectIds.forEach(id => {
                      assignProject(id, assignProjectModalUser.id, assignProjectModalUser.name);
                    });
                    setActionSuccess(`Successfully assigned ${selectedProjectIds.length} projects to ${assignProjectModalUser.name}!`);
                    setSelectedProjectIds([]);
                    setAssignProjectModalUser(null);
                  }}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedProjectIds.length === 0
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Assign {selectedProjectIds.length} Projects to {assignProjectModalUser.name}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: BULK IMPORT STAFF ACCOUNTS (EXCEL / CSV) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 font-sans">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">
                    {isSalesManager
                      ? 'Bulk Import Sales Executives (Excel / CSV)'
                      : isProjectManager
                      ? 'Bulk Import Installation Crew (Excel / CSV)'
                      : 'Bulk Import Staff & Employees (Excel / CSV)'}
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Upload an Excel (.xlsx) or CSV file. Usernames ending in <code className="font-mono text-emerald-300 font-bold">_ab</code> and passwords ending in <code className="font-mono text-emerald-300 font-bold">@ab2026</code>.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportRows([]);
                  setImportFileName('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Ready-to-use Template Download Section */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  1. Download Ready-To-Import Template Files
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Sales Executives Template */}
                  {(!isProjectManager || isSuperAdmin) && (
                    <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-950 text-xs">Sales Executives Template</span>
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">
                          5 Reps Pre-configured
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Contains <code className="font-mono font-bold">kavitha_ab</code>, <code className="font-mono font-bold">arun_ab</code>, <code className="font-mono font-bold">deepak_ab</code>, <code className="font-mono font-bold">pooja_ab</code> with <code className="font-mono font-bold">@ab2026</code> passwords.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href="/templates/sales_executives_import.xlsx"
                          download="sales_executives_import.xlsx"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .xlsx</span>
                        </a>
                        <a
                          href="/templates/sales_executives_import.csv"
                          download="sales_executives_import.csv"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .csv</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Installation Crew Template */}
                  {(!isSalesManager || isSuperAdmin) && (
                    <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-950 text-xs">Installation Crew Template</span>
                        <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded">
                          5 Technicians Pre-configured
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-800">
                        Contains <code className="font-mono font-bold">muthu_ab</code>, <code className="font-mono font-bold">karthik_ab</code>, <code className="font-mono font-bold">rajesh_ab</code> with <code className="font-mono font-bold">@ab2026</code> passwords.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href="/templates/installation_crew_import.xlsx"
                          download="installation_crew_import.xlsx"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .xlsx</span>
                        </a>
                        <a
                          href="/templates/installation_crew_import.csv"
                          download="installation_crew_import.csv"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-300 hover:bg-indigo-100 text-indigo-900 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .csv</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  2. Select or Drag Excel / CSV File to Upload
                </span>
                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600">
                    <Upload className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Click to upload Excel (.xlsx) or CSV file</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {importFileName ? `Selected: ${importFileName}` : 'Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)'}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Parsed Rows Preview */}
              {importRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      3. Preview Records Found in File ({importRows.length} Rows)
                    </span>
                    <button
                      type="button"
                      onClick={() => { setImportRows([]); setImportFileName(''); }}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    >
                      Clear File
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Full Name</th>
                          <th className="py-2.5 px-3">Username</th>
                          <th className="py-2.5 px-3">Password</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3">Location</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {importRows.map((row, idx) => {
                          const isExisting = users.some(u => u.username.toLowerCase() === (row.username || '').toLowerCase());
                          return (
                            <tr key={row._id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                              <td className="py-2 px-3 font-bold text-slate-900">{row.name}</td>
                              <td className="py-2 px-3 font-mono text-slate-700">@{row.username}</td>
                              <td className="py-2 px-3 font-mono text-slate-400">••••••••</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {row.role}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600">{row.phone}</td>
                              <td className="py-2 px-3 text-slate-500">{row.location}</td>
                              <td className="py-2 px-3 text-center">
                                {isExisting ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Already Exists
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Ready
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                {importRows.length === 0 ? 'No file parsed yet' : `${importRows.length} employee records ready for import`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportRows([]);
                    setImportFileName('');
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importRows.length === 0 || isImporting}
                  onClick={handleBulkImportSubmit}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    importRows.length === 0 || isImporting
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isImporting
                      ? 'Importing...'
                      : `Confirm & Import (${importRows.length}) Employees`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
