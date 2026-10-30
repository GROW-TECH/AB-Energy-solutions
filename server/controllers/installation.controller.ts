import { Request, Response } from 'express';
import { pool } from '../db.js';
import { createNotification } from './notifications.controller.js';

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

    const membersArray = Array.isArray(presentTeamMembers)
      ? presentTeamMembers.map((m: any) => typeof m === 'string' ? m.trim() : String(m)).filter(Boolean)
      : (presentTeamMembers ? [String(presentTeamMembers).trim()] : [siteLeadName]);
    if (membersArray.length === 0) {
      membersArray.push(siteLeadName);
    }

    await pool.query(
      `INSERT INTO installation_attendance
        (id, project_id, lead_id, date, team_lead_name, site_lead_name, technicians_present, present_team_members, latitude, gps_lat, longitude, gps_lng, check_in_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        projectId,
        leadId || null,
        attendanceDate,
        siteLeadName,
        siteLeadName,
        JSON.stringify(membersArray),
        JSON.stringify(membersArray),
        latitude || null,
        latitude || null,
        longitude || null,
        longitude || null,
        time,
        'Present',
        notes || '',
      ]
    );

    // Notify Project Manager immediately
    try {
      const [pRows]: any = await pool.query('SELECT customer_name, id FROM projects WHERE id = ?', [projectId]);
      const customerLabel = pRows?.[0]?.customer_name ? `${pRows[0].customer_name} (${projectId})` : projectId;
      const memberCount = membersArray.length;
      const crewLabel = memberCount === 1 ? `Solo check-in (${siteLeadName})` : `${siteLeadName} & ${memberCount - 1} crew member(s)`;
      const gpsLabel = latitude && longitude ? ` [GPS: ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}]` : '';

      await createNotification({
        recipientRole: 'Project Manager',
        title: 'Installation Crew Checked In on Site',
        message: `${crewLabel} arrived at ${customerLabel} and checked in at ${time}${gpsLabel}.`,
        type: 'success',
        link: '/projects',
      });
    } catch (notifErr: any) {
      console.error('Error dispatching PM attendance notification:', notifErr.message);
    }

    res.json({
      success: true,
      attendance: {
        id,
        projectId,
        date: attendanceDate,
        siteLeadName,
        presentTeamMembers: membersArray,
        latitude: latitude || null,
        longitude: longitude || null,
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

    const attendance = rows.map((r: any) => {
      let members: string[] = [];
      if (r.present_team_members) {
        if (typeof r.present_team_members === 'string') {
          try {
            const parsed = JSON.parse(r.present_team_members);
            members = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            members = r.present_team_members.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        } else if (Array.isArray(r.present_team_members)) {
          members = r.present_team_members;
        }
      } else if (r.technicians_present) {
        members = r.technicians_present.split(',').map((s: string) => s.trim()).filter(Boolean);
      } else {
        members = [r.site_lead_name || r.team_lead_name || 'Site Crew'];
      }

      return {
        id: r.id,
        projectId: r.project_id,
        date: r.date,
        siteLeadName: r.site_lead_name || r.team_lead_name,
        checkInTime: r.check_in_time,
        latitude: r.latitude || r.gps_lat,
        longitude: r.longitude || r.gps_lng,
        presentTeamMembers: members,
        notes: r.notes,
        createdAt: r.created_at,
      };
    });

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
    try {
      const [docRows]: any = await pool.query(
        'SELECT * FROM customer_documents WHERE customer_id = ? OR project_id = ? LIMIT 1',
        [project.customer_id, projectId]
      );
      if (docRows.length > 0) {
        const d = docRows[0];
        customerDoc = {
          id: d.id,
          customerId: d.customer_id,
          documentType: d.document_type || 'ID Proof',
          idNumberMasked: d.id_number ? `${d.id_number.slice(0, 4)}XXXX${d.id_number.slice(-4)}` : 'Verified',
          isVerified: true,
          createdAt: d.uploaded_at || d.created_at || new Date().toISOString(),
        };
      }
    } catch (docErr) {
      console.error('Error fetching customer doc in CC:', docErr);
    }

    // 4. Engineering Bill of Materials (BOM)
    let bom: any = null;
    let bomItems: any[] = [];
    if (project.bom_id) {
      try {
        const [bRows]: any = await pool.query('SELECT * FROM project_boms WHERE id = ?', [project.bom_id]);
        if (bRows.length > 0) {
          bom = bRows[0];
          const [iRows]: any = await pool.query('SELECT * FROM bom_items WHERE bom_id = ?', [bom.id]);
          bomItems = iRows;
        }
      } catch (bomErr) {
        console.error('Error fetching BOM in CC:', bomErr);
      }
    }

    // 5. Purchase Orders & GRNs
    let poRows: any[] = [];
    let grnRows: any[] = [];
    try {
      const [pos]: any = await pool.query('SELECT * FROM purchase_orders WHERE project_id = ?', [projectId]);
      poRows = pos || [];
      const [grns]: any = await pool.query('SELECT * FROM goods_receipt_notes WHERE project_id = ?', [projectId]);
      grnRows = grns || [];
    } catch (pErr) {
      console.error('Error fetching PO/GRN in CC:', pErr);
    }

    // 6. Installation Attendance & Progress Logs
    let attendance: any[] = [];
    let progressRows: any[] = [];
    try {
      const [attRows]: any = await pool.query(
        'SELECT * FROM installation_attendance WHERE project_id = ? ORDER BY date DESC, check_in_time DESC',
        [projectId]
      );
      attendance = (attRows || []).map((r: any) => {
        let members: string[] = [];
        if (r.present_team_members) {
          if (typeof r.present_team_members === 'string') {
            try {
              const parsed = JSON.parse(r.present_team_members);
              members = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              members = r.present_team_members.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          } else if (Array.isArray(r.present_team_members)) {
            members = r.present_team_members;
          }
        } else if (r.technicians_present) {
          members = r.technicians_present.split(',').map((s: string) => s.trim()).filter(Boolean);
        } else {
          members = [r.site_lead_name || r.team_lead_name || 'Site Crew'];
        }

        return {
          id: r.id,
          projectId: r.project_id,
          date: r.date,
          siteLeadName: r.site_lead_name || r.team_lead_name || 'Site Lead',
          check_in_time: r.check_in_time || '09:00',
          latitude: r.latitude || r.gps_lat,
          longitude: r.longitude || r.gps_lng,
          presentTeamMembers: members,
          notes: r.notes,
        };
      });

      const [progs]: any = await pool.query(
        'SELECT * FROM installation_progress_logs WHERE project_id = ? ORDER BY created_at DESC',
        [projectId]
      );
      progressRows = progs || [];
    } catch (attErr) {
      console.error('Error fetching attendance in CC:', attErr);
    }

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
        attendance,
        progressLogs: progressRows,
        materialReadiness: project.material_readiness_status || 'Pending Indent',
      },
    });
  } catch (error: any) {
    console.error('Error fetching Project Command Centre:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/installation/schedule
 * Saves the PM installation kickoff date and assigned crew members for a project
 */
export async function scheduleInstallation(req: Request, res: Response): Promise<void> {
  try {
    const { projectId, scheduledDate, installationLeadName, crewMembers } = req.body;

    if (!projectId) {
      res.status(400).json({ success: false, error: 'Project ID is required' });
      return;
    }

    const crewArray = Array.isArray(crewMembers) ? crewMembers : [];

    try {
      await pool.query(
        `UPDATE projects 
         SET target_completion_date = COALESCE(?, target_completion_date),
             scheduled_installation_date = COALESCE(?, scheduled_installation_date),
             installation_lead_name = COALESCE(?, installation_lead_name),
             assigned_crew_members = ?
         WHERE id = ?`,
        [scheduledDate || null, scheduledDate || null, installationLeadName || null, JSON.stringify(crewArray), projectId]
      );
    } catch (dbErr: any) {
      try {
        await pool.query(
          `UPDATE projects 
           SET target_completion_date = COALESCE(?, target_completion_date),
               installation_lead_name = COALESCE(?, installation_lead_name)
           WHERE id = ?`,
          [scheduledDate || null, installationLeadName || null, projectId]
        );
      } catch (innerErr) {
        console.warn('Could not update project schedule in DB:', innerErr);
      }
    }

    try {
      await createNotification({
        recipientRole: 'Installation Team',
        type: 'info',
        title: 'Installation Scheduled',
        message: `Project ${projectId} kickoff scheduled for ${scheduledDate || 'upcoming date'} with ${crewArray.length} assigned crew members.`,
        entityId: projectId,
        actionUrl: `/projects`,
      });
    } catch {}

    res.json({
      success: true,
      projectId,
      scheduledDate,
      installationLeadName,
      crewMembers: crewArray,
      message: 'Installation schedule and crew assignments saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving installation schedule:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
