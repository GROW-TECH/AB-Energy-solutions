import type { Request, Response } from 'express';
import { pool } from '../db.ts';
import { calculateQuotation } from '../services/quotation-engine.ts';
import type { QuotationCalculationInput } from '../services/quotation-engine.ts';
import { generateProposalPdf } from '../services/pdf-generator.ts';
import type { ProposalPdfData } from '../services/pdf-generator.ts';

/**
 * Normalizes a quotation database row into the client Quotation object
 */
export function formatQuotation(q: any) {
  if (!q) return null;
  return {
    ...q,
    quotationNumber: q.quotation_number,
    leadId: q.lead_id,
    leadName: q.lead_name,
    customerPhone: q.customer_phone,
    customerAddress: q.customer_address,
    systemCapacityKw: Number(q.system_capacity_kw) || 0,
    currentVersion: Number(q.current_version) || 1,
    versions: typeof q.versions === 'string' ? JSON.parse(q.versions) : (q.versions || []),
    status: q.status,
    sentDate: q.sent_date,
    validUntil: q.valid_until,
    salespersonId: q.salesperson_id,
    salespersonName: q.salesperson_name,
    totalAmount: Number(q.total_amount) || 0,
    proposalType: q.proposal_type || 'Final_Technical',
    packageTier: q.package_tier || 'Standard',
    approvalStatus: q.approval_status || 'Approved',
    discountAmount: Number(q.discount_amount) || 0,
    discountApprovedBy: q.discount_approved_by,
    subsidyAmount: Number(q.subsidy_amount) || 0,
    taxableAmount: Number(q.taxable_amount) || 0,
    gstRate: Number(q.gst_rate) || 0,
    gstAmount: Number(q.gst_amount) || 0,
    taxMode: q.tax_mode || 'ITEMIZED',
    totalCgst: Number(q.total_cgst) || 0,
    totalSgst: Number(q.total_sgst) || 0,
    totalIgst: Number(q.total_igst) || 0,
    amountInWords: q.amount_in_words || '',
    surveyId: q.survey_id,
    pdfUrl: q.pdf_url,
    convertedToProjectId: q.converted_to_project_id,
    createdAt: q.created_at,
  };
}

/**
 * 1. Stateless Preview / Calculation Endpoint
 * Used by frontend creation modal to guarantee preview numbers match server numbers to the exact rupee.
 */
export const calculateQuotationPreview = async (req: Request, res: Response) => {
  try {
    const input: QuotationCalculationInput = req.body;
    const calc = calculateQuotation(input);
    return res.json({ success: true, calculation: calc });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 2. Get All Quotations
 * Scoped by role: Customers only see their own quotations.
 */
export const getQuotations = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    let query = 'SELECT * FROM quotations ORDER BY created_at DESC';
    let params: any[] = [];

    if (user?.role === 'Customer') {
      const custId = user.customerId || '';
      query = `SELECT q.* FROM quotations q 
               LEFT JOIN customers c ON (c.converted_from_lead_id = q.lead_id OR c.phone = q.customer_phone)
               WHERE c.id = ? OR q.customer_phone = ?
               ORDER BY q.created_at DESC`;
      params = [custId, (user as any)?.phone || ''];
    }

    const [rows]: any = await pool.query(query, params);
    const parsed = rows.map((q: any) => formatQuotation(q));

    res.json({ success: true, quotations: parsed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 3. Get Single Quotation by ID
 */
export const getQuotationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query('SELECT * FROM quotations WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    res.json({ success: true, quotation: formatQuotation(rows[0]) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Authoritative Internal Helper: Create or reuse quotation draft for an approved survey.
 * IDEMPOTENT: repeated calls return existing draft without creating duplicates.
 */
export async function createQuotationDraftInternal(
  connOrPool: any,
  options: {
    surveyId: string;
    leadId?: string;
    user?: any;
    packageTier?: 'Standard' | 'Premium Bifacial' | 'Commercial Heavy Duty';
    discountAmount?: number;
    customItems?: any[];
  }
): Promise<{ quotation: any; created: boolean }> {
  const { surveyId, leadId, user, packageTier = 'Premium Bifacial', discountAmount = 0, customItems } = options;

  // 1. Idempotency Check: Does an active quotation draft already exist for this survey?
  const [existingBySurvey]: any = await connOrPool.query(
    'SELECT * FROM quotations WHERE survey_id = ? AND status != "Declined" ORDER BY created_at DESC LIMIT 1',
    [surveyId]
  );
  if (existingBySurvey && existingBySurvey.length > 0) {
    return { quotation: formatQuotation(existingBySurvey[0]), created: false };
  }

  // Idempotency Check by Lead ID if provided
  if (leadId) {
    const [existingByLead]: any = await connOrPool.query(
      'SELECT * FROM quotations WHERE lead_id = ? AND status != "Declined" ORDER BY created_at DESC LIMIT 1',
      [leadId]
    );
    if (existingByLead && existingByLead.length > 0) {
      if (!existingByLead[0].survey_id) {
        await connOrPool.query('UPDATE quotations SET survey_id = ? WHERE id = ?', [surveyId, existingByLead[0].id]);
        existingByLead[0].survey_id = surveyId;
      }
      return { quotation: formatQuotation(existingByLead[0]), created: false };
    }
  }

  // 2. Fetch approved survey and linked lead details
  const [surveys]: any = await connOrPool.query('SELECT * FROM site_surveys WHERE id = ? LIMIT 1', [surveyId]);
  if (!surveys || surveys.length === 0) {
    throw new Error(`Site survey ${surveyId} not found`);
  }
  const survey = surveys[0];

  let lead: any = null;
  const effectiveLeadId = leadId || survey.lead_id;
  if (effectiveLeadId) {
    const [leads]: any = await connOrPool.query('SELECT * FROM leads WHERE id = ? LIMIT 1', [effectiveLeadId]);
    if (leads && leads.length > 0) {
      lead = leads[0];
    }
  }

  const capacityKw = Number(survey.recommended_kw) || Number(lead?.recommended_kw) || 5;
  const roofType = survey.roof_type || lead?.roof_type || 'RCC Flat';
  const customerName = survey.customer_name || lead?.name || 'Solar Customer';
  const customerPhone = survey.phone || lead?.phone || '';
  const customerAddress = survey.address || lead?.address || lead?.city || 'Bengaluru, Karnataka';
  const customerCategory = lead?.monthly_bill && Number(lead.monthly_bill) > 25000 ? 'Commercial' : 'Residential';

  // 3. Authoritative Item-Wise GST Calculation
  const calc = calculateQuotation({
    leadId: effectiveLeadId,
    leadName: customerName,
    customerPhone,
    customerAddress,
    customerCategory,
    systemCapacityKw: capacityKw,
    packageTier,
    discountAmount,
    surveyId,
    isSurveyApproved: true,
    roofType,
    customItems,
  });

  // 4. Generate Collision-Free Primary Key (QT-2026-xxxxx)
  const [allIds]: any = await connOrPool.query("SELECT id FROM quotations WHERE id LIKE 'QT-2026-%'");
  let maxNum = 20;
  for (const row of allIds) {
    const match = row.id.match(/QT-2026-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  const finalId = `QT-2026-${String(maxNum + 1).padStart(5, '0')}`;
  const versionNumber = `${finalId}-V1`;

  const v1 = {
    version: 1,
    quotationNumber: versionNumber,
    createdAt: new Date().toISOString(),
    items: calc.items,
    subtotal: calc.subtotal,
    subsidyDeduction: calc.subsidyAmount,
    discount: calc.discountAmount,
    taxableAmount: calc.taxableAmount,
    gstRate: calc.gstRate,
    gstAmount: calc.gstAmount,
    cgstAmount: calc.cgstAmount,
    sgstAmount: calc.sgstAmount,
    igstAmount: calc.igstAmount,
    taxType: calc.taxType,
    netTotal: calc.finalContractAmount,
    amountInWords: calc.amountInWords,
    terms: calc.terms,
    notes: `Techno-Commercial Proposal based on approved Technical Site Survey ${surveyId}.`,
  };

  const validUntil = new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0];
  const salespersonId = user?.employeeId || lead?.assigned_to_id || 'EMP-06';
  const salespersonName = user?.name || lead?.assigned_to_name || 'Vikram Mehta (Sales)';

  // 5. Insert Draft Quotation into MySQL
  await connOrPool.query(
    `INSERT INTO quotations (
      id, quotation_number, lead_id, lead_name, customer_phone, customer_address, 
      system_capacity_kw, current_version, versions, status, sent_date, valid_until, 
      salesperson_id, salesperson_name, total_amount, proposal_type, package_tier, 
      subtotal, discount_amount, subsidy_amount, taxable_amount, gst_rate, gst_amount, 
      net_total, approval_status, survey_id, tax_mode, total_cgst, total_sgst, total_igst, 
      amount_in_words, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      finalId, versionNumber, effectiveLeadId || null, customerName,
      customerPhone, customerAddress, calc.systemCapacityKw,
      1, JSON.stringify([v1]), 'Draft', null, validUntil,
      salespersonId, salespersonName, calc.finalContractAmount,
      'Final_Technical', calc.packageTier, calc.subtotal, calc.discountAmount,
      calc.subsidyAmount, calc.taxableAmount, calc.gstRate, calc.gstAmount,
      calc.finalContractAmount, calc.approvalStatus, surveyId,
      calc.taxMode, calc.cgstAmount, calc.sgstAmount, calc.igstAmount,
      calc.amountInWords, new Date().toISOString()
    ]
  );

  // 6. Update reference in site_surveys
  await connOrPool.query('UPDATE site_surveys SET quotation_id = ? WHERE id = ?', [finalId, surveyId]);

  // 7. Generate PDF in background
  let pdfUrl = `/uploads/proposals/Quotation_${versionNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  try {
    const pdfData: ProposalPdfData = {
      quotationNumber: versionNumber,
      versionNumber: 1,
      createdAt: v1.createdAt,
      validUntil,
      leadName: customerName,
      customerPhone,
      customerAddress,
      systemCapacityKw: calc.systemCapacityKw,
      actualCapacityKwp: calc.actualCapacityKwp,
      packageTier: calc.packageTier,
      proposalType: 'Final_Technical',
      salespersonName,
      taxMode: calc.taxMode,
      taxType: calc.taxType,
      items: calc.items,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      taxableAmount: calc.taxableAmount,
      gstRate: calc.gstRate,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
      igstAmount: calc.igstAmount,
      gstAmount: calc.gstAmount,
      finalContractAmount: calc.finalContractAmount,
      amountInWords: calc.amountInWords,
      subsidyEligible: calc.subsidyEligible,
      subsidyAmount: calc.subsidyAmount,
      indicativeNetCustomerCost: calc.indicativeNetCustomerCost,
      annualGenerationKwh: calc.annualGenerationKwh,
      annualSavingsInr: calc.annualSavingsInr,
      lifetimeSavings25Yr: calc.lifetimeSavings25Yr,
      simplePaybackYears: calc.simplePaybackYears,
      terms: calc.terms,
    };
    const resPdf = await generateProposalPdf(pdfData);
    pdfUrl = resPdf.fileUrl;
    await connOrPool.query('UPDATE quotations SET pdf_url = ? WHERE id = ?', [pdfUrl, finalId]);
  } catch (pdfErr) {
    console.warn('PDF generation in background:', pdfErr);
  }

  const [createdRows]: any = await connOrPool.query('SELECT * FROM quotations WHERE id = ? LIMIT 1', [finalId]);
  return { quotation: formatQuotation(createdRows[0]), created: true };
}

/**
 * 4. Create Quotation Endpoint (Authoritative server calculation & collision-free ID)
 */
export const createQuotation = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const user = req.user;

    // If surveyId provided, use authoritative creation helper
    if (body.surveyId) {
      const result = await createQuotationDraftInternal(pool, {
        surveyId: body.surveyId,
        leadId: body.leadId,
        user,
        packageTier: body.packageTier,
        discountAmount: body.discountAmount,
        customItems: body.customItems,
      });
      return res.json({ success: true, quotation: result.quotation, alreadyExisted: !result.created });
    }

    // Check if linked to an approved survey via leadId
    let isSurveyApproved = false;
    let surveyRef = body.surveyId;
    if (body.leadId) {
      const [surveys]: any = await pool.query(
        'SELECT id, status, recommended_kw FROM site_surveys WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1',
        [body.leadId]
      );
      if (surveys && surveys.length > 0) {
        if (surveys[0].status === 'Approved' || surveys[0].status === 'Completed') {
          isSurveyApproved = true;
          surveyRef = surveys[0].id;
        }
      }
    }

    // Run authoritative calculation
    const calc = calculateQuotation({
      leadId: body.leadId,
      leadName: body.leadName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      customerCategory: body.customerCategory,
      systemCapacityKw: body.systemCapacityKw || 5,
      packageTier: body.packageTier || 'Premium Bifacial',
      discountAmount: body.discountAmount || 0,
      surveyId: surveyRef,
      isSurveyApproved,
      roofType: body.roofType,
      customItems: body.customItems,
      taxMode: body.taxMode,
      taxType: body.taxType,
    });

    // Generate Collision-Free Primary Key
    const [allIds]: any = await pool.query("SELECT id FROM quotations WHERE id LIKE 'QT-2026-%'");
    let maxNum = 20;
    for (const row of allIds) {
      const match = row.id.match(/QT-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const finalId = `QT-2026-${String(maxNum + 1).padStart(5, '0')}`;
    const versionNumber = `${finalId}-V1`;

    const v1 = {
      version: 1,
      quotationNumber: versionNumber,
      createdAt: new Date().toISOString(),
      items: calc.items,
      subtotal: calc.subtotal,
      subsidyDeduction: calc.subsidyAmount,
      discount: calc.discountAmount,
      taxableAmount: calc.taxableAmount,
      gstRate: calc.gstRate,
      gstAmount: calc.gstAmount,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
      igstAmount: calc.igstAmount,
      taxType: calc.taxType,
      netTotal: calc.finalContractAmount,
      amountInWords: calc.amountInWords,
      terms: calc.terms,
      notes: isSurveyApproved 
        ? `Techno-Commercial Proposal based on approved Technical Site Survey ${surveyRef}.` 
        : `Preliminary indicative solar estimate. Final capacity subject to on-site roof audit.`,
    };

    const validUntil = new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0];
    const salespersonId = body.salespersonId || user?.employeeId || 'EMP-06';
    const salespersonName = body.salespersonName || user?.name || 'Vikram Mehta (Sales)';

    // Insert into MySQL
    await pool.query(
      `INSERT INTO quotations (
        id, quotation_number, lead_id, lead_name, customer_phone, customer_address, 
        system_capacity_kw, current_version, versions, status, sent_date, valid_until, 
        salesperson_id, salesperson_name, total_amount, proposal_type, package_tier, 
        subtotal, discount_amount, subsidy_amount, taxable_amount, gst_rate, gst_amount, 
        net_total, approval_status, survey_id, tax_mode, total_cgst, total_sgst, total_igst,
        amount_in_words, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalId, versionNumber, body.leadId || null, body.leadName || 'Solar Client',
        body.customerPhone || '', body.customerAddress || '', calc.systemCapacityKw,
        1, JSON.stringify([v1]), 'Draft', null, validUntil,
        salespersonId, salespersonName, calc.finalContractAmount,
        calc.proposalType, calc.packageTier, calc.subtotal, calc.discountAmount,
        calc.subsidyAmount, calc.taxableAmount, calc.gstRate, calc.gstAmount,
        calc.finalContractAmount, calc.approvalStatus, surveyRef || null,
        calc.taxMode, calc.cgstAmount, calc.sgstAmount, calc.igstAmount,
        calc.amountInWords, new Date().toISOString()
      ]
    );

    // Update lead linkage
    if (body.leadId) {
      await pool.query('UPDATE leads SET quotation_id = ? WHERE id = ?', [finalId, body.leadId]);
    }
    if (surveyRef) {
      await pool.query('UPDATE site_surveys SET quotation_id = ? WHERE id = ?', [finalId, surveyRef]);
    }

    // Generate real PDF asynchronously
    let pdfUrl = `/uploads/proposals/Quotation_${versionNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    try {
      const pdfData: ProposalPdfData = {
        quotationNumber: versionNumber,
        versionNumber: 1,
        createdAt: v1.createdAt,
        validUntil,
        leadName: body.leadName || 'Solar Client',
        customerPhone: body.customerPhone || '',
        customerAddress: body.customerAddress || 'Bengaluru, Karnataka',
        systemCapacityKw: calc.systemCapacityKw,
        actualCapacityKwp: calc.actualCapacityKwp,
        packageTier: calc.packageTier,
        proposalType: calc.proposalType,
        salespersonName,
        taxMode: calc.taxMode,
        taxType: calc.taxType,
        items: calc.items,
        subtotal: calc.subtotal,
        discountAmount: calc.discountAmount,
        taxableAmount: calc.taxableAmount,
        gstRate: calc.gstRate,
        cgstAmount: calc.cgstAmount,
        sgstAmount: calc.sgstAmount,
        igstAmount: calc.igstAmount,
        gstAmount: calc.gstAmount,
        finalContractAmount: calc.finalContractAmount,
        amountInWords: calc.amountInWords,
        subsidyEligible: calc.subsidyEligible,
        subsidyAmount: calc.subsidyAmount,
        indicativeNetCustomerCost: calc.indicativeNetCustomerCost,
        annualGenerationKwh: calc.annualGenerationKwh,
        annualSavingsInr: calc.annualSavingsInr,
        lifetimeSavings25Yr: calc.lifetimeSavings25Yr,
        simplePaybackYears: calc.simplePaybackYears,
        terms: calc.terms,
      };
      const resPdf = await generateProposalPdf(pdfData);
      pdfUrl = resPdf.fileUrl;
      await pool.query('UPDATE quotations SET pdf_url = ? WHERE id = ?', [pdfUrl, finalId]);
    } catch (pdfErr) {
      console.warn('Note: Background PDF generation queued:', pdfErr);
    }

    const [createdRows]: any = await pool.query('SELECT * FROM quotations WHERE id = ? LIMIT 1', [finalId]);
    res.json({ success: true, quotation: formatQuotation(createdRows[0]) });
  } catch (err: any) {
    console.error('Error creating quotation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 5. Create Quotation Revision (V2, V3, ...)
 * Preserves earlier versions in versions JSON array without overwriting historical data.
 */
export const createQuotationRevision = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const user = req.user;

    const [rows]: any = await pool.query('SELECT * FROM quotations WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    const existing = rows[0];
    const versions: any[] = typeof existing.versions === 'string' ? JSON.parse(existing.versions) : (existing.versions || []);
    const nextVerNum = (existing.current_version || versions.length) + 1;
    const nextVerCode = `${id}-V${nextVerNum}`;

    // Calculate new revision
    const calc = calculateQuotation({
      leadId: existing.lead_id,
      leadName: existing.lead_name,
      customerPhone: existing.customer_phone,
      customerAddress: existing.customer_address,
      systemCapacityKw: body.systemCapacityKw || existing.system_capacity_kw,
      packageTier: body.packageTier || existing.package_tier || 'Premium Bifacial',
      discountAmount: body.discountAmount !== undefined ? body.discountAmount : existing.discount_amount,
      surveyId: existing.survey_id,
      isSurveyApproved: existing.proposal_type === 'Final_Technical',
      customItems: body.customItems,
      taxMode: body.taxMode || existing.tax_mode,
      taxType: body.taxType,
    });

    const newVersion = {
      version: nextVerNum,
      quotationNumber: nextVerCode,
      createdAt: new Date().toISOString(),
      items: calc.items,
      subtotal: calc.subtotal,
      subsidyDeduction: calc.subsidyAmount,
      discount: calc.discountAmount,
      taxableAmount: calc.taxableAmount,
      gstRate: calc.gstRate,
      gstAmount: calc.gstAmount,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
      igstAmount: calc.igstAmount,
      taxType: calc.taxType,
      netTotal: calc.finalContractAmount,
      amountInWords: calc.amountInWords,
      terms: calc.terms,
      notes: body.notes || `Revision V${nextVerNum} created by ${user?.name || 'Sales Rep'}.`,
    };

    versions.push(newVersion);

    // Generate new PDF for this revision
    let pdfUrl = existing.pdf_url;
    try {
      const pdfData: ProposalPdfData = {
        quotationNumber: nextVerCode,
        versionNumber: nextVerNum,
        createdAt: newVersion.createdAt,
        validUntil: existing.valid_until,
        leadName: existing.lead_name,
        customerPhone: existing.customer_phone,
        customerAddress: existing.customer_address,
        systemCapacityKw: calc.systemCapacityKw,
        actualCapacityKwp: calc.actualCapacityKwp,
        packageTier: calc.packageTier,
        proposalType: calc.proposalType,
        salespersonName: user?.name || existing.salesperson_name,
        taxMode: calc.taxMode,
        taxType: calc.taxType,
        items: calc.items,
        subtotal: calc.subtotal,
        discountAmount: calc.discountAmount,
        taxableAmount: calc.taxableAmount,
        gstRate: calc.gstRate,
        cgstAmount: calc.cgstAmount,
        sgstAmount: calc.sgstAmount,
        igstAmount: calc.igstAmount,
        gstAmount: calc.gstAmount,
        finalContractAmount: calc.finalContractAmount,
        amountInWords: calc.amountInWords,
        subsidyEligible: calc.subsidyEligible,
        subsidyAmount: calc.subsidyAmount,
        indicativeNetCustomerCost: calc.indicativeNetCustomerCost,
        annualGenerationKwh: calc.annualGenerationKwh,
        annualSavingsInr: calc.annualSavingsInr,
        lifetimeSavings25Yr: calc.lifetimeSavings25Yr,
        simplePaybackYears: calc.simplePaybackYears,
        terms: calc.terms,
      };
      const resPdf = await generateProposalPdf(pdfData);
      pdfUrl = resPdf.fileUrl;
    } catch (e) {
      console.warn('PDF revision generation error:', e);
    }

    await pool.query(
      `UPDATE quotations SET 
        quotation_number = ?, current_version = ?, versions = ?, total_amount = ?,
        system_capacity_kw = ?, package_tier = ?, subtotal = ?, discount_amount = ?,
        subsidy_amount = ?, taxable_amount = ?, gst_rate = ?, gst_amount = ?, net_total = ?,
        approval_status = ?, tax_mode = ?, total_cgst = ?, total_sgst = ?, total_igst = ?,
        amount_in_words = ?, pdf_url = ?
       WHERE id = ?`,
      [
        nextVerCode, nextVerNum, JSON.stringify(versions), calc.finalContractAmount,
        calc.systemCapacityKw, calc.packageTier, calc.subtotal, calc.discountAmount,
        calc.subsidyAmount, calc.taxableAmount, calc.gstRate, calc.gstAmount, calc.finalContractAmount,
        calc.approvalStatus, calc.taxMode, calc.cgstAmount, calc.sgstAmount, calc.igstAmount,
        calc.amountInWords, pdfUrl, id
      ]
    );

    res.json({ success: true, quotationNumber: nextVerCode, version: newVersion, pdfUrl });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 6. Commercial Discount Approval Handler
 * Restricted to Sales Manager and Super Admin.
 */
export const approveQuotationDiscount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user?.role !== 'Sales Manager' && user?.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        error: 'Only Sales Manager or Super Admin can approve commercial discounts.'
      });
    }

    await pool.query(
      'UPDATE quotations SET approval_status = "Approved", discount_approved_by = ? WHERE id = ?',
      [user.name, id]
    );

    res.json({ success: true, message: `Quotation ${id} approved by ${user.name}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 7. Update Quotation Status / Metadata
 */
export const updateQuotation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const allowed = ['status', 'notes', 'validUntil', 'sentDate', 'packageTier', 'versions', 'totalAmount', 'approvalStatus'];
    
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.sentDate !== undefined) { fields.push('sent_date = ?'); values.push(updates.sentDate); }
    if (updates.validUntil !== undefined) { fields.push('valid_until = ?'); values.push(updates.validUntil); }
    if (updates.packageTier !== undefined) { fields.push('package_tier = ?'); values.push(updates.packageTier); }
    if (updates.notes !== undefined) {
      const [curr]: any = await pool.query('SELECT versions FROM quotations WHERE id = ? LIMIT 1', [id]);
      if (curr && curr.length > 0) {
        const v = typeof curr[0].versions === 'string' ? JSON.parse(curr[0].versions) : curr[0].versions;
        if (v && v.length > 0) {
          v[v.length - 1].notes = updates.notes;
          fields.push('versions = ?');
          values.push(JSON.stringify(v));
        }
      }
    }
    if (updates.versions !== undefined) { fields.push('versions = ?'); values.push(JSON.stringify(updates.versions)); }
    if (updates.totalAmount !== undefined) { fields.push('total_amount = ?'); values.push(updates.totalAmount); }
    if (updates.approvalStatus !== undefined) { fields.push('approval_status = ?'); values.push(updates.approvalStatus); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE quotations SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 7A. Edit Quotation & Custom BOM Line Items (Real-Time Calculation & PDF Sync)
 */
export const editQuotation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const user = req.user;

    const [rows]: any = await pool.query('SELECT * FROM quotations WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    const existing = rows[0];

    // Sizing & Commercials
    const systemCapacityKw = body.systemCapacityKw || existing.system_capacity_kw;
    const packageTier = body.packageTier || existing.package_tier || 'Premium Bifacial';
    const discountAmount = body.discountAmount !== undefined ? Number(body.discountAmount) : Number(existing.discount_amount);
    const customItems = body.customItems;

    // Run authoritative calculation with custom items override
    const calc = calculateQuotation({
      leadId: existing.lead_id,
      leadName: existing.lead_name,
      customerPhone: existing.customer_phone,
      customerAddress: existing.customer_address,
      customerCategory: existing.customer_category,
      systemCapacityKw,
      packageTier,
      discountAmount,
      surveyId: existing.survey_id,
      isSurveyApproved: existing.proposal_type === 'Final_Technical',
      customItems,
      taxMode: body.taxMode || existing.tax_mode,
      taxType: body.taxType,
    });

    // Update current version in versions array
    let versions = typeof existing.versions === 'string' ? JSON.parse(existing.versions) : (existing.versions || []);
    if (!versions || versions.length === 0) {
      versions = [{
        version: 1,
        quotationNumber: existing.quotation_number,
        createdAt: existing.created_at || new Date().toISOString(),
        items: calc.items,
        subtotal: calc.subtotal,
        subsidyDeduction: calc.subsidyAmount,
        discount: calc.discountAmount,
        taxableAmount: calc.taxableAmount,
        gstRate: calc.gstRate,
        gstAmount: calc.gstAmount,
        cgstAmount: calc.cgstAmount,
        sgstAmount: calc.sgstAmount,
        igstAmount: calc.igstAmount,
        taxType: calc.taxType,
        netTotal: calc.finalContractAmount,
        amountInWords: calc.amountInWords,
        terms: calc.terms,
        notes: body.notes || 'Updated quotation draft with custom BOM.',
      }];
    } else {
      const lastIdx = versions.length - 1;
      versions[lastIdx] = {
        ...versions[lastIdx],
        items: calc.items,
        subtotal: calc.subtotal,
        subsidyDeduction: calc.subsidyAmount,
        discount: calc.discountAmount,
        taxableAmount: calc.taxableAmount,
        gstRate: calc.gstRate,
        gstAmount: calc.gstAmount,
        cgstAmount: calc.cgstAmount,
        sgstAmount: calc.sgstAmount,
        igstAmount: calc.igstAmount,
        taxType: calc.taxType,
        netTotal: calc.finalContractAmount,
        amountInWords: calc.amountInWords,
        terms: calc.terms,
        notes: body.notes || versions[lastIdx].notes,
      };
    }

    // Regenerate Proposal PDF
    let pdfUrl = existing.pdf_url;
    try {
      const pdfData: ProposalPdfData = {
        quotationNumber: existing.quotation_number,
        versionNumber: existing.current_version || 1,
        createdAt: existing.created_at,
        validUntil: existing.valid_until,
        leadName: existing.lead_name,
        customerPhone: existing.customer_phone,
        customerAddress: existing.customer_address,
        systemCapacityKw: calc.systemCapacityKw,
        actualCapacityKwp: calc.actualCapacityKwp,
        packageTier: calc.packageTier,
        proposalType: calc.proposalType,
        salespersonName: existing.salesperson_name || user?.name || 'Vikram Mehta (Sales)',
        taxMode: calc.taxMode,
        taxType: calc.taxType,
        items: calc.items,
        subtotal: calc.subtotal,
        discountAmount: calc.discountAmount,
        taxableAmount: calc.taxableAmount,
        gstRate: calc.gstRate,
        cgstAmount: calc.cgstAmount,
        sgstAmount: calc.sgstAmount,
        igstAmount: calc.igstAmount,
        gstAmount: calc.gstAmount,
        finalContractAmount: calc.finalContractAmount,
        amountInWords: calc.amountInWords,
        subsidyEligible: calc.subsidyEligible,
        subsidyAmount: calc.subsidyAmount,
        indicativeNetCustomerCost: calc.indicativeNetCustomerCost,
        annualGenerationKwh: calc.annualGenerationKwh,
        annualSavingsInr: calc.annualSavingsInr,
        lifetimeSavings25Yr: calc.lifetimeSavings25Yr,
        simplePaybackYears: calc.simplePaybackYears,
        terms: calc.terms,
      };
      const resPdf = await generateProposalPdf(pdfData);
      pdfUrl = resPdf.fileUrl;
    } catch (e) {
      console.warn('PDF regeneration error:', e);
    }

    await pool.query(
      `UPDATE quotations SET
        system_capacity_kw = ?, package_tier = ?, discount_amount = ?,
        subtotal = ?, taxable_amount = ?, gst_rate = ?, gst_amount = ?,
        total_amount = ?, net_total = ?, total_cgst = ?, total_sgst = ?,
        total_igst = ?, amount_in_words = ?, approval_status = ?,
        versions = ?, pdf_url = ?
       WHERE id = ?`,
      [
        calc.systemCapacityKw, calc.packageTier, calc.discountAmount,
        calc.subtotal, calc.taxableAmount, calc.gstRate, calc.gstAmount,
        calc.finalContractAmount, calc.finalContractAmount, calc.cgstAmount,
        calc.sgstAmount, calc.igstAmount, calc.amountInWords, calc.approvalStatus,
        JSON.stringify(versions), pdfUrl, id
      ]
    );

    const [updated]: any = await pool.query('SELECT * FROM quotations WHERE id = ? LIMIT 1', [id]);
    res.json({ success: true, quotation: formatQuotation(updated[0]) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 7B. Record Customer Acceptance (Stage-Gate: Unlocks PM Conversion)
 */
export const recordCustomerAcceptance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { acceptanceNotes, clientPoNumber } = req.body;
    const user = req.user;

    const [rows]: any = await pool.query('SELECT * FROM quotations WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    const quote = rows[0];

    // Check discount approval requirement before acceptance
    if (quote.approval_status === 'Pending_Approval') {
      return res.status(400).json({
        success: false,
        error: 'Cannot record customer acceptance: Quotation discount is pending Sales Manager approval.'
      });
    }

    // Set status to Customer_Accepted
    await pool.query(
      `UPDATE quotations SET 
        status = 'Customer_Accepted',
        notes = CONCAT(COALESCE(notes, ''), ?),
        sent_date = COALESCE(sent_date, NOW())
       WHERE id = ?`,
      [`\n[Customer Accepted: ${new Date().toLocaleDateString('en-IN')}] Recorded by ${user?.name || 'Sales'}. PO: ${clientPoNumber || 'N/A'}. ${acceptanceNotes || ''}`, id]
    );

    const [updated]: any = await pool.query('SELECT * FROM quotations WHERE id = ? LIMIT 1', [id]);
    res.json({ success: true, quotation: formatQuotation(updated[0]) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 8. Accept Quotation & Idempotent Project Conversion (Restricted to PM / Super Admin)
 */
export const acceptQuotation = async (req: Request, res: Response) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const user = req.user;

    // Strict Role Guardrail: Only Project Manager and Super Admin can execute EPC project conversion!
    if (user && user.role !== 'Project Manager' && user.role !== 'Super Admin') {
      conn.release();
      return res.status(403).json({
        success: false,
        error: 'Access denied: Only Project Managers and Super Admins are authorized to convert accepted quotations into live EPC projects.'
      });
    }

    // 1. Fetch quotation
    const [rows]: any = await conn.query('SELECT * FROM quotations WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const quote = rows[0];

    // Check discount approval requirement
    if (quote.approval_status === 'Pending_Approval') {
      conn.release();
      return res.status(400).json({
        success: false,
        error: 'Cannot accept quotation: Discount exceeds authorized threshold and is pending manager approval.'
      });
    }

    // 2. Idempotency Check: Was this quote already converted to a project?
    if (quote.converted_to_project_id) {
      const [existingProject]: any = await conn.query(
        'SELECT * FROM projects WHERE id = ? LIMIT 1',
        [quote.converted_to_project_id]
      );
      conn.release();
      if (existingProject && existingProject.length > 0) {
        return res.json({
          success: true,
          message: 'Quotation was already accepted and converted to project.',
          alreadyConverted: true,
          projectId: quote.converted_to_project_id,
          project: existingProject[0]
        });
      }
    }

    await conn.beginTransaction();

    const quoteTotal = Number(quote.total_amount) || 0;
    const capacityKw = Number(quote.system_capacity_kw) || 5;
    const advanceAmount = Math.round(quoteTotal * 0.40);

    // 3. Resolve or Create Customer record
    let customerId = '';
    let customerName = quote.lead_name;
    let customerPhone = quote.customer_phone;
    let customerAddress = quote.customer_address;

    const [existingCust]: any = await conn.query(
      'SELECT id, name, phone, address FROM customers WHERE converted_from_lead_id = ? OR phone = ? LIMIT 1',
      [quote.lead_id, quote.customer_phone]
    );

    if (existingCust && existingCust.length > 0) {
      customerId = existingCust[0].id;
      customerName = existingCust[0].name;
    } else {
      const [allCusts]: any = await conn.query("SELECT id FROM customers WHERE id LIKE 'CUST-2026-%'");
      let maxCustNum = 20;
      for (const c of allCusts) {
        const match = c.id.match(/CUST-2026-(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxCustNum) maxCustNum = n;
        }
      }
      customerId = `CUST-2026-${String(maxCustNum + 1).padStart(3, '0')}`;

      await conn.query(
        `INSERT INTO customers (
          id, name, email, phone, address, city, state, pincode, 
          consumer_number_discom, discom_name, converted_from_lead_id, 
          total_system_kw, total_order_value, paid_amount, balance_amount, 
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerId, customerName, `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          customerPhone, customerAddress || 'Site Address', 'Bengaluru', 'Karnataka', '560001',
          `DISCOM-${Math.floor(1000000 + Math.random() * 9000000)}`, 'BESCOM', quote.lead_id,
          capacityKw, quoteTotal, 0, quoteTotal, 'Under Installation', new Date().toISOString()
        ]
      );
    }

    // 4. Create Project record
    const [allProjs]: any = await conn.query("SELECT id FROM projects WHERE id LIKE 'PROJECT-2026-%' OR id LIKE 'PRJ-2026-%'");
    let maxProjNum = 20;
    for (const p of allProjs) {
      const match = p.id.match(/(?:PROJECT|PRJ)-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxProjNum) maxProjNum = n;
      }
    }
    const projectId = `PROJECT-2026-${String(maxProjNum + 1).padStart(3, '0')}`;
    const targetDate = new Date(Date.now() + 86400000 * 25).toISOString().split('T')[0];

    const initialTasks = [
      { id: `PT-${Date.now()}-1`, title: 'DISCOM Net-metering application & sanction', stage: 'Documentation', isCompleted: false, assignedRole: 'Project Manager', assignedToName: 'Karthik Raja', dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] },
      { id: `PT-${Date.now()}-2`, title: 'Warehouse material packing and dispatch check', stage: 'Material Ready', isCompleted: false, assignedRole: 'Project Manager', assignedToName: 'Karthik Raja', dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0] },
      { id: `PT-${Date.now()}-3`, title: 'HDG structure foundation & anchor bolting', stage: 'Installation Scheduled', isCompleted: false, assignedRole: 'Installation Team', assignedToName: 'Muthu Vel', dueDate: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0] },
      { id: `PT-${Date.now()}-4`, title: 'Module mounting & DC string conduit wiring', stage: 'Installation In Progress', isCompleted: false, assignedRole: 'Installation Team', assignedToName: 'Muthu Vel', dueDate: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0] },
    ];

    const initialChecklist = {
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
    };

    await conn.query(
      `INSERT INTO projects (
        id, customer_id, customer_name, customer_phone, customer_address, 
        quotation_id, capacity_kw, total_amount, stage, start_date, 
        target_completion_date, project_manager_id, project_manager_name, 
        installation_lead_id, installation_lead_name, checklist, tasks, 
        inventory_reserved, discom_sanction_number, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId, customerId, customerName, customerPhone, customerAddress,
        quote.id, capacityKw, quoteTotal, 'Booking', new Date().toISOString().split('T')[0],
        targetDate, 'EMP-04', 'Karthik Raja', 'EMP-05', 'Muthu Vel',
        JSON.stringify(initialChecklist), JSON.stringify(initialTasks),
        1, `BESCOM/SANCTION/${Date.now().toString().slice(-4)}`,
        `Converted deal from Quotation ${quote.quotation_number}. 40% Advance invoice issued (Unpaid).`,
        new Date().toISOString()
      ]
    );

    // 5. Create 40% Advance Invoice (Unpaid, No Fake Payments)
    const [allInvs]: any = await conn.query("SELECT id FROM invoices WHERE id LIKE 'INV-2026-%'");
    let maxInvNum = 20;
    for (const inv of allInvs) {
      const match = inv.id.match(/INV-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxInvNum) maxInvNum = n;
      }
    }
    const invoiceId = `INV-2026-${String(maxInvNum + 1).padStart(3, '0')}`;
    const invoiceNumber = `INV-2026-00${String(maxInvNum + 1).padStart(3, '0')}`;
    const subtotalInv = Math.round(advanceAmount / 1.138);
    const gstInv = advanceAmount - subtotalInv;

    const invoiceItems = [
      {
        description: `40% Milestone Advance for ${capacityKw} kW Solar EPC Plant (Booking & Engineering Approval)`,
        hsnCode: '995465',
        quantity: 1,
        rate: subtotalInv,
        amount: subtotalInv,
      }
    ];

    await conn.query(
      `INSERT INTO invoices (
        id, invoice_number, project_id, customer_id, customer_name, customer_phone, 
        issue_date, due_date, items, subtotal, cgst, sgst, igst, total_amount, 
        paid_amount, balance_due, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId, invoiceNumber, projectId, customerId, customerName, customerPhone,
        new Date().toISOString().split('T')[0],
        new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        JSON.stringify(invoiceItems), subtotalInv, Math.round(gstInv / 2), Math.round(gstInv / 2), 0,
        advanceAmount, 0, advanceAmount, 'Unpaid'
      ]
    );

    // 6. Update Quotation Status & Link Project
    await conn.query(
      'UPDATE quotations SET status = "Converted_To_Project", converted_to_project_id = ? WHERE id = ?',
      [projectId, id]
    );

    // 7. Update Lead status to Won
    if (quote.lead_id) {
      await conn.query('UPDATE leads SET status = "Won" WHERE id = ?', [quote.lead_id]);
    }

    await conn.commit();
    conn.release();

    const [projRows]: any = await pool.query('SELECT * FROM projects WHERE id = ? LIMIT 1', [projectId]);
    res.json({
      success: true,
      message: `Quotation accepted! Converted to Project ${projectId} and Advance Invoice ${invoiceNumber} created.`,
      projectId,
      project: projRows[0],
      invoiceId,
    });
  } catch (err: any) {
    await conn.rollback();
    conn.release();
    console.error('Accept quotation transaction error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 9. Download Authentic Proposal PDF Endpoint
 */
export const downloadProposalPdf = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const [rows]: any = await pool.query('SELECT * FROM quotations WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    const q = rows[0];

    // Role check for customer
    if (user?.role === 'Customer' && (user as any)?.phone !== q.customer_phone) {
      return res.status(403).json({ success: false, error: 'Unauthorized to download this quotation.' });
    }

    const versions: any[] = typeof q.versions === 'string' ? JSON.parse(q.versions) : (q.versions || []);
    const activeVer = versions.find((v: any) => v.version === q.current_version) || versions[versions.length - 1] || {};

    const calc = calculateQuotation({
      systemCapacityKw: Number(q.system_capacity_kw) || 5,
      packageTier: q.package_tier || 'Premium Bifacial',
      discountAmount: Number(q.discount_amount) || 0,
      isSurveyApproved: q.proposal_type === 'Final_Technical',
      taxMode: q.tax_mode,
      customerAddress: q.customer_address,
    });

    const pdfData: ProposalPdfData = {
      quotationNumber: q.quotation_number || `${q.id}-V1`,
      versionNumber: q.current_version || 1,
      createdAt: q.created_at,
      validUntil: q.valid_until || new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      leadName: q.lead_name,
      customerPhone: q.customer_phone,
      customerAddress: q.customer_address || 'Bengaluru, Karnataka',
      systemCapacityKw: Number(q.system_capacity_kw) || 5,
      actualCapacityKwp: calc.actualCapacityKwp,
      packageTier: q.package_tier || 'Premium Bifacial',
      proposalType: q.proposal_type || 'Final_Technical',
      salespersonName: q.salesperson_name || 'Vikram Mehta (Sales)',
      taxMode: q.tax_mode || calc.taxMode,
      taxType: activeVer.taxType || calc.taxType,
      items: activeVer.items || calc.items,
      subtotal: Number(q.subtotal) || calc.subtotal,
      discountAmount: Number(q.discount_amount) || 0,
      taxableAmount: Number(q.taxable_amount) || calc.taxableAmount,
      gstRate: Number(q.gst_rate) || calc.gstRate,
      cgstAmount: Number(q.total_cgst) || calc.cgstAmount,
      sgstAmount: Number(q.total_sgst) || calc.sgstAmount,
      igstAmount: Number(q.total_igst) || calc.igstAmount,
      gstAmount: Number(q.gst_amount) || calc.gstAmount,
      finalContractAmount: Number(q.total_amount) || calc.finalContractAmount,
      amountInWords: q.amount_in_words || calc.amountInWords,
      subsidyEligible: calc.subsidyEligible,
      subsidyAmount: Number(q.subsidy_amount) || calc.subsidyAmount,
      indicativeNetCustomerCost: calc.indicativeNetCustomerCost,
      annualGenerationKwh: calc.annualGenerationKwh,
      annualSavingsInr: calc.annualSavingsInr,
      lifetimeSavings25Yr: calc.lifetimeSavings25Yr,
      simplePaybackYears: calc.simplePaybackYears,
      terms: activeVer.terms || calc.terms,
    };

    const { filePath, fileUrl } = await generateProposalPdf(pdfData);
    await pool.query('UPDATE quotations SET pdf_url = ? WHERE id = ?', [fileUrl, id]);

    res.download(filePath);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
