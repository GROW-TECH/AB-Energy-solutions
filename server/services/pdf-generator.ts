import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

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
    specification?: string;
    make?: string;
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

/**
 * Generates official AB Energy Solutions Professional Quotation Proposal PDF
 * exactly matching the authentic 6-page A4 engineering proposal document structure.
 * Features dynamic multi-page BOM pagination, dynamic page numbering (Page X of Y),
 * and exact commercial values from the database.
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
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
        info: {
          Title: `AB Energy Solutions - Quotation ${data.quotationNumber}`,
          Author: 'AB Energy Solutions',
          Subject: `${data.systemCapacityKw} kW Grid-Connected Rooftop Solar Power System`,
        },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const coverPhotoPath = path.join(process.cwd(), 'public', 'solar-roof-cover.jpg');
      const hasLogo = fs.existsSync(logoPath);
      const hasCoverPhoto = fs.existsSync(coverPhotoPath);

      // Consistent Professional Palette
      const headingNavy = '#0F172A';
      const bodyDark = '#1E293B';
      const textMuted = '#475569';
      const greenAccent = '#059669';
      const greenLight = '#ECFDF5';
      const borderSlate = '#CBD5E1';
      const bgLight = '#F8FAFC';

      const drawHeaderBanner = (pageTitle?: string) => {
        // Watermark logo in background
        if (hasLogo) {
          doc.save();
          doc.opacity(0.035);
          doc.image(logoPath, 127, 260, { width: 340 });
          doc.restore();
        }

        // Header bar at Y = 28
        doc.font('Helvetica-Bold').fontSize(9).fillColor(headingNavy).text('AB ENERGY SOLUTIONS', 40, 26);
        doc.font('Helvetica').fontSize(7.5).fillColor(textMuted).text('Turnkey Solar EPC & Engineering', 40, 37);

        doc.font('Helvetica-Bold').fontSize(8).fillColor(greenAccent)
           .text(`Quotation: ${data.quotationNumber}`, 200, 26, { width: 195, align: 'center' });
        if (pageTitle) {
          doc.font('Helvetica-Oblique').fontSize(7).fillColor(textMuted)
             .text(pageTitle, 200, 37, { width: 195, align: 'center' });
        }

        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(headingNavy)
           .text('GST: 33FSQPA3244H1ZU', 40, 26, { align: 'right', width: 515 });
        doc.font('Helvetica').fontSize(7.5).fillColor(textMuted)
           .text('CIN/MSME Registered', 40, 37, { align: 'right', width: 515 });

        doc.moveTo(40, 48).lineTo(555, 48).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
      };

      const drawFooter = (pageNum: number, totalPages: number) => {
        doc.moveTo(40, 785).lineTo(555, 785).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
        doc.font('Helvetica').fontSize(8).fillColor(textMuted)
           .text(`AB Energy Solutions  •  Turnkey Solar EPC & Engineering  •  Page ${pageNum} of ${totalPages}`, 40, 792, { align: 'center', width: 515 });
      };

      // ==========================================
      // PAGE 1: COVER PAGE
      // ==========================================
      if (hasLogo) {
        doc.image(logoPath, 40, 28, { width: 125, height: 70, fit: [125, 70] });
      } else {
        doc.font('Helvetica-Bold').fontSize(16).fillColor(headingNavy).text('AB ENERGY SOLUTIONS', 40, 35);
      }

      doc.font('Helvetica-Bold').fontSize(10).fillColor(headingNavy)
         .text('GST: 33FSQPA3244H1ZU', 40, 35, { align: 'right', width: 515 });
      doc.font('Helvetica').fontSize(8.5).fillColor(textMuted)
         .text('Solar EPC • Electrical Infrastructure • O&M', 40, 49, { align: 'right', width: 515 });
      doc.font('Helvetica-Bold').fontSize(8).fillColor(greenAccent)
         .text('TNEB C-Licence Certified Enterprise', 40, 62, { align: 'right', width: 515 });

      doc.moveTo(40, 105).lineTo(555, 105).lineWidth(0.75).strokeColor('#E2E8F0').stroke();

      // Title & Subtitle
      doc.font('Helvetica-Bold').fontSize(15).fillColor(headingNavy)
         .text(`Quotation for ${data.systemCapacityKw} kW Grid-Connected Rooftop Solar Power System`, 40, 118, { align: 'center', width: 515 });
      doc.font('Helvetica').fontSize(9).fillColor(greenAccent)
         .text('Turnkey Engineering, Procurement, Installation & Commissioning Proposal', 40, 137, { align: 'center', width: 515 });

      // Quote No & Date Row
      const formattedDate = new Date(data.createdAt || Date.now()).toLocaleDateString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      doc.font('Helvetica-Bold').fontSize(9).fillColor(headingNavy)
         .text(`Quotation No.: ${data.quotationNumber}`, 45, 154);
      doc.font('Helvetica').fontSize(8.5).fillColor(textMuted)
         .text(`Package Tier: ${data.packageTier || 'Premium Tier-1'}`, 210, 154, { width: 175, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(9).fillColor(headingNavy)
         .text(`Date: ${formattedDate}`, 40, 154, { align: 'right', width: 515 });

      // Cover Photo
      if (hasCoverPhoto) {
        doc.image(coverPhotoPath, 40, 172, { width: 515, height: 265, fit: [515, 265], align: 'center' });
      } else {
        doc.rect(40, 172, 515, 265).fillAndStroke(bgLight, borderSlate);
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#64748B')
           .text('Grid-Connected Solar Rooftop EPC System', 40, 290, { align: 'center', width: 515 });
      }

      // Customer Details Card
      const custBoxY = 452;
      doc.rect(40, custBoxY, 515, 112).fillAndStroke(bgLight, borderSlate);

      doc.rect(40, custBoxY, 515, 24).fillAndStroke('#F1F5F9', borderSlate);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(headingNavy)
         .text('CUSTOMER DETAILS', 55, custBoxY + 7);

      doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark);
      doc.text(`Client Name: `, 55, custBoxY + 32, { continued: true })
         .font('Helvetica-Bold').text(data.leadName);

      doc.font('Helvetica').text(`Service Number: `, 55, custBoxY + 50, { continued: true })
         .font('Helvetica-Bold').text(`045310081264 / ${data.systemCapacityKw}KWp`);

      doc.font('Helvetica').text(`Quoted Capacity: `, 55, custBoxY + 68, { continued: true })
         .font('Helvetica-Bold').text(`${data.systemCapacityKw} kW On-Grid Solar`);

      doc.font('Helvetica').text(`Proposal Type: `, 55, custBoxY + 86, { continued: true })
         .font('Helvetica-Bold').text(`${data.proposalType || 'Grid-Tied Commercial/Residential'}`);

      doc.font('Helvetica').text(`Phone: `, 300, custBoxY + 32, { continued: true })
         .font('Helvetica-Bold').text(data.customerPhone || 'N/A');

      doc.font('Helvetica').text(`Site Address: `, 300, custBoxY + 50);
      doc.font('Helvetica-Bold').text(data.customerAddress || 'West Rajapalayam, P.N palayam, TN', 300, custBoxY + 62, { width: 240 });

      // Key Metrics Strip at bottom of Cover Page
      const metricY = 580;
      const metricW = 165;
      const metrics = [
        { label: 'Plant Capacity', val: `${data.systemCapacityKw} kW On-Grid` },
        { label: 'Estimated Annual Yield', val: `~${Math.round(data.annualGenerationKwh || data.systemCapacityKw * 1500).toLocaleString('en-IN')} Units` },
        { label: 'Module Performance', val: '25-30 Years Tier-1' },
      ];
      metrics.forEach((m, idx) => {
        const mX = 40 + idx * 175;
        doc.rect(mX, metricY, metricW, 46).fillAndStroke('#FFFFFF', borderSlate);
        doc.font('Helvetica').fontSize(7.5).fillColor(textMuted).text(m.label, mX + 8, metricY + 8);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(greenAccent).text(m.val, mX + 8, metricY + 24);
      });

      // ==========================================
      // PAGE 2: CORPORATE PROFILE & LETTER
      // ==========================================
      doc.addPage();
      drawHeaderBanner('Corporate Profile & Executive Letter');

      let p2Y = 60;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(headingNavy)
         .text(`Subject: Proposal for Supply, Installation, Testing & Commissioning of ${data.systemCapacityKw} kW Grid-Connected Rooftop Solar Power System`, 40, p2Y, { width: 515, lineGap: 3 });
      p2Y += 32;

      doc.font('Helvetica').fontSize(9).fillColor(bodyDark).text('Dear Sir,', 40, p2Y);
      p2Y += 16;

      doc.font('Helvetica').fontSize(9).fillColor(bodyDark).text(
        `Thank you for giving us the opportunity to submit our quotation for your ${data.systemCapacityKw} kW Solar Rooftop Project. We are pleased to offer our professional turnkey services as detailed below.\n\n` +
        `The quotation includes the complete supply, installation, testing, and commissioning of a Grid-Connected Solar Rooftop System.`,
        40, p2Y, { width: 515, lineGap: 3.5 }
      );
      p2Y += 56;

      // ABOUT AB ENERGY SOLUTION
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingNavy).text('ABOUT AB ENERGY SOLUTION', 40, p2Y);
      p2Y += 20;

      doc.font('Helvetica').fontSize(9).fillColor('#334155').text(
        'AB Energy Solution is a trusted Solar EPC & Electrical Engineering Company specializing in Project Management Consultancy (PMC), Owner\'s Engineer Services, Solar EPC, Installation, Testing & Commissioning (I&C), HT/LT Electrical Works, and Solar Material Supply.\n\n' +
        'With 12+ years of industry experience, we have successfully completed 50+ Solar & Electrical Projects across Residential, Commercial, Industrial, and Agricultural sectors. Our team includes TNEB C Licence Certified Engineers and experienced professionals dedicated to delivering projects with the highest standards of Quality, Safety, and On-Time Delivery.\n\n' +
        'We provide complete end-to-end solar solutions, from Site Survey, Design, Engineering, Procurement, Installation, Testing & Commissioning to Net Metering, CEIG Documentation, and Annual Maintenance (O&M).',
        40, p2Y, { width: 515, lineGap: 4, align: 'justify' }
      );
      p2Y += 160;

      // Quality & Safety Highlight Box
      doc.rect(40, p2Y, 515, 68).fillAndStroke(bgLight, borderSlate);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(headingNavy)
         .text('Quality & Compliance Assurance', 55, p2Y + 12);
      doc.font('Helvetica').fontSize(8.5).fillColor(textMuted).text(
        'All engineering designs, structural fabrications, module installations, and electrical grid synchronizations are performed strictly complying with MNRE standards, CEA technical regulations, DISCOM grid codes, and TANGEDCO net-metering protocols.',
        55, p2Y + 28, { width: 485, lineGap: 2.5 }
      );

      // ==========================================
      // PAGE 3: SERVICES, ADVANTAGES & VISION
      // ==========================================
      doc.addPage();
      drawHeaderBanner('Services, Advantages & Corporate Vision');

      let p3Y = 60;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingNavy).text('OUR SERVICES', 40, p3Y);
      p3Y += 20;

      const servicesCol1 = [
        'Solar Rooftop EPC Projects',
        'Ground Mounted Solar Power Plants',
        'Project Management Consultancy (PMC)',
        'Owner\'s Engineer Services',
        'Installation, Testing & Commissioning (I&C)',
        'Solar Water Pump Systems',
      ];
      const servicesCol2 = [
        'HT & LT Electrical Works',
        'Transmission Line & Pole Yard Works',
        'Net Metering & CEIG Approval Support',
        'Operation & Maintenance (O&M)',
        'Solar Material Supply',
      ];

      let sY1 = p3Y;
      servicesCol1.forEach(srv => {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(greenAccent).text('•', 48, sY1);
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`  ${srv}`, 58, sY1);
        sY1 += 18;
      });

      let sY2 = p3Y;
      servicesCol2.forEach(srv => {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(greenAccent).text('•', 300, sY2);
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`  ${srv}`, 310, sY2);
        sY2 += 18;
      });

      p3Y = Math.max(sY1, sY2) + 24;

      // WHY CHOOSE AB ENERGY SOLUTION?
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingNavy).text('WHY CHOOSE AB ENERGY SOLUTION?', 40, p3Y);
      p3Y += 20;

      const whyCol1 = [
        '12+ Years of Industry Experience',
        '50+ Successfully Completed Projects',
        'TNEB C Licence Certified Engineers',
        'Quality Workmanship & Safety Standards',
      ];
      const whyCol2 = [
        'Professional Project Management',
        'On-Time Project Delivery',
        'Transparent Communication',
        'Reliable After-Sales Support',
      ];

      let wY1 = p3Y;
      whyCol1.forEach(item => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(greenAccent).text('✔', 48, wY1);
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`   ${item}`, 62, wY1);
        wY1 += 18;
      });

      let wY2 = p3Y;
      whyCol2.forEach(item => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(greenAccent).text('✔', 300, wY2);
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`   ${item}`, 314, wY2);
        wY2 += 18;
      });

      p3Y = Math.max(wY1, wY2) + 28;

      // OUR COMMITMENT & VISION
      doc.rect(40, p3Y, 515, 80).fillAndStroke(bgLight, borderSlate);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(headingNavy)
         .text('Our Commitment', 55, p3Y + 14);
      doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark)
         .text('Quality  •  Safety  •  Innovation  •  Integrity  •  Customer Satisfaction', 55, p3Y + 28);

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(headingNavy)
         .text('Our Vision', 55, p3Y + 46);
      doc.font('Helvetica-Oblique').fontSize(8).fillColor(textMuted).text(
        '"To deliver sustainable, reliable, and high-quality solar energy solutions that create long-term value for our customers and contribute to a greener future."',
        55, p3Y + 60, { width: 485 }
      );

      // ==========================================
      // PAGE 4: SCOPE OF WORK & DYNAMIC BILL OF MATERIALS
      // ==========================================
      doc.addPage();
      drawHeaderBanner('Technical Scope of Work & Bill of Materials');

      let p4Y = 60;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingNavy).text('Scope of Work', 40, p4Y);
      p4Y += 16;

      doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark)
         .text('We will execute the complete following turnkey EPC activities:', 40, p4Y);
      p4Y += 15;

      const scopeCol1 = ['Site Survey', 'Engineering Support', 'Supply of Material'];
      const scopeCol2 = ['Complete Installation', 'Testing & Commissioning', 'Service Support'];

      let scY1 = p4Y;
      scopeCol1.forEach(sc => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(greenAccent).text('•', 48, scY1);
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`   ${sc}`, 58, scY1);
        scY1 += 14;
      });
      let scY2 = p4Y;
      scopeCol2.forEach(sc => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(greenAccent).text('•', 300, scY2);
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`   ${sc}`, 310, scY2);
        scY2 += 14;
      });

      p4Y = Math.max(scY1, scY2) + 20;

      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingNavy).text('Bill Of Materials', 40, p4Y);
      p4Y += 16;

      // Table Header: S.NO | MATERIALS | SPECIFICATION | MAKE | UNITS | QUANTITY
      const colX = [40, 75, 185, 360, 455, 500];
      const colW = [35, 110, 175, 95, 45, 55];
      const tableW = 515;

      const drawBOMTableHeader = (y: number, isContinued = false) => {
        doc.rect(40, y, tableW, 20).fillAndStroke('#0F172A', '#0F172A');
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF');
        doc.text('S.NO', colX[0], y + 6, { width: colW[0], align: 'center' });
        doc.text(isContinued ? 'MATERIALS (Contd.)' : 'MATERIALS', colX[1], y + 6, { width: colW[1], align: 'left' });
        doc.text('SPECIFICATION', colX[2], y + 6, { width: colW[2], align: 'left' });
        doc.text('MAKE', colX[3], y + 6, { width: colW[3], align: 'left' });
        doc.text('UNITS', colX[4], y + 6, { width: colW[4], align: 'center' });
        doc.text('QUANTITY', colX[5], y + 6, { width: colW[5], align: 'center' });
      };

      drawBOMTableHeader(p4Y);
      p4Y += 20;

      // Table Rows populated dynamically from BOM items
      const bomItems = data.items && data.items.length > 0 ? data.items : [];
      bomItems.forEach((item, idx) => {
        const materialName = item.category || item.description || 'Solar Component';
        const spec = item.specification || item.description || item.makeModel || 'Standard';
        const make = item.make || item.makeModel?.split(' ')[0] || 'Reputed Tier-1';
        const unit = item.unit || 'Nos';
        const qty = item.quantity || 1;

        const rowHeight = 19;

        // Check for page overflow
        if (p4Y + rowHeight > 730) {
          doc.addPage();
          drawHeaderBanner('Bill of Materials (Continued)');
          p4Y = 60;
          drawBOMTableHeader(p4Y, true);
          p4Y += 20;
        }

        const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, p4Y, tableW, rowHeight).fillAndStroke(rowBg, '#CBD5E1');

        doc.font('Helvetica').fontSize(7.5).fillColor(bodyDark);
        doc.text(String(idx + 1), colX[0], p4Y + 5, { width: colW[0], align: 'center' });
        doc.font('Helvetica-Bold').text(materialName, colX[1], p4Y + 5, { width: colW[1], ellipsis: true });
        doc.font('Helvetica').text(spec, colX[2], p4Y + 5, { width: colW[2], ellipsis: true });
        doc.text(make, colX[3], p4Y + 5, { width: colW[3], ellipsis: true });
        doc.text(unit, colX[4], p4Y + 5, { width: colW[4], align: 'center' });
        doc.font('Helvetica-Bold').text(String(qty), colX[5], p4Y + 5, { width: colW[5], align: 'center' });

        p4Y += rowHeight;
      });

      // Government Subsidy Scheme Note
      p4Y += 12;
      if (p4Y + 36 > 730) {
        doc.addPage();
        drawHeaderBanner('Technical Compliance');
        p4Y = 60;
      }

      doc.rect(40, p4Y, tableW, 28).fillAndStroke('#FEF3C7', '#F59E0B');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#92400E')
         .text('Note: As this project is proposed under the Government Subsidy Scheme, all supplied solar modules must comply with the Domestic Content Requirement (DCR) guidelines.', 48, p4Y + 9, { width: 495 });

      // ==========================================
      // PAGE 5: CLIENT SCOPE, FEATURES & WARRANTY, SYSTEM CAPACITY & PRICING
      // ==========================================
      doc.addPage();
      drawHeaderBanner('Client Scope, Features, Warranty & Commercials');

      let p5Y = 60;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingNavy).text('Client Scope', 40, p5Y);
      p5Y += 16;

      const clientScopeCol1 = [
        'Provide a shadow-free installation area.',
        'Minor civil works, if required.',
        'Statutory charges for Bi-Directional Net Meter.',
      ];
      const clientScopeCol2 = [
        'Non-statutory charges related to Net Metering.',
        'Additional charges for elevated structures (if applicable).',
        'SIM card for the Wi-Fi monitoring dongle / APFC.',
      ];

      let csY1 = p5Y;
      clientScopeCol1.forEach(cs => {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(greenAccent).text('➢', 48, csY1);
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`   ${cs}`, 58, csY1);
        csY1 += 15;
      });
      let csY2 = p5Y;
      clientScopeCol2.forEach(cs => {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(greenAccent).text('➢', 300, csY2);
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`   ${cs}`, 310, csY2);
        csY2 += 15;
      });

      p5Y = Math.max(csY1, csY2) + 20;

      // Features and Warranty
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingNavy).text('Features and Warranty', 40, p5Y);
      p5Y += 16;

      const dailyKwh = Math.round(data.systemCapacityKw * 5);
      const featCol1 = [
        'Tier-1 High-Efficiency Solar Modules',
        'Inverter Warranty: Up to 8 Years',
        'Solar Module Product Warranty: 12 Years',
        'Solar Module Performance Warranty: Up to 30 Years',
      ];
      const featCol2 = [
        'Workmanship Warranty: 1 Year',
        `Estimated Energy Generation: ~${dailyKwh} kWh/day`,
        'Non DCR / DCR Solar Panels as applicable',
        'Compliant with MNRE and DISCOM Standards',
      ];

      let ftY1 = p5Y;
      featCol1.forEach(ft => {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(greenAccent).text('-', 48, ftY1);
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`   ${ft}`, 58, ftY1);
        ftY1 += 15;
      });
      let ftY2 = p5Y;
      featCol2.forEach(ft => {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(greenAccent).text('-', 300, ftY2);
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`   ${ft}`, 310, ftY2);
        ftY2 += 15;
      });

      p5Y = Math.max(ftY1, ftY2) + 24;

      // System Capacity & Pricing
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingNavy).text('System Capacity & Pricing', 40, p5Y);
      p5Y += 16;

      const priceW = 515;
      const hasSubsidy = data.subsidyEligible && (data.subsidyAmount > 0);

      doc.rect(40, p5Y, priceW, 22).fillAndStroke('#0F172A', '#0F172A');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');
      doc.text('System Capacity', 45, p5Y + 6, { width: 145, align: 'center' });
      doc.text('Domestic Price (Including GST)', 195, p5Y + 6, { width: 165, align: 'center' });
      doc.text(hasSubsidy ? 'Govt Subsidy / Net Cost' : 'Estimated ROI', 365, p5Y + 6, { width: 185, align: 'center' });
      p5Y += 22;

      const finalPriceStr = `₹${Math.round(data.finalContractAmount).toLocaleString('en-IN')}/-`;
      doc.rect(40, p5Y, priceW, 36).fillAndStroke('#FFFFFF', '#CBD5E1');

      doc.font('Helvetica-Bold').fontSize(9).fillColor(bodyDark);
      doc.text(`${data.systemCapacityKw}KW On-grid Solar System`, 45, p5Y + 13, { width: 145, align: 'center' });

      doc.font('Helvetica-Bold').fontSize(12).fillColor(headingNavy);
      doc.text(finalPriceStr, 195, p5Y + 11, { width: 165, align: 'center' });

      if (hasSubsidy) {
        const netCost = data.indicativeNetCustomerCost || (data.finalContractAmount - data.subsidyAmount);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(greenAccent)
           .text(`Subsidy: ₹${Math.round(data.subsidyAmount).toLocaleString('en-IN')}`, 365, p5Y + 7, { width: 185, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(headingNavy)
           .text(`Net Cost: ₹${Math.round(netCost).toLocaleString('en-IN')}/-`, 365, p5Y + 20, { width: 185, align: 'center' });
      } else {
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(headingNavy)
           .text('3.5 - 4.0 Years', 365, p5Y + 12, { width: 185, align: 'center' });
      }
      p5Y += 46;

      // Payment Terms
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingNavy).text('Payment Terms', 40, p5Y);
      p5Y += 16;
      doc.rect(40, p5Y, priceW, 38).fillAndStroke(bgLight, borderSlate);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(headingNavy)
         .text('•   90% Advance Payment with Purchase Order / Agreement', 55, p5Y + 9);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(headingNavy)
         .text('•   10% After Successful Commissioning & Grid Synchronization', 55, p5Y + 23);

      // ==========================================
      // PAGE 6: TERMS & CONDITIONS, CONTACT CARD & SIGNATORY
      // ==========================================
      doc.addPage();
      drawHeaderBanner('Terms & Conditions & Official Authorization');

      let p6Y = 60;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingNavy).text('Terms & Conditions', 40, p6Y);
      p6Y += 18;

      const termsList = [
        'Quotation Validity: 7 Days from issue date.',
        'GST is included in the above quoted price.',
        'Additional civil work will be charged extra 800/kW.',
        'Net Meter approval is subject to TANGEDCO / DISCOM regulations.',
        'Delivery is subject to material readiness and site access.',
        'Any additional civil or electrical work outside the quoted scope will be charged extra.',
        'Elevated above 4 Feet mounting structures will be charged extra 2500 per kW.',
        'Force majeure conditions and DISCOM grid outages are excluded.',
      ];

      termsList.forEach(tm => {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(greenAccent).text('•', 48, p6Y);
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`   ${tm}`, 58, p6Y);
        p6Y += 16;
      });

      p6Y += 18;

      // Thank you message
      doc.rect(40, p6Y, 515, 36).fillAndStroke(greenLight, '#A7F3D0');
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#065F46').text(
        'Thank you for your valuable opportunity. We look forward to delivering a reliable solar solution and building a long-term partnership with you.',
        55, p6Y + 11, { width: 485, align: 'center' }
      );
      p6Y += 52;

      // Contact Details & Signature Card
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingNavy).text('Contact Details', 40, p6Y);
      p6Y += 16;

      const cardHeight = 96;
      doc.rect(40, p6Y, 515, cardHeight).fillAndStroke('#0F172A', '#1E293B');

      // Left Column: Managing Director Details
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#FFFFFF').text('A Boopathi BE.,', 55, p6Y + 14);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#34D399').text('CEO & Managing Director  •  AB ENERGY SOLUTIONS', 55, p6Y + 31);
      doc.font('Helvetica').fontSize(8).fillColor('#CBD5E1')
         .text('Phone: +91 95664 99678   |   Email: abenergysolutiontn@gmail.com', 55, p6Y + 47);
      doc.font('Helvetica').fontSize(8).fillColor('#CBD5E1')
         .text('1/359, Maruthi Nagar, Chinnakavandanur, Namakkal, TN - 636202', 55, p6Y + 60);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#34D399')
         .text('12+ Years Solar Experience   •   TNEB C-Licence Certified Enterprise', 55, p6Y + 74);

      // Right Column: Official Authorized Signatory Box
      doc.rect(380, p6Y + 12, 160, 72).fillAndStroke('#FFFFFF', '#CBD5E1');
      doc.font('Helvetica-Bold').fontSize(8).fillColor(headingNavy)
         .text('For AB ENERGY SOLUTIONS', 380, p6Y + 18, { width: 160, align: 'center' });
      doc.moveTo(395, p6Y + 60).lineTo(525, p6Y + 60).lineWidth(0.5).strokeColor('#94A3B8').stroke();
      doc.font('Helvetica').fontSize(7.5).fillColor('#64748B')
         .text('Authorized Signatory', 380, p6Y + 65, { width: 160, align: 'center' });

      // ==========================================
      // STAMP ALL BUFFERED PAGES WITH DYNAMIC FOOTER
      // ==========================================
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawFooter(i + 1, range.count);
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
