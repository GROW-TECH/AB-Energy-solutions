import { Request, Response } from 'express';
import { pool } from '../db.js';
import { formatSurvey } from './surveys.controller.js';

export const getBootstrapData = async (req: Request, res: Response) => {
  try {
    // 1. Enforce Server-Side Authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to access CRM bootstrap data.',
        code: 'AUTH_REQUIRED',
      });
    }

    const { role, customerId } = req.user;

    // 2. Customer Isolation: If authenticated as Customer, return ONLY their own data
    if (role === 'Customer') {
      const activeCustId = customerId || 'CUST-2026-001';

      const [customers]: any = await pool.query(
        'SELECT id, name, email, phone, alternate_phone, address, city, state, pincode, consumer_number_discom, discom_name, gstin, total_system_kw, total_order_value, paid_amount, balance_amount, status, created_at FROM customers WHERE id = ?',
        [activeCustId]
      );

      const [projects]: any = await pool.query(
        'SELECT * FROM projects WHERE customer_id = ? ORDER BY created_at DESC',
        [activeCustId]
      );

      const [invoices]: any = await pool.query(
        'SELECT * FROM invoices WHERE customer_id = ? ORDER BY issue_date DESC',
        [activeCustId]
      );

      const [payments]: any = await pool.query(
        'SELECT * FROM payments WHERE customer_id = ? ORDER BY payment_date DESC',
        [activeCustId]
      );

      const [warranties]: any = await pool.query(
        'SELECT * FROM warranties WHERE customer_id = ?',
        [activeCustId]
      );

      const [amcs]: any = await pool.query(
        'SELECT * FROM amc_contracts WHERE customer_id = ?',
        [activeCustId]
      );

      const [tickets]: any = await pool.query(
        'SELECT * FROM service_tickets WHERE customer_id = ? ORDER BY created_at DESC',
        [activeCustId]
      );

      // Return public product specifications without supplier names or wholesale unit costs
      const [products]: any = await pool.query(
        'SELECT id, sku, name, category, brand, specifications, unit, 0 as current_stock, 0 as reserved_stock, 0 as available_stock, 0 as min_threshold, 0 as unit_cost, "" as supplier_name FROM inventory_products ORDER BY category, name'
      );

      return res.json({
        success: true,
        data: {
          employees: [],
          leads: [],
          customers: customers.map((c: any) => formatCustomer(c)),
          surveys: [],
          quotations: [],
          projects: projects.map((p: any) => formatProject(p)),
          products: products.map((pr: any) => formatProduct(pr)),
          invoices: invoices.map((i: any) => formatInvoice(i)),
          payments: payments.map((py: any) => formatPayment(py)),
          warranties: warranties.map((w: any) => formatWarranty(w)),
          amcs: amcs.map((a: any) => formatAmc(a)),
          tickets: tickets.map((t: any) => formatTicket(t)),
          followUps: [],
          suppliers: [],
          expenses: [],
          automationRules: [],
        },
      });
    }

    // 3. Operational Staff & Super Admin Data Projection
    // Exclude password hashes and sensitive credential columns explicitly
    const [employees]: any = await pool.query(
      'SELECT id, name, email, phone, role, department, avatar, active_leads_count, completed_projects_count, location FROM employees'
    );
    const [leads]: any = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    const [customers]: any = await pool.query(
      'SELECT id, name, email, phone, alternate_phone, address, city, state, pincode, consumer_number_discom, discom_name, gstin, converted_from_lead_id, total_system_kw, total_order_value, paid_amount, balance_amount, status, created_at FROM customers ORDER BY created_at DESC'
    );
    let surveysQuery = 'SELECT * FROM site_surveys';
    const surveysParams: any[] = [];
    if (role === 'Survey Engineer') {
      const empId = req.user.employeeId || req.user.id || req.user.userId;
      const userName = (req.user.name || req.user.username || '').trim();
      const firstPart = userName.split(' ')[0] || userName;
      surveysQuery += ' WHERE (engineer_id = ? OR engineer_id = ? OR engineer_name = ? OR engineer_name LIKE ?)';
      surveysParams.push(empId, req.user.userId || req.user.id, userName, `%${firstPart}%`);
    }
    surveysQuery += ' ORDER BY scheduled_date DESC';
    const [surveys]: any = await pool.query(surveysQuery, surveysParams);
    const [surveyPhotos]: any = await pool.query('SELECT * FROM survey_photos ORDER BY uploaded_at ASC');
    const [surveyHistory]: any = await pool.query('SELECT * FROM survey_review_history ORDER BY created_at ASC');

    const photosBySurvey: Record<string, any[]> = {};
    for (const p of surveyPhotos) {
      if (!photosBySurvey[p.survey_id]) photosBySurvey[p.survey_id] = [];
      photosBySurvey[p.survey_id].push(p);
    }

    const historyBySurvey: Record<string, any[]> = {};
    for (const h of surveyHistory) {
      if (!historyBySurvey[h.survey_id]) historyBySurvey[h.survey_id] = [];
      historyBySurvey[h.survey_id].push(h);
    }
    const [quotations]: any = await pool.query('SELECT * FROM quotations ORDER BY created_at DESC');
    const [projects]: any = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    const [products]: any = await pool.query('SELECT * FROM inventory_products ORDER BY category, name');
    const [invoices]: any = await pool.query('SELECT * FROM invoices ORDER BY issue_date DESC');
    const [payments]: any = await pool.query('SELECT * FROM payments ORDER BY payment_date DESC');
    const [warranties]: any = await pool.query('SELECT * FROM warranties');
    const [amcs]: any = await pool.query('SELECT * FROM amc_contracts');
    const [tickets]: any = await pool.query('SELECT * FROM service_tickets ORDER BY created_at DESC');
    const [followUps]: any = await pool.query('SELECT * FROM follow_ups ORDER BY due_date ASC');
    const [suppliers]: any = await pool.query('SELECT * FROM suppliers');
    const [expenses]: any = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    const [custUsers]: any = await pool.query(
      "SELECT customer_id, username FROM user_accounts WHERE role = 'Customer' AND customer_id IS NOT NULL AND is_active = TRUE"
    );
    const custUserMap: Record<string, string> = {};
    for (const u of (custUsers || [])) {
      if (u.customer_id) custUserMap[u.customer_id] = u.username;
    }

    res.json({
      success: true,
      data: {
        employees: employees.map((e: any) => ({
          id: e.id,
          name: e.name,
          email: e.email,
          phone: e.phone,
          role: e.role,
          department: e.department,
          avatar: e.avatar,
          activeLeadsCount: e.active_leads_count,
          completedProjectsCount: e.completed_projects_count,
          location: e.location,
        })),
        leads: leads.map((l: any) => ({
          id: l.id,
          name: l.name || '',
          email: l.email || '',
          phone: l.phone || '',
          city: l.city || '',
          state: l.state || 'Tamil Nadu',
          address: l.address || '',
          pincode: l.pincode || '',
          source: l.source || 'Direct',
          status: l.status || 'New',
          priority: l.priority || 'Medium',
          recommendedPriority: l.recommended_priority,
          priorityOverrideReason: l.priority_override_reason,
          buyingIntent: l.buying_intent,
          assignedToId: l.assigned_to_id || '',
          assignedToName: l.assigned_to_name || '',
          monthlyBill: Number(l.monthly_bill) || 0,
          sanctionLoad: Number(l.sanction_load) || 0,
          roofAreaSqFt: Number(l.roof_area_sqft) || 0,
          roofType: l.roof_type,
          connectionSpace: l.connection_space || 'Single Space',
          customerType: l.customer_type || 'Residential',
          systemType: l.system_type || 'On-Grid',
          recommendedKw: Number(l.recommended_kw) || 0,
          estimatedBudget: Number(l.estimated_budget) || 0,
          consumerNumberDiscom: l.consumer_number_discom || l.eb_service_number || '',
          ebServiceNumber: l.eb_service_number || l.consumer_number_discom || '',
          surveyId: l.survey_id || undefined,
          quotationId: l.quotation_id || undefined,
          notes: l.notes || '',
          createdAt: l.created_at,
          updatedAt: l.updated_at,
          lastContactedAt: l.last_contacted_at,
          lastModifiedBy: l.last_modified_by || undefined,
          lastModifiedRole: l.last_modified_role || undefined,
          lastModifiedAt: l.last_modified_at || undefined,
          editHistory: typeof l.edit_history === 'string' ? JSON.parse(l.edit_history) : (l.edit_history || []),
        })),
        customers: customers.map((c: any) => formatCustomer(c, role, custUserMap[c.id])),
        surveys: surveys.map((s: any) => formatSurvey(s, photosBySurvey[s.id] || [], historyBySurvey[s.id] || [])),
        quotations: quotations.map((q: any) => ({
          id: q.id,
          quotationNumber: q.quotation_number,
          leadId: q.lead_id,
          leadName: q.lead_name,
          customerPhone: q.customer_phone,
          customerAddress: q.customer_address,
          systemCapacityKw: Number(q.system_capacity_kw) || 0,
          currentVersion: Number(q.current_version) || 1,
          versions: typeof q.versions === 'string' ? JSON.parse(q.versions) : (q.versions || []),
          status: q.status,
          priority: q.priority || 'Medium',
          sentDate: q.sent_date,
          validUntil: q.valid_until,
          salespersonId: q.salesperson_id,
          salespersonName: q.salesperson_name,
          totalAmount: role === 'Installation Team' ? 0 : (Number(q.total_amount) || 0),
          proposalType: q.proposal_type || 'Final_Technical',
          packageTier: q.package_tier || 'Standard',
          approvalStatus: q.approval_status || 'Approved',
          discountAmount: Number(q.discount_amount) || 0,
          discountApprovedBy: q.discount_approved_by,
          subsidyAmount: Number(q.subsidy_amount) || 0,
          taxableAmount: Number(q.taxable_amount) || 0,
          gstRate: Number(q.gst_rate) || 13.80,
          gstAmount: Number(q.gst_amount) || 0,
          pdfUrl: q.pdf_url,
          convertedToProjectId: q.converted_to_project_id,
          surveyId: q.survey_id,
          materialsPurchasedConfirmed: Boolean(q.materials_purchased_confirmed),
          materialsPurchasedAt: q.materials_purchased_at || undefined,
          materialsPurchasedBy: q.materials_purchased_by || undefined,
          createdAt: q.created_at,
          lastModifiedBy: q.last_modified_by || undefined,
          lastModifiedRole: q.last_modified_role || undefined,
          lastModifiedAt: q.last_modified_at || undefined,
          editHistory: typeof q.edit_history === 'string' ? JSON.parse(q.edit_history) : (q.edit_history || []),
        })),
        projects: projects.map((p: any) => formatProject(p, role)),
        products: products.map((pr: any) => formatProduct(pr, role)),
        invoices: role === 'Installation Team' ? [] : invoices.map((i: any) => formatInvoice(i)),
        payments: role === 'Installation Team' ? [] : payments.map((py: any) => formatPayment(py)),
        warranties: warranties.map((w: any) => formatWarranty(w)),
        amcs: amcs.map((a: any) => formatAmc(a)),
        tickets: tickets.map((t: any) => formatTicket(t)),
        followUps: followUps.map((f: any) => ({
          id: f.id,
          leadId: f.lead_id,
          leadName: f.lead_name,
          customerId: f.customer_id,
          customerName: f.customer_name,
          quotationId: f.quotation_id,
          title: f.title,
          dueDate: f.due_date,
          dueTime: f.due_time,
          type: f.type,
          status: f.status,
          priority: f.priority,
          assignedToId: f.assigned_to_id,
          assignedToName: f.assigned_to_name,
          notes: f.notes || '',
          completedAt: f.completed_at,
          isStruckOut: Boolean(f.is_struck_out),
          outcome: f.outcome || '',
          createdAt: f.created_at || '',
        })),
        suppliers: suppliers.map((su: any) => ({
          id: su.id,
          name: su.name,
          contactPerson: su.contact_person,
          email: su.email,
          phone: su.phone,
          category: su.category,
          city: su.city,
          address: su.address,
          gstin: su.gstin,
          paymentTerms: su.payment_terms,
          rating: Number(su.rating) || 4.5,
        })),
        expenses: role === 'Installation Team' ? [] : expenses.map((ex: any) => ({
          id: ex.id,
          projectId: ex.project_id,
          category: ex.category,
          title: ex.title,
          totalAmount: Number(ex.total_amount) || 0,
          paymentMode: ex.payment_mode,
          receiptUrl: ex.receipt_url,
          recordedBy: ex.recorded_by,
          date: ex.date,
          notes: ex.notes || '',
        })),
        automationRules: [],
      },
    });
  } catch (error: any) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ success: false, error: 'Failed to load bootstrap data.' });
  }
};

function formatCustomer(c: any, role?: string, portalUsername?: string | null) {
  const isInstallation = role === 'Installation Team';
  return {
    id: c.id,
    name: c.name || '',
    email: c.email || '',
    phone: c.phone || '',
    alternatePhone: c.alternate_phone || '',
    address: c.address || '',
    city: c.city || '',
    state: c.state || '',
    pincode: c.pincode || '',
    consumerNumberDiscom: c.consumer_number_discom || '',
    discomName: c.discom_name || '',
    gstin: c.gstin || '',
    convertedFromLeadId: c.converted_from_lead_id || '',
    totalSystemKw: Number(c.total_system_kw) || 0,
    totalOrderValue: isInstallation ? 0 : (Number(c.total_order_value) || 0),
    paidAmount: isInstallation ? 0 : (Number(c.paid_amount) || 0),
    balanceAmount: isInstallation ? 0 : (Number(c.balance_amount) || 0),
    status: c.status || 'Active',
    createdAt: c.created_at || '',
    portalUsername: portalUsername || c.portal_username || null,
  };
}

function formatProject(p: any, role?: string) {
  const isInstallation = role === 'Installation Team';
  return {
    id: p.id,
    customerId: p.customer_id,
    customerName: p.customer_name,
    customerPhone: p.customer_phone,
    customerAddress: p.customer_address,
    quotationId: p.quotation_id,
    capacityKw: Number(p.capacity_kw) || 0,
    totalAmount: isInstallation ? 0 : (Number(p.total_amount) || 0),
    stage: p.stage,
    startDate: p.start_date,
    targetCompletionDate: p.target_completion_date,
    projectManagerId: p.project_manager_id,
    projectManagerName: p.project_manager_name,
    installationLeadId: p.installation_lead_id,
    installationLeadName: p.installation_lead_name,
    scheduled_installation_date: p.scheduled_installation_date || p.target_completion_date,
    assigned_crew_members: typeof p.assigned_crew_members === 'string'
      ? (() => { try { return JSON.parse(p.assigned_crew_members); } catch { return []; } })()
      : (p.assigned_crew_members || []),
    checklist: typeof p.checklist === 'string' ? JSON.parse(p.checklist) : (p.checklist || {}),
    tasks: typeof p.tasks === 'string' ? JSON.parse(p.tasks) : (p.tasks || []),
    inventoryReserved: Boolean(p.inventory_reserved),
    materialShortageFlag: Boolean(p.material_shortage_flag),
    shortageDetails: p.shortage_details,
    commissioningDate: p.commissioning_date,
    netMeterInstalledDate: p.net_meter_installed_date,
    warrantyActivated: Boolean(p.warranty_activated),
    amcInitiated: Boolean(p.amc_initiated),
    discomSanctionNumber: p.discom_sanction_number,
    notes: p.notes || '',
    lastModifiedBy: p.last_modified_by || undefined,
    lastModifiedRole: p.last_modified_role || undefined,
    lastModifiedAt: p.last_modified_at || undefined,
    editHistory: typeof p.edit_history === 'string' ? JSON.parse(p.edit_history) : (p.edit_history || []),

    // Advance Payment Gate
    advancePaymentReceived: Boolean(p.advance_payment_received),
    advancePaymentAmount: p.advance_payment_amount ? Number(p.advance_payment_amount) : undefined,
    advancePaymentMode: p.advance_payment_mode || undefined,
    advancePaymentRef: p.advance_payment_ref || undefined,
    advancePaymentDate: p.advance_payment_date || undefined,
    advancePaymentNotes: p.advance_payment_notes || undefined,

    // DISCOM Net Metering Paperwork
    discomNetMeteringFee: p.discom_net_metering_fee ? Number(p.discom_net_metering_fee) : undefined,
    discomFeeReceiptUrl: p.discom_fee_receipt_url || undefined,
    discomAgreementSigned: Boolean(p.discom_agreement_signed),
    discomAgreementDocUrl: p.discom_agreement_doc_url || undefined,

    // Installation Target Days Commitment & 4-Step Coordinated Workflow
    installationTargetDays: p.installation_target_days ? Number(p.installation_target_days) : 3,
    installationDurationDays: p.installation_duration_days ? Number(p.installation_duration_days) : 2,
    materialArrivedOnSite: Boolean(p.material_arrived_on_site || p.checklist?.materialArrivedOnSite),
    materialArrivedConfirmedAt: p.material_arrived_confirmed_at || p.checklist?.materialArrivedConfirmedAt || undefined,
    materialArrivedConfirmedBy: p.material_arrived_confirmed_by || p.checklist?.materialArrivedConfirmedBy || undefined,
    siteSurveyVerified: Boolean(p.site_survey_verified || p.checklist?.siteSurveyVerified),
    siteSurveyVerifiedAt: p.site_survey_verified_at || p.checklist?.siteSurveyVerifiedAt || undefined,
    siteSurveyVerifiedBy: p.site_survey_verified_by || p.checklist?.siteSurveyVerifiedBy || undefined,
    attendancePhotoUrl: p.attendance_photo_url || p.checklist?.attendancePhotoUrl || undefined,
    arrivedMaterialIds: (typeof p.checklist === 'string' ? (() => { try { return JSON.parse(p.checklist)?.arrivedMaterialIds; } catch { return []; } })() : p.checklist?.arrivedMaterialIds) || [],

    // Post-Installation Geotagged Photos & 20-Sec Live Video Gate
    postInstallPhotos: typeof p.post_install_photos === 'string' ? (() => { try { return JSON.parse(p.post_install_photos); } catch { return undefined; } })() : (p.post_install_photos || undefined),
    commissioningVideoUrl: p.commissioning_video_url || undefined,
    pmClearanceStatus: p.pm_clearance_status || 'Pending',
    pmClearedBy: p.pm_cleared_by || undefined,
    pmClearedAt: p.pm_cleared_at || undefined,

    // DISCOM Grid Synchronization & AMC
    ebInspectionCleared: Boolean(p.eb_inspection_cleared),
    solarMeterFixed: Boolean(p.solar_meter_fixed),
    solarMeterInitialReading: p.solar_meter_initial_reading ? Number(p.solar_meter_initial_reading) : undefined,
    gridLiveDate: p.grid_live_date || undefined,
    amcWarrantyYears: p.amc_warranty_years ? Number(p.amc_warranty_years) : 5,
  };
}

function formatProduct(pr: any, role?: string) {
  const isInstallation = role === 'Installation Team';
  return {
    id: pr.id,
    sku: pr.sku,
    name: pr.name,
    category: pr.category,
    brand: pr.brand,
    specifications: pr.specifications,
    unit: pr.unit,
    currentStock: Number(pr.current_stock) || 0,
    reservedStock: Number(pr.reserved_stock) || 0,
    availableStock: Number(pr.available_stock) || 0,
    minThreshold: Number(pr.min_threshold) || 0,
    unitCost: isInstallation ? 0 : (Number(pr.unit_cost) || 0),
    supplierName: pr.supplier_name,
  };
}

function formatInvoice(i: any) {
  return {
    id: i.id,
    invoiceNumber: i.invoice_number,
    projectId: i.project_id,
    customerId: i.customer_id,
    customerName: i.customer_name,
    customerPhone: i.customer_phone,
    customerGstin: i.customer_gstin,
    issueDate: i.issue_date,
    dueDate: i.due_date,
    items: typeof i.items === 'string' ? JSON.parse(i.items) : (i.items || []),
    subtotal: Number(i.subtotal) || 0,
    cgst: Number(i.cgst) || 0,
    sgst: Number(i.sgst) || 0,
    igst: Number(i.igst) || 0,
    totalAmount: Number(i.total_amount) || 0,
    paidAmount: Number(i.paid_amount) || 0,
    balanceDue: Number(i.balance_due) || 0,
    status: i.status,
  };
}

function formatPayment(py: any) {
  return {
    id: py.id,
    paymentNumber: py.payment_number,
    invoiceId: py.invoice_id,
    projectId: py.project_id,
    customerId: py.customer_id,
    customerName: py.customer_name,
    amount: Number(py.amount) || 0,
    paymentDate: py.payment_date,
    paymentMode: py.payment_mode,
    transactionReference: py.transaction_reference,
    bankName: py.bank_name,
    status: py.status,
    recordedBy: py.recorded_by,
    isAdvance: Boolean(py.is_advance),
    quotationId: py.quotation_id || undefined,
    reconciled: Boolean(py.reconciled),
    reconciledAt: py.reconciled_at || undefined,
    reconciledBy: py.reconciled_by || undefined,
  };
}

function formatWarranty(w: any) {
  return {
    id: w.id,
    projectId: w.project_id,
    customerId: w.customer_id,
    customerName: w.customer_name,
    equipmentType: w.equipment_type,
    makeModel: w.make_model,
    serialNumber: w.serial_number,
    warrantyPeriodYears: Number(w.warranty_period_years) || 10,
    startDate: w.start_date,
    endDate: w.end_date,
    daysRemaining: Number(w.days_remaining) || 0,
    status: w.status,
  };
}

function formatAmc(a: any) {
  return {
    id: a.id,
    customerId: a.customer_id,
    customerName: a.customer_name,
    customerPhone: a.customer_phone,
    customerAddress: a.customer_address,
    projectId: a.project_id,
    capacityKw: Number(a.capacity_kw) || 0,
    planName: a.plan_name,
    annualPrice: Number(a.annual_price) || 0,
    visitsPerYear: Number(a.visits_per_year) || 4,
    completedVisits: Number(a.completed_visits) || 0,
    startDate: a.start_date,
    endDate: a.end_date,
    status: a.status,
    nextScheduledVisit: a.next_scheduled_visit,
  };
}

function formatTicket(t: any) {
  return {
    id: t.id,
    ticketNumber: t.ticket_number,
    customerId: t.customer_id,
    customerName: t.customer_name,
    customerPhone: t.phone,
    customerAddress: t.customer_address,
    projectId: t.project_id,
    issueCategory: t.issue_category,
    severity: t.severity,
    status: t.status,
    technicianId: t.technician_id,
    technicianName: t.technician_name,
    description: t.description,
    createdAt: t.created_at,
    scheduledDate: t.scheduled_date,
    resolvedAt: t.resolved_at,
    resolutionNotes: t.resolution_notes,
    customerFeedbackScore: Number(t.customer_feedback_score) || 5,
  };
}
