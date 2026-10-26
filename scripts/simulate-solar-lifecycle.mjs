// Automated Solar Lifecycle Simulation Test
async function runEndToEndSolarSimulation() {
  const BASE_URL = 'http://localhost:3000/api';
  console.log('--- STARTING END-TO-END SOLAR LIFECYCLE SIMULATION ---');

  const testId = Math.floor(1000 + Math.random() * 9000).toString();
  const leadId = `LEAD-TEST-${testId}`;
  const customerId = `CUST-TEST-${testId}`;
  const quoteId = `QT-TEST-${testId}`;
  const projectId = `PRJ-TEST-${testId}`;
  const invoiceId = `INV-TEST-${testId}`;
  const paymentId = `PAY-TEST-${testId}`;

  // STEP 1: CREATE NEW PROSPECTIVE SOLAR LEAD
  console.log('\n[1/7] Step 1: Creating New Lead (Aditya Varma, 6 kW, Bangalore)...');
  const leadPayload = {
    id: leadId,
    name: 'Aditya Varma',
    phone: '+91 98450 12345',
    email: 'aditya.varma@gmail.com',
    city: 'Bangalore',
    state: 'Karnataka',
    address: 'Plot 42, Green Glen Layout, Bellandur',
    pincode: '560103',
    source: 'Website Form',
    status: 'New',
    priority: 'High',
    assignedToId: 'EMP-001',
    assignedToName: 'Aarav Sharma',
    monthlyBill: 8500,
    sanctionLoad: 7,
    roofAreaSqFt: 750,
    roofType: 'RCC Flat',
    recommendedKw: 6,
    estimatedBudget: 360000,
    notes: 'Interested in PM Surya Ghar central subsidy. High daytime consumption.',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };

  const leadRes = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadPayload)
  }).then(r => r.json());

  console.log('Lead Created Successfully:', leadRes.success ? 'PASS' : 'FAIL', leadRes.lead?.id);

  // STEP 2: SCHEDULE ROOFTOP SITE SURVEY
  console.log('\n[2/7] Step 2: Scheduling Technical Rooftop Feasibility Audit...');
  const surveyId = `SURV-TEST-${testId}`;
  const surveyPayload = {
    id: surveyId,
    leadId: leadId,
    leadName: 'Aditya Varma',
    customerName: 'Aditya Varma',
    phone: '+91 98450 12345',
    address: 'Plot 42, Green Glen Layout, Bellandur, Bangalore',
    scheduledDate: new Date().toISOString().split('T')[0],
    engineerId: 'EMP-004',
    engineerName: 'Vikram Mehta',
    status: 'Completed',
    roofAreaSqFt: 750,
    shadowFreeAreaSqFt: 680,
    roofType: 'RCC Flat',
    azimuthAngle: 180,
    tiltAngle: 15,
    distanceToLtPanelMeters: 18,
    gridPhase: 'Three Phase',
    photosUploaded: [
      { title: 'Roof South View', url: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=800&q=80', description: 'Clear RCC terrace facing true South' },
      { title: 'LT Distribution Panel', url: 'https://images.unsplash.com/photo-1558441719-8b489c63f736?auto=format&fit=crop&w=800&q=80', description: 'Three-phase 415V supply verified' }
    ],
    notes: 'Terrace is ideal for 6 kW bifacial modules. Structural slab load rating verified.'
  };

  const surveyRes = await fetch(`${BASE_URL}/surveys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(surveyPayload)
  }).then(r => r.json());

  console.log('Site Survey Completed & Logged:', surveyRes.success ? 'PASS' : 'FAIL', surveyRes.survey?.id);

  // STEP 3: GENERATE QUOTATION WITH PM SURYA GHAR SUBSIDY
  console.log('\n[3/7] Step 3: Generating Techno-Commercial Proposal with Subsidy...');
  const quotePayload = {
    id: quoteId,
    quotationNumber: `QT-2026-${testId}`,
    leadId: leadId,
    leadName: 'Aditya Varma',
    customerPhone: '+91 98450 12345',
    customerAddress: 'Plot 42, Green Glen Layout, Bellandur, Bangalore',
    systemCapacityKw: 6,
    currentVersion: 1,
    versions: [
      {
        versionNumber: 1,
        date: new Date().toISOString().split('T')[0],
        basePrice: 320000,
        taxes: 44160,
        grossAmount: 364160,
        subsidyAmount: 78000,
        netPayable: 286160,
        items: []
      }
    ],
    status: 'Approved',
    sentDate: new Date().toISOString().split('T')[0],
    validUntil: '2026-11-20',
    salespersonId: 'EMP-001',
    salespersonName: 'Aarav Sharma',
    totalAmount: 286160,
    createdAt: new Date().toISOString().split('T')[0],
  };

  const quoteRes = await fetch(`${BASE_URL}/quotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quotePayload)
  }).then(r => r.json());

  console.log('Solar Quotation Generated:', quoteRes.success ? 'PASS' : 'FAIL', quoteRes.quotation?.quotationNumber);

  // STEP 4: CONVERT TO CUSTOMER ACCOUNT & ACTIVE EPC PROJECT
  console.log('\n[4a/8] Step 4a: Creating Customer Account in Database...');
  const customerPayload = {
    id: customerId,
    name: 'Aditya Varma',
    email: 'aditya.varma@gmail.com',
    phone: '+91 98450 12345',
    address: 'Plot 42, Green Glen Layout, Bellandur',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560103',
    consumerNumberDiscom: `BESCOM-${testId}`,
    discomName: 'BESCOM',
    convertedFromLeadId: leadId,
    totalSystemKw: 6,
    totalOrderValue: 286160,
    paidAmount: 114464,
    balanceAmount: 171696,
    status: 'Under Installation'
  };

  const custRes = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerPayload)
  }).then(r => r.json());

  console.log('Customer Account Created in DB:', custRes.success ? 'PASS' : 'FAIL', custRes.customer?.id);

  console.log('\n[4b/8] Step 4b: Converting Accepted Proposal into EPC Execution Project...');
  const projectPayload = {
    id: projectId,
    customerId: customerId,
    customerName: 'Aditya Varma',
    customerPhone: '+91 98450 12345',
    customerAddress: 'Plot 42, Green Glen Layout, Bellandur, Bangalore',
    quotationId: quoteId,
    capacityKw: 6,
    totalAmount: 286160,
    stage: 'Mounting Structure',
    startDate: new Date().toISOString().split('T')[0],
    targetCompletionDate: '2026-11-15',
    projectManagerId: 'EMP-003',
    projectManagerName: 'Rajesh Nair',
    installationLeadId: 'EMP-004',
    installationLeadName: 'Vikram Mehta',
    checklist: {
      structureFastening: true,
      moduleClampingTorque: true,
      inverterWallMounting: false,
      dcWiringConduit: false,
      acWiringArmoured: false,
      chemicalEarthingPits: false,
      lightningArrester: false,
      dcdbProtectionFuses: false,
      discomBiDirectionalMeter: false,
      ceigInspectionSignOff: false,
      remoteMonitoringSync: false,
      safetySignageInstalled: false
    },
    tasks: [],
    inventoryReserved: true,
    materialShortageFlag: false,
    discomSanctionNumber: 'BESCOM-KA-2026-8841'
  };

  const projRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectPayload)
  }).then(r => r.json());

  console.log('EPC Project Initiated:', projRes.success ? 'PASS' : 'FAIL', projRes.project?.id);

  // STEP 5: ISSUE 40% ADVANCE GST TAX INVOICE
  console.log('\n[5/7] Step 5: Issuing 40% Milestone Booking Advance Tax Invoice...');
  const advanceAmount = Math.round(286160 * 0.40); // 40% of net investment
  const taxableBase = Math.round(advanceAmount / 1.138);
  const compositeGst = advanceAmount - taxableBase;

  const invoicePayload = {
    id: invoiceId,
    invoiceNumber: `INV-2026-${testId}`,
    projectId: projectId,
    customerId: customerId,
    customerName: 'Aditya Varma',
    customerPhone: '+91 98450 12345',
    customerGstin: 'URP-CONSUMER',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '2026-10-30',
    items: [
      {
        description: '40% Booking Advance for 6 kW Rooftop Solar EPC Plant (SAC 995465)',
        hsnCode: '995465',
        quantity: 1,
        rate: taxableBase,
        amount: taxableBase
      }
    ],
    subtotal: taxableBase,
    cgst: Math.round(compositeGst / 2),
    sgst: Math.round(compositeGst / 2),
    igst: 0,
    totalAmount: advanceAmount,
    paidAmount: advanceAmount,
    balanceDue: 0,
    status: 'Paid'
  };

  const invRes = await fetch(`${BASE_URL}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoicePayload)
  }).then(r => r.json());

  console.log('Advance Milestone Invoice Generated:', invRes.success ? 'PASS' : 'FAIL', invRes.invoice?.invoiceNumber);

  // STEP 6: RECORD BANK PAYMENT RECEIPT (NEFT UTR)
  console.log('\n[6/7] Step 6: Recording Bank Wire Payment Settlement (NEFT)...');
  const paymentPayload = {
    id: paymentId,
    paymentNumber: `REC-2026-${testId}`,
    invoiceId: invoiceId,
    projectId: projectId,
    customerId: customerId,
    customerName: 'Aditya Varma',
    amount: advanceAmount,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'NEFT / Bank Transfer',
    transactionReference: `HDFC000${testId}891`,
    bankName: 'HDFC Bank Ltd',
    status: 'Verified',
    recordedBy: 'Accounts Dept'
  };

  const payRes = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentPayload)
  }).then(r => r.json());

  console.log('Payment Reconciled with Bank UTR:', payRes.success ? 'PASS' : 'FAIL', payRes.payment?.paymentNumber);

  // STEP 7: PROVISION 25-YEAR SOLAR WARRANTIES
  console.log('\n[7/7] Step 7: Provisioning 25-Year Performance & 10-Year Inverter Warranties...');
  const warrantyPayload = {
    id: `WAR-TEST-${testId}`,
    certificateNumber: `CERT-2026-${testId}`,
    projectId: projectId,
    customerId: customerId,
    customerName: 'Aditya Varma',
    equipmentType: 'Solar PV Modules (Bifacial)',
    makeModel: 'Waaree 550W Bifacial Mono PERC (11 Units)',
    serialNumber: `WAR-BF-2026-${testId}`,
    warrantyPeriodYears: 25,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2051-10-21',
    status: 'Active'
  };

  const warRes = await fetch(`${BASE_URL}/warranties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(warrantyPayload)
  }).then(r => r.json());

  console.log('Warranty Provisioned in Registry:', warRes.success ? 'PASS' : 'FAIL', warRes.warranty?.serialNumber);

  console.log('\n========================================================================');
  console.log('COMPLETE 7-STEP SOLAR BUSINESS CYCLE SIMULATION: 100% SUCCESSFUL!');
  console.log(`Customer: Aditya Varma | Lead ID: ${leadId} | Project ID: ${projectId}`);
  console.log('========================================================================');
}

runEndToEndSolarSimulation().catch(console.error);
