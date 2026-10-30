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

    const baseFields: string[] = [];
    const baseValues: any[] = [];

    if (updates.stage !== undefined) { baseFields.push('stage = ?'); baseValues.push(updates.stage); }
    if (updates.checklist !== undefined) { baseFields.push('checklist = ?'); baseValues.push(JSON.stringify(updates.checklist)); }
    if (updates.tasks !== undefined) { baseFields.push('tasks = ?'); baseValues.push(JSON.stringify(updates.tasks)); }
    if (updates.commissioningDate !== undefined) { baseFields.push('commissioning_date = ?'); baseValues.push(updates.commissioningDate); }
    if (updates.netMeterInstalledDate !== undefined) { baseFields.push('net_meter_installed_date = ?'); baseValues.push(updates.netMeterInstalledDate); }
    if (updates.siteReadinessConfirmed !== undefined) { baseFields.push('site_readiness_confirmed = ?'); baseValues.push(updates.siteReadinessConfirmed ? 1 : 0); }
    if (updates.siteReadinessNotes !== undefined) { baseFields.push('site_readiness_notes = ?'); baseValues.push(updates.siteReadinessNotes); }
    if (updates.targetCompletionDate !== undefined || updates.target_completion_date !== undefined) {
      baseFields.push('target_completion_date = ?');
      baseValues.push(updates.targetCompletionDate || updates.target_completion_date);
    }
    if (updates.installationLeadName !== undefined || updates.installation_lead_name !== undefined) {
      baseFields.push('installation_lead_name = ?');
      baseValues.push(updates.installationLeadName || updates.installation_lead_name);
    }
    if (updates.notes !== undefined) { baseFields.push('notes = ?'); baseValues.push(updates.notes); }

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
