import { Request, Response } from 'express';
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
    res.json({ success: true, project: p });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.stage !== undefined) { fields.push('stage = ?'); values.push(updates.stage); }
    if (updates.checklist !== undefined) { fields.push('checklist = ?'); values.push(JSON.stringify(updates.checklist)); }
    if (updates.tasks !== undefined) { fields.push('tasks = ?'); values.push(JSON.stringify(updates.tasks)); }
    if (updates.commissioningDate !== undefined) { fields.push('commissioning_date = ?'); values.push(updates.commissioningDate); }
    if (updates.netMeterInstalledDate !== undefined) { fields.push('net_meter_installed_date = ?'); values.push(updates.netMeterInstalledDate); }
    if (updates.siteReadinessConfirmed !== undefined) { fields.push('site_readiness_confirmed = ?'); values.push(updates.siteReadinessConfirmed ? 1 : 0); }
    if (updates.siteReadinessNotes !== undefined) { fields.push('site_readiness_notes = ?'); values.push(updates.siteReadinessNotes); }
    if (updates.scheduledInstallationDate !== undefined) { fields.push('scheduled_installation_date = ?'); values.push(updates.scheduledInstallationDate); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err: any) {
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
