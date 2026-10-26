import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { convertNumberToWords } from './quotation-engine.ts';

export interface ProposalPdfData {
  quotationNumber: string;
  versionNumber: number;
  createdAt: string;
  validUntil: string;
  leadName: string;
  customerPhone: string;
  customerAddress: string;
  systemCapacityKw: number;
  actualCapacityKwp: number;
  packageTier: string;
  proposalType: string;
  salespersonName: string;
  taxMode?: 'ITEMIZED' | 'COMPOSITE';
  taxType?: 'CGST_SGST' | 'IGST';
  items: Array<{
    category: string;
    description: string;
    makeModel: string;
    hsnSacCode?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    taxableAmount?: number;
    gstRate?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
    taxAmount?: number;
    totalPrice: number;
    warrantyPeriod: string;
  }>;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  gstAmount: number;
  finalContractAmount: number;
  amountInWords?: string;
  subsidyEligible: boolean;
  subsidyAmount: number;
  indicativeNetCustomerCost: number;
  annualGenerationKwh: number;
  annualSavingsInr: number;
  lifetimeSavings25Yr: number;
  simplePaybackYears: number;
  terms: string[];
}

function formatInr(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '₹0';
  return '₹' + Math.round(Number(amount)).toLocaleString('en-IN');
}

/**
 * Generates an official, publication-quality Solar EPC Proposal PDF
 * with dynamic multi-page continuation, repeated table headers,
 * item-wise GST, statutory HSN/SAC codes, and Indian numbering words.
 * Saves to uploads/proposals/ and returns the local file path and URL.
 */
export async function generateProposalPdf(data: ProposalPdfData): Promise<{ filePath: string; fileUrl: string }> {
  const proposalsDir = path.join(process.cwd(), 'uploads', 'proposals');
  if (!fs.existsSync(proposalsDir)) {
    fs.mkdirSync(proposalsDir, { recursive: true });
  }

  const sanitizedQuoteNo = data.quotationNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Quotation_${sanitizedQuoteNo}.pdf`;
  const filePath = path.join(proposalsDir, fileName);
  const fileUrl = `/uploads/proposals/${fileName}`;

  return new Promise((resolve, reject) => {
    try {
      // Color Palette
      const brandNavy = '#0A1224';
      const brandEmerald = '#059669';
      const slateDark = '#1E293B';
      const slateLight = '#64748B';
      const lightBg = '#F8FAFC';
      const borderLine = '#CBD5E1';
      const tableHeaderBg = '#0F172A';

      // Page Geometry
      const pageMargin = 35;
      const contentWidth = 525; // 595.28 - 70
      const pageBottomThreshold = 750; // Trigger page break if row exceeds this

      const doc = new PDFDocument({
        size: 'A4',
        margin: pageMargin,
        bufferPages: true, // Enables two-pass rendering for corporate page numbering
        info: {
          Title: `Solar Proposal ${data.quotationNumber}`,
          Author: 'AB Energy Solutions',
          Subject: `${data.systemCapacityKw} kW Rooftop Solar Proposal`,
        },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // --- Helper: Render Primary Page 1 Header ---
      const renderPage1Header = () => {
        doc.rect(0, 0, 595.28, 70).fill(brandNavy);

        doc.fillColor('#FFFFFF')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('AB ENERGY SOLUTIONS', 35, 18);

        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#94A3B8')
           .text('Certified Tier-1 Solar EPC & Clean Energy Infrastructure • GSTIN: 29AABCS1429B1Z8', 35, 38)
           .text('Indiranagar, Bengaluru, KA 560038 • support@abenergy.in • +91 80 4920 1888', 35, 49);

        // Proposal Badge on Right
        doc.fillColor('#10B981')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('TECHNO-COMMERCIAL PROPOSAL', 330, 18, { align: 'right', width: 230 });

        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#CBD5E1')
           .text(`REF: ${data.quotationNumber} (Ver ${data.versionNumber})`, 330, 34, { align: 'right', width: 230 })
           .text(`Date: ${new Date(data.createdAt).toLocaleDateString('en-IN')}`, 330, 46, { align: 'right', width: 230 });
      };

      // --- Helper: Render Continued Page Header ---
      const renderContinuedPageHeader = (pageNumber: number) => {
        doc.rect(0, 0, 595.28, 42).fill(brandNavy);

        doc.fillColor('#FFFFFF')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('AB ENERGY SOLUTIONS', 35, 14);

        doc.fillColor('#94A3B8')
           .fontSize(8)
           .font('Helvetica')
           .text(`Proposal Ref: ${data.quotationNumber}  •  Client: ${data.leadName}`, 180, 15);

        doc.fillColor('#10B981')
           .fontSize(8)
           .font('Helvetica-Bold')
           .text(`Page ${pageNumber} (Continued)`, 400, 15, { align: 'right', width: 160 });
      };

      // --- Helper: Render 9-Column BOM Table Header ---
      const renderTableHeader = (y: number, isContinued: boolean = false) => {
        if (isContinued) {
          doc.fillColor(brandNavy)
             .fontSize(8.5)
             .font('Helvetica-Bold')
             .text('EQUIPMENT BILL OF MATERIALS (BOM) & STATUTORY GST BREAKDOWN — CONTINUED', 35, y);
          y += 14;
        }

        const h = 20;
        doc.rect(35, y, contentWidth, h).fill(tableHeaderBg);

        doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
        doc.text('#', 35, y + 6, { width: 18, align: 'center' });
        doc.text('MATERIAL / SCOPE OF WORK', 55, y + 6, { width: 170, align: 'left' });
        doc.text('HSN/SAC', 227, y + 6, { width: 42, align: 'center' });
        doc.text('QTY', 271, y + 6, { width: 38, align: 'center' });
        doc.text('RATE (₹)', 311, y + 6, { width: 49, align: 'right' });
        doc.text('TAXABLE (₹)', 362, y + 6, { width: 53, align: 'right' });
        doc.text('GST %', 417, y + 6, { width: 32, align: 'center' });
        doc.text('TAX (₹)', 451, y + 6, { width: 48, align: 'right' });
        doc.text('TOTAL (₹)', 501, y + 6, { width: 59, align: 'right' });

        return y + h;
      };

      // Start Page 1
      renderPage1Header();
      let currentY = 80;

      // --- METADATA ROW ---
      doc.rect(35, currentY, contentWidth, 54).fillAndStroke(lightBg, borderLine);

      doc.fillColor(slateDark).fontSize(8.5).font('Helvetica-Bold').text('CLIENT & PROJECT DETAILS', 45, currentY + 6);
      doc.font('Helvetica').fontSize(8).fillColor(slateDark)
         .text(`Client Name: ${data.leadName}`, 45, currentY + 19)
         .text(`Contact Phone: ${data.customerPhone}`, 45, currentY + 30)
         .text(`Site Location: ${data.customerAddress || 'Bengaluru, Karnataka'}`, 45, currentY + 41, { width: 250, ellipsis: true });

      doc.font('Helvetica-Bold').fontSize(8.5).text('TECHNICAL SIZING SPECIFICATIONS', 320, currentY + 6);
      doc.font('Helvetica').fontSize(8)
         .text(`System Capacity: ${data.systemCapacityKw} kW DC (${data.actualCapacityKwp} kWp)`, 320, currentY + 19)
         .text(`Package Tier: ${data.packageTier}`, 320, currentY + 30)
         .text(`Valid Until: ${data.validUntil} (14 Days)  •  Sales: ${data.salespersonName}`, 320, currentY + 41);

      currentY += 64;

      // --- BOM TABLE TITLE ---
      doc.fillColor(brandNavy)
         .fontSize(9.5)
         .font('Helvetica-Bold')
         .text('EQUIPMENT BILL OF MATERIALS (BOM) & STATUTORY GST BREAKDOWN', 35, currentY);
      currentY += 14;

      // Draw Initial Table Header
      currentY = renderTableHeader(currentY, false);

      let currentPageIndex = 1;

      // --- RENDER MATERIAL ROWS (WITH DYNAMIC ROW-SPLIT PREVENTION) ---
      data.items.forEach((item, index) => {
        const taxable = item.taxableAmount !== undefined ? item.taxableAmount : (item.quantity * item.unitPrice);
        const gstRate = item.gstRate !== undefined ? item.gstRate : data.gstRate;
        const tax = item.taxAmount !== undefined ? item.taxAmount : Math.round(taxable * (gstRate / 100));
        const lineTotal = item.totalPrice !== undefined ? item.totalPrice : (taxable + tax);

        const subText = `Make: ${item.makeModel}  •  ${item.warrantyPeriod}`;

        // Measure dynamic heights
        doc.font('Helvetica-Bold').fontSize(7.5);
        const descH = doc.heightOfString(item.description, { width: 170 });
        doc.font('Helvetica').fontSize(6.5);
        const subH = doc.heightOfString(subText, { width: 170 });

        const rowHeight = Math.max(26, Math.ceil(descH + subH + 10));

        // Check for page overflow
        if (currentY + rowHeight > pageBottomThreshold) {
          // Bottom continuation prompt
          doc.rect(35, currentY, contentWidth, 14).fillAndStroke('#F1F5F9', borderLine);
          doc.fillColor(slateLight).fontSize(7).font('Helvetica-Oblique')
             .text('(BOM continued on next page →)', 45, currentY + 3, { align: 'right', width: 505 });

          // Spawn next page
          doc.addPage();
          currentPageIndex++;
          renderContinuedPageHeader(currentPageIndex);
          currentY = 56;
          currentY = renderTableHeader(currentY, true);
        }

        // Draw alternating background row
        const isEven = index % 2 === 0;
        doc.rect(35, currentY, contentWidth, rowHeight).fill(isEven ? '#FFFFFF' : '#F8FAFC');
        doc.strokeColor(borderLine).lineWidth(0.5).rect(35, currentY, contentWidth, rowHeight).stroke();

        // Print Col 1: Index
        doc.fillColor(slateDark).fontSize(7.5).font('Helvetica');
        doc.text(`${index + 1}`, 35, currentY + 6, { width: 18, align: 'center' });

        // Print Col 2: Material description & subtext
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(slateDark)
           .text(item.description, 55, currentY + 4, { width: 170 });
        doc.font('Helvetica').fontSize(6.5).fillColor(slateLight)
           .text(subText, 55, currentY + 4 + descH + 1, { width: 170 });

        // Center / Right align other columns vertically
        const midY = currentY + 6;
        doc.fontSize(7.5).fillColor(slateDark);

        // Col 3: HSN/SAC
        doc.text(item.hsnSacCode || '8541', 227, midY, { width: 42, align: 'center' });

        // Col 4: Qty & Unit
        doc.text(`${item.quantity} ${item.unit}`, 271, midY, { width: 38, align: 'center' });

        // Col 5: Unit Rate
        doc.text(formatInr(item.unitPrice), 311, midY, { width: 49, align: 'right' });

        // Col 6: Taxable Amount
        doc.text(formatInr(taxable), 362, midY, { width: 53, align: 'right' });

        // Col 7: GST %
        doc.font('Helvetica-Bold').text(`${gstRate}%`, 417, midY, { width: 32, align: 'center' });

        // Col 8: Tax Amount
        doc.font('Helvetica').text(formatInr(tax), 451, midY, { width: 48, align: 'right' });

        // Col 9: Total Price
        doc.font('Helvetica-Bold').text(formatInr(lineTotal), 501, midY, { width: 59, align: 'right' });

        currentY += rowHeight;
      });

      // --- CHECK IF SUMMARY BLOCK FITS ON CURRENT PAGE ---
      // Summary block needs ~265 pt. If remaining space < 265 pt, move to next page cleanly.
      const summaryRequiredHeight = 265;
      if (currentY + summaryRequiredHeight > pageBottomThreshold) {
        doc.rect(35, currentY, contentWidth, 14).fillAndStroke('#F1F5F9', borderLine);
        doc.fillColor(slateLight).fontSize(7).font('Helvetica-Oblique')
           .text('(Financial Summary and Terms continue on next page →)', 45, currentY + 3, { align: 'right', width: 505 });

        doc.addPage();
        currentPageIndex++;
        renderContinuedPageHeader(currentPageIndex);
        currentY = 56;
      } else {
        currentY += 6;
      }

      // --- AMOUNT IN WORDS BAR ---
      const words = data.amountInWords || convertNumberToWords(data.finalContractAmount);
      doc.rect(35, currentY, contentWidth, 18).fillAndStroke('#F1F5F9', borderLine);
      doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold').text('Amount in Words: ', 43, currentY + 5, { continued: true });
      doc.font('Helvetica').fillColor(brandNavy).text(words);

      currentY += 24;

      // --- TWO-COLUMN SUMMARY GRID (ROI ON LEFT, FINANCIAL/TAX ON RIGHT) ---
      const boxHeight = 118;

      // 1. Generation & Savings ROI (Left Box)
      doc.rect(35, currentY, 245, boxHeight).fillAndStroke(lightBg, borderLine);
      doc.fillColor(brandEmerald).fontSize(8.5).font('Helvetica-Bold').text('ESTIMATED GENERATION & SOLAR PAYBACK', 43, currentY + 7);

      doc.fillColor(slateDark).fontSize(7.5).font('Helvetica')
         .text(`Estimated Annual Yield: ~${data.annualGenerationKwh.toLocaleString('en-IN')} kWh / yr`, 43, currentY + 22)
         .text(`Annual Grid Bill Savings: ~₹${data.annualSavingsInr.toLocaleString('en-IN')} / yr`, 43, currentY + 36)
         .text(`25-Year Cumulative Savings: ~₹${data.lifetimeSavings25Yr.toLocaleString('en-IN')}`, 43, currentY + 50)
         .text(`Estimated Simple Payback: ~${data.simplePaybackYears} Years`, 43, currentY + 64);

      doc.fillColor(slateLight).fontSize(6.5)
         .text('*Calculated at 1,450 kWh/kWp specific yield & ₹8.20/kWh average grid tariff.', 43, currentY + 82, { width: 230 })
         .text('*Actual solar generation depends on local irradiance and rooftop tilt angle.', 43, currentY + 93, { width: 230 });

      // 2. Financial & Tax Breakdown (Right Box)
      doc.rect(290, currentY, 270, boxHeight).fillAndStroke('#FFFFFF', borderLine);

      const isIgst = data.taxType === 'IGST' || (data.igstAmount !== undefined && data.igstAmount > 0);
      const cgst = data.cgstAmount !== undefined ? data.cgstAmount : Math.round(data.gstAmount / 2);
      const sgst = data.sgstAmount !== undefined ? data.sgstAmount : (data.gstAmount - cgst);
      const igst = data.igstAmount !== undefined ? data.igstAmount : data.gstAmount;

      let sumY = currentY + 6;
      doc.fillColor(slateDark).fontSize(7.5).font('Helvetica');
      doc.text('Gross Equipment Subtotal:', 298, sumY);
      doc.text(formatInr(data.subtotal), 455, sumY, { width: 100, align: 'right' });

      if (data.discountAmount > 0) {
        sumY += 12;
        doc.text('Commercial Discount:', 298, sumY);
        doc.fillColor(brandEmerald).text(`- ${formatInr(data.discountAmount)}`, 455, sumY, { width: 100, align: 'right' });
        doc.fillColor(slateDark);
      }

      sumY += 12;
      doc.font('Helvetica-Bold').text('Net Taxable Base Value:', 298, sumY);
      doc.text(formatInr(data.taxableAmount), 455, sumY, { width: 100, align: 'right' });

      sumY += 12;
      doc.font('Helvetica');
      if (isIgst) {
        doc.text('Integrated GST (IGST):', 298, sumY);
        doc.text(formatInr(igst), 455, sumY, { width: 100, align: 'right' });
      } else {
        doc.text('Central GST (CGST):', 298, sumY);
        doc.text(formatInr(cgst), 455, sumY, { width: 100, align: 'right' });
        sumY += 11;
        doc.text('State GST (SGST):', 298, sumY);
        doc.text(formatInr(sgst), 455, sumY, { width: 100, align: 'right' });
      }

      sumY += 14;
      doc.rect(290, sumY - 2, 270, 20).fill('#0F172A');
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#FFFFFF');
      doc.text('FINAL CONTRACT VALUE:', 298, sumY + 3);
      doc.text(formatInr(data.finalContractAmount), 445, sumY + 3, { width: 110, align: 'right' });

      if (data.subsidyEligible && data.subsidyAmount > 0) {
        sumY += 24;
        doc.font('Helvetica').fontSize(7.5).fillColor(brandEmerald);
        doc.text('PM Surya Ghar Subsidy (Direct Benefit):', 298, sumY);
        doc.text(`- ${formatInr(data.subsidyAmount)}`, 445, sumY, { width: 110, align: 'right' });

        sumY += 11;
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(brandNavy);
        doc.text('Indicative Net Out-of-Pocket:', 298, sumY);
        doc.text(formatInr(data.indicativeNetCustomerCost), 445, sumY, { width: 110, align: 'right' });
      }

      currentY += boxHeight + 10;

      // --- MILESTONE PAYMENT SCHEDULE & TERMS ---
      doc.fillColor(brandNavy).fontSize(8.5).font('Helvetica-Bold').text('MILESTONE PAYMENT SCHEDULE & TERMS', 35, currentY);
      currentY += 12;
      const termsToPrint = data.terms && data.terms.length > 0 ? data.terms.slice(0, 4) : [
        '40% Advance on signing contract and engineering layout signoff.',
        '40% Upon warehouse material dispatch & physical site delivery.',
        '20% Upon successful system testing, commissioning & net-metering synchronization.',
        'Quotation validity is 14 days from date of issue.',
      ];
      termsToPrint.forEach((term) => {
        doc.fillColor(slateDark).fontSize(7).font('Helvetica').text(`•  ${term}`, 40, currentY, { width: 515 });
        currentY += 10;
      });

      currentY += 4;

      // --- SIGNATURE BLOCK ---
      const sigHeight = 44;
      doc.rect(35, currentY, 250, sigHeight).stroke(borderLine);
      doc.fillColor(slateLight).fontSize(6.5).text('For AB Energy Solutions (Authorized Signatory):', 42, currentY + 5);
      doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Bold').text(data.salespersonName || 'Authorized Signatory', 42, currentY + 28);

      doc.rect(310, currentY, 250, sigHeight).stroke(borderLine);
      doc.fillColor(slateLight).fontSize(6.5).text('Client Acceptance Signature:', 318, currentY + 5);
      doc.fillColor(slateDark).fontSize(7).text('I accept the above proposal terms & BOM scope.', 318, currentY + 28);

      // --- CORPORATE FOOTER WITH TWO-PASS PAGE NUMBERING (ZERO LOCALHOST ARTIFACTS) ---
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        // Footer divider line
        doc.strokeColor(borderLine).lineWidth(0.5).moveTo(35, 805).lineTo(560, 805).stroke();

        // Left corporate identification
        doc.font('Helvetica').fontSize(6.5).fillColor(slateLight);
        doc.text(
          'AB Energy Solutions • CIN: U40106KA2021PTC148921 • GSTIN: 29AABCS1429B1Z8 • Indiranagar, Bengaluru, KA 560038 • support@abenergy.in',
          35,
          812,
          { width: 420 }
        );

        // Right page numbering
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor(slateDark);
        doc.text(
          `Page ${i + 1} of ${totalPages}`,
          460,
          812,
          { width: 100, align: 'right' }
        );
      }

      doc.end();

      writeStream.on('finish', () => {
        resolve({ filePath, fileUrl });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}
