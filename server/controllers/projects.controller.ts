import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { pool } from '../db.js';
import { createNotification } from './notifications.controller.js';

export const createProject = async (req: Request, res: Response) => {
  try {
    const p = req.body;
    await pool.query(
      `INSERT INTO projects (id, customer_id, customer_name, customer_phone, customer_address, quotation_id, capacity_kw, total_amount, stage, start_date, target_completion_date, project_manager_id, project_manager_name, installation_lead_id, installation_lead_name, checklist, tasks, inventory_reserved, material_shortage_flag, shortage_details, commissioning_date, net_meter_installed_date, warranty_activated, amc_initiated, discom_sanction_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id, p.customerId, p.customerName, p.customerPhone || '', p.customerAddress || '', p.quotationId,
        p.capacityKw || 0, p.totalAmount || 0, p.stage, p.startDate, p.targetCompletionDate,
        p.projectManagerId, p.projectManagerName, p.installationLeadId, p.installationLeadName,
        JSON.stringify(p.checklist || {}), JSON.stringify(p.tasks || []), p.inventoryReserved ? 1 : 0,
        p.materialShortageFlag ? 1 : 0, p.shortageDetails || null, p.commissioningDate || null,
        p.netMeterInstalledDate || null, p.warrantyActivated ? 1 : 0, p.amcInitiated ? 1 : 0,
        p.discomSanctionNumber || null, p.notes || ''
      ]
    );

    // Non-blocking auto-link to subsidy tracking
    try {
      const capKw = Number(p.capacityKw) || 3;
      const isRes = capKw <= 10;
      const subAmount = isRes ? (capKw <= 1 ? 30000 : (capKw <= 2 ? 60000 : 78000)) : 0;
      const subsidiesFile = path.resolve(process.cwd(), 'data', 'subsidies.json');
      let currentSubsidies: any[] = [];
      if (fs.existsSync(subsidiesFile)) {
        try {
          currentSubsidies = JSON.parse(fs.readFileSync(subsidiesFile, 'utf-8'));
        } catch (_) {}
      }
      if (!currentSubsidies.some((s: any) => s.project_id === p.id)) {
        currentSubsidies.unshift({
          id: `SUB-${String(p.id).replace('PROJECT-', '').replace('PRJ-', '')}`,
          project_id: p.id,
          project_number: p.id,
          customer_name: p.customerName || 'Customer',
          customer_phone: p.customerPhone || '',
          customer_type: isRes ? 'residential' : 'commercial',
          is_eligible: isRes,
          site_address: p.customerAddress || '',
          discom_name: 'TANGEDCO',
          consumer_number: p.discomSanctionNumber || 'Pending Consumer No',
          sanctioned_load_kw: capKw,
          system_capacity_kw: capKw,
          subsidy_applicable_amount: subAmount,
          dcr_modules_used: isRes,
          panel_make_and_model: isRes ? 'Tata Power Solar / Waaree 545W Mono PERC (DCR)' : 'Tier-1 High Efficiency Panels',
          inverter_make_and_model: `${capKw}kW On-Grid Solar Inverter`,
          portal_application_no: isRes ? `PMS-TN-${new Date().getFullYear()}-${String(p.id).replace(/\D/g, '').slice(-5) || Math.floor(10000 + Math.random() * 90000)}` : 'N/A (Commercial Project)',
          application_submission_date: new Date().toISOString().split('T')[0],
          current_stage: isRes ? 1 : 0,
          current_stage_name: isRes ? 'Portal Registration Submitted' : 'Not Eligible (Commercial Project)',
          stage_status: 'in_progress',
          days_in_current_stage: 1,
          is_delayed: false,
          documents: { electricity_bill: true, aadhaar_card: isRes, cancelled_cheque: false, roof_photo_geotagged: true, dcr_certificate: isRes, tfr_letter: false, wcr_copy: false, net_meter_test_report: false, commissioning_cert: false },
          notes: `Auto-generated for Project ${p.id}`,
          last_updated: new Date().toISOString().split('T')[0]
        });
        const sDir = path.dirname(subsidiesFile);
        if (!fs.existsSync(sDir)) fs.mkdirSync(sDir, { recursive: true });
        fs.writeFileSync(subsidiesFile, JSON.stringify(currentSubsidies, null, 2), 'utf-8');
      }
    } catch (_) {}

    res.json({ success: true, project: p });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const baseFields: string[] = [];
    const baseValues: any[] = [];

    if (updates.stage !== undefined) { baseFields.push('stage = ?'); baseValues.push(updates.stage); }
    if (updates.tasks !== undefined) { baseFields.push('tasks = ?'); baseValues.push(JSON.stringify(updates.tasks)); }
    if (updates.commissioningDate !== undefined) { baseFields.push('commissioning_date = ?'); baseValues.push(updates.commissioningDate); }
    if (updates.netMeterInstalledDate !== undefined) { baseFields.push('net_meter_installed_date = ?'); baseValues.push(updates.netMeterInstalledDate); }
    if (updates.siteReadinessConfirmed !== undefined) { baseFields.push('site_readiness_confirmed = ?'); baseValues.push(updates.siteReadinessConfirmed ? 1 : 0); }
    if (updates.siteReadinessNotes !== undefined) { baseFields.push('site_readiness_notes = ?'); baseValues.push(updates.siteReadinessNotes); }
    if (updates.startDate !== undefined || updates.start_date !== undefined) {
      baseFields.push('start_date = ?');
      baseValues.push(updates.startDate || updates.start_date);
    }
    if (updates.targetCompletionDate !== undefined || updates.target_completion_date !== undefined) {
      baseFields.push('target_completion_date = ?');
      baseValues.push(updates.targetCompletionDate || updates.target_completion_date);
    }
    if (updates.installationLeadName !== undefined || updates.installation_lead_name !== undefined) {
      baseFields.push('installation_lead_name = ?');
      baseValues.push(updates.installationLeadName || updates.installation_lead_name);
    }
    if (updates.notes !== undefined) { baseFields.push('notes = ?'); baseValues.push(updates.notes); }

    // Merge updates into checklist JSON object so it always stays preserved in MySQL base columns
    let checklistToSave: any = updates.checklist;
    if (checklistToSave === undefined) {
      try {
        const [currRows]: any = await pool.query('SELECT checklist FROM projects WHERE id = ? LIMIT 1', [id]);
        if (currRows && currRows.length > 0 && currRows[0].checklist) {
          checklistToSave = typeof currRows[0].checklist === 'string' ? JSON.parse(currRows[0].checklist) : currRows[0].checklist;
        }
      } catch (_) {}
    }
    if (!checklistToSave || typeof checklistToSave !== 'object') {
      checklistToSave = {};
    }

    if (updates.arrivedMaterialIds !== undefined) checklistToSave.arrivedMaterialIds = updates.arrivedMaterialIds;
    if (updates.materialArrivedOnSite !== undefined) checklistToSave.materialArrivedOnSite = updates.materialArrivedOnSite;
    if (updates.materialArrivedConfirmedAt !== undefined) checklistToSave.materialArrivedConfirmedAt = updates.materialArrivedConfirmedAt;
    if (updates.materialArrivedConfirmedBy !== undefined) checklistToSave.materialArrivedConfirmedBy = updates.materialArrivedConfirmedBy;
    if (updates.installationDurationDays !== undefined) checklistToSave.installationDurationDays = updates.installationDurationDays;
    if (updates.targetCompletionDate !== undefined || updates.target_completion_date !== undefined) {
      checklistToSave.targetCompletionDate = updates.targetCompletionDate || updates.target_completion_date;
    }
    if (updates.startDate !== undefined || updates.start_date !== undefined) {
      checklistToSave.startDate = updates.startDate || updates.start_date;
    }
    if (updates.siteSurveyVerified !== undefined) checklistToSave.siteSurveyVerified = updates.siteSurveyVerified;
    if (updates.siteSurveyVerifiedAt !== undefined) checklistToSave.siteSurveyVerifiedAt = updates.siteSurveyVerifiedAt;
    if (updates.siteSurveyVerifiedBy !== undefined) checklistToSave.siteSurveyVerifiedBy = updates.siteSurveyVerifiedBy;

    baseFields.push('checklist = ?');
    baseValues.push(JSON.stringify(checklistToSave));

    const user = (req as any).user;
    if (user?.role === 'Super Admin' || user?.role === 'CEO' || updates.lastModifiedRole === 'Super Admin') {
      const modifierName = user?.name || updates.lastModifiedBy || 'Super Admin';
      const modifierRole = user?.role || updates.lastModifiedRole || 'Super Admin';
      const modifiedAt = new Date().toISOString();
      baseFields.push('last_modified_by = ?'); baseValues.push(modifierName);
      baseFields.push('last_modified_role = ?'); baseValues.push(modifierRole);
      baseFields.push('last_modified_at = ?'); baseValues.push(modifiedAt);

      try {
        const [currP]: any = await pool.query('SELECT edit_history FROM projects WHERE id = ? LIMIT 1', [id]);
        let history: any[] = [];
        if (currP && currP.length > 0 && currP[0].edit_history) {
          history = typeof currP[0].edit_history === 'string' ? JSON.parse(currP[0].edit_history) : currP[0].edit_history;
        }
        history.push({
          timestamp: modifiedAt,
          editedBy: modifierName,
          editorRole: modifierRole,
          changesSummary: Object.keys(updates).filter(k => !['lastModifiedBy', 'lastModifiedRole', 'lastModifiedAt', 'editHistory'].includes(k)).join(', ') || 'Project updated'
        });
        baseFields.push('edit_history = ?'); baseValues.push(JSON.stringify(history));
      } catch (histErr) {
        console.warn('Could not update project edit history:', histErr);
      }
    }

    const extendedFields = [...baseFields];
    const extendedValues = [...baseValues];

    if (updates.scheduledInstallationDate !== undefined || updates.scheduled_installation_date !== undefined) { 
      extendedFields.push('scheduled_installation_date = ?'); 
      extendedValues.push(updates.scheduledInstallationDate || updates.scheduled_installation_date); 
    }
    if (updates.assignedCrewMembers !== undefined || updates.assigned_crew_members !== undefined) {
      extendedFields.push('assigned_crew_members = ?');
      const crewVal = updates.assignedCrewMembers || updates.assigned_crew_members;
      extendedValues.push(Array.isArray(crewVal) ? JSON.stringify(crewVal) : crewVal);
    }

    // Advance Payment Fields
    if (updates.advancePaymentReceived !== undefined) { extendedFields.push('advance_payment_received = ?'); extendedValues.push(updates.advancePaymentReceived ? 1 : 0); }
    if (updates.advancePaymentAmount !== undefined) { extendedFields.push('advance_payment_amount = ?'); extendedValues.push(updates.advancePaymentAmount); }
    if (updates.advancePaymentMode !== undefined) { extendedFields.push('advance_payment_mode = ?'); extendedValues.push(updates.advancePaymentMode); }
    if (updates.advancePaymentRef !== undefined) { extendedFields.push('advance_payment_ref = ?'); extendedValues.push(updates.advancePaymentRef); }
    if (updates.advancePaymentDate !== undefined) { extendedFields.push('advance_payment_date = ?'); extendedValues.push(updates.advancePaymentDate); }
    if (updates.advancePaymentNotes !== undefined) { extendedFields.push('advance_payment_notes = ?'); extendedValues.push(updates.advancePaymentNotes); }

    // DISCOM Net Metering Paperwork
    if (updates.discomNetMeteringFee !== undefined) { extendedFields.push('discom_net_metering_fee = ?'); extendedValues.push(updates.discomNetMeteringFee); }
    if (updates.discomFeeReceiptUrl !== undefined) { extendedFields.push('discom_fee_receipt_url = ?'); extendedValues.push(updates.discomFeeReceiptUrl); }
    if (updates.discomAgreementSigned !== undefined) { extendedFields.push('discom_agreement_signed = ?'); extendedValues.push(updates.discomAgreementSigned ? 1 : 0); }
    if (updates.discomAgreementDocUrl !== undefined) { extendedFields.push('discom_agreement_doc_url = ?'); extendedValues.push(updates.discomAgreementDocUrl); }

    // Installation Commitment Window
    if (updates.installationTargetDays !== undefined) { extendedFields.push('installation_target_days = ?'); extendedValues.push(updates.installationTargetDays); }
    if (updates.installationDurationDays !== undefined) { extendedFields.push('installation_duration_days = ?'); extendedValues.push(updates.installationDurationDays); }
    if (updates.materialArrivedOnSite !== undefined) { extendedFields.push('material_arrived_on_site = ?'); extendedValues.push(updates.materialArrivedOnSite ? 1 : 0); }
    if (updates.materialArrivedConfirmedAt !== undefined) { extendedFields.push('material_arrived_confirmed_at = ?'); extendedValues.push(updates.materialArrivedConfirmedAt); }
    if (updates.materialArrivedConfirmedBy !== undefined) { extendedFields.push('material_arrived_confirmed_by = ?'); extendedValues.push(updates.materialArrivedConfirmedBy); }
    if (updates.siteSurveyVerified !== undefined) { extendedFields.push('site_survey_verified = ?'); extendedValues.push(updates.siteSurveyVerified ? 1 : 0); }
    if (updates.siteSurveyVerifiedAt !== undefined) { extendedFields.push('site_survey_verified_at = ?'); extendedValues.push(updates.siteSurveyVerifiedAt); }
    if (updates.siteSurveyVerifiedBy !== undefined) { extendedFields.push('site_survey_verified_by = ?'); extendedValues.push(updates.siteSurveyVerifiedBy); }
    if (updates.attendancePhotoUrl !== undefined) { extendedFields.push('attendance_photo_url = ?'); extendedValues.push(updates.attendancePhotoUrl); }

    // Post-Installation Geotagged Photos & 20-Sec Live Video Gate
    if (updates.postInstallPhotos !== undefined) { extendedFields.push('post_install_photos = ?'); extendedValues.push(typeof updates.postInstallPhotos === 'string' ? updates.postInstallPhotos : JSON.stringify(updates.postInstallPhotos)); }
    if (updates.commissioningVideoUrl !== undefined) { extendedFields.push('commissioning_video_url = ?'); extendedValues.push(updates.commissioningVideoUrl); }
    if (updates.pmClearanceStatus !== undefined) { extendedFields.push('pm_clearance_status = ?'); extendedValues.push(updates.pmClearanceStatus); }
    if (updates.pmClearedBy !== undefined) { extendedFields.push('pm_cleared_by = ?'); extendedValues.push(updates.pmClearedBy); }
    if (updates.pmClearedAt !== undefined) { extendedFields.push('pm_cleared_at = ?'); extendedValues.push(updates.pmClearedAt); }

    // DISCOM Grid Synchronization & AMC
    if (updates.ebInspectionCleared !== undefined) { extendedFields.push('eb_inspection_cleared = ?'); extendedValues.push(updates.ebInspectionCleared ? 1 : 0); }
    if (updates.solarMeterFixed !== undefined) { extendedFields.push('solar_meter_fixed = ?'); extendedValues.push(updates.solarMeterFixed ? 1 : 0); }
    if (updates.solarMeterInitialReading !== undefined) { extendedFields.push('solar_meter_initial_reading = ?'); extendedValues.push(updates.solarMeterInitialReading); }
    if (updates.gridLiveDate !== undefined) { extendedFields.push('grid_live_date = ?'); extendedValues.push(updates.gridLiveDate); }
    if (updates.amcWarrantyYears !== undefined) { extendedFields.push('amc_warranty_years = ?'); extendedValues.push(updates.amcWarrantyYears); }

    // If advance payment is recorded, automatically record in accounts payments
    if (updates.recordAdvancePayment && updates.advancePaymentAmount) {
      try {
        const payId = `PAY-ADV-${Date.now().toString().slice(-6)}`;
        await pool.query(
          `INSERT INTO payments (id, payment_number, invoice_id, project_id, customer_id, customer_name, amount, payment_date, payment_mode, transaction_reference, status, recorded_by, is_advance, quotation_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Verified', ?, 1, ?)`,
          [
            payId,
            payId,
            '',
            id,
            updates.customerId || '',
            updates.customerName || '',
            updates.advancePaymentAmount,
            updates.advancePaymentDate || new Date().toISOString().split('T')[0],
            updates.advancePaymentMode || 'NEFT/RTGS',
            updates.advancePaymentRef || 'ADV-REF',
            updates.recordedBy || user?.name || 'Sales Manager',
            updates.quotationId || ''
          ]
        );
      } catch (payErr) {
        console.warn('Could not auto-insert advance into payments table:', payErr);
      }
    }

    // If Grid Live is activated, automatically create AMC contract in Service Team portal
    if (updates.activateGridLive) {
      try {
        const amcYears = Number(updates.amcWarrantyYears) || 5;
        const startDate = new Date().toISOString().split('T')[0];
        const endYear = new Date().getFullYear() + amcYears;
        const endDate = `${endYear}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`;
        const amcId = `AMC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        await pool.query(
          `INSERT INTO amc_contracts (id, customer_id, customer_name, customer_phone, customer_address, project_id, capacity_kw, plan_name, warranty_years, start_date, end_date, status, visits_per_year)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 2)`,
          [
            amcId,
            updates.customerId || '',
            updates.customerName || '',
            updates.customerPhone || '',
            updates.customerAddress || '',
            id,
            updates.capacityKw || 5,
            `${amcYears}-Year EPC Care`,
            amcYears,
            startDate,
            endDate
          ]
        );
      } catch (amcErr) {
        console.warn('Could not auto-insert AMC contract:', amcErr);
      }
    }

    if (extendedFields.length > 0) {
      try {
        await pool.query(`UPDATE projects SET ${extendedFields.join(', ')} WHERE id = ?`, [...extendedValues, id]);
      } catch (extendedErr) {
        // Fallback to base known columns if custom columns don't exist in MySQL table
        if (baseFields.length > 0) {
          try {
            await pool.query(`UPDATE projects SET ${baseFields.join(', ')} WHERE id = ?`, [...baseValues, id]);
          } catch (baseErr) {
            console.warn('Base project update warning:', baseErr);
          }
        }
      }
    }

    res.json({ success: true, id, updates });
  } catch (err: any) {
    console.error('Error updating project:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/projects/:id/confirm-readiness
 * Step 6 of Workflow: Project Manager confirms site readiness before installation starts.
 * Unlocks physical installation execution and notifies the Installation Team.
 */
export const confirmSiteReadiness = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      scheduledInstallationDate,
      siteReadinessNotes,
      shadowFreeConfirmed,
      civilIntegrityConfirmed,
      electricalClearanceConfirmed,
    } = req.body;

    const [rows]: any = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    const project = rows[0];

    const notesSummary = [
      siteReadinessNotes || '',
      shadowFreeConfirmed ? '✓ Shadow-free roof clearance verified' : '',
      civilIntegrityConfirmed ? '✓ Civil structure integrity & anchor points approved' : '',
      electricalClearanceConfirmed ? '✓ LT panel & electrical tie-in clearance verified' : '',
    ].filter(Boolean).join(' | ');

    await pool.query(
      `UPDATE projects 
       SET site_readiness_confirmed = 1,
           site_readiness_date = NOW(),
           site_readiness_notes = ?,
           scheduled_installation_date = ?,
           stage = 'Installation Scheduled'
       WHERE id = ?`,
      [notesSummary, scheduledInstallationDate || null, id]
    );

    // Notify Installation Team that site is ready
    await createNotification({
      recipientRole: 'Installation Team',
      title: `Site Readiness Approved (${id})`,
      message: `Project Manager confirmed site readiness for Project ${id} (${project.customer_name}). Installation scheduled for ${scheduledInstallationDate || 'Immediately'}. Installation team may now start physical works.`,
      type: 'success',
    });

    res.json({
      success: true,
      message: 'Site readiness confirmed by Project Manager. Installation team cleared to begin execution.',
      project: {
        id,
        siteReadinessConfirmed: true,
        scheduledInstallationDate,
        stage: 'Installation Scheduled',
      },
    });
  } catch (err: any) {
    console.error('Error confirming site readiness:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
