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
 * Generates official AB Energy Solutions 4-Page Quotation Proposal PDF
 * with professional typography, bold black headings, and zero wasted white space.
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
      const headingBlack = '#000000';
      const bodyDark = '#1E293B';
      const textMuted = '#475569';
      const greenAccent = '#059669';
      const borderSlate = '#CBD5E1';
      const bgLight = '#F8FAFC';

      const drawHeaderBanner = (pageTitle: string) => {
        if (hasLogo) {
          doc.save();
          doc.opacity(0.04);
          doc.image(logoPath, 130, 250, { width: 340 });
          doc.restore();
        }
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(headingBlack).text('AB ENERGY SOLUTIONS', 40, 28);
        doc.font('Helvetica').fontSize(8).fillColor(textMuted).text(`Quotation: ${data.quotationNumber}`, 165, 28);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(headingBlack).text('GST: 33FSQPA3244H1ZU', 40, 28, { align: 'right', width: 515 });
        doc.moveTo(40, 42).lineTo(555, 42).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
      };

      const drawFooter = (pageNum: number) => {
        doc.moveTo(40, 765).lineTo(555, 765).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
        doc.font('Helvetica').fontSize(8).fillColor(textMuted)
           .text(`AB Energy Solutions  •  Turnkey Solar EPC & Engineering  •  Page ${pageNum} of 4`, 40, 772, { align: 'center', width: 515 });
      };

      // ==========================================
      // PAGE 1: COVER PAGE
      // ==========================================
      if (hasLogo) {
        // Logo scaled cleanly to prevent any overlap
        doc.image(logoPath, 45, 28, { width: 105, height: 84, fit: [105, 84] });
      } else {
        doc.font('Helvetica-Bold').fontSize(16).fillColor(headingBlack).text('AB ENERGY SOLUTIONS', 45, 35);
      }

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(headingBlack)
         .text('GST: 33FSQPA3244H1ZU', 40, 40, { align: 'right', width: 515 });
      doc.font('Helvetica').fontSize(8).fillColor(textMuted)
         .text('Solar EPC • Electrical Infrastructure • O&M', 40, 54, { align: 'right', width: 515 });

      // Subtle dividing line under header
      doc.moveTo(40, 118).lineTo(555, 118).lineWidth(0.75).strokeColor('#E2E8F0').stroke();

      // Title in Bold Black
      doc.font('Helvetica-Bold').fontSize(15).fillColor(headingBlack)
         .text(`Quotation for ${data.systemCapacityKw} kW Grid-Connected Rooftop Solar Power System`, 40, 130, { align: 'center', width: 515 });

      // Quote No & Date Row
      const formattedDate = new Date(data.createdAt || Date.now()).toLocaleDateString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      doc.font('Helvetica').fontSize(9.5).fillColor(bodyDark)
         .text(`Quotation No.: ${data.quotationNumber}`, 45, 160);
      doc.font('Helvetica').fontSize(9.5).fillColor(bodyDark)
         .text(`Date: ${formattedDate}`, 40, 160, { align: 'right', width: 515 });

      // High-Res Rooftop Cover Photo
      if (hasCoverPhoto) {
        doc.image(coverPhotoPath, 45, 185, { width: 505, height: 285, fit: [505, 285], align: 'center' });
      } else {
        doc.rect(45, 185, 505, 285).fillAndStroke(bgLight, borderSlate);
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#64748B')
           .text('Grid-Connected Solar Rooftop System', 45, 310, { align: 'center', width: 505 });
      }

      // Customer Details Card
      const custBoxY = 485;
      doc.rect(45, custBoxY, 505, 95).fillAndStroke(bgLight, borderSlate);

      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(headingBlack).text('CUSTOMER DETAILS', 60, custBoxY + 12);

      doc.font('Helvetica').fontSize(9).fillColor(bodyDark);
      doc.text(`Client Name: ${data.leadName}`, 60, custBoxY + 34);
      doc.text(`Service Number: XXX / ${data.systemCapacityKw}KWp`, 60, custBoxY + 52);
      doc.text(`Quoted Capacity: ${data.systemCapacityKw} kW On-Grid`, 60, custBoxY + 70);

      doc.text(`Phone: ${data.customerPhone || 'N/A'}`, 310, custBoxY + 34);
      doc.text(`Site Address: ${data.customerAddress || 'Tamil Nadu, India'}`, 310, custBoxY + 52, { width: 225 });

      drawFooter(1);

      // ==========================================
      // PAGE 2: CORPORATE PROFILE, SERVICES & ADVANTAGES
      // ==========================================
      doc.addPage();
      drawHeaderBanner('Corporate Profile');

      // Subject in Bold Black
      doc.font('Helvetica-Bold').fontSize(10).fillColor(headingBlack)
         .text(`Subject: Proposal for Supply, Installation, Testing & Commissioning of ${data.systemCapacityKw} kW Grid-Connected Rooftop Solar Power System`, 40, 52, { width: 515, lineGap: 2 });

      doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark)
         .text(`Dear Sir,\nThank you for giving us the opportunity to submit our quotation for your ${data.systemCapacityKw} kW Solar Rooftop Project. We are pleased to offer our turnkey engineering and EPC services as detailed below.\n\nThe quotation includes the complete supply, installation, testing, and commissioning of a Grid-Connected Solar Rooftop System.`, 40, 78, { width: 515, lineGap: 2.5 });

      // ABOUT AB ENERGY SOLUTION (Bold Black)
      const aboutY = 135;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingBlack).text('ABOUT AB ENERGY SOLUTION', 40, aboutY);

      doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(
        'AB Energy Solution is a professionally managed Solar EPC and Electrical Engineering enterprise, delivering reliable, high-yield, and cost-effective solar energy solutions for residential, commercial, industrial, and agricultural sectors.\n\n' +
        'The company is led by Mr. A. Boopathi, B.E., Managing Director, who brings 12+ years of hands-on experience in the Solar EPC and Electrical Engineering industry. Under his technical leadership, 50+ solar and electrical projects have been successfully executed with a strong focus on quality, safety, and timely project delivery.\n\n' +
        'Our technical team includes TNEB C Licence Certified Engineers and skilled professionals, ensuring every project is executed in accordance with industry standards, MNRE guidelines, and client requirements.',
        40, aboutY + 18, { width: 515, lineGap: 2.5, align: 'justify' }
      );

      // OUR SERVICES (Bold Black, 2 Columns)
      const servicesY = 248;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingBlack).text('OUR SERVICES', 40, servicesY);

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

      let sY1 = servicesY + 18;
      servicesCol1.forEach(srv => {
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`•   ${srv}`, 50, sY1);
        sY1 += 14;
      });

      let sY2 = servicesY + 18;
      servicesCol2.forEach(srv => {
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`•   ${srv}`, 300, sY2);
        sY2 += 14;
      });

      // WHY CHOOSE AB ENERGY SOLUTION? (Bold Black, 2 Columns)
      const whyY = 355;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingBlack).text('WHY CHOOSE AB ENERGY SOLUTION?', 40, whyY);

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

      let wY1 = whyY + 18;
      whyCol1.forEach(item => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(greenAccent).text('✔', 50, wY1);
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`  ${item}`, 65, wY1);
        wY1 += 16;
      });

      let wY2 = whyY + 18;
      whyCol2.forEach(item => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(greenAccent).text('✔', 300, wY2);
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`  ${item}`, 315, wY2);
        wY2 += 16;
      });

      // OUR COMMITMENT & VISION
      const visionY = 445;
      doc.rect(40, visionY, 515, 65).fillAndStroke(bgLight, borderSlate);

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(headingBlack)
         .text('Our Commitment: Quality  •  Safety  •  Innovation  •  Integrity  •  Customer Satisfaction', 40, visionY + 14, { align: 'center', width: 515 });

      doc.font('Helvetica-Oblique').fontSize(8).fillColor('#64748B')
         .text('"To deliver sustainable, reliable, and high-quality solar energy solutions that create long-term value for our customers and contribute to a greener future."', 50, visionY + 34, { align: 'center', width: 495 });

      drawFooter(2);

      // ==========================================
      // PAGE 3: SCOPE OF WORK & DYNAMIC BILL OF MATERIALS
      // ==========================================
      doc.addPage();
      drawHeaderBanner('Technical Scope & BOM');

      let p3Y = 52;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingBlack).text('Scope of Work', 40, p3Y);
      p3Y += 16;

      doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text('We will execute the complete turnkey engineering and EPC activities as below:', 40, p3Y);
      p3Y += 14;

      const scopeCol1 = ['Site Survey', 'Engineering Support', 'Supply of Material'];
      const scopeCol2 = ['Complete Installation', 'Testing & Commissioning', 'Service support'];

      let scY1 = p3Y;
      scopeCol1.forEach(sc => {
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`•   ${sc}`, 50, scY1);
        scY1 += 13;
      });
      let scY2 = p3Y;
      scopeCol2.forEach(sc => {
        doc.font('Helvetica').fontSize(8.5).fillColor(bodyDark).text(`•   ${sc}`, 300, scY2);
        scY2 += 13;
      });

      p3Y += 46;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingBlack).text('Bill Of Materials', 40, p3Y);
      p3Y += 16;

      // Table Header: S.NO | MATERIALS | SPECIFICATION | MAKE | UNITS | QUANTITY
      const colX = [40, 75, 175, 345, 455, 500];
      const colW = [35, 100, 170, 110, 45, 55];
      const tableW = 515;

      doc.rect(40, p3Y, tableW, 20).fillAndStroke('#F1F5F9', '#94A3B8');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(headingBlack);
      doc.text('S.NO', colX[0], p3Y + 6, { width: colW[0], align: 'center' });
      doc.text('MATERIALS', colX[1], p3Y + 6, { width: colW[1], align: 'left' });
      doc.text('SPECIFICATION', colX[2], p3Y + 6, { width: colW[2], align: 'left' });
      doc.text('MAKE', colX[3], p3Y + 6, { width: colW[3], align: 'left' });
      doc.text('UNITS', colX[4], p3Y + 6, { width: colW[4], align: 'center' });
      doc.text('QUANTITY', colX[5], p3Y + 6, { width: colW[5], align: 'center' });
      p3Y += 20;

      // Table Rows populated dynamically from BOM items
      const bomItems = data.items && data.items.length > 0 ? data.items : [];
      bomItems.forEach((item, idx) => {
        const materialName = item.category || item.description || 'Material';
        const spec = item.specification || item.description || item.makeModel || 'Standard';
        const make = item.make || item.makeModel?.split(' ')[0] || 'Reputed';
        const unit = item.unit || 'Nos';
        const qty = item.quantity || 1;

        const rowHeight = 18;
        const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, p3Y, tableW, rowHeight).fillAndStroke(rowBg, '#CBD5E1');

        doc.font('Helvetica').fontSize(7.5).fillColor(bodyDark);
        doc.text(String(idx + 1), colX[0], p3Y + 5, { width: colW[0], align: 'center' });
        doc.text(materialName, colX[1], p3Y + 5, { width: colW[1], ellipsis: true });
        doc.text(spec, colX[2], p3Y + 5, { width: colW[2], ellipsis: true });
        doc.text(make, colX[3], p3Y + 5, { width: colW[3], ellipsis: true });
        doc.text(unit, colX[4], p3Y + 5, { width: colW[4], align: 'center' });
        doc.text(String(qty), colX[5], p3Y + 5, { width: colW[5], align: 'center' });

        p3Y += rowHeight;
      });

      // Government Subsidy Scheme Note
      p3Y += 12;
      doc.rect(40, p3Y, tableW, 26).fillAndStroke('#FEF3C7', '#F59E0B');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#92400E')
         .text('Note: As this project is proposed under the Government Subsidy Scheme, all supplied solar modules must comply with the Domestic Content Requirement (DCR) guidelines.', 48, p3Y + 8, { width: 495 });

      drawFooter(3);

      // ==========================================
      // PAGE 4: COMMERCIAL PRICING, WARRANTY & CONTACT CARD
      // ==========================================
      doc.addPage();
      drawHeaderBanner('Commercial Terms & Agreement');

      let p4Y = 52;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingBlack).text('Client Scope', 40, p4Y);
      p4Y += 16;

      const clientScopeCol1 = [
        'Provide a shadow-free installation area.',
        'Minor civil works, if required.',
        'Statutory charges for Bi-Directional Net Meter.',
      ];
      const clientScopeCol2 = [
        'Non-statutory charges related to Net Metering.',
        'Additional charges for elevated structures (if applicable).',
        'SIM card for Wi-Fi monitoring / Power factor APFC.',
      ];

      let csY1 = p4Y;
      clientScopeCol1.forEach(cs => {
        doc.font('Helvetica').fontSize(8).fillColor(bodyDark).text(`➢   ${cs}`, 50, csY1);
        csY1 += 13;
      });
      let csY2 = p4Y;
      clientScopeCol2.forEach(cs => {
        doc.font('Helvetica').fontSize(8).fillColor(bodyDark).text(`➢   ${cs}`, 300, csY2);
        csY2 += 13;
      });

      p4Y += 46;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingBlack).text('Features and Warranty', 40, p4Y);
      p4Y += 16;

      const dailyKwh = Math.round(data.systemCapacityKw * 5);
      const featCol1 = [
        'Tier-1 High-Efficiency Solar Modules',
        'Inverter Warranty: Up to 8 Years',
        'Solar Module Product Warranty: 12 Years',
        'Solar Module Performance Warranty: Up to 30 Years',
      ];
      const featCol2 = [
        'Workmanship Warranty: 1 Year',
        `Estimated Generation: ~${dailyKwh} kWh/day (Subject to weather)`,
        'The solar panels are Non DCR / DCR as applicable',
        'Suitable for Residential, Commercial & Industrial Installations',
      ];

      let ftY1 = p4Y;
      featCol1.forEach(ft => {
        doc.font('Helvetica').fontSize(8).fillColor(bodyDark).text(`-   ${ft}`, 50, ftY1);
        ftY1 += 13;
      });
      let ftY2 = p4Y;
      featCol2.forEach(ft => {
        doc.font('Helvetica').fontSize(8).fillColor(bodyDark).text(`-   ${ft}`, 300, ftY2);
        ftY2 += 13;
      });

      p4Y += 60;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingBlack).text('System Capacity & Pricing', 40, p4Y);
      p4Y += 16;

      // 3-Column Pricing Box: System Capacity | Domestic Price (Including GST) | ROI
      const priceW = 515;
      doc.rect(40, p4Y, priceW, 22).fillAndStroke('#F1F5F9', '#94A3B8');
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(headingBlack);
      doc.text('System Capacity', 45, p4Y + 6, { width: 175, align: 'center' });
      doc.text('Domestic Price (Including GST)', 225, p4Y + 6, { width: 190, align: 'center' });
      doc.text('ROI', 420, p4Y + 6, { width: 130, align: 'center' });
      p4Y += 22;

      const finalPriceStr = `${Math.round(data.finalContractAmount).toLocaleString('en-IN')}/-`;
      doc.rect(40, p4Y, priceW, 26).fillAndStroke('#FFFFFF', '#94A3B8');
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(bodyDark);
      doc.text(`${data.systemCapacityKw}KW On-grid Solar System`, 45, p4Y + 8, { width: 175, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(12).fillColor(headingBlack);
      doc.text(finalPriceStr, 225, p4Y + 7, { width: 190, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(bodyDark);
      doc.text('3.5 years', 420, p4Y + 8, { width: 130, align: 'center' });
      p4Y += 34;

      // Payment Terms (Bold Black)
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingBlack).text('Payment Terms', 40, p4Y);
      p4Y += 16;
      doc.rect(40, p4Y, priceW, 36).fillAndStroke(bgLight, borderSlate);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(headingBlack)
         .text('•   90% Advance Payment with Purchase Order / Agreement', 55, p4Y + 8);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(headingBlack)
         .text('•   10% After Successful Commissioning & Grid Synchronization', 55, p4Y + 22);
      p4Y += 46;

      // Terms & Conditions (Bold Black)
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingBlack).text('Terms & Conditions', 40, p4Y);
      p4Y += 15;

      const termsList = [
        'Quotation Validity: 7 Days from issue date.',
        'Including GST above price.',
        'Net Meter approval is subject to TANGEDCO / DISCOM regulations.',
        'Delivery is subject to material readiness and site access.',
        'Any additional civil/electrical work outside the quoted scope will be charged extra.',
        'If need Zero Export Device extra.',
        'Force majeure conditions and DISCOM grid outages are excluded.',
      ];

      termsList.forEach(tm => {
        doc.font('Helvetica').fontSize(8).fillColor(bodyDark).text(`•   ${tm}`, 50, p4Y);
        p4Y += 12;
      });

      // Contact Details & Signature Card
      p4Y += 10;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(headingBlack).text('Contact Details', 40, p4Y);
      p4Y += 15;

      const cardHeight = 85;
      doc.rect(40, p4Y, 515, cardHeight).fillAndStroke('#0F172A', '#1E293B');

      // Left Column: Managing Director Details
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#FFFFFF').text('A Boopathi BE.,', 55, p4Y + 12);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#34D399').text('CEO & Managing Director  •  AB ENERGY SOLUTIONS', 55, p4Y + 27);
      doc.font('Helvetica').fontSize(7.5).fillColor('#CBD5E1')
         .text('Phone: +91 95664 99678   |   Email: abenergysolutiontn@gmail.com', 55, p4Y + 42);
      doc.font('Helvetica').fontSize(7.5).fillColor('#CBD5E1')
         .text('1/359, Maruthi Nagar, Chinnakavandanur, Namakkal, TN - 636202', 55, p4Y + 54);
      doc.font('Helvetica').fontSize(7.5).fillColor('#34D399')
         .text('10+ Years Solar Experience   •   TNEB Competency Certified', 55, p4Y + 66);

      // Right Column: Official Authorized Signatory Box
      doc.rect(385, p4Y + 10, 155, 65).fillAndStroke('#FFFFFF', '#CBD5E1');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(headingBlack)
         .text('For AB ENERGY SOLUTIONS', 385, p4Y + 16, { width: 155, align: 'center' });
      doc.font('Helvetica').fontSize(7).fillColor('#64748B')
         .text('Authorized Signatory', 385, p4Y + 56, { width: 155, align: 'center' });

      drawFooter(4);

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
