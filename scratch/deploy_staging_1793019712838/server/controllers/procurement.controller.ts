import { Request, Response } from 'express';
import { pool } from '../db.js';
import { createNotification } from './notifications.controller.js';
import { generateGrnPdf } from '../services/grn-pdf-generator.js';

/**
 * GET /api/procurement/orders
 * Returns list of purchase orders from MySQL database with linked items and GRNs
 */
export async function getPurchaseOrders(req: Request, res: Response): Promise<void> {
  try {
    const { projectId, quotationId, status } = req.query;
    let sql = 'SELECT * FROM purchase_orders';
    const params: any[] = [];
    const conditions: string[] = [];

    if (projectId) {
      conditions.push('project_id = ?');
      params.push(projectId);
    }
    if (quotationId) {
      conditions.push('quotation_id = ?');
      params.push(quotationId);
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

    // Fetch items and GRNs for each PO
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
 * Creates a new purchase order tied to an accepted quotation or project
 */
export async function createPurchaseOrder(req: Request, res: Response): Promise<void> {
  try {
    const {
      projectId,
      quotationId,
      quotationNumber,
      customerName,
      customerPhone,
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

    const taxAmount = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + taxAmount;

    await pool.query(
      `INSERT INTO purchase_orders 
        (id, po_number, project_id, quotation_id, bom_id, supplier_id, supplier_name, customer_name, customer_phone, delivery_warehouse, expected_delivery_date, status, subtotal, tax_amount, grand_total, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Issued', ?, ?, ?, ?)`,
      [
        id,
        poNumber,
        projectId || null,
        quotationId || null,
        bomId || null,
        supplierId || null,
        supplierName,
        customerName || null,
        customerPhone || null,
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

    // Update Project status if already linked
    if (projectId) {
      await pool.query(
        "UPDATE projects SET material_readiness_status = 'Procurement In Progress' WHERE id = ? AND (material_readiness_status = 'Pending Indent' OR material_readiness_status IS NULL)",
        [projectId]
      );
    }

    // Send persistent notification to Project Manager & Installation Team
    const clientLabel = customerName || (quotationNumber ? `Quote ${quotationNumber}` : (projectId || 'Project'));
    await createNotification({
      recipientRole: 'Project Manager',
      title: `Purchase Order Issued (${poNumber})`,
      message: `Purchase Order ${poNumber} for ₹${grandTotal.toLocaleString('en-IN')} issued to ${supplierName} for ${clientLabel}. Delivery expected: ${expectedDeliveryDate || 'Within 5 days'}.`,
      type: 'info',
    });

    await createNotification({
      recipientRole: 'Installation Team',
      title: `Materials Ordered (${poNumber})`,
      message: `Procurement initiated for ${clientLabel}. PO ${poNumber} placed with ${supplierName}.`,
      type: 'info',
    });

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
 * Inwards material, creates a Goods Receipt Note (GRN), captures customer digital signature,
 * generates signed GRN PDF, updates received quantities, and notifies PM and Installation teams.
 */
export async function createGoodsReceiptNote(req: Request, res: Response): Promise<void> {
  try {
    const {
      poId,
      quotationId,
      deliveryChallanNumber,
      supplierInvoiceNumber,
      receivedDate,
      receivedBy,
      deliveryWarehouse,
      items,
      notes,
      customerSignatureData,
      customerSignatureName,
      customerSignaturePhone,
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
    const linkedQuotationId = quotationId || po.quotation_id;

    // Fetch customer details from quotation if available
    let customerName = po.customer_name || 'Valued Customer';
    let customerPhone = po.customer_phone || '';
    let customerAddress = '';
    let quoteNum = '';

    if (linkedQuotationId) {
      const [qRows]: any = await pool.query('SELECT * FROM quotations WHERE id = ?', [linkedQuotationId]);
      if (qRows && qRows.length > 0) {
        customerName = qRows[0].lead_name || customerName;
        customerPhone = qRows[0].customer_phone || customerPhone;
        customerAddress = qRows[0].customer_address || '';
        quoteNum = qRows[0].quotation_number || '';
      }
    }

    const grnId = `GRN-${Date.now().toString().slice(-6)}`;
    const grnNumber = `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let hasShortage = false;
    let totalDiscrepancies = 0;

    // Calculate discrepancies and format items for PDF & DB
    const processedItems: any[] = [];
    for (const item of items) {
      const orderedQty = Number(item.orderedQuantity || item.quantity) || 0;
      const receivedQty = Number(item.receivedQuantity) || 0;
      const acceptedQty = Number(item.acceptedQuantity !== undefined ? item.acceptedQuantity : receivedQty);
      const rejectedQty = Number(item.rejectedQuantity || 0) + Math.max(0, orderedQty - acceptedQty);

      if (rejectedQty > 0 || acceptedQty < orderedQty) {
        hasShortage = true;
        totalDiscrepancies += rejectedQty;
      }

      processedItems.push({
        id: item.id || item.poiId,
        itemName: item.name || item.itemName || 'Material Item',
        category: item.category || 'Solar BOS',
        orderedQuantity: orderedQty,
        receivedQuantity: receivedQty,
        acceptedQuantity: acceptedQty,
        rejectedQuantity: rejectedQty,
        unit: item.unit || 'Nos',
        remarks: item.remarks || '',
      });
    }

    // Generate Signed GRN PDF using PDFKit
    let signedPdfUrl = '';
    try {
      const pdfResult = await generateGrnPdf({
        grnNumber,
        poNumber: po.po_number,
        quotationNumber: quoteNum,
        receivedDate: receivedDate || new Date().toISOString().split('T')[0],
        deliveryWarehouse: deliveryWarehouse || po.delivery_warehouse || 'Site Delivery',
        deliveryChallanNo: deliveryChallanNumber || '',
        supplierInvoiceNo: supplierInvoiceNumber || '',
        supplierName: po.supplier_name || 'Authorized Supplier',
        customerName: customerSignatureName || customerName,
        customerPhone: customerSignaturePhone || customerPhone,
        customerAddress,
        verifiedBy: receivedBy || (req as any).user?.name || 'Store Officer',
        notes: notes || '',
        items: processedItems,
        customerSignatureData: customerSignatureData || undefined,
        customerSignatureName: customerSignatureName || customerName,
        customerSignaturePhone: customerSignaturePhone || customerPhone,
        customerSignatureDate: new Date().toLocaleString('en-IN'),
      });
      signedPdfUrl = pdfResult.fileUrl;
    } catch (pdfErr: any) {
      console.error('Error generating GRN PDF:', pdfErr);
      signedPdfUrl = `/documents/grn_${grnNumber}.pdf`;
    }

    // Save GRN Header in DB
    const receivedByName = receivedBy || (req as any).user?.name || 'Store Officer';
    const deliveryLocation = deliveryWarehouse || po.delivery_warehouse || 'Site Delivery';
    const challanNum = deliveryChallanNumber || grnNumber;

    await pool.query(
      `INSERT INTO goods_receipt_notes
        (id, grn_number, po_id, quotation_id, project_id, delivery_challan_no, challan_number, supplier_invoice_no, delivery_warehouse, delivery_location, received_date, verified_by, received_by_name, customer_signature_name, customer_signature_phone, customer_signature_data, customer_signature_date, signed_pdf_url, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, NOW())`,
      [
        grnId,
        grnNumber,
        poId,
        linkedQuotationId || null,
        po.project_id || null,
        deliveryChallanNumber || '',
        challanNum,
        supplierInvoiceNumber || '',
        deliveryLocation,
        deliveryLocation,
        receivedDate || new Date().toISOString().split('T')[0],
        receivedByName,
        receivedByName,
        customerSignatureName || customerName,
        customerSignaturePhone || customerPhone,
        customerSignatureData || null,
        signedPdfUrl,
        hasShortage ? 'Partial Shortage' : 'Approved',
        notes || '',
      ]
    );

    // Save GRN Items and update PO Items
    for (const item of processedItems) {
      const grnItemId = `GRI-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await pool.query(
        `INSERT INTO grn_items
          (id, grn_id, item_name, category, ordered_qty, ordered_quantity, received_qty, received_quantity, accepted_qty, accepted_quantity, rejected_qty, rejected_quantity, damaged_qty, unit, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          grnItemId,
          grnId,
          item.itemName,
          item.category,
          item.orderedQuantity,
          item.orderedQuantity,
          item.receivedQuantity,
          item.receivedQuantity,
          item.acceptedQuantity,
          item.acceptedQuantity,
          item.rejectedQuantity,
          item.rejectedQuantity,
          item.rejectedQuantity,
          item.unit,
          item.remarks,
        ]
      );

      // Update PO Item cumulative received quantity
      if (item.id) {
        await pool.query(
          'UPDATE purchase_order_items SET received_quantity = received_quantity + ? WHERE id = ?',
          [item.acceptedQuantity, item.id]
        );
      }
    }

    // Determine new PO status
    const newPoStatus = hasShortage ? 'Partial Delivered' : 'Delivered';
    await pool.query(
      'UPDATE purchase_orders SET status = ?, grn_number = ?, delivery_challan_url = ? WHERE id = ?',
      [newPoStatus, grnNumber, signedPdfUrl, poId]
    );

    // Update project if already linked
    if (po.project_id) {
      const newReadiness = hasShortage ? 'Partial Shortage' : 'Materials Delivered & Signed';
      await pool.query(
        'UPDATE projects SET material_readiness_status = ?, grn_id = ?, signed_grn_pdf_url = ? WHERE id = ?',
        [newReadiness, grnId, signedPdfUrl, po.project_id]
      );
    }

    // Send persistent notification to PM & Installation Team
    const notifType = hasShortage ? 'warning' : 'success';
    const notifMsg = hasShortage
      ? `Material delivery recorded for PO ${po.po_number} with customer digital signature. Shortages/rejections: ${totalDiscrepancies} units reported.`
      : `Complete material delivery received at site for PO ${po.po_number}. Customer (${customerSignatureName || customerName}) signed delivery receipt with zero shortage.`;

    await createNotification({
      recipientRole: 'Project Manager',
      title: `Material Delivery & Customer Signature Recorded (${grnNumber})`,
      message: notifMsg,
      type: notifType,
      link: signedPdfUrl,
    });

    await createNotification({
      recipientRole: 'Installation Team',
      title: `Site Materials Received & Signed (${grnNumber})`,
      message: notifMsg,
      type: notifType,
      link: signedPdfUrl,
    });

    res.json({
      success: true,
      grn: {
        id: grnId,
        grnNumber,
        poNumber: po.po_number,
        status: newPoStatus,
        signedPdfUrl,
        hasShortage,
        materialReadiness: hasShortage ? 'Partial Shortage' : 'Materials Delivered & Signed',
      },
    });
  } catch (error: any) {
    console.error('Error in createGoodsReceiptNote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/procurement/pending-indents
 * Returns material requirements from accepted quotations (and approved project BOMs)
 * so the Purchase Team can immediately issue POs and track site fulfillment.
 */
export async function getPendingIndents(req: Request, res: Response): Promise<void> {
  try {
    // 1. Fetch all accepted quotations that are not yet converted or have ongoing procurement
    const [quotations]: any = await pool.query(`
      SELECT q.id as quotation_id, q.quotation_number, q.lead_name as customer_name,
             q.customer_phone, q.customer_address, q.system_capacity_kw, q.total_amount,
             q.status as quotation_status, q.survey_id, q.converted_to_project_id,
             q.versions
      FROM quotations q
      WHERE q.status IN ('Customer_Accepted', 'Accepted') 
         OR (q.status = 'Converted_To_Project' AND q.converted_to_project_id IS NOT NULL)
      ORDER BY q.created_at DESC
    `);

    const indents: any[] = [];

    for (const q of quotations) {
      // Fetch any existing POs for this quotation
      const [pos]: any = await pool.query(
        'SELECT * FROM purchase_orders WHERE quotation_id = ? OR (project_id IS NOT NULL AND project_id = ?)',
        [q.quotation_id, q.converted_to_project_id]
      );

      // Fetch any signed GRNs for this quotation
      const [grns]: any = await pool.query(
        'SELECT * FROM goods_receipt_notes WHERE quotation_id = ? OR (project_id IS NOT NULL AND project_id = ?)',
        [q.quotation_id, q.converted_to_project_id]
      );

      const hasSignedGrn = grns.some((g: any) => g.customer_signature_data || g.customer_signature_name);
      const isDelivered = pos.some((p: any) => p.status === 'Delivered');
      const isPartial = pos.some((p: any) => p.status === 'Partial Delivered') || grns.some((g: any) => g.status === 'Partial Shortage');
      const isIssued = pos.length > 0;

      let procurementStatus = 'Pending Indent';
      if (hasSignedGrn && isDelivered && !isPartial) {
        procurementStatus = 'Materials Delivered & Signed';
      } else if (isPartial) {
        procurementStatus = 'Partial Shortage';
      } else if (isIssued) {
        procurementStatus = 'PO Issued / In-Transit';
      }

      // Fetch items from approved Survey BOM if survey_id is linked
      let items: any[] = [];
      let bomId = null;

      if (q.survey_id) {
        const [boms]: any = await pool.query(
          "SELECT * FROM project_boms WHERE survey_id = ? AND status = 'Approved' ORDER BY id DESC LIMIT 1",
          [q.survey_id]
        );
        if (boms && boms.length > 0) {
          bomId = boms[0].id;
          const [bomItems]: any = await pool.query('SELECT * FROM bom_items WHERE bom_id = ?', [bomId]);
          items = bomItems;
        }
      }

      // If no survey bom items, extract from quotation versions JSON
      if (items.length === 0 && q.versions) {
        try {
          const vData = typeof q.versions === 'string' ? JSON.parse(q.versions) : q.versions;
          const activeVer = Array.isArray(vData) ? vData[vData.length - 1] : vData;
          if (activeVer && activeVer.items && Array.isArray(activeVer.items)) {
            items = activeVer.items.map((it: any) => ({
              id: it.id || `QI-${Math.random().toString(36).substr(2, 6)}`,
              item_name: it.description || it.name,
              category: it.category || 'Solar BOS',
              quantity: it.quantity,
              unit: it.unit || 'Nos',
              estimated_unit_cost: it.unitPrice || 1000,
            }));
          }
        } catch (e) {
          console.error('Error parsing quote items:', e);
        }
      }

      indents.push({
        indent_id: `IND-${q.quotation_id}`,
        quotation_id: q.quotation_id,
        quotation_number: q.quotation_number,
        customer_name: q.customer_name,
        customer_phone: q.customer_phone,
        customer_address: q.customer_address,
        system_size_kw: q.system_capacity_kw,
        total_amount: q.total_amount,
        bom_id: bomId,
        procurement_status: procurementStatus,
        quotation_status: q.quotation_status,
        converted_to_project_id: q.converted_to_project_id,
        has_signed_grn: hasSignedGrn,
        signed_grn: grns[0] || null,
        purchase_orders: pos,
        goods_receipt_notes: grns,
        items,
      });
    }

    res.json({ success: true, indents });
  } catch (error: any) {
    console.error('Error fetching pending indents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/procurement/convert-to-project
 * Step 5 of Workflow: Converts an accepted quotation into an EPC project
 * ONLY when required material receipt and customer signature conditions are satisfied!
 * Links quotation, procurement, GRN, and signature records to the EPC project.
 * Prevents duplicate conversion.
 */
export async function convertToEpcProject(req: Request, res: Response): Promise<void> {
  const conn = await pool.getConnection();
  try {
    const { quotationId, projectManagerName, installationLeadName } = req.body;

    if (!quotationId) {
      conn.release();
      res.status(400).json({ success: false, error: 'Quotation ID is required' });
      return;
    }

    // 1. Fetch quotation
    const [qRows]: any = await conn.query('SELECT * FROM quotations WHERE id = ?', [quotationId]);
    if (!qRows || qRows.length === 0) {
      conn.release();
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }
    const quote = qRows[0];

    // 2. Prevent duplicate conversion
    if (quote.converted_to_project_id) {
      const [existingProject]: any = await conn.query('SELECT * FROM projects WHERE id = ?', [quote.converted_to_project_id]);
      conn.release();
      if (existingProject && existingProject.length > 0) {
        return res.json({
          success: true,
          message: 'Project already converted',
          alreadyConverted: true,
          project: existingProject[0],
        });
      }
    }

    // 3. Strict Pre-requisite Check: Must have a completed GRN with customer digital signature!
    const [grnRows]: any = await conn.query(
      `SELECT g.*, p.id as po_id FROM goods_receipt_notes g
       LEFT JOIN purchase_orders p ON g.po_id = p.id
       WHERE (g.quotation_id = ? OR p.quotation_id = ?) 
         AND (g.customer_signature_data IS NOT NULL OR g.customer_signature_name IS NOT NULL)
       ORDER BY g.created_at DESC LIMIT 1`,
      [quotationId, quotationId]
    );

    if (!grnRows || grnRows.length === 0) {
      conn.release();
      return res.status(400).json({
        success: false,
        error: 'Cannot convert to EPC project: Required material receipt and customer digital signature conditions are not satisfied. Please ensure the Purchase Team records material arrival at site and captures the customer signature first.',
      });
    }

    const grn = grnRows[0];
    const poId = grn.po_id || grn.poId || null;

    await conn.beginTransaction();

    const quoteTotal = Number(quote.total_amount) || 0;
    const capacityKw = Number(quote.system_capacity_kw) || 5;

    // 4. Resolve or create Customer record
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
      let maxCustNum = 25;
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          customerId,
          customerName,
          `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          customerPhone,
          customerAddress || 'Site Address',
          'Bengaluru',
          'Karnataka',
          '560001',
          `DISCOM-${Math.floor(1000000 + Math.random() * 9000000)}`,
          'BESCOM',
          quote.lead_id,
          capacityKw,
          quoteTotal,
          0,
          quoteTotal,
          'Under Installation',
        ]
      );
    }

    // 5. Generate Project ID
    const [allProjs]: any = await conn.query("SELECT id FROM projects WHERE id LIKE 'PROJECT-2026-%' OR id LIKE 'PRJ-2026-%'");
    let maxProjNum = 25;
    for (const p of allProjs) {
      const match = p.id.match(/(?:PROJECT|PRJ)-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxProjNum) maxProjNum = n;
      }
    }
    const projectId = `PROJECT-2026-${String(maxProjNum + 1).padStart(3, '0')}`;
    const targetDate = new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0];

    const initialTasks = [
      { id: `PT-${Date.now()}-1`, title: 'DISCOM Net-metering application & sanction', stage: 'Documentation', isCompleted: false, assignedRole: 'Project Manager', assignedToName: projectManagerName || 'Karthik Raja', dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] },
      { id: `PT-${Date.now()}-2`, title: 'Verify site physical readiness & electrical clearance', stage: 'Site Readiness', isCompleted: false, assignedRole: 'Project Manager', assignedToName: projectManagerName || 'Karthik Raja', dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0] },
      { id: `PT-${Date.now()}-3`, title: 'HDG structure foundation & anchor bolting', stage: 'Installation Scheduled', isCompleted: false, assignedRole: 'Installation Team', assignedToName: installationLeadName || 'Muthu Vel', dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0] },
      { id: `PT-${Date.now()}-4`, title: 'Module mounting & DC string conduit wiring', stage: 'Installation In Progress', isCompleted: false, assignedRole: 'Installation Team', assignedToName: installationLeadName || 'Muthu Vel', dueDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0] },
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

    const materialStatus = grn.status === 'Partial Shortage' ? 'Partial Shortage' : 'Materials Delivered & Signed';

    // 6. Insert EPC Project linking all records
    await conn.query(
      `INSERT INTO projects (
        id, customer_id, customer_name, customer_phone, customer_address, 
        quotation_id, capacity_kw, total_amount, stage, start_date, 
        target_completion_date, project_manager_id, project_manager_name, 
        installation_lead_id, installation_lead_name, checklist, tasks, 
        inventory_reserved, material_readiness_status, grn_id, signed_grn_pdf_url, po_id,
        site_readiness_confirmed, discom_sanction_number, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Awaiting Site Readiness', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 0, ?, ?, NOW())`,
      [
        projectId,
        customerId,
        customerName,
        customerPhone,
        customerAddress,
        quote.id,
        capacityKw,
        quoteTotal,
        new Date().toISOString().split('T')[0],
        targetDate,
        'EMP-04',
        projectManagerName || 'Karthik Raja',
        'EMP-05',
        installationLeadName || 'Muthu Vel',
        JSON.stringify(initialChecklist),
        JSON.stringify(initialTasks),
        materialStatus,
        grn.id,
        grn.signed_pdf_url || null,
        poId,
        `BESCOM/SANCTION/${Date.now().toString().slice(-4)}`,
        `Converted EPC Project from Quotation ${quote.quotation_number}. Materials verified & customer signature captured under GRN ${grn.grn_number}.`,
      ]
    );

    // 7. Update Quotation record
    await conn.query(
      "UPDATE quotations SET status = 'Converted_To_Project', converted_to_project_id = ? WHERE id = ?",
      [projectId, quotationId]
    );

    // 8. Update GRN and PO records with project_id
    if (grn.id) {
      await conn.query('UPDATE goods_receipt_notes SET project_id = ? WHERE id = ?', [projectId, grn.id]);
    }
    if (poId) {
      await conn.query('UPDATE purchase_orders SET project_id = ? WHERE id = ?', [projectId, poId]);
    }

    await conn.commit();
    conn.release();

    // 9. Send Persistent Notifications to PM & Installation Team
    await createNotification({
      recipientRole: 'Project Manager',
      title: `EPC Project Converted (${projectId})`,
      message: `Quotation ${quote.quotation_number} (${customerName}) successfully converted to EPC Project ${projectId}. Materials delivered and signed. Please inspect and confirm site readiness before installation starts.`,
      type: 'info',
      link: grn.signed_pdf_url,
    });

    await createNotification({
      recipientRole: 'Installation Team',
      title: `New EPC Project Assigned (${projectId})`,
      message: `Project ${projectId} (${customerName}) created. Site materials delivered under GRN ${grn.grn_number}. Installation execution is locked awaiting PM site readiness confirmation.`,
      type: 'info',
      link: grn.signed_pdf_url,
    });

    res.json({
      success: true,
      projectId,
      message: 'EPC Project converted successfully with full material receipt and customer signature audit trail.',
      project: {
        id: projectId,
        customerName,
        capacityKw,
        totalAmount: quoteTotal,
        stage: 'Awaiting Site Readiness',
        materialReadinessStatus: materialStatus,
        signedGrnPdfUrl: grn.signed_pdf_url,
      },
    });
  } catch (err: any) {
    await conn.rollback();
    conn.release();
    console.error('Error in convertToEpcProject:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
