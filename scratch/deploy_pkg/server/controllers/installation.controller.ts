import { Request, Response } from 'express';
import { pool } from '../db.js';

/**
 * POST /api/installation/attendance
 * Records daily field team attendance for an installation project
 */
export async function recordAttendance(req: Request, res: Response): Promise<void> {
  try {
    const {
      projectId,
      leadId,
      date,
      presentTeamMembers,
      siteLeadName,
      latitude,
      longitude,
      checkInTime,
      notes,
    } = req.body;

    if (!projectId || !siteLeadName) {
      res.status(400).json({ success: false, error: 'Project ID and Site Lead Name are required' });
      return;
    }

    const id = `ATT-${Date.now().toString().slice(-6)}`;
    const attendanceDate = date || new Date().toISOString().split('T')[0];
    const time = checkInTime || new Date().toTimeString().split(' ')[0];

    await pool.query(
      `INSERT INTO installation_attendance
        (id, project_id, lead_id, date, present_team_members, site_lead_name, latitude, longitude, check_in_time, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        projectId,
        leadId || null,
        attendanceDate,
        Array.isArray(presentTeamMembers) ? JSON.stringify(presentTeamMembers) : JSON.stringify([presentTeamMembers || siteLeadName]),
        siteLeadName,
        latitude || null,
        longitude || null,
        time,
        notes || '',
      ]
    );

    res.json({
      success: true,
      attendance: {
        id,
        projectId,
        date: attendanceDate,
        siteLeadName,
        checkInTime: time,
      },
    });
  } catch (error: any) {
    console.error('Error recording installation attendance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/installation/attendance/:projectId
 * Returns attendance logs for a project
 */
export async function getProjectAttendance(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const [rows]: any = await pool.query(
      'SELECT * FROM installation_attendance WHERE project_id = ? ORDER BY date DESC, check_in_time DESC',
      [projectId]
    );

    const attendance = rows.map((r: any) => ({
      id: r.id,
      projectId: r.project_id,
      date: r.date,
      siteLeadName: r.site_lead_name,
      checkInTime: r.check_in_time,
      latitude: r.latitude,
      longitude: r.longitude,
      presentTeamMembers: typeof r.present_team_members === 'string' ? JSON.parse(r.present_team_members) : r.present_team_members,
      notes: r.notes,
      createdAt: r.created_at,
    }));

    res.json({ success: true, attendance });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/installation/progress
 * Logs a progress milestone with completion percentage and verification notes
 */
export async function logProgress(req: Request, res: Response): Promise<void> {
  try {
    const {
      projectId,
      milestone,
      status,
      percentageCompleted,
      loggedBy,
      notes,
    } = req.body;

    if (!projectId || !milestone) {
      res.status(400).json({ success: false, error: 'Project ID and milestone name are required' });
      return;
    }

    const id = `PRG-${Date.now().toString().slice(-6)}`;
    const pct = Number(percentageCompleted) || 0;

    await pool.query(
      `INSERT INTO installation_progress_logs
        (id, project_id, milestone, status, percentage_completed, logged_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        projectId,
        milestone,
        status || 'Completed',
        pct,
        loggedBy || (req as any).user?.name || 'Installation Lead',
        notes || '',
      ]
    );

    // Update project stage if 100% completed
    if (pct === 100 && milestone.toLowerCase().includes('commission')) {
      await pool.query(
        "UPDATE projects SET stage = 'Commissioning', commissioning_date = CURDATE() WHERE id = ?",
        [projectId]
      );
    }

    res.json({
      success: true,
      progressLog: {
        id,
        projectId,
        milestone,
        status: status || 'Completed',
        percentageCompleted: pct,
      },
    });
  } catch (error: any) {
    console.error('Error logging installation progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/installation/command-centre/:projectId
 * Returns the Master Consolidated 6-Card Command Centre dataset for Project Manager
 */
export async function getProjectCommandCentre(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;

    // 1. Project Header
    const [projectRows]: any = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!projectRows || projectRows.length === 0) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }
    const project = projectRows[0];

    // 2. Linked Survey
    let survey: any = null;
    if (project.quotation_id) {
      const [qRows]: any = await pool.query('SELECT survey_id FROM quotations WHERE id = ?', [project.quotation_id]);
      if (qRows.length > 0 && qRows[0].survey_id) {
        const [sRows]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [qRows[0].survey_id]);
        if (sRows.length > 0) survey = sRows[0];
      }
    }

    // 3. Customer Identity Document (metadata only)
    let customerDoc: any = null;
    const [docRows]: any = await pool.query(
      'SELECT id, customer_id, document_type, id_number_masked, is_verified, created_at FROM customer_documents WHERE customer_id = ? OR project_id = ? LIMIT 1',
      [project.customer_id, projectId]
    );
    if (docRows.length > 0) customerDoc = docRows[0];

    // 4. Engineering Bill of Materials (BOM)
    let bom: any = null;
    let bomItems: any[] = [];
    if (project.bom_id) {
      const [bRows]: any = await pool.query('SELECT * FROM project_boms WHERE id = ?', [project.bom_id]);
      if (bRows.length > 0) {
        bom = bRows[0];
        const [iRows]: any = await pool.query('SELECT * FROM bom_items WHERE bom_id = ?', [bom.id]);
        bomItems = iRows;
      }
    }

    // 5. Purchase Orders & GRNs
    const [poRows]: any = await pool.query('SELECT * FROM purchase_orders WHERE project_id = ?', [projectId]);
    const [grnRows]: any = await pool.query('SELECT * FROM goods_receipt_notes WHERE project_id = ?', [projectId]);

    // 6. Installation Attendance & Progress Logs
    const [attendanceRows]: any = await pool.query(
      'SELECT * FROM installation_attendance WHERE project_id = ? ORDER BY date DESC',
      [projectId]
    );
    const [progressRows]: any = await pool.query(
      'SELECT * FROM installation_progress_logs WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );

    res.json({
      success: true,
      commandCentre: {
        project,
        survey,
        customerDoc,
        bom,
        bomItems,
        purchaseOrders: poRows,
        goodsReceiptNotes: grnRows,
        attendance: attendanceRows,
        progressLogs: progressRows,
        materialReadiness: project.material_readiness_status || 'Pending Indent',
      },
    });
  } catch (error: any) {
    console.error('Error fetching Project Command Centre:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
