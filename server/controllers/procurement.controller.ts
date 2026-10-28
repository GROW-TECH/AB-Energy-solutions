import { Request, Response } from 'express';
import crypto from 'crypto';
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
    if (!orders || orders.length === 0) {
      res.json({ success: true, purchaseOrders: [] });
      return;
    }

    const poIds = orders.map((p: any) => p.id);

    // Parallel batch queries for items and GRNs
    const [[allItems], [allGrns]]: any = await Promise.all([
      pool.query('SELECT * FROM purchase_order_items WHERE po_id IN (?)', [poIds]),
      pool.query('SELECT * FROM goods_receipt_notes WHERE po_id IN (?) ORDER BY created_at DESC', [poIds])
    ]);

    const itemsMap: Record<string, any[]> = {};
    for (const it of (allItems || [])) {
      if (!itemsMap[it.po_id]) itemsMap[it.po_id] = [];
      itemsMap[it.po_id].push({
        id: it.id,
        sku: it.sku,
        name: it.item_name,
        category: it.category,
        quantity: Number(it.quantity),
        unit: it.unit,
        unitPrice: Number(it.unit_price),
        totalAmount: Number(it.total_amount),
        receivedQuantity: Number(it.received_quantity || 0),
      });
    }

    const grnsMap: Record<string, any[]> = {};
    for (const g of (allGrns || [])) {
      if (!grnsMap[g.po_id]) grnsMap[g.po_id] = [];
      grnsMap[g.po_id].push(g);
    }

    for (const po of orders) {
      po.items = itemsMap[po.id] || [];
      po.grns = grnsMap[po.id] || [];
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

    // RBAC & Lifecycle Integrity: Reject PO issuance if the project is already Completed
    if (projectId) {
      const [pRows]: any = await pool.query('SELECT stage FROM projects WHERE id = ?', [projectId]);
      if (pRows && pRows.length > 0 && pRows[0].stage === 'Completed') {
        res.status(400).json({ 
          success: false, 
          error: `Cannot issue Purchase Order: Project ${projectId} is already Completed and procurement is closed.` 
        });
        return;
      }
    }
    if (quotationId) {
      const [qRows]: any = await pool.query(
        'SELECT q.status, q.converted_to_project_id, p.stage as project_stage FROM quotations q LEFT JOIN projects p ON p.id = q.converted_to_project_id WHERE q.id = ?',
        [quotationId]
      );
      if (qRows && qRows.length > 0 && (qRows[0].project_stage === 'Completed' || qRows[0].status === 'Completed')) {
        res.status(400).json({ 
          success: false, 
          error: 'Cannot issue Purchase Order: The linked project has already reached Completed stage and procurement is finalized.' 
        });
        return;
      }
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
 * Creates a Goods Receipt Note (GRN) for site deliveries.
 * Supports:
 *  1. Remote Customer E-Signature (Default): Saves GRN as 'Pending_Signature', generates
 *     a unique cryptographically secure signing link, builds un-signed preview PDF, and allows sharing via WhatsApp/Email.
 *  2. In-Person Immediate Signing: Captures customer electronic signature directly on-device.
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
      signingMethod = 'remote', // 'remote' (default) or 'in_person'
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
    let customerAddress = po.delivery_location || '';
    let quoteNum = '';

    if (linkedQuotationId) {
      const [qRows]: any = await pool.query('SELECT * FROM quotations WHERE id = ?', [linkedQuotationId]);
      if (qRows && qRows.length > 0) {
        customerName = qRows[0].lead_name || customerName;
        customerPhone = qRows[0].customer_phone || customerPhone;
        customerAddress = qRows[0].customer_address || customerAddress;
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

    const isRemote = signingMethod === 'remote' || !customerSignatureData;
    const signingToken = isRemote ? crypto.randomBytes(24).toString('hex') : null;
    const signingExpiresAt = isRemote ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;
    const grnStatus = isRemote ? 'Pending_Signature' : (hasShortage ? 'Partial Shortage' : 'Approved');
    const linkStatus = isRemote ? 'Pending' : 'Signed';

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const signingUrl = signingToken ? `${protocol}://${host}/sign-grn/${signingToken}` : '';

    // Generate Initial GRN PDF (Awaiting signature or signed on-spot)
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
        customerSignatureData: !isRemote ? customerSignatureData : undefined,
        customerSignatureName: customerSignatureName || customerName,
        customerSignaturePhone: customerSignaturePhone || customerPhone,
        customerSignatureDate: !isRemote ? new Date().toLocaleString('en-IN') : undefined,
        isPendingSignature: isRemote,
        documentVersion: 1,
      });
      signedPdfUrl = pdfResult.fileUrl;
    } catch (pdfErr: any) {
      console.error('Error generating GRN PDF:', pdfErr);
      signedPdfUrl = `/documents/grn_${grnNumber}.pdf`;
    }

    // Save GRN Header in DB with secure token and audit fields
    const receivedByName = receivedBy || (req as any).user?.name || 'Store Officer';
    const deliveryLocation = deliveryWarehouse || po.delivery_warehouse || 'Site Delivery';
    const challanNum = deliveryChallanNumber || grnNumber;

    await pool.query(
      `INSERT INTO goods_receipt_notes
        (id, grn_number, po_id, quotation_id, project_id, delivery_challan_no, challan_number, supplier_invoice_no, delivery_warehouse, delivery_location, received_date, verified_by, received_by_name, customer_signature_name, customer_signature_phone, customer_signature_data, customer_signature_date, signed_pdf_url, status, notes, signing_token, signing_link_status, signing_expires_at, declaration_consent, document_version, resend_count, signed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${!isRemote ? 'NOW()' : 'NULL'}, ?, ?, ?, ?, ?, ?, ${!isRemote ? 1 : 0}, 1, 0, ${!isRemote ? 'NOW()' : 'NULL'}, NOW())`,
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
        !isRemote ? customerSignatureData : null,
        signedPdfUrl,
        grnStatus,
        notes || '',
        signingToken,
        linkStatus,
        signingExpiresAt,
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

    if (!isRemote) {
      // In-person signature completed immediately
      const newPoStatus = hasShortage ? 'Partial Delivered' : 'Delivered';
      await pool.query(
        'UPDATE purchase_orders SET status = ?, grn_number = ?, delivery_challan_url = ? WHERE id = ?',
        [newPoStatus, grnNumber, signedPdfUrl, poId]
      );

      if (po.project_id) {
        const newReadiness = hasShortage ? 'Partial Shortage' : 'Materials Delivered & Signed';
        await pool.query(
          'UPDATE projects SET material_readiness_status = ?, grn_id = ?, signed_grn_pdf_url = ? WHERE id = ?',
          [newReadiness, grnId, signedPdfUrl, po.project_id]
        );
      }

      await createNotification({
        recipientRole: 'Project Manager',
        title: `Material Delivery & Customer Signature Recorded (${grnNumber})`,
        message: `Material delivery for PO ${po.po_number} confirmed with immediate customer electronic signature.`,
        type: hasShortage ? 'warning' : 'success',
        link: signedPdfUrl,
      });
    } else {
      // Remote signing link generated
      await pool.query(
        'UPDATE purchase_orders SET grn_number = ?, delivery_challan_url = ? WHERE id = ?',
        [grnNumber, signedPdfUrl, poId]
      );

      await createNotification({
        recipientRole: 'Purchase Team',
        title: `Customer E-Signature Link Ready (${grnNumber})`,
        message: `GRN ${grnNumber} generated for PO ${po.po_number}. Secure customer signing link created and ready to share via WhatsApp or Email.`,
        type: 'info',
        link: signingUrl,
      });
    }

    res.json({
      success: true,
      grn: {
        id: grnId,
        grnNumber,
        poNumber: po.po_number,
        status: grnStatus,
        signingLinkStatus: linkStatus,
        signingToken,
        signingUrl,
        signingExpiresAt,
        signedPdfUrl,
        previewPdfUrl: signedPdfUrl,
        hasShortage,
        customerName: customerSignatureName || customerName,
        customerPhone: customerSignaturePhone || customerPhone,
        materialReadiness: isRemote ? 'Pending Customer Signature' : (hasShortage ? 'Partial Shortage' : 'Materials Delivered & Signed'),
      },
      signingUrl,
      signingToken,
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
    // 1. Fetch all accepted quotations that are not archived
    const [quotations]: any = await pool.query(`
      SELECT q.id as quotation_id, q.quotation_number, q.lead_name as customer_name,
             q.customer_phone, q.customer_address, q.system_capacity_kw, q.total_amount,
             q.status as quotation_status, q.survey_id, q.converted_to_project_id,
             q.versions,
             p.stage as project_stage
      FROM quotations q
      LEFT JOIN projects p ON p.id = q.converted_to_project_id
      WHERE (q.procurement_archived IS NULL OR q.procurement_archived = 0)
        AND (q.status IN ('Customer_Accepted', 'Accepted') 
         OR (q.status = 'Converted_To_Project' AND q.converted_to_project_id IS NOT NULL))
      ORDER BY q.created_at DESC
    `);

    if (!quotations || quotations.length === 0) {
      res.json({ success: true, indents: [] });
      return;
    }

    const quotationIds = quotations.map((q: any) => q.quotation_id);
    const projectIds = quotations.map((q: any) => q.converted_to_project_id).filter(Boolean);
    const surveyIds = quotations.map((q: any) => q.survey_id).filter(Boolean);

    // Parallel batch queries for POs, GRNs, and BOMs
    const queryPromises: Promise<any>[] = [
      projectIds.length > 0
        ? pool.query('SELECT * FROM purchase_orders WHERE quotation_id IN (?) OR project_id IN (?)', [quotationIds, projectIds])
        : pool.query('SELECT * FROM purchase_orders WHERE quotation_id IN (?)', [quotationIds]),
      projectIds.length > 0
        ? pool.query('SELECT * FROM goods_receipt_notes WHERE quotation_id IN (?) OR project_id IN (?)', [quotationIds, projectIds])
        : pool.query('SELECT * FROM goods_receipt_notes WHERE quotation_id IN (?)', [quotationIds]),
    ];

    if (surveyIds.length > 0) {
      queryPromises.push(pool.query("SELECT * FROM project_boms WHERE survey_id IN (?) AND status = 'Approved' ORDER BY id DESC", [surveyIds]));
    } else {
      queryPromises.push(Promise.resolve([[]]));
    }

    const [[allPos], [allGrns], [allBoms]]: any = await Promise.all(queryPromises);

    // If any BOMs found, fetch their items in one batch query
    const bomIds = (allBoms || []).map((b: any) => b.id);
    let allBomItems: any[] = [];
    if (bomIds.length > 0) {
      const [items]: any = await pool.query('SELECT * FROM bom_items WHERE bom_id IN (?)', [bomIds]);
      allBomItems = items || [];
    }

    // Index BOMs by survey_id
    const bomsBySurveyId: Record<string, any> = {};
    for (const b of (allBoms || [])) {
      if (!bomsBySurveyId[b.survey_id]) {
        bomsBySurveyId[b.survey_id] = b;
      }
    }

    // Index BOM items by bom_id
    const itemsByBomId: Record<string, any[]> = {};
    for (const it of allBomItems) {
      if (!itemsByBomId[it.bom_id]) itemsByBomId[it.bom_id] = [];
      itemsByBomId[it.bom_id].push(it);
    }

    // Index POs by quotation_id and project_id
    const posByQuote: Record<string, any[]> = {};
    for (const p of (allPos || [])) {
      if (p.quotation_id) {
        if (!posByQuote[p.quotation_id]) posByQuote[p.quotation_id] = [];
        posByQuote[p.quotation_id].push(p);
      }
      if (p.project_id) {
        if (!posByQuote[p.project_id]) posByQuote[p.project_id] = [];
        posByQuote[p.project_id].push(p);
      }
    }

    // Index GRNs by quotation_id and project_id
    const grnsByQuote: Record<string, any[]> = {};
    for (const g of (allGrns || [])) {
      if (g.quotation_id) {
        if (!grnsByQuote[g.quotation_id]) grnsByQuote[g.quotation_id] = [];
        grnsByQuote[g.quotation_id].push(g);
      }
      if (g.project_id) {
        if (!grnsByQuote[g.project_id]) grnsByQuote[g.project_id] = [];
        grnsByQuote[g.project_id].push(g);
      }
    }

    const indents: any[] = [];

    for (const q of quotations) {
      const posMap = new Map<string, any>();
      (posByQuote[q.quotation_id] || []).forEach(p => posMap.set(p.id, p));
      if (q.converted_to_project_id) {
        (posByQuote[q.converted_to_project_id] || []).forEach(p => posMap.set(p.id, p));
      }
      const pos = Array.from(posMap.values());

      const grnsMap = new Map<string, any>();
      (grnsByQuote[q.quotation_id] || []).forEach(g => grnsMap.set(g.id, g));
      if (q.converted_to_project_id) {
        (grnsByQuote[q.converted_to_project_id] || []).forEach(g => grnsMap.set(g.id, g));
      }
      const grns = Array.from(grnsMap.values());

      const hasSignedGrn = grns.some((g: any) => g.customer_signature_data || g.customer_signature_name);
      const isDelivered = pos.some((p: any) => p.status === 'Delivered');
      const isPartial = pos.some((p: any) => p.status === 'Partial Delivered') || grns.some((g: any) => g.status === 'Partial Shortage');
      const isIssued = pos.length > 0;
      const isProjectCompleted = q.project_stage === 'Completed';

      let procurementStatus = 'Pending Indent';
      if (isProjectCompleted) {
        procurementStatus = 'Project Completed (Procurement Closed)';
      } else if (hasSignedGrn && isDelivered && !isPartial) {
        procurementStatus = 'Materials Delivered & Signed';
      } else if (isPartial) {
        procurementStatus = 'Partial Shortage';
      } else if (isIssued) {
        procurementStatus = 'PO Issued / In-Transit';
      }

      let items: any[] = [];
      let bomId = null;

      if (q.survey_id && bomsBySurveyId[q.survey_id]) {
        bomId = bomsBySurveyId[q.survey_id].id;
        items = itemsByBomId[bomId] || [];
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
        project_stage: q.project_stage || null,
        is_completed: isProjectCompleted,
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
 * DELETE /api/procurement/orders/:id
 * Deletes a purchase order and its linked items
 */
export async function deletePurchaseOrder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM purchase_order_items WHERE po_id = ?', [id]);
    await pool.query('DELETE FROM goods_receipt_notes WHERE po_id = ?', [id]);
    await pool.query('DELETE FROM purchase_orders WHERE id = ?', [id]);
    res.json({ success: true, message: `Purchase order ${id} deleted successfully.` });
  } catch (error: any) {
    console.error('Error in deletePurchaseOrder:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * DELETE /api/procurement/indents/:id
 * Removes/archives an indent from active procurement view
 */
export async function deleteIndent(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^IND-/, '');
    await pool.query('UPDATE quotations SET procurement_archived = 1 WHERE id = ?', [cleanId]);
    res.json({ success: true, message: `Indent ${id} removed.` });
  } catch (error: any) {
    console.error('Error in deleteIndent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * DELETE /api/procurement/indents-closed/all
 * Clears/removes all closed/completed procurement indents
 */
export async function clearClosedIndents(req: Request, res: Response): Promise<void> {
  try {
    await pool.query(`
      UPDATE quotations q
      LEFT JOIN projects p ON p.id = q.converted_to_project_id
      SET q.procurement_archived = 1
      WHERE p.stage = 'Completed' OR q.status = 'Converted_To_Project'
    `);
    res.json({ success: true, message: 'All closed procurement indents cleared.' });
  } catch (error: any) {
    console.error('Error in clearClosedIndents:', error);
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

/**
 * GET /api/procurement/sign-grn/:token
 * Public endpoint: Allows a customer to inspect a GRN and its line items without logging in.
 * Validates token existence, expiry, and single-use status.
 */
export async function getPublicSigningGrn(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;
    if (!token) {
      res.status(400).json({ success: false, error: 'Token is required' });
      return;
    }

    const [grnRows]: any = await pool.query(
      `SELECT g.*, p.po_number, p.supplier_name, p.delivery_warehouse as po_delivery_location
       FROM goods_receipt_notes g
       LEFT JOIN purchase_orders p ON g.po_id = p.id
       WHERE g.signing_token = ?`,
      [token]
    );

    if (!grnRows || grnRows.length === 0) {
      res.status(404).json({ success: false, error: 'Signing link not found or invalid' });
      return;
    }

    const grn = grnRows[0];

    // Check if Revoked / Cancelled
    if (grn.signing_link_status === 'Cancelled') {
      res.json({
        success: true,
        status: 'Cancelled',
        error: 'This signing link has been revoked by AB Energy Solutions. Please contact the purchase team.',
        grnNumber: grn.grn_number,
      });
      return;
    }

    // Check Expiry
    if (grn.signing_expires_at && new Date(grn.signing_expires_at) < new Date() && grn.signing_link_status === 'Pending') {
      await pool.query('UPDATE goods_receipt_notes SET signing_link_status = ? WHERE id = ?', ['Expired', grn.id]);
      res.json({
        success: true,
        status: 'Expired',
        error: 'This signing link has expired. Please request a new signing link from AB Energy Solutions.',
        grnNumber: grn.grn_number,
        expiresAt: grn.signing_expires_at,
      });
      return;
    }

    // Check if already Signed
    if (grn.signing_link_status === 'Signed') {
      res.json({
        success: true,
        status: 'Signed',
        grn: {
          id: grn.id,
          grnNumber: grn.grn_number,
          poNumber: grn.po_number,
          customerName: grn.customer_signature_name,
          customerPhone: grn.customer_signature_phone,
          signedPdfUrl: grn.signed_pdf_url,
          signedAt: grn.signed_at || grn.customer_signature_date,
          verifiedBy: grn.verified_by,
        },
      });
      return;
    }

    // Fetch Line Items
    const [itemRows]: any = await pool.query(
      'SELECT * FROM grn_items WHERE grn_id = ? ORDER BY id ASC',
      [grn.id]
    );

    res.json({
      success: true,
      status: 'Pending',
      grn: {
        id: grn.id,
        grnNumber: grn.grn_number,
        poNumber: grn.po_number,
        quotationNumber: grn.quotation_id,
        receivedDate: grn.received_date,
        deliveryWarehouse: grn.delivery_warehouse,
        deliveryChallanNo: grn.delivery_challan_no,
        supplierInvoiceNo: grn.supplier_invoice_no,
        supplierName: grn.supplier_name || 'Authorized Vendor',
        customerName: grn.customer_signature_name,
        customerPhone: grn.customer_signature_phone,
        customerAddress: grn.delivery_location || grn.po_delivery_location || 'Customer Installation Site',
        verifiedBy: grn.verified_by,
        notes: grn.notes,
        previewPdfUrl: grn.signed_pdf_url,
        documentVersion: grn.document_version || 1,
        expiresAt: grn.signing_expires_at,
        items: (itemRows || []).map((it: any) => ({
          id: it.id,
          itemName: it.item_name,
          category: it.category,
          orderedQuantity: Number(it.ordered_quantity || it.ordered_qty || 0),
          receivedQuantity: Number(it.received_quantity || it.received_qty || 0),
          acceptedQuantity: Number(it.accepted_quantity || it.accepted_qty || 0),
          rejectedQuantity: Number(it.rejected_quantity || it.rejected_qty || 0),
          unit: it.unit || 'Nos',
          remarks: it.remarks || '',
        })),
      },
    });
  } catch (error: any) {
    console.error('Error in getPublicSigningGrn:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/procurement/sign-grn/:token
 * Public endpoint: Customer submits their electronic signature with declaration consent.
 * Enforces single-use, captures IP & user-agent audit, generates final signed PDF, and updates DB & notifications.
 */
export async function submitPublicCustomerSignature(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;
    const { customerName, customerSignature, declarationConsent } = req.body;

    if (!token) {
      res.status(400).json({ success: false, error: 'Signing token is required' });
      return;
    }

    if (!customerSignature || !customerSignature.startsWith('data:image')) {
      res.status(400).json({ success: false, error: 'Valid signature image is required' });
      return;
    }

    if (!declarationConsent) {
      res.status(400).json({ success: false, error: 'You must consent to the material receipt declaration' });
      return;
    }

    const [grnRows]: any = await pool.query(
      `SELECT g.*, p.po_number, p.supplier_name, p.delivery_warehouse as po_delivery_location, p.project_id as po_project_id
       FROM goods_receipt_notes g
       LEFT JOIN purchase_orders p ON g.po_id = p.id
       WHERE g.signing_token = ?`,
      [token]
    );

    if (!grnRows || grnRows.length === 0) {
      res.status(404).json({ success: false, error: 'Signing link not found or invalid' });
      return;
    }

    const grn = grnRows[0];

    // Single-use check
    if (grn.signing_link_status === 'Signed') {
      res.status(400).json({
        success: false,
        error: 'This Goods Receipt Note has already been electronically signed and cannot be signed again.',
        signedPdfUrl: grn.signed_pdf_url,
      });
      return;
    }

    if (grn.signing_link_status === 'Cancelled') {
      res.status(400).json({ success: false, error: 'This signing link has been revoked.' });
      return;
    }

    if (grn.signing_expires_at && new Date(grn.signing_expires_at) < new Date()) {
      await pool.query('UPDATE goods_receipt_notes SET signing_link_status = ? WHERE id = ?', ['Expired', grn.id]);
      res.status(400).json({ success: false, error: 'This signing link has expired. Please request a new link.' });
      return;
    }

    // Capture Audit Details
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.socket.remoteAddress || '127.0.0.1');
    const userAgent = (req.headers['user-agent'] || 'Mobile Browser').substring(0, 500);
    const signerName = (customerName || grn.customer_signature_name || 'Customer').trim();
    const signedTimestamp = new Date().toLocaleString('en-IN');

    // Fetch line items
    const [itemRows]: any = await pool.query(
      'SELECT * FROM grn_items WHERE grn_id = ? ORDER BY id ASC',
      [grn.id]
    );

    const processedItems = (itemRows || []).map((it: any) => ({
      itemName: it.item_name,
      category: it.category,
      orderedQuantity: Number(it.ordered_quantity || it.ordered_qty || 0),
      receivedQuantity: Number(it.received_quantity || it.received_qty || 0),
      acceptedQuantity: Number(it.accepted_quantity || it.accepted_qty || 0),
      rejectedQuantity: Number(it.rejected_quantity || it.rejected_qty || 0),
      unit: it.unit || 'Nos',
      remarks: it.remarks || '',
    }));

    // Generate Final Signed PDF with Embedded Signature and Audit Details
    let finalSignedPdfUrl = '';
    try {
      const pdfResult = await generateGrnPdf({
        grnNumber: grn.grn_number,
        poNumber: grn.po_number,
        quotationNumber: grn.quotation_id,
        receivedDate: grn.received_date,
        deliveryWarehouse: grn.delivery_warehouse,
        deliveryChallanNo: grn.delivery_challan_no,
        supplierInvoiceNo: grn.supplier_invoice_no,
        supplierName: grn.supplier_name || 'Authorized Supplier',
        customerName: signerName,
        customerPhone: grn.customer_signature_phone,
        customerAddress: grn.delivery_location || grn.po_delivery_location,
        verifiedBy: grn.verified_by,
        notes: grn.notes,
        items: processedItems,
        customerSignatureData: customerSignature,
        customerSignatureName: signerName,
        customerSignaturePhone: grn.customer_signature_phone,
        customerSignatureDate: signedTimestamp,
        signingIp: ip,
        documentVersion: grn.document_version || 1,
        isPendingSignature: false,
      });
      finalSignedPdfUrl = pdfResult.fileUrl;
    } catch (pdfErr) {
      console.error('Error generating final signed GRN PDF:', pdfErr);
      finalSignedPdfUrl = grn.signed_pdf_url || `/documents/grn_${grn.grn_number}.pdf`;
    }

    // Persist electronic signature and audit in database
    await pool.query(
      `UPDATE goods_receipt_notes SET
         customer_signature_data = ?,
         customer_signature_name = ?,
         customer_signature_date = NOW(),
         signed_at = NOW(),
         signed_pdf_url = ?,
         status = 'Signed',
         signing_link_status = 'Signed',
         signing_ip = ?,
         signing_user_agent = ?,
         declaration_consent = 1
       WHERE id = ?`,
      [customerSignature, signerName, finalSignedPdfUrl, ip, userAgent, grn.id]
    );

    // Update PO status to Delivered
    if (grn.po_id) {
      await pool.query(
        'UPDATE purchase_orders SET status = ?, delivery_challan_url = ? WHERE id = ?',
        ['Delivered', finalSignedPdfUrl, grn.po_id]
      );
    }

    // Update Project Material Readiness if linked
    const targetProjectId = grn.project_id || grn.po_project_id;
    if (targetProjectId) {
      await pool.query(
        'UPDATE projects SET material_readiness_status = ?, grn_id = ?, signed_grn_pdf_url = ? WHERE id = ?',
        ['Materials Delivered & Signed', grn.id, finalSignedPdfUrl, targetProjectId]
      );
    }

    // Send notifications to Purchase Team & Assigned Project Manager
    await createNotification({
      recipientRole: 'Purchase Team',
      title: `GRN Signed by Customer (${grn.grn_number})`,
      message: `Customer ${signerName} has electronically signed the Goods Receipt Note for PO ${grn.po_number}. Site delivery confirmed.`,
      type: 'success',
      link: finalSignedPdfUrl,
    });

    await createNotification({
      recipientRole: 'Project Manager',
      title: `Site Materials Received & Signed (${grn.grn_number})`,
      message: `Customer ${signerName} has completed electronic signing for site materials (${grn.grn_number}). Material readiness verified.`,
      type: 'success',
      link: finalSignedPdfUrl,
    });

    res.json({
      success: true,
      grnNumber: grn.grn_number,
      signedPdfUrl: finalSignedPdfUrl,
      signedAt: signedTimestamp,
      signerName,
      message: 'Goods Receipt Note has been electronically signed successfully.',
    });
  } catch (error: any) {
    console.error('Error in submitPublicCustomerSignature:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/procurement/grns
 * Authenticated: Returns all Goods Receipt Notes with signing link statuses and links.
 */
export async function getGoodsReceiptNotes(req: Request, res: Response): Promise<void> {
  try {
    const { poId, quotationId, status } = req.query;
    let sql = `
      SELECT g.*, p.po_number, p.supplier_name, p.delivery_warehouse as po_delivery_location
      FROM goods_receipt_notes g
      LEFT JOIN purchase_orders p ON g.po_id = p.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (poId) {
      conditions.push('g.po_id = ?');
      params.push(poId);
    }
    if (quotationId) {
      conditions.push('g.quotation_id = ?');
      params.push(quotationId);
    }
    if (status) {
      conditions.push('g.signing_link_status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY g.created_at DESC';

    const [rows]: any = await pool.query(sql, params);

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';

    const grns = rows.map((r: any) => ({
      ...r,
      signing_url: r.signing_token ? `${protocol}://${host}/sign-grn/${r.signing_token}` : null,
      is_expired: r.signing_expires_at && new Date(r.signing_expires_at) < new Date() && r.signing_link_status === 'Pending',
    }));

    res.json({ success: true, grns });
  } catch (error: any) {
    console.error('Error in getGoodsReceiptNotes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/procurement/grn/:id/resend-link
 * Authenticated: Refreshes signing token and extends validity by 7 days.
 */
export async function resendSigningLink(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query('SELECT * FROM goods_receipt_notes WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, error: 'GRN not found' });
      return;
    }
    const grn = rows[0];
    if (grn.signing_link_status === 'Signed') {
      res.status(400).json({ success: false, error: 'Cannot resend: GRN has already been signed by the customer.' });
      return;
    }

    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newToken = crypto.randomBytes(24).toString('hex');

    await pool.query(
      `UPDATE goods_receipt_notes SET
         signing_token = ?,
         signing_link_status = 'Pending',
         signing_expires_at = ?,
         resend_count = resend_count + 1
       WHERE id = ?`,
      [newToken, newExpiresAt, id]
    );

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const signingUrl = `${protocol}://${host}/sign-grn/${newToken}`;

    res.json({
      success: true,
      signingUrl,
      signingToken: newToken,
      expiresAt: newExpiresAt,
      message: 'Signing link has been refreshed and extended by 7 days.',
    });
  } catch (error: any) {
    console.error('Error in resendSigningLink:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/procurement/grn/:id/revoke-link
 * Authenticated: Revokes/Cancels a pending signing link.
 */
export async function revokeSigningLink(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query('SELECT * FROM goods_receipt_notes WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, error: 'GRN not found' });
      return;
    }
    const grn = rows[0];
    if (grn.signing_link_status === 'Signed') {
      res.status(400).json({ success: false, error: 'Cannot revoke: GRN has already been signed.' });
      return;
    }

    const userName = (req as any).user?.name || 'Authorized Staff';

    await pool.query(
      `UPDATE goods_receipt_notes SET
         signing_link_status = 'Cancelled',
         status = 'Cancelled',
         revoked_at = NOW(),
         revoked_by = ?
       WHERE id = ?`,
      [userName, id]
    );

    res.json({
      success: true,
      message: 'Signing link has been revoked. Customer will no longer be able to sign using this link.',
    });
  } catch (error: any) {
    console.error('Error in revokeSigningLink:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
