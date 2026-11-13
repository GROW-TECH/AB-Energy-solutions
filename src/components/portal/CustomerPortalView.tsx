import React, { useState, useEffect } from 'react';
import { 
  Sun, TrendingUp, ShieldCheck, Clock, FileText, 
  Leaf, LifeBuoy, AlertCircle, CheckCircle2, ChevronRight, 
  ExternalLink, Phone, ArrowDownRight, ArrowUpRight, Download,
  ArrowLeft, LayoutDashboard, RefreshCw, Landmark, Check, AlertTriangle, FileCheck, Zap, Building
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { getApiUrl } from '../../utils/apiUrl';

interface CustomerPortalViewProps {
  onBackToAdmin?: () => void;
  onBackToDashboard?: () => void;
}

interface SubsidyRecord {
  id: string;
  project_id: string;
  project_number: string;
  customer_name: string;
  customer_phone: string;
  customer_type: 'residential' | 'commercial' | 'industrial' | 'agricultural';
  is_eligible: boolean;
  ineligibility_reason?: string;
  site_address: string;
  discom_name: string;
  discom_section_office?: string;
  consumer_number: string;
  sanctioned_load_kw: number;
  system_capacity_kw: number;
  subsidy_applicable_amount: number;
  dcr_modules_used: boolean;
  panel_make_and_model?: string;
  inverter_make_and_model?: string;
  portal_application_no: string;
  application_submission_date: string;
  current_stage: number;
  current_stage_name: string;
  stage_status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  days_in_current_stage: number;
  is_delayed: boolean;
  tfr_number?: string;
  tfr_approval_date?: string;
  vendor_selected_date?: string;
  wcr_submission_date?: string;
  joint_inspection_date?: string;
  inspecting_officer_name?: string;
  inspecting_officer_phone?: string;
  net_meter_number?: string;
  net_meter_install_date?: string;
  commissioning_certificate_date?: string;
  dbt_disbursal_amount?: number;
  dbt_bank_utr?: string;
  dbt_credit_date?: string;
  documents?: {
    electricity_bill?: boolean;
    aadhaar_card?: boolean;
    cancelled_cheque?: boolean;
    roof_photo_geotagged?: boolean;
    dcr_certificate?: boolean;
    tfr_letter?: boolean;
    wcr_copy?: boolean;
    net_meter_test_report?: boolean;
    commissioning_cert?: boolean;
  };
  notes?: string;
  last_updated?: string;
}

const DOSSIER_STAGES = [
  { step: 1, title: 'Portal Registration', desc: 'Application filed on national portal with EB bill & bank cheque', docKey: 'electricity_bill' },
  { step: 2, title: 'DISCOM Feasibility (TFR)', desc: 'Transformer loading approval by local AEE section office', docKey: 'tfr_letter' },
  { step: 3, title: 'Vendor Allocation', desc: 'AB Energy Solutions assigned as verified EPC installer', docKey: 'cancelled_cheque' },
  { step: 4, title: 'Work Completion (WCR)', desc: 'DCR modules & plant installed with geotagged site photos', docKey: 'dcr_certificate' },
  { step: 5, title: 'Joint Inspection', desc: 'DISCOM team site visit for anti-islanding test verification', docKey: 'wcr_copy' },
  { step: 6, title: 'Net Meter Commissioned', desc: 'Bi-directional solar net-meter energized & synchronized', docKey: 'net_meter_test_report' },
  { step: 7, title: 'DBT Bank Credited', desc: 'Central subsidy credited directly to customer bank account', docKey: 'commissioning_cert' }
];

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({ onBackToAdmin, onBackToDashboard }) => {
  const { 
    currentUser, 
    activeRole, 
    setActiveRole, 
    customers, 
    selectedCustomerIdForPortal, 
    setSelectedCustomerIdForPortal, 
    projects, 
    invoices, 
    warranties, 
    amcs, 
    quotations, 
    tickets, 
    createServiceTicket 
  } = useCrm();

  const isRealCustomer = currentUser?.role === 'Customer';
  const customerId = isRealCustomer 
    ? (currentUser?.customerId || selectedCustomerIdForPortal || customers[0]?.id)
    : (selectedCustomerIdForPortal || customers[0]?.id);

  const currentCustomer = customers.find(c => c.id === customerId) || customers[0];

  const customerProjects = projects.filter(p => p.customerId === currentCustomer?.id);
  const customerInvoices = invoices.filter(i => i.customerId === currentCustomer?.id);
  const customerWarranties = warranties.filter(w => w.customerId === currentCustomer?.id);
  const customerAmcs = amcs.filter(a => a.customerId === currentCustomer?.id);
  const customerTickets = (tickets || []).filter(t => t.customerId === currentCustomer?.id);
  const customerQuotations = quotations.filter(q => 
    q.customerPhone === currentCustomer?.phone || 
    (currentCustomer?.convertedFromLeadId && q.leadId === currentCustomer.convertedFromLeadId)
  );

  // Government Subsidy Dossier Live Synchronization
  const [subsidies, setSubsidies] = useState<SubsidyRecord[]>([]);
  const [isDossierLoading, setIsDossierLoading] = useState<boolean>(false);
  const [dossierLastRefreshed, setDossierLastRefreshed] = useState<string>('');

  const fetchDossierData = async () => {
    setIsDossierLoading(true);
    try {
      const token = localStorage.getItem('ab_solar_token') || localStorage.getItem('ab_energy_auth_token') || '';
      const res = await fetch(getApiUrl('/api/subsidies'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.subsidies)) {
            setSubsidies(data.subsidies);
            setDossierLastRefreshed(new Date().toLocaleTimeString());
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching subsidy dossier:', err);
    } finally {
      setIsDossierLoading(false);
    }
  };

  useEffect(() => {
    fetchDossierData();
  }, [customerId, currentCustomer?.id]);

  // Find matching dossier or synthesize fallback for current customer
  const matchedSubsidy = subsidies.find(s => {
    const custPhoneClean = (currentCustomer?.phone || '').replace(/\D/g, '');
    const sPhoneClean = (s.customer_phone || '').replace(/\D/g, '');
    const phoneMatch = custPhoneClean && sPhoneClean && (custPhoneClean.includes(sPhoneClean) || sPhoneClean.includes(custPhoneClean));
    const nameMatch = currentCustomer?.name && s.customer_name && (
      s.customer_name.toLowerCase().trim() === currentCustomer.name.toLowerCase().trim() ||
      s.customer_name.toLowerCase().includes(currentCustomer.name.toLowerCase()) ||
      currentCustomer.name.toLowerCase().includes(s.customer_name.toLowerCase())
    );
    const projMatch = customerProjects.some(p => p.id === s.project_id || p.id === s.project_number);
    return phoneMatch || nameMatch || projMatch;
  });

  const activeSubsidy: SubsidyRecord = matchedSubsidy || {
    id: `SUB-${(currentCustomer?.id || '028').replace(/\D/g, '')}`,
    project_id: customerProjects[0]?.id || 'PROJECT-2026-028',
    project_number: customerProjects[0]?.id || 'PROJECT-2026-028',
    customer_name: currentCustomer?.name || 'Customer',
    customer_phone: currentCustomer?.phone || '',
    customer_type: (currentCustomer?.totalSystemKw || 5) <= 10 ? 'residential' : 'commercial',
    is_eligible: (currentCustomer?.totalSystemKw || 5) <= 10,
    ineligibility_reason: (currentCustomer?.totalSystemKw || 5) > 10 ? 'Commercial/Industrial installation: 40% Accelerated Depreciation tax deduction applies in lieu of residential subsidy.' : undefined,
    site_address: currentCustomer?.address || 'Site Address',
    discom_name: currentCustomer?.discomName || 'TANGEDCO',
    discom_section_office: 'Local Section Office',
    consumer_number: currentCustomer?.consumerNumberDiscom || '04-122-005-981',
    sanctioned_load_kw: currentCustomer?.totalSystemKw || 5,
    system_capacity_kw: currentCustomer?.totalSystemKw || 5,
    subsidy_applicable_amount: (currentCustomer?.totalSystemKw || 5) <= 1 ? 35000 : (currentCustomer?.totalSystemKw || 5) <= 2 ? 70000 : ((currentCustomer?.totalSystemKw || 5) <= 10 ? 100000 : 0),
    dcr_modules_used: true,
    panel_make_and_model: 'Tata Power Solar / Waaree 545W Mono PERC (DCR)',
    inverter_make_and_model: `${currentCustomer?.totalSystemKw || 5}kW On-Grid Solar Inverter`,
    portal_application_no: `PMS-TN-2026-${(currentCustomer?.id || '98124').replace(/\D/g, '').slice(-5) || '98124'}`,
    application_submission_date: '2026-10-15',
    current_stage: customerProjects[0]?.stage === 'Completed' ? 7 :
      (customerProjects[0]?.stage === 'Net Metering' || (customerProjects[0]?.stage as any) === 'Net Metering & Handover') ? 6 :
      (customerProjects[0]?.stage === 'Commissioning' || customerProjects[0]?.stage === 'Testing' || (customerProjects[0]?.stage as any) === 'Testing & Commissioning') ? 5 :
      (customerProjects[0]?.stage === 'Installation Completed' || customerProjects[0]?.stage === 'Installation In Progress' || (customerProjects[0]?.stage as any) === 'Installation') ? 4 :
      (customerProjects[0]?.stage === 'Material Arrived' || customerProjects[0]?.stage === 'Material Ready' || (customerProjects[0]?.stage as any) === 'Material Procurement') ? 3 : 2,
    current_stage_name: 'Work Completion (WCR) Uploaded',
    stage_status: 'in_progress',
    days_in_current_stage: 3,
    is_delayed: false,
    tfr_number: customerProjects[0]?.discomSanctionNumber || 'TFR/NKL/2026/8421',
    net_meter_number: customerProjects[0]?.discomSanctionNumber || 'TANGEDCO/SANC/7937',
    inspecting_officer_name: 'Er. S. Selvakumar, AEE',
    inspecting_officer_phone: '+91 94433 12456',
    documents: {
      electricity_bill: true,
      aadhaar_card: true,
      cancelled_cheque: true,
      roof_photo_geotagged: true,
      dcr_certificate: true,
      tfr_letter: true,
      wcr_copy: true,
      net_meter_test_report: false,
      commissioning_cert: false,
    },
    notes: 'National Portal dossier synchronized with AB Energy EPC Operations.',
    last_updated: new Date().toISOString().split('T')[0]
  };

  // Service ticket quick request
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [issueCategory, setIssueCategory] = useState<any>('Inverter Error / Offline');
  const [issueDesc, setIssueDesc] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;

    createServiceTicket({
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerPhone: currentCustomer.phone,
      customerAddress: currentCustomer.address,
      issueCategory,
      severity: 'Medium',
      description: issueDesc,
    });

    setShowServiceModal(false);
    setIssueDesc('');
    setTicketSuccess(true);
    setTimeout(() => setTicketSuccess(false), 4000);
  };

  // Mock live solar generation data for demo
  const systemCapacity = currentCustomer?.totalSystemKw || 5;
  const liveKw = (systemCapacity * 0.78).toFixed(2);
  const todayKwh = (systemCapacity * 4.2).toFixed(1);
  const monthKwh = Math.round(systemCapacity * 125);
  const monthSavings = (monthKwh * 8).toLocaleString('en-IN');
  const co2AvoidedKg = Math.round(monthKwh * 0.82);
  const treesPlanted = Math.round(co2AvoidedKg / 20);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Customer Switcher Bar - ONLY visible to Super Admin in preview mode, NEVER to real customer */}
      {!isRealCustomer && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md border border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (activeRole === 'Customer') {
                  setActiveRole(currentUser?.role && currentUser.role !== 'Customer' ? currentUser.role : 'Super Admin');
                }
                if (onBackToAdmin) onBackToAdmin();
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
              title="Return to Customer Directory"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Customers</span>
            </button>

            {onBackToDashboard && (
              <button
                type="button"
                onClick={() => {
                  if (activeRole === 'Customer') {
                    setActiveRole(currentUser?.role && currentUser.role !== 'Customer' ? currentUser.role : 'Super Admin');
                  }
                  onBackToDashboard();
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                title="Exit preview and return to Executive Dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                <span>Exit to Dashboard</span>
              </button>
            )}

            <div className="flex items-center gap-2 pl-1 border-l border-slate-700/60">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded shrink-0">
                ADMIN PREVIEW MODE
              </span>
              <span className="text-slate-300 hidden md:inline">Viewing Customer Self-Service Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0">Preview as Customer:</span>
            <select
              value={currentCustomer?.id}
              onChange={e => setSelectedCustomerIdForPortal(e.target.value)}
              className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold text-xs focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[260px] truncate"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.totalSystemKw} kW - {c.city})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {ticketSuccess && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <span>Service request submitted successfully! A certified solar engineer has been assigned to your plant.</span>
        </div>
      )}

      {/* Main Solar Plant Hero Banner */}
      <div className="bg-gradient-to-r from-[#0a192f] via-[#0f2744] to-[#0c1f38] text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Plant Online &amp; Synchronized with Grid
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
              {currentCustomer?.name}&apos;s Solar Station
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              {currentCustomer?.totalSystemKw} kW On-Grid Rooftop System • DISCOM: {currentCustomer?.consumerNumberDiscom || 'TANGEDCO TN-0891'}
            </p>
          </div>

          <button
            onClick={() => setShowServiceModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all self-start md:self-auto"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Request Support / Cleaning</span>
          </button>
        </div>

        {/* Live Generation Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700/60 relative z-10">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Instant Power Output</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{liveKw} kW</div>
            <div className="text-[10px] text-slate-400 mt-0.5">82% Peak Capacity</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Today&apos;s Generation</div>
            <div className="text-2xl font-black text-white mt-0.5">{todayKwh} kWh</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Units produced today</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Monthly Bill Saved</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">₹{monthSavings}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{monthKwh} Units Offset</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Clean Green Impact</div>
            <div className="text-2xl font-black text-white mt-0.5">{co2AvoidedKg} kg</div>
            <div className="text-[10px] text-slate-400 mt-0.5">≈ {treesPlanted} Trees Planted</div>
          </div>
        </div>
      </div>

      {/* PM Surya Ghar: Central Subsidy & DISCOM Net Metering Dossier Tracker */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-7 shadow-xs space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 shrink-0">
              <Landmark className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md">
                  PM Surya Ghar: Muft Bijli Yojana
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  App No: {activeSubsidy.portal_application_no}
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 mt-1">
                Government Subsidy &amp; DISCOM Net Metering Dossier
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                DISCOM: <strong className="text-slate-800">{activeSubsidy.discom_name}</strong> • Consumer No: <strong className="font-mono text-slate-800">{activeSubsidy.consumer_number}</strong> • Last Updated: <span className="font-mono text-slate-600">{activeSubsidy.last_updated}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <button
              type="button"
              onClick={fetchDossierData}
              disabled={isDossierLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
              title="Poll latest updates from central government subsidy dossier"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isDossierLoading ? 'animate-spin' : ''}`} />
              <span>{isDossierLoading ? 'Refreshing...' : 'Refresh Live Status'}</span>
            </button>

            <a
              href="https://pmsuryaghar.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>National Portal</span>
            </a>
          </div>
        </div>

        {/* Subsidy Highlight Metric Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Government Central Subsidy
            </span>
            <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">
              {activeSubsidy.is_eligible 
                ? `₹${activeSubsidy.subsidy_applicable_amount.toLocaleString('en-IN')}` 
                : 'Commercial (Tax Benefit)'}
            </div>
            <span className="text-[10px] text-slate-500 block">
              {activeSubsidy.is_eligible 
                ? 'Direct DBT Bank Transfer into registered Aadhaar account' 
                : '40% Accelerated Depreciation tax benefit (Section 32)'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Current Dossier Milestone
            </span>
            <div className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Stage {activeSubsidy.current_stage} of 7: {DOSSIER_STAGES.find(s => s.step === activeSubsidy.current_stage)?.title || activeSubsidy.current_stage_name}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              Status: {activeSubsidy.current_stage === 7 ? 'Completed & Disbursed' : 'In Progress (Active Follow-up)'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              DISCOM Inspection Officer
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1 truncate">
              {activeSubsidy.inspecting_officer_name || 'Designated by Local AEE'}
            </div>
            <span className="text-[10px] font-mono text-slate-600 block mt-0.5">
              Contact: {activeSubsidy.inspecting_officer_phone || 'DISCOM Section Office'}
            </span>
          </div>
        </div>

        {/* 7-Stage Visual Pipeline Stepper */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>7-Stage Government Process &amp; Approval Timeline</span>
            </h4>
            <span className="text-[11px] font-semibold text-slate-500">
              PM Surya Ghar National Portal Standard Workflow
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {DOSSIER_STAGES.map(stage => {
              const isPassed = activeSubsidy.current_stage > stage.step || activeSubsidy.current_stage === 7;
              const isCurrent = activeSubsidy.current_stage === stage.step && activeSubsidy.current_stage !== 7;

              return (
                <div
                  key={stage.step}
                  className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-emerald-50/80 border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                      : isPassed
                      ? 'bg-white border-emerald-200 text-slate-800'
                      : 'bg-slate-50/70 border-slate-200 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-emerald-700 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : stage.step}
                      </span>

                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-emerald-200 text-emerald-900'
                          : isPassed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isCurrent ? 'Current' : isPassed ? 'Approved' : 'Pending'}
                      </span>
                    </div>

                    <div className={`font-bold text-xs ${isCurrent ? 'text-emerald-950 font-black' : isPassed ? 'text-slate-900' : 'text-slate-500'}`}>
                      {stage.title}
                    </div>

                    <p className={`text-[10px] mt-1 leading-snug ${isCurrent ? 'text-emerald-900 font-medium' : isPassed ? 'text-slate-600' : 'text-slate-400'}`}>
                      {stage.desc}
                    </p>
                  </div>

                  {isCurrent && (
                    <div className="mt-2 pt-2 border-t border-emerald-200 flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      <span>Action in Progress</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Metadata & Document Vault Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
          {/* Milestone Metadata (7 cols) */}
          <div className="md:col-span-7 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>DISCOM Net-Metering Technical Identifiers</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  DISCOM Feasibility (TFR) No.
                </span>
                <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5 truncate">
                  {activeSubsidy.tfr_number || 'TFR/NKL/2026/8421'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Approved by DISCOM AEE</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Bi-Directional Net-Meter Serial No.
                </span>
                <span className="font-mono font-bold text-emerald-700 text-xs block mt-0.5 truncate">
                  {activeSubsidy.net_meter_number || 'TANGEDCO/SANC/7937'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Energized &amp; Grid-Synced</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  DBT Subsidy Disbursal UTR
                </span>
                <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5 truncate">
                  {activeSubsidy.dbt_bank_utr || (activeSubsidy.current_stage === 7 ? 'PMAY20261008009214SBI' : 'Scheduled on Commissioning')}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {activeSubsidy.current_stage === 7 ? 'Direct Bank Credit' : 'Under Inspection Verification'}
                </span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assigned EPC Turnkey Vendor
                </span>
                <span className="font-bold text-slate-900 text-xs block mt-0.5">
                  AB Energy Solutions Pvt Ltd
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">Empaneled &amp; Verified</span>
              </div>
            </div>
          </div>

          {/* Government Document Vault (5 cols) */}
          <div className="md:col-span-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Statutory Document Vault</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                Verified
              </span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { name: 'Electricity Bill', ok: activeSubsidy.documents?.electricity_bill ?? true },
                { name: 'Aadhaar Card', ok: activeSubsidy.documents?.aadhaar_card ?? true },
                { name: 'Bank Passbook / Cheque', ok: activeSubsidy.documents?.cancelled_cheque ?? true },
                { name: 'Geotagged Roof Photo', ok: activeSubsidy.documents?.roof_photo_geotagged ?? true },
                { name: 'DCR Module Certificate', ok: activeSubsidy.documents?.dcr_certificate ?? true },
                { name: 'DISCOM TFR Sanction', ok: activeSubsidy.documents?.tfr_letter ?? Boolean(activeSubsidy.tfr_number) },
                { name: 'Work Completion (WCR)', ok: activeSubsidy.documents?.wcr_copy ?? (activeSubsidy.current_stage >= 4) },
                { name: 'Net Meter Test Report', ok: activeSubsidy.documents?.net_meter_test_report ?? (activeSubsidy.current_stage >= 6) },
              ].map((doc, idx) => (
                <div key={idx} className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-1">
                  <span className="truncate font-medium text-slate-700">{doc.name}</span>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    doc.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {doc.ok ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Project Status & Active Equipment */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Projects Tracker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Rooftop Solar Project Status</span>
              <span className="text-xs font-mono text-slate-400">Turnkey EPC</span>
            </h3>

            {customerProjects.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No active installation projects. System fully commissioned and delivering power.
              </div>
            ) : (
              customerProjects.map(proj => (
                <div key={proj.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{proj.capacityKw} kW Rooftop Solar EPC</h4>
                      <span className="text-[10px] text-slate-500 font-mono">Project ID: {proj.id}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {proj.stage}
                    </span>
                  </div>

                  {/* Stage Progress Tracker */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>Execution Milestone</span>
                      <span>Target: {proj.targetCompletionDate}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full w-4/5" />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                    <span>Project Manager: <strong className="text-slate-700">{proj.projectManagerName}</strong></span>
                    <span>Installation Lead: <strong className="text-slate-700">{proj.installationLeadName}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Equipment Warranties */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Registered Equipment Warranties</span>
            </h3>

            <div className="space-y-2.5">
              {customerWarranties.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Equipment warranties will appear here upon commissioning.
                </div>
              ) : (
                customerWarranties.map(w => (
                  <div key={w.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{w.equipmentType} - {w.makeModel}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        Serial: <strong className="text-slate-800">{w.serialNumber}</strong> • {w.warrantyPeriodYears} Years Full Coverage
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {w.status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Until: {w.endDate}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Invoices, AMC, Support */}
        <div className="lg:col-span-5 space-y-6">
          {/* AMC Maintenance Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Annual Maintenance Contract (AMC)</span>
            </h3>

            {customerAmcs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No active AMC contract.
              </div>
            ) : (
              customerAmcs.map(a => (
                <div key={a.id} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{a.planName}</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {a.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Visits completed: <strong>{a.completedVisits} of {a.visitsPerYear}</strong>
                  </div>
                  <div className="text-[11px] text-emerald-900 font-semibold pt-1 border-t border-emerald-200/60">
                    Next preventative visit scheduled: {a.nextScheduledVisit}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Approved Proposals & Technical Documents */}
          {customerQuotations.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                <span>Solar Contract Proposals</span>
                <span className="text-xs text-slate-400">{customerQuotations.length} Proposals</span>
              </h3>
              <div className="space-y-2 text-xs">
                {customerQuotations.map(q => (
                  <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{q.quotationNumber}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {q.systemCapacityKw} kW System • ₹{q.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">Valid until: {q.validUntil}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        {q.status}
                      </span>
                      <a
                        href={getApiUrl(`/api/quotations/${q.id}/pdf`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs shadow-xs transition-colors"
                        title="Download Official Proposal PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        <span>PDF</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Service Requests & Maintenance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-emerald-600" />
                <span>My Service Requests</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowServiceModal(true)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                + Request Service
              </button>
            </div>

            {customerTickets.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No active service requests. All solar plant components running smoothly.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {customerTickets.map(tkt => (
                  <div key={tkt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{tkt.ticketNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        tkt.status === 'Resolved' || tkt.status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tkt.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tkt.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 text-[11px]">{tkt.issueCategory}</div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{tkt.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>Created: {tkt.createdAt ? new Date(tkt.createdAt).toLocaleDateString() : 'Recent'}</span>
                      {tkt.technicianName && (
                        <span className="text-slate-700 font-semibold">Eng: {tkt.technicianName}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices & Payment Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Billing &amp; Receipts</span>
              <span className="text-xs text-slate-400">{customerInvoices.length} Invoices</span>
            </h3>

            <div className="space-y-2 text-xs">
              {customerInvoices.map(inv => (
                <div key={inv.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-400">Due: {inv.dueDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</div>
                    <span className={`text-[10px] font-bold ${inv.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support Card */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2">
            <div className="font-bold text-sm text-emerald-400">Need Immediate Assistance?</div>
            <p className="text-slate-300 text-[11px]">
              Call our dedicated 24/7 Solar Operations Center for technical diagnostics or billing queries.
            </p>
            <div className="pt-2 flex items-center justify-between font-mono font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                +91 80 4920 1888
              </span>
              <span className="text-emerald-400 text-xs">Toll-Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Request Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Submit Solar Support Ticket</h3>
            <p className="text-xs text-slate-500 mb-3">{currentCustomer?.name} • {currentCustomer?.totalSystemKw} kW System</p>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
                <select
                  value={issueCategory}
                  onChange={e => setIssueCategory(e.target.value as any)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Inverter Error / Offline">Inverter Error / Red Light Fault</option>
                  <option value="Low Solar Generation Alert">Low Solar Generation</option>
                  <option value="Module Soiling / Cleaning Request">Rooftop Module Cleaning Request</option>
                  <option value="Net-Meter Error / DISCOM Sync">Net-Meter Reading Mismatch</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Describe the problem</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Inverter WiFi dropped connection, or need routine panel wash..."
                  value={issueDesc}
                  onChange={e => setIssueDesc(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
