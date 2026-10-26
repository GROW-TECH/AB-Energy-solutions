import { Request, Response } from 'express';
import { pool } from '../db.js';

/**
 * GET /api/procurement/orders
 * Returns list of purchase orders from MySQL database
 */
export async function getPurchaseOrders(req: Request, res: Response): Promise<void> {
  try {
    const { projectId, status } = req.query;
    let sql = 'SELECT * FROM purchase_orders';
    const params: any[] = [];
    const conditions: string[] = [];

    if (projectId) {
      conditions.push('project_id = ?');
      params.push(projectId);
    }
    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const [orders]: any = await pool.query(sql, params);

    // Fetch items for each PO
    for (const po of orders) {
      const [items]: any = await pool.query('SELECT * FROM purchase_order_items WHERE po_id = ?', [po.id]);
      po.items = items.map((it: any) => ({
        id: it.id,
        sku: it.sku,
        name: it.item_name,
        category: it.category,
        quantity: Number(it.quantity),
        unit: it.unit,
        unitPrice: Number(it.unit_price),
        totalAmount: Number(it.total_amount),
        receivedQuantity: Number(it.received_quantity || 0),
      }));

      // Fetch GRNs for this PO if any
      const [grns]: any = await pool.query('SELECT * FROM goods_receipt_notes WHERE po_id = ? ORDER BY created_at DESC', [po.id]);
      po.grns = grns;
    }

    res.json({ success: true, purchaseOrders: orders });
  } catch (error: any) {
    console.error('Error in getPurchaseOrders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/procurement/orders
 * Creates a new purchase order tied to a project BOM or standard indent
 */
export async function createPurchaseOrder(req: Request, res: Response): Promise<void> {
  try {
    const {
      projectId,
      bomId,
      supplierId,
      supplierName,
      deliveryWarehouse,
      expectedDeliveryDate,
      items,
      notes,
    } = req.body;

    if (!supplierName || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'Supplier and at least one item are required' });
      return;
    }

    const id = `PO-${Date.now().toString().slice(-6)}`;
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let subtotal = 0;
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.unitPrice) || 0;
      subtotal += qty * rate;
    }

    const taxAmount = Math.round(subtotal * 0.18); // 18% standard GST for solar equipment
    const grandTotal = subtotal + taxAmount;

    await pool.query(
      `INSERT INTO purchase_orders 
        (id, po_number, project_id, bom_id, supplier_id, supplier_name, delivery_warehouse, expected_delivery_date, status, subtotal, tax_amount, grand_total, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Issued', ?, ?, ?, ?)`,
      [
        id,
        poNumber,
        projectId || null,
        bomId || null,
        supplierId || null,
        supplierName,
        deliveryWarehouse || 'Central Warehouse',
        expectedDeliveryDate || null,
        subtotal,
        taxAmount,
        grandTotal,
        notes || '',
      ]
    );

    // Insert items
    for (const item of items) {
      const itemId = `POI-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.unitPrice) || 0;
      const itemTotal = qty * rate;

      await pool.query(
        `INSERT INTO purchase_order_items
          (id, po_id, sku, item_name, category, quantity, unit, unit_price, total_amount, received_quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          itemId,
          id,
          item.sku || 'SOL-ITEM',
          item.name || item.itemName || 'Material Item',
          item.category || 'General BOS',
          qty,
          item.unit || 'Nos',
          rate,
          itemTotal,
        ]
      );
    }

    // If linked to a project, update project readiness status to 'Procurement In Progress'
    if (projectId) {
      await pool.query(
        "UPDATE projects SET material_readiness_status = 'Procurement In Progress' WHERE id = ? AND (material_readiness_status = 'Pending Indent' OR material_readiness_status IS NULL)",
        [projectId]
      );
    }

    res.json({
      success: true,
      purchaseOrder: {
        id,
        poNumber,
        grandTotal,
        status: 'Issued',
      },
    });
  } catch (error: any) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/procurement/grn
 * Inwards material, creates a Goods Receipt Note (GRN), updates received quantities,
 * and sets project material readiness.
 */
export async function createGoodsReceiptNote(req: Request, res: Response): Promise<void> {
  try {
    const {
      poId,
      deliveryChallanNumber,
      supplierInvoiceNumber,
      receivedDate,
      receivedBy,
      deliveryWarehouse,
      items,
      notes,
    } = req.body;

    if (!poId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'PO ID and items are required' });
      return;
    }

    // Fetch PO
    const [poRows]: any = await pool.query('SELECT * FROM purchase_orders WHERE id = ?', [poId]);
    if (!poRows || poRows.length === 0) {
      res.status(404).json({ success: false, error: 'Purchase Order not found' });
      return;
    }
    const po = poRows[0];

    const grnId = `GRN-${Date.now().toString().slice(-6)}`;
    const grnNumber = `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let hasShortage = false;

    // Save GRN Header
    await pool.query(
      `INSERT INTO goods_receipt_notes
        (id, grn_number, po_id, project_id, delivery_challan_no, supplier_invoice_no, delivery_warehouse, received_date, verified_by, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Approved', ?)`,
      [
        grnId,
        grnNumber,
        poId,
        po.project_id || null,
        deliveryChallanNumber || '',
        supplierInvoiceNumber || '',
        deliveryWarehouse || po.delivery_warehouse || 'Site Warehouse',
        receivedDate || new Date().toISOString().split('T')[0],
        receivedBy || (req as any).user?.name || 'Store In-Charge',
        notes || '',
      ]
    );

    // Save GRN Items and update PO Items received quantities
    for (const item of items) {
      const grnItemId = `GRI-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const orderedQty = Number(item.orderedQuantity || item.quantity) || 0;
      const receivedQty = Number(item.receivedQuantity) || 0;
      const acceptedQty = Number(item.acceptedQuantity !== undefined ? item.acceptedQuantity : receivedQty);
      const rejectedQty = Number(item.rejectedQuantity || 0);

      if (acceptedQty < orderedQty) {
        hasShortage = true;
      }

      await pool.query(
        `INSERT INTO grn_items
          (id, grn_id, item_name, category, ordered_quantity, received_quantity, accepted_quantity, rejected_quantity, unit, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          grnItemId,
          grnId,
          item.name || item.itemName,
          item.category || 'Solar BOS',
          orderedQty,
          receivedQty,
          acceptedQty,
          rejectedQty,
          item.unit || 'Nos',
          item.remarks || '',
        ]
      );

      // Update PO Item cumulative received quantity
      if (item.id || item.poiId) {
        await pool.query(
          'UPDATE purchase_order_items SET received_quantity = received_quantity + ? WHERE id = ?',
          [acceptedQty, item.id || item.poiId]
        );
      }
    }

    // Determine new PO status
    const newPoStatus = hasShortage ? 'Partial Delivered' : 'Delivered';
    await pool.query(
      'UPDATE purchase_orders SET status = ?, grn_number = ?, delivery_challan_url = ? WHERE id = ?',
      [newPoStatus, grnNumber, deliveryChallanNumber || null, poId]
    );

    // Update project material readiness status if linked
    if (po.project_id) {
      const newReadiness = hasShortage ? 'Partial Shortage' : 'Fully Received at Site';
      await pool.query(
        'UPDATE projects SET material_readiness_status = ? WHERE id = ?',
        [newReadiness, po.project_id]
      );
    }

    res.json({
      success: true,
      grn: {
        id: grnId,
        grnNumber,
        poNumber: po.po_number,
        status: newPoStatus,
        materialReadiness: hasShortage ? 'Partial Shortage' : 'Fully Received at Site',
      },
    });
  } catch (error: any) {
    console.error('Error in createGoodsReceiptNote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/procurement/pending-indents
 * Returns projects whose BOM is approved by Project Manager but materials are not fully procured.
 */
export async function getPendingIndents(req: Request, res: Response): Promise<void> {
  try {
    const sql = `
      SELECT p.id as project_id, p.name as project_name, p.customer_name, p.system_size_kw, 
             p.material_readiness_status, p.status as project_status,
             b.id as bom_id, b.status as bom_status, b.total_estimated_cost
      FROM projects p
      INNER JOIN project_boms b ON p.bom_id = b.id
      WHERE b.status = 'Approved' 
        AND (p.material_readiness_status IS NULL OR p.material_readiness_status IN ('Pending Indent', 'Procurement In Progress', 'Partial Shortage'))
      ORDER BY p.created_at DESC
    `;
    const [indents]: any = await pool.query(sql);

    // Attach BOM items for each indent
    for (const ind of indents) {
      const [items]: any = await pool.query('SELECT * FROM bom_items WHERE bom_id = ?', [ind.bom_id]);
      ind.items = items;
    }

    res.json({ success: true, indents });
  } catch (error: any) {
    console.error('Error fetching pending indents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
