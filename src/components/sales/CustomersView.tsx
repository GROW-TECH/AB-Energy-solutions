import React, { useState } from 'react';
import { 
  UserCheck, Search, Filter, Phone, Mail, MapPin, 
  SunMedium, ShieldCheck, Clock, Receipt, ChevronRight, 
  ExternalLink, ArrowRight, CheckCircle2, KeyRound, Copy, 
  Check, MessageCircle, Eye, EyeOff, Share2, AlertCircle,
  ArrowLeft, Building2, Zap, DollarSign, Users, X
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Customer } from '../../types';
import { NavItemKey } from '../layout/Sidebar';

interface CustomersViewProps {
  onNavigate: (tab: NavItemKey) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onNavigate }) => {
  const { 
    customers, 
    setSelectedCustomerIdForPortal, 
    warranties, 
    amcs, 
    projects, 
    timeline,
    createCustomerPortalAccount
  } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Portal Account Modal & Sharing State
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPortal, setIsSavingPortal] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalSuccess, setPortalSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || null;

  // Compute dynamic portal URL (works for localhost and live subfolder)
  const getPortalUrl = () => {
    if (typeof window === 'undefined') return 'https://xiadot.com/AB_Energy_Solutions/';
    return `${window.location.origin}${window.location.pathname.replace(/(\/index\.html|\/)+$/, '')}/`;
  };

  const handleOpenCredentialsModal = (customer: Customer) => {
    const defaultUser = customer.portalUsername || 
      `${customer.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}.solar`;
    setPortalUsername(defaultUser);
    setPortalPassword('Solar@2026');
    setPortalError(null);
    setPortalSuccess(null);
    setShowPortalModal(true);
  };

  const handleSavePortalAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!portalUsername.trim() || !portalPassword.trim()) {
      setPortalError('Username and password are required.');
      return;
    }

    setIsSavingPortal(true);
    setPortalError(null);
    const result = await createCustomerPortalAccount(selectedCustomer.id, portalUsername.trim(), portalPassword.trim());
    setIsSavingPortal(false);

    if (result.success) {
      setPortalSuccess(`Login credentials active for ${result.username}!`);
      setTimeout(() => {
        setShowPortalModal(false);
        setPortalSuccess(null);
      }, 1400);
    } else {
      setPortalError(result.error || 'Failed to configure portal access');
    }
  };

  const handleCopyCredentials = (customer: Customer) => {
    const url = getPortalUrl();
    const user = customer.portalUsername || 'Configured via Admin';
    const text = `AB Energy Solutions - Customer Solar Portal\n\nDear ${customer.name},\nYour rooftop solar system portal is ready. You can track live power generation, equipment warranty certificates, and invoices anytime:\n\nPortal Link: ${url}\nLogin ID / Username: ${user}\nPassword: Solar@2026\n\nFor any queries or maintenance assistance, contact us at support@abenergy.in`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = (customer: Customer) => {
    const url = getPortalUrl();
    const user = customer.portalUsername || 'Configured via Admin';
    const text = `AB Energy Solutions - Customer Solar Portal\n\nDear ${customer.name},\nYour rooftop solar system portal is ready. You can track live power generation, equipment warranty certificates, and invoices anytime:\n\nPortal Link: ${url}\nLogin ID / Username: ${user}\nPassword: Solar@2026\n\nFor any queries or maintenance assistance, contact us at support@abenergy.in`;
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOpenPortal = (customerId: string) => {
    setSelectedCustomerIdForPortal(customerId);
    onNavigate('customer-portal');
  };

  // Filter calculations
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.consumerNumberDiscom && c.consumerNumberDiscom.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || c.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Overall KPI metrics
  const totalCapacityKw = customers.reduce((sum, c) => sum + (c.totalSystemKw || 0), 0);
  const totalPortfolioValue = customers.reduce((sum, c) => sum + (c.totalOrderValue || 0), 0);
  const totalBalanceDue = customers.reduce((sum, c) => sum + (c.balanceAmount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* VIEW 1: FULL-WIDTH CUSTOMER DIRECTORY TABLE */}
      {!selectedCustomer ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>Customer Directory &amp; Accounts</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage solar homeowner accounts, warranty assets, billing ledgers, and self-service portal credentials.
              </p>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Customer Accounts</span>
                <div className="text-xl font-bold text-slate-900 mt-1">{customers.length} Accounts</div>
              </div>
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Installed Capacity</span>
                <div className="text-xl font-bold text-emerald-700 mt-1">{totalCapacityKw.toFixed(1)} kW</div>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Portfolio Contract Value</span>
                <div className="text-xl font-bold text-slate-900 mt-1">₹{totalPortfolioValue.toLocaleString('en-IN')}</div>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Outstanding Collections</span>
                <div className={`text-xl font-bold mt-1 ${totalBalanceDue > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                  ₹{totalBalanceDue.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search and Filters Toolbar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 w-full sm:w-80 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by name, phone, city, or ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-500 font-semibold shrink-0">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Statuses ({customers.length})</option>
                <option value="Under Installation">Under Installation</option>
                <option value="Completed">Completed / Commissioned</option>
                <option value="Active">Active</option>
              </select>
            </div>
          </div>

          {/* Customer Directory Mobile Cards (< lg) */}
          <div className="lg:hidden divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                No customer accounts match your search or filter.
              </div>
            ) : (
              filteredCustomers.map(customer => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className="p-4 hover:bg-slate-50/80 cursor-pointer transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {customer.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                          {customer.status}
                        </span>
                        {customer.portalUsername ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Portal Active</span>
                          </span>
                        ) : null}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">{customer.name}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.city}, {customer.state}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shrink-0">
                      {customer.totalSystemKw} kW
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Order</span>
                      <span className="font-bold text-slate-900 text-xs">₹{customer.totalOrderValue.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Balance Due</span>
                      <span className={`font-bold text-xs ${customer.balanceAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        ₹{customer.balanceAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <a
                      href={`tel:${customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 font-mono font-semibold"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{customer.phone}</span>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomerId(customer.id);
                      }}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg text-xs shadow-xs inline-flex items-center gap-1"
                    >
                      <span>View Profile</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Directory Enterprise Data Table (Desktop >= lg) */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Customer ID</th>
                    <th className="py-3 px-4">Customer Name &amp; Location</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">System Size</th>
                    <th className="py-3 px-4">Order Value</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Project Status</th>
                    <th className="py-3 px-4">Portal Access</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No customer accounts match your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(customer => {
                      return (
                        <tr 
                          key={customer.id} 
                          onClick={() => setSelectedCustomerId(customer.id)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                            {customer.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {customer.name}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {customer.city}, {customer.state}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">
                            {customer.phone}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
                              {customer.totalSystemKw} kW
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            ₹{customer.totalOrderValue.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`font-bold ${customer.balanceAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                              ₹{customer.balanceAmount.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                              {customer.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {customer.portalUsername ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                                Unconfigured
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCustomerId(customer.id);
                              }}
                              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg text-xs shadow-xs transition-colors inline-flex items-center gap-1"
                            >
                              <span>View Profile</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: DEDICATED FULL-WIDTH CUSTOMER PROFILE & LEDGER */
        <div className="space-y-6">
          {/* Breadcrumb Navigation & Back Button */}
          <div className="flex items-center justify-between gap-4 pb-1">
            <button
              type="button"
              onClick={() => setSelectedCustomerId(null)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Customer Directory</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPortal(selectedCustomer.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
              >
                <span>Open Customer Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Customer Master Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                    {selectedCustomer.id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                    {selectedCustomer.status}
                  </span>
                  {selectedCustomer.consumerNumberDiscom && (
                    <span className="text-[11px] font-mono text-slate-500">
                      DISCOM: <strong className="text-slate-800">{selectedCustomer.consumerNumberDiscom}</strong>
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{selectedCustomer.name}</h1>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Contact Phone</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedCustomer.phone}</div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Email</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedCustomer.email || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial & Technical Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Solar System Capacity</span>
              <div className="text-xl font-bold text-emerald-700">
                {selectedCustomer.totalSystemKw} kW On-Grid
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Plant Value</span>
              <div className="text-xl font-bold text-slate-900">
                ₹{selectedCustomer.totalOrderValue.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Paid Collections</span>
              <div className="text-xl font-bold text-emerald-800">
                ₹{selectedCustomer.paidAmount.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Outstanding Balance</span>
              <div className={`text-xl font-bold ${selectedCustomer.balanceAmount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                ₹{selectedCustomer.balanceAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* REDESIGNED: CUSTOMER SELF-SERVICE PORTAL ACCESS CARD (Follows Theme, No Emojis) */}
          <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-emerald-600 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Customer Self-Service Portal Access</h3>
                  <p className="text-xs text-slate-500">
                    Provision customer credentials and share portal link for rooftop generation tracking, warranties, and billing.
                  </p>
                </div>
              </div>

              {selectedCustomer.portalUsername ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Portal Active: <span className="font-mono">{selectedCustomer.portalUsername}</span></span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
                  <span>Access Not Provisioned</span>
                </span>
              )}
            </div>

            {/* URL Display and Quick Copy */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="font-mono text-slate-700 truncate">
                <span className="text-slate-500 select-none">Portal Login URL: </span>
                <span className="text-emerald-700 font-bold">{getPortalUrl()}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCredentials(selectedCustomer)}
                className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-md border border-slate-300 shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                title="Copy portal link and credentials"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedLink ? 'Copied to Clipboard' : 'Copy Access Info'}</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleOpenCredentialsModal(selectedCustomer)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{selectedCustomer.portalUsername ? 'Manage / Reset Credentials' : 'Setup Portal Access'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleShareWhatsApp(selectedCustomer)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Share via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPortal(selectedCustomer.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs transition-colors ml-auto cursor-pointer"
              >
                <span>Launch Portal Preview</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Warrantied Equipment Assets */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Warrantied Equipment Assets</span>
            </h3>

            {warranties.filter(w => w.customerId === selectedCustomer.id).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                Warranties automatically activate upon plant commissioning.
              </div>
            ) : (
              <div className="space-y-2">
                {warranties.filter(w => w.customerId === selectedCustomer.id).map(w => (
                  <div key={w.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{w.equipmentType} - {w.makeModel}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Serial: {w.serialNumber} • {w.warrantyPeriodYears} Years Full Coverage
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Annual Maintenance Contracts (AMC) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>AMC Contract &amp; Service Care</span>
            </h3>

            {amcs.filter(a => a.customerId === selectedCustomer.id).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                No active AMC contract currently provisioned.
              </div>
            ) : (
              <div className="space-y-2">
                {amcs.filter(a => a.customerId === selectedCustomer.id).map(a => (
                  <div key={a.id} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{a.planName} ({a.capacityKw} kW)</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {a.completedVisits} of {a.visitsPerYear} preventative visits completed • Next: {a.nextScheduledVisit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">₹{a.annualPrice.toLocaleString('en-IN')}/yr</div>
                      <span className="text-[11px] font-bold text-emerald-700">{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Lifetime Activity Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">
              Customer Lifetime Activity Timeline
            </h3>

            {timeline.filter(t => t.entityId === selectedCustomer.id).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                No historical events logged yet.
              </div>
            ) : (
              <div className="space-y-2">
                {timeline.filter(t => t.entityId === selectedCustomer.id).map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clean Enterprise Credentials Modal (Theme Matched, No Emojis) */}
      {showPortalModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Customer Portal Credentials</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set portal login for <strong>{selectedCustomer.name}</strong> ({selectedCustomer.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPortalModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {portalError && (
              <div className="mb-3.5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{portalError}</span>
              </div>
            )}

            {portalSuccess && (
              <div className="mb-3.5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{portalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSavePortalAccount} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Portal Login ID / Username
                </label>
                <input
                  type="text"
                  required
                  value={portalUsername}
                  onChange={e => setPortalUsername(e.target.value)}
                  placeholder="e.g. iyer.solar"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  The customer will use this username to sign in to their self-service portal.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={portalPassword}
                    onChange={e => setPortalPassword(e.target.value)}
                    placeholder="Enter customer password"
                    className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPortalModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPortal}
                  className="px-4 py-1.5 font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {isSavingPortal ? 'Saving...' : 'Save Portal Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
