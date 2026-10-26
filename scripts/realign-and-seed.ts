import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { 
  INITIAL_EMPLOYEES, INITIAL_LEADS, INITIAL_CUSTOMERS, INITIAL_SURVEYS, 
  INITIAL_PRODUCTS, INITIAL_QUOTATIONS, INITIAL_PROJECTS, INITIAL_INVOICES, 
  INITIAL_PAYMENTS, INITIAL_WARRANTIES, INITIAL_AMCS, INITIAL_SERVICE_TICKETS, 
  INITIAL_AUTOMATION_RULES, INITIAL_FOLLOW_UPS, INITIAL_EXPENSES, 
  INITIAL_SUPPLIERS, INITIAL_PURCHASE_ORDERS 
} from '../src/data/initialData.ts';

dotenv.config();

async function realignAndSeed() {
  console.log('Connecting to MySQL on ' + process.env.DB_HOST + '...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  console.log('Connected! Creating/updating tables matching exact TypeScript types...');

  const schemaSql = `
    DROP TABLE IF EXISTS employees;
    CREATE TABLE employees (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(50),
      role VARCHAR(50) NOT NULL,
      department VARCHAR(100),
      avatar TEXT,
      active_leads_count INT DEFAULT 0,
      completed_projects_count INT DEFAULT 0,
      location VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS leads;
    CREATE TABLE leads (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150),
      phone VARCHAR(50) NOT NULL,
      city VARCHAR(100),
      state VARCHAR(100),
      address TEXT,
      pincode VARCHAR(20),
      source VARCHAR(50),
      status VARCHAR(50) NOT NULL DEFAULT 'New',
      priority VARCHAR(50) DEFAULT 'Medium',
      assigned_to_id VARCHAR(50),
      assigned_to_name VARCHAR(150),
      monthly_bill DECIMAL(12,2) DEFAULT 0,
      sanction_load DECIMAL(8,2) DEFAULT 0,
      roof_area_sqft DECIMAL(10,2) DEFAULT 0,
      roof_type VARCHAR(100),
      recommended_kw DECIMAL(8,2) DEFAULT 0,
      estimated_budget DECIMAL(12,2) DEFAULT 0,
      notes TEXT,
      created_at VARCHAR(50),
      updated_at VARCHAR(50),
      last_contacted_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS customers;
    CREATE TABLE customers (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150),
      phone VARCHAR(50) NOT NULL,
      alternate_phone VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      pincode VARCHAR(20),
      consumer_number_discom VARCHAR(100),
      discom_name VARCHAR(100),
      gstin VARCHAR(50),
      converted_from_lead_id VARCHAR(50),
      total_system_kw DECIMAL(8,2) DEFAULT 0,
      total_order_value DECIMAL(12,2) DEFAULT 0,
      paid_amount DECIMAL(12,2) DEFAULT 0,
      balance_amount DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Active',
      created_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS site_surveys;
    CREATE TABLE site_surveys (
      id VARCHAR(50) PRIMARY KEY,
      lead_id VARCHAR(50),
      lead_name VARCHAR(150),
      customer_name VARCHAR(150),
      phone VARCHAR(50),
      address TEXT,
      scheduled_date VARCHAR(50),
      engineer_id VARCHAR(50),
      engineer_name VARCHAR(150),
      status VARCHAR(50) DEFAULT 'Scheduled',
      roof_area_sqft DECIMAL(10,2) DEFAULT 0,
      shadow_free_area_sqft DECIMAL(10,2) DEFAULT 0,
      roof_type VARCHAR(100),
      azimuth_angle DECIMAL(6,2) DEFAULT 180,
      tilt_angle DECIMAL(6,2) DEFAULT 15,
      existing_sanction_load_kw DECIMAL(8,2) DEFAULT 0,
      grid_phase VARCHAR(50),
      distance_to_lt_panel_meters DECIMAL(8,2) DEFAULT 0,
      recommended_kw DECIMAL(8,2) DEFAULT 0,
      panel_quantity INT DEFAULT 0,
      estimated_generation_units_per_year DECIMAL(10,2) DEFAULT 0,
      estimated_annual_savings DECIMAL(12,2) DEFAULT 0,
      estimated_cost DECIMAL(12,2) DEFAULT 0,
      payback_years DECIMAL(4,1) DEFAULT 0,
      co2_reduction_tons_per_year DECIMAL(6,2) DEFAULT 0,
      photos_uploaded JSON,
      bill_photo_uploaded BOOLEAN DEFAULT FALSE,
      notes TEXT,
      completed_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS quotations;
    CREATE TABLE quotations (
      id VARCHAR(50) PRIMARY KEY,
      quotation_number VARCHAR(100) NOT NULL,
      lead_id VARCHAR(50),
      lead_name VARCHAR(150),
      customer_phone VARCHAR(50),
      customer_address TEXT,
      system_capacity_kw DECIMAL(8,2) DEFAULT 0,
      current_version INT DEFAULT 1,
      versions JSON,
      status VARCHAR(50) DEFAULT 'Draft',
      sent_date VARCHAR(50),
      valid_until VARCHAR(50),
      salesperson_id VARCHAR(50),
      salesperson_name VARCHAR(150),
      total_amount DECIMAL(12,2) DEFAULT 0,
      created_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS projects;
    CREATE TABLE projects (
      id VARCHAR(50) PRIMARY KEY,
      customer_id VARCHAR(50),
      customer_name VARCHAR(150),
      customer_phone VARCHAR(50),
      customer_address TEXT,
      quotation_id VARCHAR(50),
      capacity_kw DECIMAL(8,2) DEFAULT 0,
      total_amount DECIMAL(12,2) DEFAULT 0,
      stage VARCHAR(50) DEFAULT 'Booking',
      start_date VARCHAR(50),
      target_completion_date VARCHAR(50),
      project_manager_id VARCHAR(50),
      project_manager_name VARCHAR(150),
      installation_lead_id VARCHAR(50),
      installation_lead_name VARCHAR(150),
      checklist JSON,
      tasks JSON,
      inventory_reserved BOOLEAN DEFAULT FALSE,
      material_shortage_flag BOOLEAN DEFAULT FALSE,
      shortage_details TEXT,
      commissioning_date VARCHAR(50),
      net_meter_installed_date VARCHAR(50),
      warranty_activated BOOLEAN DEFAULT FALSE,
      amc_initiated BOOLEAN DEFAULT FALSE,
      discom_sanction_number VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS inventory_products;
    CREATE TABLE inventory_products (
      id VARCHAR(50) PRIMARY KEY,
      sku VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(100) NOT NULL,
      brand VARCHAR(100),
      specifications TEXT,
      unit VARCHAR(50),
      current_stock INT DEFAULT 0,
      reserved_stock INT DEFAULT 0,
      available_stock INT DEFAULT 0,
      min_threshold INT DEFAULT 0,
      unit_cost DECIMAL(12,2) DEFAULT 0,
      supplier_name VARCHAR(150)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS invoices;
    CREATE TABLE invoices (
      id VARCHAR(50) PRIMARY KEY,
      invoice_number VARCHAR(100) NOT NULL UNIQUE,
      project_id VARCHAR(50),
      customer_id VARCHAR(50),
      customer_name VARCHAR(150),
      customer_phone VARCHAR(50),
      customer_gstin VARCHAR(50),
      issue_date VARCHAR(50),
      due_date VARCHAR(50),
      items JSON,
      subtotal DECIMAL(12,2) DEFAULT 0,
      cgst DECIMAL(12,2) DEFAULT 0,
      sgst DECIMAL(12,2) DEFAULT 0,
      igst DECIMAL(12,2) DEFAULT 0,
      total_amount DECIMAL(12,2) DEFAULT 0,
      paid_amount DECIMAL(12,2) DEFAULT 0,
      balance_due DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Draft'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS payments;
    CREATE TABLE payments (
      id VARCHAR(50) PRIMARY KEY,
      payment_number VARCHAR(100) NOT NULL UNIQUE,
      invoice_id VARCHAR(50),
      project_id VARCHAR(50),
      customer_id VARCHAR(50),
      customer_name VARCHAR(150),
      amount DECIMAL(12,2) DEFAULT 0,
      payment_date VARCHAR(50),
      payment_mode VARCHAR(50),
      transaction_reference VARCHAR(100),
      bank_name VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Verified',
      recorded_by VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS warranties;
    CREATE TABLE warranties (
      id VARCHAR(50) PRIMARY KEY,
      project_id VARCHAR(50),
      customer_id VARCHAR(50),
      customer_name VARCHAR(150),
      equipment_type VARCHAR(100),
      make_model VARCHAR(150),
      serial_number VARCHAR(100),
      warranty_period_years INT DEFAULT 10,
      start_date VARCHAR(50),
      end_date VARCHAR(50),
      days_remaining INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Active'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS amc_contracts;
    CREATE TABLE amc_contracts (
      id VARCHAR(50) PRIMARY KEY,
      customer_id VARCHAR(50),
      customer_name VARCHAR(150),
      customer_phone VARCHAR(50),
      customer_address TEXT,
      project_id VARCHAR(50),
      capacity_kw DECIMAL(8,2) DEFAULT 0,
      plan_name VARCHAR(100),
      annual_price DECIMAL(12,2) DEFAULT 0,
      visits_per_year INT DEFAULT 4,
      completed_visits INT DEFAULT 0,
      start_date VARCHAR(50),
      end_date VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Active',
      next_scheduled_visit VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS service_tickets;
    CREATE TABLE service_tickets (
      id VARCHAR(50) PRIMARY KEY,
      ticket_number VARCHAR(100) NOT NULL UNIQUE,
      customer_id VARCHAR(50),
      customer_name VARCHAR(150),
      phone VARCHAR(50),
      customer_address TEXT,
      project_id VARCHAR(50),
      issue_category VARCHAR(100),
      severity VARCHAR(50) DEFAULT 'Medium',
      status VARCHAR(50) DEFAULT 'Open',
      technician_id VARCHAR(50),
      technician_name VARCHAR(150),
      description TEXT,
      created_at VARCHAR(50),
      scheduled_date VARCHAR(50),
      resolved_at VARCHAR(50),
      resolution_notes TEXT,
      customer_feedback_score INT DEFAULT 5
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS follow_ups;
    CREATE TABLE follow_ups (
      id VARCHAR(50) PRIMARY KEY,
      lead_id VARCHAR(50),
      lead_name VARCHAR(150),
      customer_id VARCHAR(50),
      customer_name VARCHAR(150),
      quotation_id VARCHAR(50),
      title VARCHAR(200) NOT NULL,
      due_date VARCHAR(50) NOT NULL,
      due_time VARCHAR(50),
      type VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Pending',
      priority VARCHAR(50) DEFAULT 'Medium',
      assigned_to_id VARCHAR(50),
      assigned_to_name VARCHAR(150),
      notes TEXT,
      completed_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS automation_rules;
    CREATE TABLE automation_rules (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      trigger_event VARCHAR(100),
      condition_expression TEXT,
      action_type VARCHAR(100),
      action_payload JSON,
      is_active BOOLEAN DEFAULT TRUE,
      execution_count INT DEFAULT 0,
      last_executed_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS expenses;
    CREATE TABLE expenses (
      id VARCHAR(50) PRIMARY KEY,
      project_id VARCHAR(50),
      category VARCHAR(100),
      title VARCHAR(200) NOT NULL,
      total_amount DECIMAL(12,2) DEFAULT 0,
      payment_mode VARCHAR(50),
      receipt_url TEXT,
      recorded_by VARCHAR(100),
      date VARCHAR(50),
      notes TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    DROP TABLE IF EXISTS suppliers;
    CREATE TABLE suppliers (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      contact_person VARCHAR(150),
      email VARCHAR(150),
      phone VARCHAR(50),
      category VARCHAR(100),
      city VARCHAR(100),
      address TEXT,
      gstin VARCHAR(50),
      payment_terms VARCHAR(100),
      rating DECIMAL(3,1) DEFAULT 4.5
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await conn.query(schemaSql);
  console.log('✅ All tables synchronized! Now inserting seed records...');

  // 1. Employees
  for (const emp of INITIAL_EMPLOYEES) {
    await conn.query(
      `INSERT INTO employees (id, name, email, phone, role, department, avatar, active_leads_count, completed_projects_count, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [emp.id, emp.name, emp.email, emp.phone, emp.role, emp.department, emp.avatar, emp.activeLeadsCount, emp.completedProjectsCount, emp.location]
    );
  }

  // 2. Leads
  for (const lead of INITIAL_LEADS) {
    await conn.query(
      `INSERT INTO leads (id, name, email, phone, city, state, address, pincode, source, status, priority, assigned_to_id, assigned_to_name, monthly_bill, sanction_load, roof_area_sqft, roof_type, recommended_kw, estimated_budget, notes, created_at, updated_at, last_contacted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lead.id, lead.name, lead.email || null, lead.phone, lead.city, lead.state, lead.address, lead.pincode,
        lead.source, lead.status, lead.priority, lead.assignedToId, lead.assignedToName, lead.monthlyBill || 0,
        lead.sanctionLoad || 0, lead.roofAreaSqFt || 0, lead.roofType || null, lead.recommendedKw || 0,
        lead.estimatedBudget || 0, lead.notes || '', lead.createdAt, lead.updatedAt, lead.lastContactedAt || null
      ]
    );
  }

  // 3. Customers
  for (const cust of INITIAL_CUSTOMERS) {
    await conn.query(
      `INSERT INTO customers (id, name, email, phone, alternate_phone, address, city, state, pincode, consumer_number_discom, discom_name, gstin, converted_from_lead_id, total_system_kw, total_order_value, paid_amount, balance_amount, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cust.id, cust.name, cust.email, cust.phone, cust.alternatePhone || null, cust.address, cust.city, cust.state,
        cust.pincode, cust.consumerNumberDiscom, cust.discomName, cust.gstin || null, cust.convertedFromLeadId || null,
        cust.totalSystemKw || 0, cust.totalOrderValue || 0, cust.paidAmount || 0, cust.balanceAmount || 0, cust.status, cust.createdAt
      ]
    );
  }

  // 4. Products
  for (const prod of INITIAL_PRODUCTS) {
    await conn.query(
      `INSERT INTO inventory_products (id, sku, name, category, brand, specifications, unit, current_stock, reserved_stock, available_stock, min_threshold, unit_cost, supplier_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prod.id, prod.sku, prod.name, prod.category, prod.brand, prod.specifications || '', prod.unit,
        prod.currentStock, prod.reservedStock, prod.availableStock, prod.minThreshold, prod.unitCost, prod.supplierName
      ]
    );
  }

  // 5. Site Surveys
  for (const s of INITIAL_SURVEYS) {
    await conn.query(
      `INSERT INTO site_surveys (id, lead_id, lead_name, customer_name, phone, address, scheduled_date, engineer_id, engineer_name, status, roof_area_sqft, shadow_free_area_sqft, roof_type, azimuth_angle, tilt_angle, existing_sanction_load_kw, grid_phase, distance_to_lt_panel_meters, recommended_kw, panel_quantity, estimated_generation_units_per_year, estimated_annual_savings, estimated_cost, payback_years, co2_reduction_tons_per_year, photos_uploaded, bill_photo_uploaded, notes, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id, s.leadId, s.leadName, s.customerName, s.phone, s.address, s.scheduledDate, s.engineerId, s.engineerName,
        s.status, s.roofAreaSqFt || 0, s.shadowFreeAreaSqFt || 0, s.roofType, s.azimuthAngle || 180, s.tiltAngle || 15,
        s.existingSanctionLoadKw || 0, s.gridPhase || 'Three Phase', s.distanceToLtPanelMeters || 0, s.recommendedKw || 0,
        s.panelQuantity || 0, s.estimatedGenerationUnitsPerYear || 0, s.estimatedAnnualSavings || 0, s.estimatedCost || 0,
        s.paybackYears || 0, s.co2ReductionTonsPerYear || 0, JSON.stringify(s.photosUploaded || []), s.billPhotoUploaded ? 1 : 0,
        s.notes || '', s.completedAt || null
      ]
    );
  }

  // 6. Quotations
  for (const q of INITIAL_QUOTATIONS) {
    await conn.query(
      `INSERT INTO quotations (id, quotation_number, lead_id, lead_name, customer_phone, customer_address, system_capacity_kw, current_version, versions, status, sent_date, valid_until, salesperson_id, salesperson_name, total_amount, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        q.id, q.quotationNumber, q.leadId, q.leadName, q.customerPhone, q.customerAddress, q.systemCapacityKw || 0,
        q.currentVersion || 1, JSON.stringify(q.versions || []), q.status, q.sentDate || null, q.validUntil,
        q.salespersonId, q.salespersonName, q.totalAmount || 0, q.createdAt
      ]
    );
  }

  // 7. Projects
  for (const p of INITIAL_PROJECTS) {
    await conn.query(
      `INSERT INTO projects (id, customer_id, customer_name, customer_phone, customer_address, quotation_id, capacity_kw, total_amount, stage, start_date, target_completion_date, project_manager_id, project_manager_name, installation_lead_id, installation_lead_name, checklist, tasks, inventory_reserved, material_shortage_flag, shortage_details, commissioning_date, net_meter_installed_date, warranty_activated, amc_initiated, discom_sanction_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id, p.customerId, p.customerName, p.customerPhone || '', p.customerAddress || '', p.quotationId,
        p.capacityKw || 0, p.totalAmount || 0, p.stage, p.startDate, p.targetCompletionDate,
        p.projectManagerId, p.projectManagerName, p.installationLeadId, p.installationLeadName,
        JSON.stringify(p.checklist || {}), JSON.stringify(p.tasks || []), p.inventoryReserved ? 1 : 0,
        p.materialShortageFlag ? 1 : 0, p.shortageDetails || null, p.commissioningDate || null,
        p.netMeterInstalledDate || null, p.warrantyActivated ? 1 : 0, p.amcInitiated ? 1 : 0,
        p.discomSanctionNumber || null, p.notes || ''
      ]
    );
  }

  // 8. Invoices
  for (const inv of INITIAL_INVOICES) {
    await conn.query(
      `INSERT INTO invoices (id, invoice_number, project_id, customer_id, customer_name, customer_phone, customer_gstin, issue_date, due_date, items, subtotal, cgst, sgst, igst, total_amount, paid_amount, balance_due, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inv.id, inv.invoiceNumber, inv.projectId, inv.customerId, inv.customerName, inv.customerPhone || '', inv.customerGstin || null,
        inv.issueDate, inv.dueDate, JSON.stringify(inv.items || []), inv.subtotal, inv.cgst, inv.sgst, inv.igst,
        inv.totalAmount, inv.paidAmount, inv.balanceDue, inv.status
      ]
    );
  }

  // 9. Payments
  for (const pay of INITIAL_PAYMENTS) {
    await conn.query(
      `INSERT INTO payments (id, payment_number, invoice_id, project_id, customer_id, customer_name, amount, payment_date, payment_mode, transaction_reference, bank_name, status, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pay.id, pay.paymentNumber, pay.invoiceId, pay.projectId, pay.customerId, pay.customerName, pay.amount,
        pay.paymentDate, pay.paymentMode, pay.transactionReference, pay.bankName || null, pay.status, pay.recordedBy
      ]
    );
  }

  // 10. Warranties & AMCs
  for (const w of INITIAL_WARRANTIES) {
    await conn.query(
      `INSERT INTO warranties (id, project_id, customer_id, customer_name, equipment_type, make_model, serial_number, warranty_period_years, start_date, end_date, days_remaining, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [w.id, w.projectId, w.customerId, w.customerName, w.equipmentType, w.makeModel, w.serialNumber, w.warrantyPeriodYears, w.startDate, w.endDate, w.daysRemaining, w.status]
    );
  }

  for (const a of INITIAL_AMCS) {
    await conn.query(
      `INSERT INTO amc_contracts (id, customer_id, customer_name, customer_phone, customer_address, project_id, capacity_kw, plan_name, annual_price, visits_per_year, completed_visits, start_date, end_date, status, next_scheduled_visit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.customerId, a.customerName, a.customerPhone, a.customerAddress, a.projectId, a.capacityKw, a.planName, a.annualPrice, a.visitsPerYear, a.completedVisits, a.startDate, a.endDate, a.status, a.nextScheduledVisit]
    );
  }

  // 11. Service Tickets
  for (const t of INITIAL_SERVICE_TICKETS) {
    await conn.query(
      `INSERT INTO service_tickets (id, ticket_number, customer_id, customer_name, phone, customer_address, project_id, issue_category, severity, status, technician_id, technician_name, description, created_at, scheduled_date, resolved_at, resolution_notes, customer_feedback_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.ticketNumber, t.customerId, t.customerName, t.customerPhone, t.customerAddress, t.projectId || null, t.issueCategory, t.severity, t.status, t.technicianId || null, t.technicianName || null, t.description, t.createdAt, t.scheduledDate || null, t.resolvedAt || null, t.resolutionNotes || null, t.customerFeedbackScore || 5]
    );
  }

  // 12. Follow-ups
  for (const f of INITIAL_FOLLOW_UPS) {
    await conn.query(
      `INSERT INTO follow_ups (id, lead_id, lead_name, customer_id, customer_name, quotation_id, title, due_date, due_time, type, status, priority, assigned_to_id, assigned_to_name, notes, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [f.id, f.leadId || null, f.leadName || null, f.customerId || null, f.customerName || null, f.quotationId || null, f.title, f.dueDate, f.dueTime || null, f.type, f.status, f.priority, f.assignedToId, f.assignedToName, f.notes || '', f.completedAt || null]
    );
  }

  // 13. Suppliers & Expenses
  for (const sup of INITIAL_SUPPLIERS) {
    await conn.query(
      `INSERT INTO suppliers (id, name, contact_person, email, phone, category, city, address, gstin, payment_terms, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sup.id, sup.name, sup.contactPerson, sup.email, sup.phone, sup.category, sup.city, sup.address, sup.gstin, sup.paymentTerms, sup.rating || 4.5]
    );
  }

  for (const exp of INITIAL_EXPENSES) {
    await conn.query(
      `INSERT INTO expenses (id, project_id, category, title, total_amount, payment_mode, receipt_url, recorded_by, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [exp.id, exp.projectId, exp.category, exp.title, exp.totalAmount, exp.paymentMode, exp.receiptUrl || null, exp.recordedBy, exp.date, exp.notes || '']
    );
  }

  console.log('✅ ALL SEED DATA SUCCESSFULLY INSERTED INTO CPANEL MYSQL!');
  await conn.end();
}

realignAndSeed().catch(err => {
  console.error('❌ Migration and seeding failed:', err);
  process.exit(1);
});
