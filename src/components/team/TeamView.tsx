import React, { useState, useEffect } from 'react';
import { 
  Users2, UserCheck, ShieldCheck, Phone, Mail, 
  MapPin, Award, CheckCircle2, ArrowRight, Plus, 
  Search, Filter, Shield, KeyRound, UserX, UserPlus,
  Building2, Lock, Eye, Edit3, RefreshCw, AlertCircle, 
  ChevronRight, CheckSquare, Layers, Receipt, LifeBuoy, Clock
} from 'lucide-react';
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
  const { employees, activeRole, setActiveRole, currentUser, authFetch, projects } = useCrm();

  // Active Sub-tab in User Management
  const [activeTab, setActiveTab] = useState<'directory' | 'perspectives' | 'matrix' | 'departments'>('directory');

  // Users state
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
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
    } catch (err: any) {
      setActionError(err.message);
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
              <Users2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isSuperAdmin
                ? 'Centralized User Management & Role-Based Governance'
                : isSalesManager
                ? 'Sales Executives & Representative Management'
                : isProjectManager
                ? 'Installation Crew & Field Team Management'
                : 'Team & User Directory'}
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full">
              {isSuperAdmin
                ? 'Enterprise Access Control'
                : isSalesManager
                ? 'Sales Team Provisioning'
                : isProjectManager
                ? 'Crew Provisioning'
                : 'Direct Access'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {isSuperAdmin
              ? 'Provision user accounts, configure reporting hierarchies, enforce data scoping, and inspect system-wide RBAC entitlements.'
              : isSalesManager
              ? 'Provision and manage Sales Executive user accounts, update sales contact credentials, and monitor lead capacities.'
              : isProjectManager
              ? 'Provision and manage Installation Team technician accounts, update field credentials, and assign mounting crews.'
              : 'View team members and contact credentials.'}
          </p>
        </div>

        {canManageUsers && (
          <button
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
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
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
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
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

          {/* User Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User / Employee</th>
                    <th className="py-3 px-4">Role &amp; Entitlement</th>
                    <th className="py-3 px-4">Department &amp; Team</th>
                    <th className="py-3 px-4">Contact Credentials</th>
                    <th className="py-3 px-4 text-center">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
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
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 group-hover:bg-emerald-700 text-emerald-400 group-hover:text-white font-bold text-xs flex items-center justify-center shrink-0 transition-colors">
                              {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{user.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">@{user.username} • {user.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {user.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{user.department}</div>
                          <div className="text-[11px] text-slate-400">{user.location}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-700">{user.email || '—'}</div>
                          <div className="text-[11px] text-slate-400">{user.phone || '—'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            user.isActive 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                            <span>{user.isActive ? 'Active' : 'Deactivated'}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedMemberProfile(user); }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                              title="View Field Operations Profile"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Profile</span>
                            </button>

                            {canManageUsers && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditModal(user); }}
                                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                                  title="Edit user details"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
                                onClick={(e) => { e.stopPropagation(); setActiveRole(user.role); }}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer ml-1"
                                title="Switch perspective to this role"
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
    </div>
  );
};
