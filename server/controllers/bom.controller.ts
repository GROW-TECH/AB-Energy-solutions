import { Request, Response } from 'express';
import { pool } from '../db.js';
import { createQuotationDraftInternal } from './quotations.controller.js';

// 1. Get BOM for a Project or Survey
export const getBom = async (req: Request, res: Response) => {
  try {
    const { projectId, surveyId } = req.query;

    if (!projectId && !surveyId) {
      return res.status(400).json({ success: false, error: 'projectId or surveyId is required' });
    }

    let query = 'SELECT * FROM project_boms WHERE 1=1';
    const params: any[] = [];

    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }
    if (surveyId) {
      query += ' AND survey_id = ?';
      params.push(surveyId);
    }

    query += ' ORDER BY version DESC LIMIT 1';

    const [boms]: any = await pool.query(query, params);
    if (!boms || boms.length === 0) {
      return res.json({ success: true, bom: null });
    }

    const bom = boms[0];
    const [items]: any = await pool.query('SELECT * FROM bom_items WHERE bom_id = ? ORDER BY id ASC', [bom.id]);

    res.json({
      success: true,
      bom: {
        id: bom.id,
        projectId: bom.project_id,
        surveyId: bom.survey_id,
        version: bom.version,
        isEdited: Boolean(bom.is_edited) || (Number(bom.version) > 1),
        status: bom.status,
        preparedById: bom.prepared_by_id,
        preparedByName: bom.prepared_by_name,
        approvedById: bom.approved_by_id,
        approvedByName: bom.approved_by_name,
        totalEstimatedCost: Number(bom.total_estimated_cost) || 0,
        revisionComments: bom.revision_comments || '',
        createdAt: bom.created_at,
        updatedAt: bom.updated_at,
        items: (items || []).map((it: any) => ({
          id: it.id,
          bomId: it.bom_id,
          productId: it.product_id,
          category: it.category,
          itemName: it.item_name,
          technicalSpecification: it.technical_specification,
          brandMake: it.brand_make || '',
          quantity: Number(it.quantity) || 1,
          unit: it.unit || 'Nos',
          estimatedUnitCost: Number(it.estimated_unit_cost) || 0,
          estimatedTotalCost: Number(it.estimated_total_cost) || 0,
          remarks: it.remarks || '',
          photoUrl: it.photo_url || '',
        })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 2. Save or Update BOM (Survey Engineer, Project Manager, Super Admin)
export const saveBom = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      id,
      projectId = null,
      surveyId = null,
      items = [],
      status = 'Draft',
      revisionComments = ''
    } = req.body;

    const totalEstimatedCost = items.reduce(
      (sum: number, it: any) => sum + (Number(it.estimatedTotalCost) || (Number(it.quantity) || 1) * (Number(it.estimatedUnitCost) || 0)),
      0
    );

    const now = new Date().toISOString();
    let bomId = id;

    if (!bomId) {
      // Check if existing BOM exists for this survey/project
      let findQuery = 'SELECT id, version FROM project_boms WHERE 1=1';
      const findParams: any[] = [];
      if (surveyId) {
        findQuery += ' AND survey_id = ?';
        findParams.push(surveyId);
      } else if (projectId) {
        findQuery += ' AND project_id = ?';
        findParams.push(projectId);
      }
      findQuery += ' ORDER BY version DESC LIMIT 1';

      const [existing]: any = await pool.query(findQuery, findParams);
      if (existing && existing.length > 0) {
        bomId = existing[0].id;
      } else {
        bomId = `BOM-${Date.now().toString().slice(-6)}`;
      }
    }

    // Upsert project_boms
    const [existingBom]: any = await pool.query('SELECT * FROM project_boms WHERE id = ?', [bomId]);

    if (!existingBom || existingBom.length === 0) {
      await pool.query(
        `INSERT INTO project_boms 
          (id, project_id, survey_id, version, status, is_edited, prepared_by_id, prepared_by_name, total_estimated_cost, revision_comments, created_at, updated_at)
         VALUES (?, ?, ?, 1, ?, 0, ?, ?, ?, ?, ?, ?)`,
        [
          bomId,
          projectId,
          surveyId,
          status,
          user?.userId || user?.id || null,
          user?.name || user?.username || 'Survey Engineer',
          totalEstimatedCost,
          revisionComments,
          now,
          now,
        ]
      );
    } else {
      const prev = existingBom[0];
      const newVersion = (Number(prev.version) || 1) + 1;
      await pool.query(
        `UPDATE project_boms 
         SET status = ?, version = ?, is_edited = 1, total_estimated_cost = ?, revision_comments = ?, updated_at = ?
         WHERE id = ?`,
        [status, newVersion, totalEstimatedCost, revisionComments, now, bomId]
      );
    }

    // Sync line items: delete old and insert current
    await pool.query('DELETE FROM bom_items WHERE bom_id = ?', [bomId]);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const itemId = it.id || `BI-${Date.now().toString().slice(-5)}-${i + 1}`;
      const lineTotal = Number(it.estimatedTotalCost) || (Number(it.quantity) || 1) * (Number(it.estimatedUnitCost) || 0);

      await pool.query(
        `INSERT INTO bom_items 
          (id, bom_id, product_id, category, item_name, technical_specification, brand_make, quantity, unit, estimated_unit_cost, estimated_total_cost, remarks, photo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          bomId,
          it.productId || null,
          it.category || 'General',
          it.itemName || 'Custom Item',
          it.technicalSpecification || '',
          it.brandMake || '',
          Number(it.quantity) || 1,
          it.unit || 'Nos',
          Number(it.estimatedUnitCost) || 0,
          lineTotal,
          it.remarks || '',
          it.photoUrl || null,
        ]
      );
    }

    // Link bom_id in survey/project if present
    if (surveyId) {
      try {
        await pool.query('UPDATE site_surveys SET notes = CONCAT(IFNULL(notes, ""), " [BOM: ", ?, "]") WHERE id = ?', [bomId, surveyId]);
      } catch (_) {}
    }
    if (projectId) {
      try {
        await pool.query('UPDATE projects SET bom_id = ? WHERE id = ?', [bomId, projectId]);
      } catch (_) {}
    }

    res.json({
      success: true,
      bomId,
      status,
      totalEstimatedCost,
      itemsCount: items.length,
    });
  } catch (err: any) {
    console.error('Error saving BOM:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 3. Submit BOM for Review (Survey Engineer)
export const submitBomForReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();

    await pool.query(
      `UPDATE project_boms SET status = 'Submitted', updated_at = ? WHERE id = ?`,
      [now, id]
    );

    res.json({ success: true, id, status: 'Submitted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 4. Review BOM (Project Manager or Super Admin: Approve or Request Changes)
export const reviewBom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, comments = '' } = req.body; // action: 'Approve' | 'Request Changes'
    const user = (req as any).user;
    const now = new Date().toISOString();

    if (action === 'Approve') {
      await pool.query(
        `UPDATE project_boms 
         SET status = 'Approved', approved_by_id = ?, approved_by_name = ?, revision_comments = ?, updated_at = ?
         WHERE id = ?`,
        [user?.userId || null, user?.name || 'Project Manager', comments, now, id]
      );

      let createdQuotation: any = null;
      try {
        const [bomRows]: any = await pool.query('SELECT * FROM project_boms WHERE id = ?', [id]);
        if (bomRows && bomRows.length > 0 && bomRows[0].survey_id) {
          const bom = bomRows[0];
          const [itemsRows]: any = await pool.query('SELECT * FROM bom_items WHERE bom_id = ? ORDER BY id ASC', [id]);

          // Map BOM items to Quotation custom line items
          const mappedItems = itemsRows.map((it: any) => ({
            id: it.id,
            category: it.category || 'General',
            description: it.item_name || it.category,
            specification: it.technical_specification || '',
            make: it.brand_make || '',
            makeModel: `${it.brand_make || ''} ${it.technical_specification || ''}`.trim(),
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'Nos',
            unitPrice: Number(it.estimated_unit_cost) || 0,
          }));

          const resDraft = await createQuotationDraftInternal(pool, {
            surveyId: bom.survey_id,
            user,
            customItems: mappedItems.length > 0 ? mappedItems : undefined,
          });
          createdQuotation = resDraft.quotation;

          // Update survey status to Approved
          await pool.query(
            "UPDATE site_surveys SET status = 'Approved' WHERE id = ?",
            [bom.survey_id]
          );

          // Update lead status to ready for Sales
          const [surveyRows]: any = await pool.query('SELECT lead_id FROM site_surveys WHERE id = ?', [bom.survey_id]);
          if (surveyRows && surveyRows.length > 0 && surveyRows[0].lead_id) {
            await pool.query(
              "UPDATE leads SET status = 'Quotation Sent' WHERE id = ?",
              [surveyRows[0].lead_id]
            );
          }
        }
      } catch (qErr: any) {
        console.error('Auto quotation generation upon PM BOM approval notice:', qErr.message);
      }

      return res.json({ success: true, id, status: 'Approved', quotation: createdQuotation });
    } else if (action === 'Request Changes') {
      await pool.query(
        `UPDATE project_boms 
         SET status = 'Changes Requested', revision_comments = ?, updated_at = ?
         WHERE id = ?`,
        [comments, now, id]
      );
      return res.json({ success: true, id, status: 'Changes Requested' });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action. Must be "Approve" or "Request Changes".' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 5. Get all BOMs (for Survey Engineer and Project Manager views)
export const getAllBoms = async (req: Request, res: Response) => {
  try {
    const [boms]: any = await pool.query(`
      SELECT b.*, 
             s.customer_name as survey_customer_name, s.phone as survey_phone, s.recommended_kw as survey_kw, s.lead_id, s.status as survey_status, s.roof_type,
             p.customer_name as project_customer_name, p.capacity_kw as project_kw,
             (SELECT COUNT(*) FROM bom_items bi WHERE bi.bom_id COLLATE utf8mb4_unicode_ci = b.id COLLATE utf8mb4_unicode_ci) as items_count
      FROM project_boms b
      LEFT JOIN site_surveys s ON b.survey_id COLLATE utf8mb4_unicode_ci = s.id COLLATE utf8mb4_unicode_ci
      LEFT JOIN projects p ON b.project_id COLLATE utf8mb4_unicode_ci = p.id COLLATE utf8mb4_unicode_ci
      ORDER BY b.updated_at DESC
    `);

    res.json({
      success: true,
      boms: (boms || []).map((b: any) => ({
        id: b.id,
        projectId: b.project_id,
        surveyId: b.survey_id,
        leadId: b.lead_id,
        customerName: b.survey_customer_name || b.project_customer_name || 'Customer',
        phone: b.survey_phone || '',
        capacityKw: Number(b.survey_kw || b.project_kw || 0),
        roofType: b.roof_type || 'RCC Flat',
        version: b.version,
        isEdited: Boolean(b.is_edited) || (Number(b.version) > 1),
        status: b.status,
        preparedById: b.prepared_by_id,
        preparedByName: b.prepared_by_name,
        approvedById: b.approved_by_id,
        approvedByName: b.approved_by_name,
        totalEstimatedCost: Number(b.total_estimated_cost) || 0,
        revisionComments: b.revision_comments || '',
        itemsCount: Number(b.items_count) || 0,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

