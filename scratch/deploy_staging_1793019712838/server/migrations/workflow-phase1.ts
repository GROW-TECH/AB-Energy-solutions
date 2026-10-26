import { pool } from '../db.js';

export async function runPhase1Migration() {
  console.log('--- Starting Workflow Phase 1 Migration ---');

  // 1. Verify connection and current tables
  const [tables]: any = await pool.query('SHOW TABLES');
  console.log('Connected to MySQL. Existing tables count:', tables.length);

  // 2. Create project_boms table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_boms (
      id VARCHAR(50) PRIMARY KEY,
      project_id VARCHAR(50) NULL,
      survey_id VARCHAR(50) NULL,
      version INT NOT NULL DEFAULT 1,
      status VARCHAR(50) NOT NULL DEFAULT 'Draft',
      prepared_by_id VARCHAR(50) NULL,
      prepared_by_name VARCHAR(150) NULL,
      approved_by_id VARCHAR(50) NULL,
      approved_by_name VARCHAR(150) NULL,
      total_estimated_cost DECIMAL(12,2) DEFAULT 0,
      revision_comments TEXT NULL,
      created_at VARCHAR(50) NOT NULL,
      updated_at VARCHAR(50) NOT NULL,
      INDEX idx_pb_project (project_id),
      INDEX idx_pb_survey (survey_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Verified table: project_boms');

  // 3. Create bom_items table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bom_items (
      id VARCHAR(50) PRIMARY KEY,
      bom_id VARCHAR(50) NOT NULL,
      product_id VARCHAR(50) NULL,
      category VARCHAR(100) NOT NULL,
      item_name VARCHAR(200) NOT NULL,
      technical_specification TEXT NOT NULL,
      brand_make VARCHAR(100) NULL,
      quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
      unit VARCHAR(50) NOT NULL DEFAULT 'Nos',
      estimated_unit_cost DECIMAL(12,2) DEFAULT 0,
      estimated_total_cost DECIMAL(12,2) DEFAULT 0,
      remarks TEXT NULL,
      photo_url VARCHAR(500) NULL,
      INDEX idx_bi_bom (bom_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Verified table: bom_items');

  // 4. Create customer_documents table (simplified customer photo and Aadhaar/identity proof)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_documents (
      id VARCHAR(50) PRIMARY KEY,
      customer_id VARCHAR(50) NULL,
      project_id VARCHAR(50) NULL,
      survey_id VARCHAR(50) NULL,
      document_type VARCHAR(100) NOT NULL DEFAULT 'Aadhaar Card',
      id_number VARCHAR(100) NULL,
      customer_photo_path VARCHAR(500) NULL,
      doc_front_path VARCHAR(500) NULL,
      doc_back_path VARCHAR(500) NULL,
      notes TEXT NULL,
      uploaded_by_id VARCHAR(50) NULL,
      uploaded_by_name VARCHAR(150) NULL,
      uploaded_at VARCHAR(50) NOT NULL,
      INDEX idx_cd_customer (customer_id),
      INDEX idx_cd_project (project_id),
      INDEX idx_cd_survey (survey_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Verified table: customer_documents');

  // 5. Create goods_receipt_notes table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS goods_receipt_notes (
      id VARCHAR(50) PRIMARY KEY,
      po_id VARCHAR(50) NOT NULL,
      project_id VARCHAR(50) NULL,
      supplier_id VARCHAR(50) NULL,
      challan_number VARCHAR(100) NOT NULL,
      challan_date VARCHAR(50) NULL,
      received_date VARCHAR(50) NOT NULL,
      delivery_location VARCHAR(150) NULL,
      challan_document_path VARCHAR(500) NULL,
      has_discrepancy TINYINT(1) DEFAULT 0,
      discrepancy_summary TEXT NULL,
      received_by_id VARCHAR(50) NULL,
      received_by_name VARCHAR(150) NULL,
      created_at VARCHAR(50) NOT NULL,
      INDEX idx_grn_po (po_id),
      INDEX idx_grn_project (project_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Verified table: goods_receipt_notes');

  // 6. Create grn_items table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS grn_items (
      id VARCHAR(50) PRIMARY KEY,
      grn_id VARCHAR(50) NOT NULL,
      bom_item_id VARCHAR(50) NULL,
      item_name VARCHAR(200) NOT NULL,
      ordered_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
      received_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
      accepted_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
      damaged_qty DECIMAL(10,2) DEFAULT 0,
      rejected_qty DECIMAL(10,2) DEFAULT 0,
      damage_photo_path VARCHAR(500) NULL,
      remarks TEXT NULL,
      INDEX idx_gi_grn (grn_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Verified table: grn_items');

  // 7. Create installation_attendance table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS installation_attendance (
      id VARCHAR(50) PRIMARY KEY,
      project_id VARCHAR(50) NOT NULL,
      date VARCHAR(50) NOT NULL,
      team_lead_id VARCHAR(50) NULL,
      team_lead_name VARCHAR(150) NULL,
      technicians_present JSON NULL,
      check_in_time VARCHAR(50) NOT NULL,
      gps_lat DECIMAL(10,7) NULL,
      gps_lng DECIMAL(10,7) NULL,
      status VARCHAR(50) DEFAULT 'On_Site',
      notes TEXT NULL,
      INDEX idx_ia_proj (project_id),
      INDEX idx_ia_date (date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Verified table: installation_attendance');

  // 8. Create installation_progress_logs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS installation_progress_logs (
      id VARCHAR(50) PRIMARY KEY,
      project_id VARCHAR(50) NOT NULL,
      reported_date VARCHAR(50) NOT NULL,
      stage_reached VARCHAR(100) NOT NULL,
      progress_percent INT DEFAULT 0,
      is_blocked TINYINT(1) DEFAULT 0,
      blocker_reason TEXT NULL,
      materials_ready_confirmed TINYINT(1) DEFAULT 0,
      photos JSON NULL,
      reported_by_id VARCHAR(50) NULL,
      created_at VARCHAR(50) NOT NULL,
      INDEX idx_ipl_proj (project_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Verified table: installation_progress_logs');

  // 9. Alter purchase_orders and projects for linkage
  const poColumns = [
    'ADD COLUMN IF NOT EXISTS project_id VARCHAR(50) NULL',
    'ADD COLUMN IF NOT EXISTS bom_id VARCHAR(50) NULL',
    'ADD COLUMN IF NOT EXISTS delivery_warehouse VARCHAR(150) NULL',
    'ADD COLUMN IF NOT EXISTS delivery_challan_url VARCHAR(500) NULL',
    'ADD COLUMN IF NOT EXISTS supplier_invoice_url VARCHAR(500) NULL'
  ];
  for (const col of poColumns) {
    try {
      await pool.query(`ALTER TABLE purchase_orders ${col}`);
    } catch (e: any) {
      console.warn(`PO column notice: ${e.message}`);
    }
  }

  const projectColumns = [
    'ADD COLUMN IF NOT EXISTS bom_id VARCHAR(50) NULL',
    'ADD COLUMN IF NOT EXISTS material_readiness_status VARCHAR(50) DEFAULT "Planning"'
  ];
  for (const col of projectColumns) {
    try {
      await pool.query(`ALTER TABLE projects ${col}`);
    } catch (e: any) {
      console.warn(`Projects column notice: ${e.message}`);
    }
  }

  console.log('--- Phase 1 Database Migration Completed Successfully! ---');
}

if (process.argv[1]?.includes('workflow-phase1')) {
  runPhase1Migration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
