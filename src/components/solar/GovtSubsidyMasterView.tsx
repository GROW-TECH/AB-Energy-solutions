import React, { useState, useEffect } from 'react';
import {
  Landmark, ShieldCheck, AlertTriangle, CheckCircle2, Clock, 
  ExternalLink, Search, Filter, Phone, MessageSquare, FileText, 
  Upload, Check, ArrowRight, User, Building, Zap, RefreshCw, 
  Calendar, Eye, Info, ChevronRight, X, AlertCircle, FileCheck
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiUrl';

interface SubsidyRecord {
  id: string;
  project_id: string;
  project_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
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
  documents: {
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
  last_updated: string;
}

interface SummaryStats {
  total_records: number;
  eligible_records: number;
  total_pipeline_subsidy: number;
  total_disbursed_subsidy: number;
  pending_tfr_count: number;
  pending_net_meter_count: number;
  delayed_bottlenecks_count: number;
}

const STAGES = [
  { step: 1, title: 'Portal Registration', desc: 'Application filed with EB bill & bank cheque' },
  { step: 2, title: 'DISCOM Feasibility (TFR)', desc: 'Transformer loading approval by local AEE' },
  { step: 3, title: 'Vendor Allocation', desc: 'AB Energy Solutions assigned on national portal' },
  { step: 4, title: 'Work Completion (WCR)', desc: 'DCR panels & installation photos uploaded' },
  { step: 5, title: 'Joint Inspection', desc: 'DISCOM team visits for anti-islanding test' },
  { step: 6, title: 'Net Meter Commissioned', desc: 'Bi-directional solar meter energized' },
  { step: 7, title: 'DBT Bank Credited', desc: 'Subsidy credited directly to customer bank A/c' }
];

export const GovtSubsidyMasterView: React.FC = () => {
  const [subsidies, setSubsidies] = useState<SubsidyRecord[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterEligibility, setFilterEligibility] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<SubsidyRecord | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeDossierTab, setActiveDossierTab] = useState<'stepper' | 'docs' | 'whatsapp' | 'officer'>('stepper');

  // Edit form state for dossier modal
  const [editStage, setEditStage] = useState<number>(1);
  const [editTfrNo, setEditTfrNo] = useState<string>('');
  const [editOfficerName, setEditOfficerName] = useState<string>('');
  const [editOfficerPhone, setEditOfficerPhone] = useState<string>('');
  const [editNetMeterNo, setEditNetMeterNo] = useState<string>('');
  const [editBankUtr, setEditBankUtr] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editDocs, setEditDocs] = useState<Record<string, boolean>>({});

  const token = localStorage.getItem('ab_solar_token') || localStorage.getItem('ab_energy_auth_token') || '';

  const authFetch = (url: string, opts: any = {}) => {
    const fullUrl = url.startsWith('http') ? url : getApiUrl(url);
    const headers = {
      ...(opts.headers || {}),
      Authorization: `Bearer ${token}`
    };
    return fetch(fullUrl, { ...opts, headers });
  };

  const fetchSubsidies = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/subsidies');
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.subsidies) {
            setSubsidies(data.subsidies);
            setSummary(data.summary);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch subsidies, will use local fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubsidies();
  }, []);

  const openDossier = (record: SubsidyRecord) => {
    setSelectedRecord(record);
    setEditStage(record.current_stage);
    setEditTfrNo(record.tfr_number || '');
    setEditOfficerName(record.inspecting_officer_name || '');
    setEditOfficerPhone(record.inspecting_officer_phone || '');
    setEditNetMeterNo(record.net_meter_number || '');
    setEditBankUtr(record.dbt_bank_utr || '');
    setEditNotes(record.notes || '');
    setEditDocs({ ...(record.documents || {}) });
    setIsDossierOpen(true);
    setActiveDossierTab('stepper');
  };

  const saveDossierChanges = async () => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const stageName = STAGES.find(s => s.step === editStage)?.title || selectedRecord.current_stage_name;
      const payload: Partial<SubsidyRecord> = {
        current_stage: editStage,
        current_stage_name: stageName,
        tfr_number: editTfrNo,
        inspecting_officer_name: editOfficerName,
        inspecting_officer_phone: editOfficerPhone,
        net_meter_number: editNetMeterNo,
        dbt_bank_utr: editBankUtr,
        notes: editNotes,
        documents: editDocs as any,
        stage_status: editStage === 7 ? 'completed' : 'in_progress'
      };

      const res = await authFetch(`/api/subsidies/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.subsidy) {
          setSubsidies(prev => prev.map(s => s.id === data.subsidy.id ? data.subsidy : s));
          setSelectedRecord(data.subsidy);
        }
      }
    } catch (err) {
      console.error('Error saving subsidy changes:', err);
    } finally {
      setIsSaving(false);
      setIsDossierOpen(false);
    }
  };

  const getWhatsAppMessage = (record: SubsidyRecord) => {
    const stage = STAGES.find(s => s.step === record.current_stage);
    return `Namaste ${record.customer_name} ji,\n\nGreetings from AB Energy Solutions! Here is the latest official update on your Solar Subsidy & EB Net Metering application:\n\n` +
      `🏛️ Scheme: PM Surya Ghar Muft Bijli Yojana\n` +
      `📋 Portal App ID: ${record.portal_application_no}\n` +
      `⚡ Capacity: ${record.system_capacity_kw} kW (${record.dcr_modules_used ? 'DCR Indian Made Panels' : 'Standard'})\n` +
      `💰 Expected Subsidy: ₹${record.subsidy_applicable_amount.toLocaleString('en-IN')}\n` +
      `📍 Current Status: Stage ${record.current_stage}/7 - ${record.current_stage_name}\n` +
      (record.tfr_number ? `✅ EB Feasibility (TFR) Ref: ${record.tfr_number}\n` : '') +
      (record.net_meter_number ? `🔌 Net Meter No: ${record.net_meter_number}\n` : '') +
      (record.dbt_bank_utr ? `🎉 Subsidy Credited! Bank UTR: ${record.dbt_bank_utr}\n` : '') +
      `\nOur team is closely tracking your application with ${record.discom_name}. For any assistance, feel free to reply to this message.\n\nWarm regards,\nAB Energy Solutions (Solar EPC & Engineering)`;
  };

  const openWhatsApp = (record: SubsidyRecord) => {
    const cleanPhone = record.customer_phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(getWhatsAppMessage(record));
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  // Filter list
  const filteredSubsidies = subsidies.filter(s => {
    const matchesSearch = 
      s.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customer_phone.includes(searchQuery) ||
      s.portal_application_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.consumer_number.includes(searchQuery) ||
      s.project_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = filterStage === 'all' ? true :
      filterStage === 'delayed' ? s.is_delayed :
      String(s.current_stage) === filterStage;

    const matchesEligibility = filterEligibility === 'all' ? true :
      filterEligibility === 'eligible' ? s.is_eligible :
      !s.is_eligible;

    return matchesSearch && matchesStage && matchesEligibility;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-navy-950 rounded-2xl p-6 sm:p-8 text-white border border-emerald-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
              <Landmark className="w-3.5 h-3.5" />
              Central Government Subsidy & DISCOM Net-Metering Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              PM Surya Ghar: Muft Bijli Yojana
              <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium">
                MNRE 2024–2026 Rules
              </span>
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Track national portal applications (<code className="text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded">pmsuryaghar.gov.in</code>), 
              TANGEDCO/DISCOM Technical Feasibility Reports (TFR), DCR module verification, 
              bi-directional net-meter commissioning, and customer DBT bank credits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://pmsuryaghar.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
            >
              <ExternalLink className="w-4 h-4" />
              National Portal Login ↗
            </a>
            <button
              onClick={fetchSubsidies}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700/80 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Subsidy Scale Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400">1 kW Residential</div>
            <div className="text-emerald-400 font-bold text-sm">₹30,000 Flat Subsidy</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400">2 kW Residential</div>
            <div className="text-emerald-400 font-bold text-sm">₹60,000 Flat Subsidy</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400">3 kW to 10 kW Residential</div>
            <div className="text-emerald-400 font-bold text-sm">₹78,000 Maximum Cap</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400">Commercial / Industrial</div>
            <div className="text-amber-400 font-bold text-sm">₹0 (40% Depr. Benefit)</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total In Pipeline</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Landmark className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{((summary?.total_pipeline_subsidy || 0) / 100000).toFixed(2)} Lakhs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across {summary?.eligible_records || subsidies.filter(s => s.is_eligible).length} eligible projects
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Disbursed (DBT)</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">
              ₹{((summary?.total_disbursed_subsidy || 0) / 100000).toFixed(2)} Lakhs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Credited directly to customer accounts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waiting Net Meter</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Zap className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-700">
              {summary?.pending_net_meter_count ?? subsidies.filter(s => s.current_stage === 5 || s.current_stage === 6).length}
            </span>
            <span className="text-xs text-purple-600 font-medium">Ready for sync</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">DISCOM inspection & meter testing</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bottlenecks & Delayed</span>
            <span className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600">
              {summary?.delayed_bottlenecks_count ?? subsidies.filter(s => s.is_delayed).length}
            </span>
            <span className="text-xs text-red-500 font-medium">&gt;15 days pending</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Requires immediate EB office follow-up</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, phone, portal application no, or consumer number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Stages (1-7)</option>
              <option value="1">Stage 1: Portal Registered</option>
              <option value="2">Stage 2: TFR Pending</option>
              <option value="4">Stage 4: WCR Uploaded</option>
              <option value="5">Stage 5: Inspection Scheduled</option>
              <option value="6">Stage 6: Net Meter Commissioned</option>
              <option value="7">Stage 7: Subsidy Credited</option>
              <option value="delayed">⚠️ Overdue / Delayed Only</option>
            </select>
          </div>

          <select
            value={filterEligibility}
            onChange={(e) => setFilterEligibility(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Tariffs</option>
            <option value="eligible">Residential (Eligible)</option>
            <option value="ineligible">Commercial / Industrial (₹0)</option>
          </select>
        </div>
      </div>

      {/* Subsidies Mobile Cards (< lg) */}
      <div className="lg:hidden divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredSubsidies.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-700">No subsidy records found</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filters.</p>
          </div>
        ) : (
          filteredSubsidies.map((record) => (
            <div
              key={record.id}
              className={`p-4 transition-colors space-y-3 ${record.is_delayed ? 'bg-red-50/20' : 'hover:bg-slate-50/80'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {record.project_number}
                    </span>
                    {record.dcr_modules_used ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                        DCR
                      </span>
                    ) : null}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-medium">
                      {record.customer_type}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">{record.customer_name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{record.customer_phone}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {record.is_eligible ? (
                    <div>
                      <div className="font-bold text-emerald-700 text-sm sm:text-base font-mono">
                        ₹{record.subsidy_applicable_amount.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400">Govt. DBT</span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-slate-400 text-xs line-through">₹0 Subsidy</span>
                      <div className="text-[10px] text-amber-700 font-medium">40% Tax Depr.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Stepper Status */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-[11px]">
                    Stage {record.current_stage}/7: {record.current_stage_name}
                  </span>
                  {record.is_delayed && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {record.days_in_current_stage}d Delayed
                    </span>
                  )}
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      record.current_stage === 7 ? 'bg-emerald-500' :
                      record.is_delayed ? 'bg-red-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, (record.current_stage / 7) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Portal: <strong className="font-mono text-slate-700">{record.portal_application_no || 'Pending'}</strong></span>
                  <span>EB: <strong className="font-mono text-slate-700">{record.consumer_number || 'N/A'}</strong></span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-600 font-semibold">
                  {record.system_capacity_kw} kW System
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openWhatsApp(record)}
                    title="Send update via WhatsApp"
                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDossier(record)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Dossier</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Subsidies Table (Desktop >= lg) */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Customer &amp; Project</th>
                <th className="py-3 px-4">System Specs &amp; Panels</th>
                <th className="py-3 px-4">National Portal &amp; EB Info</th>
                <th className="py-3 px-4">Govt. Stage &amp; Progress</th>
                <th className="py-3 px-4">Subsidy Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubsidies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">No subsidy records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredSubsidies.map((record) => (
                  <tr 
                    key={record.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${record.is_delayed ? 'bg-red-50/20' : ''}`}
                  >
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{record.customer_name}</div>
                      <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {record.customer_phone}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-700 font-medium mt-1">
                        {record.project_number}
                      </div>
                    </td>

                    {/* System & Panels */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {record.system_capacity_kw} kW Grid-Tied
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        {record.dcr_modules_used ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                            DCR Compliant
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Non-DCR Tier 1
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-medium">
                          {record.customer_type}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-1" title={record.panel_make_and_model}>
                        {record.panel_make_and_model || 'Standard Modules'}
                      </div>
                    </td>

                    {/* Portal & EB */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-bold text-slate-800">
                        {record.portal_application_no}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        <span className="font-medium text-slate-700">EB:</span> {record.consumer_number}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[190px]">
                        {record.discom_section_office || record.discom_name}
                      </div>
                    </td>

                    {/* Stage & Stepper */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800 text-[11px]">
                          Stage {record.current_stage}/7: {record.current_stage_name}
                        </span>
                        {record.is_delayed && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {record.days_in_current_stage}d Delayed
                          </span>
                        )}
                      </div>

                      {/* Mini visual progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            record.current_stage === 7 ? 'bg-emerald-500' :
                            record.is_delayed ? 'bg-red-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, (record.current_stage / 7) * 100)}%` }}
                        ></div>
                      </div>

                      {record.tfr_number && (
                        <div className="text-[10px] text-slate-500 mt-1 truncate">
                          TFR: <span className="font-mono font-semibold">{record.tfr_number}</span>
                        </div>
                      )}
                      {record.net_meter_number && (
                        <div className="text-[10px] text-purple-700 font-medium truncate">
                          Meter: <span className="font-mono">{record.net_meter_number}</span>
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4">
                      {record.is_eligible ? (
                        <>
                          <div className="font-bold text-emerald-700 text-sm">
                            ₹{record.subsidy_applicable_amount.toLocaleString('en-IN')}
                          </div>
                          {record.current_stage === 7 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Credited to Bank
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Direct Benefit Transfer (DBT)
                            </span>
                          )}
                        </>
                      ) : (
                        <div>
                          <span className="font-bold text-slate-400 text-xs line-through">₹0 Subsidy</span>
                          <div className="text-[10px] text-amber-700 font-medium">40% Tax Depr.</div>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openWhatsApp(record)}
                          title="Send update via WhatsApp"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDossier(record)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Dossier
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Subsidy Dossier Modal */}
      {isDossierOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-950 to-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    PM Surya Ghar Dossier
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    {selectedRecord.portal_application_no}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {selectedRecord.customer_name} &bull; {selectedRecord.system_capacity_kw} kW System
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedRecord.site_address}
                </p>
              </div>

              <button
                onClick={() => setIsDossierOpen(false)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 text-xs font-semibold">
              <button
                onClick={() => setActiveDossierTab('stepper')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  activeDossierTab === 'stepper' 
                    ? 'border-emerald-600 text-emerald-800 bg-white' 
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                1. 7-Stage Stepper & Milestones
              </button>
              <button
                onClick={() => setActiveDossierTab('docs')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  activeDossierTab === 'docs' 
                    ? 'border-emerald-600 text-emerald-800 bg-white' 
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Government Document Vault
              </button>
              <button
                onClick={() => setActiveDossierTab('whatsapp')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  activeDossierTab === 'whatsapp' 
                    ? 'border-emerald-600 text-emerald-800 bg-white' 
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Customer WhatsApp Notification
              </button>
              <button
                onClick={() => setActiveDossierTab('officer')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  activeDossierTab === 'officer' 
                    ? 'border-emerald-600 text-emerald-800 bg-white' 
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                4. DISCOM Officer & Notes
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {activeDossierTab === 'stepper' && (
                <div className="space-y-6">
                  {/* Stepper Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Update Government Milestone Stage:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {STAGES.map((s) => (
                        <div
                          key={s.step}
                          onClick={() => setEditStage(s.step)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            editStage === s.step
                              ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                              : editStage > s.step
                              ? 'border-emerald-200 bg-white text-slate-700'
                              : 'border-slate-200 bg-slate-50/50 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">
                              Stage {s.step}
                            </span>
                            {editStage > s.step ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : editStage === s.step ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                            ) : null}
                          </div>
                          <div className="font-semibold text-slate-900 text-xs mt-1">
                            {s.title}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            {s.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stage-Specific Fields */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Stage Milestone Metadata
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          DISCOM Technical Feasibility Report (TFR) No.
                        </label>
                        <input
                          type="text"
                          value={editTfrNo}
                          onChange={(e) => setEditTfrNo(e.target.value)}
                          placeholder="e.g. TFR/NKL/2026/8421"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Bi-Directional Net Meter Serial No.
                        </label>
                        <input
                          type="text"
                          value={editNetMeterNo}
                          onChange={(e) => setEditNetMeterNo(e.target.value)}
                          placeholder="e.g. L&T-GEN-98214"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Direct Benefit Transfer (DBT) Bank UTR
                        </label>
                        <input
                          type="text"
                          value={editBankUtr}
                          onChange={(e) => setEditBankUtr(e.target.value)}
                          placeholder="e.g. PMAY20261008009214SBI"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Subsidy Amount Applicable
                        </label>
                        <div className="px-3 py-2 bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 rounded-lg">
                          ₹{selectedRecord.subsidy_applicable_amount.toLocaleString('en-IN')} (Fixed CFA)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDossierTab === 'docs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Official PM Surya Ghar Document Checklist
                      </h3>
                      <p className="text-xs text-slate-500">
                        All 6 documents must be verified before submitting final commissioning report to DISCOM.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'electricity_bill', label: 'Electricity Bill (Latest 2 months)', desc: 'Proof of domestic consumer number & sanctioned load' },
                      { key: 'aadhaar_card', label: 'Aadhaar Card of Meter Holder', desc: 'Required for national portal authentication' },
                      { key: 'cancelled_cheque', label: 'Bank Cancelled Cheque / Passbook', desc: 'Aadhaar-seeded bank account for DBT payment' },
                      { key: 'roof_photo_geotagged', label: 'Geotagged Rooftop Plant Photo', desc: 'Clear photo showing installed panels and inverter' },
                      { key: 'dcr_certificate', label: 'DCR Module Manufacturer Certificate', desc: 'Proof of Indian-made solar cells and modules' },
                      { key: 'tfr_letter', label: 'DISCOM Feasibility Letter (TFR)', desc: 'Approved transformer capacity letter' },
                      { key: 'wcr_copy', label: 'Work Completion Report (WCR)', desc: 'Earthing test (<5 ohms) and wiring diagram' },
                      { key: 'commissioning_cert', label: 'Joint Inspection & Commissioning Cert', desc: 'Signed by DISCOM AEE and AB Energy engineer' },
                    ].map((doc) => {
                      const isChecked = !!editDocs[doc.key];
                      return (
                        <div
                          key={doc.key}
                          onClick={() => setEditDocs(prev => ({ ...prev, [doc.key]: !isChecked }))}
                          className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            isChecked
                              ? 'border-emerald-300 bg-emerald-50/50'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{doc.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{doc.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeDossierTab === 'whatsapp' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Automated Customer Progress Message
                    </h3>
                    <p className="text-xs text-slate-500">
                      Send an official branded WhatsApp update to keep the customer confident and informed.
                    </p>
                  </div>

                  <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap border border-slate-800 leading-relaxed">
                    {getWhatsAppMessage(selectedRecord)}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => openWhatsApp(selectedRecord)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Open WhatsApp & Send to {selectedRecord.customer_phone} ↗
                    </button>
                  </div>
                </div>
              )}

              {activeDossierTab === 'officer' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      DISCOM Officer Details & Internal Follow-Up Log
                    </h3>
                    <p className="text-xs text-slate-500">
                      Keep track of the specific Assistant Executive Engineer (AEE) in charge of this meter synchronization.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Inspecting Officer Name / Designation
                      </label>
                      <input
                        type="text"
                        value={editOfficerName}
                        onChange={(e) => setEditOfficerName(e.target.value)}
                        placeholder="e.g. Er. S. Selvakumar, AEE/TANGEDCO"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Inspecting Officer Mobile Number
                      </label>
                      <input
                        type="text"
                        value={editOfficerPhone}
                        onChange={(e) => setEditOfficerPhone(e.target.value)}
                        placeholder="e.g. +91 94433 12456"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block text-slate-600 font-semibold mb-1">
                      Internal Office Notes & Follow-Up Log
                    </label>
                    <textarea
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="e.g. Transformer load test completed. Follow-up with section office on Monday."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <a
                href="https://pmsuryaghar.gov.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Application on National Portal ↗
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDossierOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDossierChanges}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save & Update Dossier
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
