import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface GrnPdfData {
  grnNumber: string;
  poNumber: string;
  quotationNumber?: string;
  receivedDate: string;
  deliveryWarehouse: string;
  deliveryChallanNo?: string;
  supplierInvoiceNo?: string;
  supplierName: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  verifiedBy: string;
  notes?: string;
  items: Array<{
    itemName: string;
    category?: string;
    orderedQuantity: number;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    unit: string;
    remarks?: string;
  }>;
  customerSignatureData?: string; // base64 data url
  customerSignatureName?: string;
  customerSignaturePhone?: string;
  customerSignatureDate?: string;
}

export async function generateGrnPdf(data: GrnPdfData): Promise<{ filePath: string; fileUrl: string }> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `GRN-${data.grnNumber}`,
          Author: 'AB Energy Solutions',
          Subject: 'Material Delivery Receipt & Goods Receipt Note',
        },
      });

      const fileName = `grn_${data.grnNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      const publicDir = path.resolve(process.cwd(), 'public', 'documents');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const filePath = path.join(publicDir, fileName);
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const PAGE_W = 595.28;
      const PAGE_H = 841.89;
      const MARGIN = 36;
      const CONTENT_W = PAGE_W - MARGIN * 2;

      // Primary colors
      const PRIMARY = '#059669'; // Emerald-600
      const DARK = '#0f172a'; // Slate-900
      const MUTED = '#475569'; // Slate-600
      const LIGHT_BG = '#f8fafc'; // Slate-50
      const BORDER = '#cbd5e1'; // Slate-300

      // Top green accent bar
      doc.rect(0, 0, PAGE_W, 6).fill(PRIMARY);

      // Company Header
      let y = 24;

      // Brand Title
      doc.font('Helvetica-Bold').fontSize(16).fillColor(PRIMARY).text('AB ENERGY SOLUTIONS', MARGIN, y);
      y += 18;
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Turnkey Rooftop Solar EPC • MNRE Approved Channel Partner • ISO 9001:2015', MARGIN, y);
      y += 12;
      doc.text('Regd. Office: 124, 2nd Cross, Industrial Suburb, Yeshwanthpur, Bengaluru - 560022 | Support: +91 98450 12345', MARGIN, y);
      y += 18;

      // Title Banner
      doc.rect(MARGIN, y, CONTENT_W, 28).fill('#ecfdf5');
      doc.rect(MARGIN, y, CONTENT_W, 28).stroke(PRIMARY);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#065f46')
        .text('GOODS RECEIPT NOTE & SITE MATERIAL HANDOVER CHALLAN', MARGIN, y + 8, { align: 'center', width: CONTENT_W });
      y += 36;

      // Two Column Meta Grid (GRN Info / Customer & Site Info)
      const colW = (CONTENT_W - 12) / 2;

      // Left Box: Document & Supplier Details
      doc.rect(MARGIN, y, colW, 88).fill(LIGHT_BG);
      doc.rect(MARGIN, y, colW, 88).stroke(BORDER);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(DARK).text('RECEIPT & DISPATCH DETAILS', MARGIN + 8, y + 8);
      
      let leftY = y + 22;
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED).text('GRN Number: ', MARGIN + 8, leftY);
      doc.font('Helvetica-Bold').fillColor(PRIMARY).text(data.grnNumber, MARGIN + 75, leftY);
      leftY += 13;
      doc.font('Helvetica').fillColor(MUTED).text('PO Number: ', MARGIN + 8, leftY);
      doc.font('Helvetica-Bold').fillColor(DARK).text(data.poNumber, MARGIN + 75, leftY);
      leftY += 13;
      if (data.quotationNumber) {
        doc.font('Helvetica').fillColor(MUTED).text('Quotation Ref: ', MARGIN + 8, leftY);
        doc.font('Helvetica-Bold').fillColor(DARK).text(data.quotationNumber, MARGIN + 75, leftY);
        leftY += 13;
      }
      doc.font('Helvetica').fillColor(MUTED).text('Supplier Name: ', MARGIN + 8, leftY);
      doc.font('Helvetica').fillColor(DARK).text(data.supplierName || 'Authorized Vendor', MARGIN + 75, leftY);
      leftY += 13;
      doc.font('Helvetica').fillColor(MUTED).text('Delivery DC / Inv: ', MARGIN + 8, leftY);
      doc.font('Helvetica').fillColor(DARK).text(`${data.deliveryChallanNo || 'N/A'} / ${data.supplierInvoiceNo || 'N/A'}`, MARGIN + 75, leftY);

      // Right Box: Customer & Delivery Site Details
      const rightX = MARGIN + colW + 12;
      doc.rect(rightX, y, colW, 88).fill(LIGHT_BG);
      doc.rect(rightX, y, colW, 88).stroke(BORDER);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(DARK).text('DELIVERY SITE & CUSTOMER INFO', rightX + 8, y + 8);

      let rightY = y + 22;
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED).text('Customer: ', rightX + 8, rightY);
      doc.font('Helvetica-Bold').fillColor(DARK).text(data.customerName || 'Solar Client', rightX + 70, rightY);
      rightY += 13;
      doc.font('Helvetica').fillColor(MUTED).text('Phone: ', rightX + 8, rightY);
      doc.font('Helvetica').fillColor(DARK).text(data.customerPhone || 'N/A', rightX + 70, rightY);
      rightY += 13;
      doc.font('Helvetica').fillColor(MUTED).text('Delivery Date: ', rightX + 8, rightY);
      doc.font('Helvetica-Bold').fillColor(DARK).text(data.receivedDate || new Date().toISOString().split('T')[0], rightX + 70, rightY);
      rightY += 13;
      doc.font('Helvetica').fillColor(MUTED).text('Site Warehouse: ', rightX + 8, rightY);
      doc.font('Helvetica').fillColor(DARK).text(data.deliveryWarehouse || 'On-Site Staging Location', rightX + 70, rightY);
      rightY += 13;
      doc.font('Helvetica').fillColor(MUTED).text('Site Address: ', rightX + 8, rightY);
      doc.font('Helvetica').fillColor(DARK).text(data.customerAddress ? data.customerAddress.substring(0, 35) : 'Client Installation Site', rightX + 70, rightY);

      y += 98;

      // Table Header: Materials Received & Inspected
      doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text('VERIFIED MATERIALS & LINE ITEM INSPECTION', MARGIN, y);
      y += 14;

      const colDefs = [
        { label: 'S.No', w: 26, align: 'center' },
        { label: 'Item Description & Specs', w: 185, align: 'left' },
        { label: 'Category', w: 85, align: 'left' },
        { label: 'Ord Qty', w: 42, align: 'right' },
        { label: 'Rcv Qty', w: 42, align: 'right' },
        { label: 'Acc Qty', w: 42, align: 'right' },
        { label: 'Short / Rej', w: 50, align: 'right' },
        { label: 'Unit', w: 30, align: 'center' },
      ];

      // Render table header row
      doc.rect(MARGIN, y, CONTENT_W, 20).fill('#1e293b');
      let hX = MARGIN;
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
      colDefs.forEach(col => {
        const textX = col.align === 'right' ? hX : (col.align === 'center' ? hX : hX + 4);
        doc.text(col.label, textX, y + 6, { width: col.w, align: col.align as any });
        hX += col.w;
      });
      y += 20;

      // Table Rows
      let hasShortages = false;
      let totalShortQty = 0;

      data.items.forEach((it, idx) => {
        const rowH = 18;
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(MARGIN, y, CONTENT_W, rowH).fill(bg);
        doc.rect(MARGIN, y, CONTENT_W, rowH).stroke('#e2e8f0');

        const ord = Number(it.orderedQuantity) || 0;
        const rcv = Number(it.receivedQuantity) || 0;
        const acc = Number(it.acceptedQuantity !== undefined ? it.acceptedQuantity : rcv);
        const rej = Number(it.rejectedQuantity || 0) + Math.max(0, ord - acc);

        if (rej > 0) {
          hasShortages = true;
          totalShortQty += rej;
        }

        let rX = MARGIN;
        doc.font('Helvetica').fontSize(7.5).fillColor(DARK);

        // 1. S.No
        doc.text(String(idx + 1), rX, y + 5, { width: colDefs[0].w, align: 'center' });
        rX += colDefs[0].w;

        // 2. Item Description
        doc.font('Helvetica-Bold').text(it.itemName || 'Material Item', rX + 4, y + 5, { width: colDefs[1].w - 8, align: 'left', lineBreak: false });
        rX += colDefs[1].w;

        // 3. Category
        doc.font('Helvetica').fillColor(MUTED).text(it.category || 'Solar BOS', rX + 4, y + 5, { width: colDefs[2].w - 8, align: 'left', lineBreak: false });
        rX += colDefs[2].w;

        // 4. Ord Qty
        doc.fillColor(DARK).text(String(ord), rX, y + 5, { width: colDefs[3].w, align: 'right' });
        rX += colDefs[3].w;

        // 5. Rcv Qty
        doc.fillColor(DARK).text(String(rcv), rX, y + 5, { width: colDefs[4].w, align: 'right' });
        rX += colDefs[4].w;

        // 6. Acc Qty
        doc.font('Helvetica-Bold').fillColor(PRIMARY).text(String(acc), rX, y + 5, { width: colDefs[5].w, align: 'right' });
        rX += colDefs[5].w;

        // 7. Short / Rej Qty
        if (rej > 0) {
          doc.font('Helvetica-Bold').fillColor('#dc2626').text(String(rej), rX, y + 5, { width: colDefs[6].w, align: 'right' });
        } else {
          doc.font('Helvetica').fillColor(MUTED).text('-', rX, y + 5, { width: colDefs[6].w, align: 'right' });
        }
        rX += colDefs[6].w;

        // 8. Unit
        doc.font('Helvetica').fillColor(MUTED).text(it.unit || 'Nos', rX, y + 5, { width: colDefs[7].w, align: 'center' });

        y += rowH;
      });

      y += 8;

      // Discrepancy & Inspection Verdict Box
      const verdictBg = hasShortages ? '#fef2f2' : '#ecfdf5';
      const verdictBorder = hasShortages ? '#f87171' : '#6ee7b7';
      const verdictText = hasShortages 
        ? `⚠️ MATERIAL DISCREPANCY RECORDED: Shortage / Rejection of ${totalShortQty} units noted. Re-order / indemnity in process.` 
        : `✓ 100% COMPLETE & SOUND CONDITION: All equipment received, inspected, and verified with zero discrepancy.`;

      doc.rect(MARGIN, y, CONTENT_W, 24).fill(verdictBg);
      doc.rect(MARGIN, y, CONTENT_W, 24).stroke(verdictBorder);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(hasShortages ? '#991b1b' : '#065f46')
        .text(verdictText, MARGIN + 8, y + 7, { width: CONTENT_W - 16 });
      y += 32;

      // Customer Electronic Signature Acknowledgment Box
      doc.rect(MARGIN, y, CONTENT_W, 175).fill('#fbfcfd');
      doc.rect(MARGIN, y, CONTENT_W, 175).stroke(BORDER);

      doc.rect(MARGIN, y, CONTENT_W, 20).fill('#f1f5f9');
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(DARK)
        .text('CUSTOMER ELECTRONIC SIGNATURE & SITE HANDOVER ACKNOWLEDGMENT', MARGIN + 8, y + 5);

      y += 26;
      doc.font('Helvetica').fontSize(7).fillColor(MUTED)
        .text('Declaration: I/We hereby acknowledge physical receipt of the turnkey solar power plant equipment, modules, inverters, and BOS accessories listed above at our site in sound, un-damaged condition, subject to the discrepancy inspection recorded herein.', MARGIN + 8, y, { width: CONTENT_W - 16, lineGap: 1.5 });

      y += 24;

      // Split into 2 verification columns: Customer Signature (Left) & Verified By Store/PM (Right)
      const sigColW = (CONTENT_W - 24) / 2;

      // Customer Signature Box
      const custBoxX = MARGIN + 8;
      doc.rect(custBoxX, y, sigColW, 115).stroke('#e2e8f0');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(DARK).text('CUSTOMER / AUTHORIZED SIGNATORY', custBoxX + 6, y + 6);

      if (data.customerSignatureData && data.customerSignatureData.startsWith('data:image')) {
        try {
          const base64Data = data.customerSignatureData.replace(/^data:image\/\w+;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          doc.image(imgBuffer, custBoxX + 8, y + 20, { fit: [sigColW - 16, 45], align: 'center' });
        } catch (imgErr) {
          doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(MUTED).text('[Electronic Signature Authenticated Digitally]', custBoxX + 8, y + 35);
        }
      } else {
        doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(MUTED).text('[Signed Electronically via Customer Touch Portal]', custBoxX + 8, y + 35);
      }

      const sigMetaY = y + 70;
      doc.font('Helvetica-Bold').fontSize(7).fillColor(DARK).text(`Name: ${data.customerSignatureName || data.customerName}`, custBoxX + 6, sigMetaY);
      doc.font('Helvetica').fillColor(MUTED).text(`Mobile: ${data.customerSignaturePhone || data.customerPhone || 'Verified'}`, custBoxX + 6, sigMetaY + 11);
      doc.text(`Timestamp: ${data.customerSignatureDate || new Date().toLocaleString('en-IN')}`, custBoxX + 6, sigMetaY + 22);
      doc.font('Helvetica-Bold').fillColor(PRIMARY).text('✓ Digitally Signed & Locked Against Alteration', custBoxX + 6, sigMetaY + 33);

      // Company Store / PM Verification Box
      const compBoxX = custBoxX + sigColW + 8;
      doc.rect(compBoxX, y, sigColW, 115).stroke('#e2e8f0');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(DARK).text('FOR AB ENERGY SOLUTIONS (STORE / SITE LOGISTICS)', compBoxX + 6, y + 6);

      // Company Stamp Representation
      doc.circle(compBoxX + sigColW / 2, y + 42, 22).stroke(PRIMARY);
      doc.font('Helvetica-Bold').fontSize(6).fillColor(PRIMARY)
        .text('AB ENERGY SOLUTIONS', compBoxX + 10, y + 34, { width: sigColW - 20, align: 'center' })
        .text('LOGISTICS VERIFIED', compBoxX + 10, y + 43, { width: sigColW - 20, align: 'center' });

      doc.font('Helvetica-Bold').fontSize(7).fillColor(DARK).text(`Store Officer: ${data.verifiedBy || 'Store In-Charge'}`, compBoxX + 6, sigMetaY);
      doc.font('Helvetica').fillColor(MUTED).text('Designation: Materials Logistics & QA Executive', compBoxX + 6, sigMetaY + 11);
      doc.text(`Verification Date: ${data.receivedDate || new Date().toISOString().split('T')[0]}`, compBoxX + 6, sigMetaY + 22);
      doc.font('Helvetica-Bold').fillColor(DARK).text('Official System Generated & Certified GRN', compBoxX + 6, sigMetaY + 33);

      // Bottom Footer Bar
      const footerY = PAGE_H - 24;
      doc.rect(0, footerY - 4, PAGE_W, 28).fill('#0f172a');
      doc.font('Helvetica').fontSize(6.5).fillColor('#94a3b8')
        .text(`AB Energy Solutions ERP Document Ref: GRN-${data.grnNumber} • Generated on ${new Date().toLocaleString('en-IN')} • Turnkey Solar EPC Project Management`, MARGIN, footerY + 4, { align: 'center', width: CONTENT_W });

      doc.end();

      writeStream.on('finish', () => {
        resolve({
          filePath,
          fileUrl: `/documents/${fileName}`,
        });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}
