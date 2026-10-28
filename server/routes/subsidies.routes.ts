import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const subsidiesRouter = Router();

export interface SubsidyRecord {
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
  discom_name: string; // e.g. TANGEDCO, BESCOM, TSSPDCL
  discom_section_office?: string;
  consumer_number: string;
  sanctioned_load_kw: number;
  system_capacity_kw: number;
  subsidy_applicable_amount: number; // e.g. 78000
  dcr_modules_used: boolean;
  panel_make_and_model?: string;
  inverter_make_and_model?: string;
  
  // Government Portal Info
  portal_application_no: string;
  application_submission_date: string;
  current_stage: number; // 1 to 7
  current_stage_name: string;
  stage_status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  days_in_current_stage: number;
  is_delayed: boolean;
  
  // Stage Milestone Details
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
  
  // Documents
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

// Initial realistic subsidy records matching existing projects
const initialSubsidies: SubsidyRecord[] = [
  {
    id: 'SUB-2026-001',
    project_id: 'PROJECT-2026-023',
    project_number: 'PRJ-2026-023',
    customer_name: 'Vikrant Deshpande',
    customer_phone: '+91 98450 12345',
    customer_email: 'vikrant.deshpande@example.com',
    customer_type: 'residential',
    is_eligible: true,
    site_address: '142, Anna Nagar West, Namakkal, Tamil Nadu - 637001',
    discom_name: 'TANGEDCO',
    discom_section_office: 'Namakkal Town AEE Office',
    consumer_number: '04-122-005-981',
    sanctioned_load_kw: 25,
    system_capacity_kw: 20,
    subsidy_applicable_amount: 78000, // Capped at 78,000 max for domestic
    dcr_modules_used: true,
    panel_make_and_model: 'Tata Power Solar 545W Mono PERC (DCR)',
    inverter_make_and_model: 'Sungrow 20kW On-Grid Inverter',
    portal_application_no: 'PMS-TN-2026-98124',
    application_submission_date: '2026-09-15',
    current_stage: 5,
    current_stage_name: 'DISCOM Joint Inspection Scheduled',
    stage_status: 'in_progress',
    days_in_current_stage: 4,
    is_delayed: false,
    tfr_number: 'TFR/NKL/2026/8421',
    tfr_approval_date: '2026-09-28',
    vendor_selected_date: '2026-10-02',
    wcr_submission_date: '2026-10-18',
    joint_inspection_date: '2026-10-29',
    inspecting_officer_name: 'Er. S. Selvakumar, AEE/TANGEDCO',
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
    notes: 'Structure and inverter installed with DCR modules. TANGEDCO AEE scheduled inspection for Thursday 11 AM.',
    last_updated: '2026-10-25'
  },
  {
    id: 'SUB-2026-002',
    project_id: 'PROJECT-2026-021',
    project_number: 'PRJ-2026-021',
    customer_name: 'K. Balasubramaniam',
    customer_phone: '+91 94432 87654',
    customer_email: 'bala.kumar@example.com',
    customer_type: 'residential',
    is_eligible: true,
    site_address: '88, Gandhi Road, Paramathi Velur, Namakkal - 637207',
    discom_name: 'TANGEDCO',
    discom_section_office: 'Paramathi Distribution Section',
    consumer_number: '04-188-012-340',
    sanctioned_load_kw: 5,
    system_capacity_kw: 3.3,
    subsidy_applicable_amount: 78000,
    dcr_modules_used: true,
    panel_make_and_model: 'Waaree 550W Bi-facial DCR',
    inverter_make_and_model: 'Growatt 3.3kW Single Phase',
    portal_application_no: 'PMS-TN-2026-77319',
    application_submission_date: '2026-08-10',
    current_stage: 7,
    current_stage_name: 'DBT Subsidy Disbursed to Bank',
    stage_status: 'completed',
    days_in_current_stage: 0,
    is_delayed: false,
    tfr_number: 'TFR/PMV/2026/3310',
    tfr_approval_date: '2026-08-22',
    vendor_selected_date: '2026-08-25',
    wcr_submission_date: '2026-09-08',
    joint_inspection_date: '2026-09-14',
    inspecting_officer_name: 'Er. R. Murugesan',
    inspecting_officer_phone: '+91 94430 98123',
    net_meter_number: 'L&T-GEN-98214-2026',
    net_meter_install_date: '2026-09-16',
    commissioning_certificate_date: '2026-09-18',
    dbt_disbursal_amount: 78000,
    dbt_bank_utr: 'PMAY20261008009214SBI',
    dbt_credit_date: '2026-10-08',
    documents: {
      electricity_bill: true,
      aadhaar_card: true,
      cancelled_cheque: true,
      roof_photo_geotagged: true,
      dcr_certificate: true,
      tfr_letter: true,
      wcr_copy: true,
      net_meter_test_report: true,
      commissioning_cert: true,
    },
    notes: 'Subsidy of ₹78,000 credited to customer State Bank of India account. Project fully closed.',
    last_updated: '2026-10-08'
  },
  {
    id: 'SUB-2026-003',
    project_id: 'PROJECT-2026-024',
    project_number: 'PRJ-2026-024',
    customer_name: 'S. Jayachandran',
    customer_phone: '+91 97890 55432',
    customer_email: 'jayachandran.s@example.com',
    customer_type: 'residential',
    is_eligible: true,
    site_address: '12, Periyar Street, Rasipuram, Namakkal - 637408',
    discom_name: 'TANGEDCO',
    discom_section_office: 'Rasipuram East AEE',
    consumer_number: '04-099-001-442',
    sanctioned_load_kw: 6,
    system_capacity_kw: 5,
    subsidy_applicable_amount: 78000,
    dcr_modules_used: true,
    panel_make_and_model: 'Adani Solar 540W Mono DCR',
    inverter_make_and_model: 'Solis 5kW Dual MPPT',
    portal_application_no: 'PMS-TN-2026-102941',
    application_submission_date: '2026-10-05',
    current_stage: 2,
    current_stage_name: 'DISCOM Feasibility (TFR) Pending',
    stage_status: 'in_progress',
    days_in_current_stage: 22,
    is_delayed: true, // Over 15 days threshold!
    documents: {
      electricity_bill: true,
      aadhaar_card: true,
      cancelled_cheque: true,
      roof_photo_geotagged: true,
      dcr_certificate: false,
      tfr_letter: false,
      wcr_copy: false,
      net_meter_test_report: false,
      commissioning_cert: false,
    },
    notes: 'ALERT: TFR pending for 22 days at Rasipuram section office due to transformer load inspection delay. Need urgent follow-up.',
    last_updated: '2026-10-26'
  },
  {
    id: 'SUB-2026-004',
    project_id: 'PROJECT-2026-025',
    project_number: 'PRJ-2026-025',
    customer_name: 'R. Kaliappan Poultry Farm',
    customer_phone: '+91 98427 66110',
    customer_type: 'commercial',
    is_eligible: false,
    ineligibility_reason: 'Commercial / Industrial connection (HT/LT Tariff IIIB). Central PM Surya Ghar subsidy applies strictly to Domestic (Tariff IA) connections.',
    site_address: 'SF No. 240, Mohanur Road, Valayappatti, Namakkal - 637020',
    discom_name: 'TANGEDCO',
    discom_section_office: 'Mohanur Rural',
    consumer_number: '04-045-008-112',
    sanctioned_load_kw: 60,
    system_capacity_kw: 50,
    subsidy_applicable_amount: 0,
    dcr_modules_used: false,
    panel_make_and_model: 'Jinko Solar 580W TOPCon (Non-DCR Tier 1)',
    inverter_make_and_model: 'Sungrow 50kW Commercial',
    portal_application_no: 'N/A (Commercial Solar Project)',
    application_submission_date: '2026-10-12',
    current_stage: 0,
    current_stage_name: 'Not Eligible (Commercial Project)',
    stage_status: 'completed',
    days_in_current_stage: 0,
    is_delayed: false,
    documents: {
      electricity_bill: true,
      aadhaar_card: false,
      cancelled_cheque: false,
      roof_photo_geotagged: true,
      dcr_certificate: false,
      tfr_letter: true,
      wcr_copy: false,
      net_meter_test_report: false,
      commissioning_cert: false,
    },
    notes: 'Zero government subsidy applicable. Customer claimed 40% Accelerated Depreciation tax deduction under Section 32 of Income Tax Act.',
    last_updated: '2026-10-20'
  }
];

const DATA_FILE = path.resolve(process.cwd(), 'data', 'subsidies.json');

function loadSubsidies(): SubsidyRecord[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading subsidies.json, using fallback initial data:', err);
  }
  return initialSubsidies;
}

function saveSubsidies(records: SubsidyRecord[]): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing subsidies.json:', err);
  }
}

// 1. Get all subsidies
subsidiesRouter.get('/', (_req: Request, res: Response) => {
  const data = loadSubsidies();
  const activeEligible = data.filter(d => d.is_eligible);
  const totalPipelineSubsidy = activeEligible.reduce((acc, curr) => acc + (curr.subsidy_applicable_amount || 0), 0);
  const totalDisbursed = data.filter(d => d.current_stage === 7).reduce((acc, curr) => acc + (curr.dbt_disbursal_amount || curr.subsidy_applicable_amount || 0), 0);
  const pendingTfrCount = data.filter(d => d.current_stage === 2 && d.is_eligible).length;
  const pendingMeterCount = data.filter(d => (d.current_stage === 5 || d.current_stage === 6) && d.is_eligible).length;
  const delayedCount = data.filter(d => d.is_delayed && d.is_eligible).length;

  return res.json({
    success: true,
    subsidies: data,
    summary: {
      total_records: data.length,
      eligible_records: activeEligible.length,
      total_pipeline_subsidy: totalPipelineSubsidy,
      total_disbursed_subsidy: totalDisbursed,
      pending_tfr_count: pendingTfrCount,
      pending_net_meter_count: pendingMeterCount,
      delayed_bottlenecks_count: delayedCount,
    }
  });
});

// 2. Get single subsidy by Project ID
subsidiesRouter.get('/project/:projectId', (req: Request, res: Response) => {
  const { projectId } = req.params;
  const data = loadSubsidies();
  const record = data.find(d => d.project_id === projectId || d.id === projectId);
  if (!record) {
    return res.status(404).json({ success: false, message: 'Subsidy record not found for this project' });
  }
  return res.json({ success: true, subsidy: record });
});

// 3. Update subsidy stage or details
subsidiesRouter.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const data = loadSubsidies();
  const index = data.findIndex(d => d.id === id || d.project_id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Subsidy record not found' });
  }

  const updatedRecord: SubsidyRecord = {
    ...data[index],
    ...updates,
    last_updated: new Date().toISOString().split('T')[0]
  };

  data[index] = updatedRecord;
  saveSubsidies(data);

  return res.json({
    success: true,
    message: 'Subsidy record updated successfully',
    subsidy: updatedRecord
  });
});

// 4. Create new subsidy tracking record
subsidiesRouter.post('/', (req: Request, res: Response) => {
  const payload = req.body;
  const data = loadSubsidies();

  const capacityKw = Number(payload.system_capacity_kw) || 3;
  const isResidential = payload.customer_type === 'residential';
  
  // Auto compute PM Surya Ghar subsidy
  let subsidyAmount = 0;
  if (isResidential) {
    if (capacityKw <= 1) subsidyAmount = 30000;
    else if (capacityKw <= 2) subsidyAmount = 60000;
    else subsidyAmount = 78000; // Cap at 78,000 for 3kW+
  }

  const newRecord: SubsidyRecord = {
    id: `SUB-${new Date().getFullYear()}-${String(data.length + 1).padStart(3, '0')}`,
    project_id: payload.project_id || `PROJECT-${Date.now()}`,
    project_number: payload.project_number || 'PRJ-NEW',
    customer_name: payload.customer_name || 'Customer Name',
    customer_phone: payload.customer_phone || '',
    customer_email: payload.customer_email || '',
    customer_type: payload.customer_type || 'residential',
    is_eligible: isResidential,
    ineligibility_reason: isResidential ? undefined : 'Commercial/Industrial tariff not eligible for central residential subsidy.',
    site_address: payload.site_address || '',
    discom_name: payload.discom_name || 'TANGEDCO',
    discom_section_office: payload.discom_section_office || '',
    consumer_number: payload.consumer_number || '',
    sanctioned_load_kw: Number(payload.sanctioned_load_kw) || capacityKw,
    system_capacity_kw: capacityKw,
    subsidy_applicable_amount: subsidyAmount,
    dcr_modules_used: payload.dcr_modules_used ?? true,
    panel_make_and_model: payload.panel_make_and_model || '',
    inverter_make_and_model: payload.inverter_make_and_model || '',
    portal_application_no: payload.portal_application_no || `PMS-TN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
    application_submission_date: payload.application_submission_date || new Date().toISOString().split('T')[0],
    current_stage: isResidential ? 1 : 0,
    current_stage_name: isResidential ? 'National Portal Registration Submitted' : 'Not Eligible (Commercial)',
    stage_status: 'in_progress',
    days_in_current_stage: 1,
    is_delayed: false,
    documents: payload.documents || {
      electricity_bill: true,
      aadhaar_card: true,
      cancelled_cheque: false,
      roof_photo_geotagged: false,
      dcr_certificate: false,
      tfr_letter: false,
      wcr_copy: false,
      net_meter_test_report: false,
      commissioning_cert: false,
    },
    notes: payload.notes || 'Application created.',
    last_updated: new Date().toISOString().split('T')[0]
  };

  data.unshift(newRecord);
  saveSubsidies(data);

  return res.status(201).json({
    success: true,
    message: 'Subsidy tracking record created successfully',
    subsidy: newRecord
  });
});
