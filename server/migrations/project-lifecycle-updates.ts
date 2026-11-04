import { pool } from '../db.js';

async function addColumnSafely(table: string, column: string, columnDef: string) {
  try {
    const [cols]: any = await pool.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
    if (!cols || cols.length === 0) {
      await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${columnDef}`);
      console.log(`[Migration] Added column ${column} to ${table}`);
    }
  } catch (e: any) {
    console.warn(`[Migration] Column ${column} check/add notice for ${table}:`, e.message);
  }
}

export async function runProjectLifecycleMigration() {
  console.log('Running project lifecycle updates migration...');

  // 0. Leads: Survey and Quotation Linkage
  await addColumnSafely('leads', 'survey_id', 'VARCHAR(50) NULL');
  await addColumnSafely('leads', 'quotation_id', 'VARCHAR(50) NULL');

  // 1. Site Surveys: Measured Cable Lengths and Client Signature
  await addColumnSafely('site_surveys', 'measured_dc_cable_meters', 'DECIMAL(10, 2) NULL');
  await addColumnSafely('site_surveys', 'measured_ac_cable_meters', 'DECIMAL(10, 2) NULL');
  await addColumnSafely('site_surveys', 'client_signature_data', 'LONGTEXT NULL');
  await addColumnSafely('site_surveys', 'client_signed_at', 'VARCHAR(50) NULL');
  await addColumnSafely('site_surveys', 'client_signer_name', 'VARCHAR(150) NULL');
  await addColumnSafely('site_surveys', 'client_approval_doc_url', 'TEXT NULL');
  await addColumnSafely('site_surveys', 'latitude', 'DECIMAL(10, 7) NULL');
  await addColumnSafely('site_surveys', 'longitude', 'DECIMAL(10, 7) NULL');

  // 2. Projects: Advance Payment, DISCOM Paperwork, Commitment, PM Clearance, and Grid Live AMC fields
  await addColumnSafely('projects', 'advance_payment_received', 'TINYINT(1) DEFAULT 0');
  await addColumnSafely('projects', 'advance_payment_amount', 'DECIMAL(15, 2) NULL');
  await addColumnSafely('projects', 'advance_payment_mode', 'VARCHAR(50) NULL');
  await addColumnSafely('projects', 'advance_payment_ref', 'VARCHAR(100) NULL');
  await addColumnSafely('projects', 'advance_payment_date', 'VARCHAR(50) NULL');
  await addColumnSafely('projects', 'advance_payment_notes', 'TEXT NULL');
  await addColumnSafely('projects', 'discom_net_metering_fee', 'DECIMAL(12, 2) NULL');
  await addColumnSafely('projects', 'discom_fee_receipt_url', 'TEXT NULL');
  await addColumnSafely('projects', 'discom_agreement_signed', 'TINYINT(1) DEFAULT 0');
  await addColumnSafely('projects', 'discom_agreement_doc_url', 'TEXT NULL');
  await addColumnSafely('projects', 'installation_target_days', 'INT DEFAULT 3');
  await addColumnSafely('projects', 'material_arrived_on_site', 'TINYINT(1) DEFAULT 0');
  await addColumnSafely('projects', 'material_arrived_confirmed_at', 'VARCHAR(50) NULL');
  await addColumnSafely('projects', 'material_arrived_confirmed_by', 'VARCHAR(150) NULL');
  await addColumnSafely('projects', 'site_survey_verified', 'TINYINT(1) DEFAULT 0');
  await addColumnSafely('projects', 'site_survey_verified_at', 'VARCHAR(50) NULL');
  await addColumnSafely('projects', 'site_survey_verified_by', 'VARCHAR(150) NULL');
  await addColumnSafely('projects', 'installation_duration_days', 'INT DEFAULT 2');
  await addColumnSafely('projects', 'attendance_photo_url', 'TEXT NULL');
  await addColumnSafely('projects', 'post_install_photos', 'JSON NULL');
  await addColumnSafely('projects', 'commissioning_video_url', 'TEXT NULL');
  await addColumnSafely('projects', 'pm_clearance_status', "VARCHAR(50) DEFAULT 'Pending'");
  await addColumnSafely('projects', 'pm_cleared_by', 'VARCHAR(150) NULL');
  await addColumnSafely('projects', 'pm_cleared_at', 'VARCHAR(50) NULL');
  await addColumnSafely('projects', 'eb_inspection_cleared', 'TINYINT(1) DEFAULT 0');
  await addColumnSafely('projects', 'solar_meter_fixed', 'TINYINT(1) DEFAULT 0');
  await addColumnSafely('projects', 'solar_meter_initial_reading', 'DECIMAL(12, 2) NULL');
  await addColumnSafely('projects', 'grid_live_date', 'VARCHAR(50) NULL');
  await addColumnSafely('projects', 'amc_warranty_years', 'INT DEFAULT 5');

  // 3. Payments: Advance filter and reconciliation fields
  await addColumnSafely('payments', 'is_advance', 'TINYINT(1) DEFAULT 0');
  await addColumnSafely('payments', 'quotation_id', 'VARCHAR(50) NULL');
  await addColumnSafely('payments', 'reconciled', 'TINYINT(1) DEFAULT 0');
  await addColumnSafely('payments', 'reconciled_at', 'VARCHAR(50) NULL');
  await addColumnSafely('payments', 'reconciled_by', 'VARCHAR(150) NULL');

  // 4. AMC Contracts table (Ensure table exists for AMC auto-creation)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS amc_contracts (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(50) NOT NULL,
        customer_name VARCHAR(150) NOT NULL,
        customer_phone VARCHAR(50) NULL,
        customer_address TEXT NULL,
        project_id VARCHAR(50) NOT NULL,
        capacity_kw DECIMAL(10, 2) DEFAULT 0,
        plan_name VARCHAR(100) DEFAULT 'Standard Solar Care',
        warranty_years INT DEFAULT 5,
        annual_price DECIMAL(12, 2) DEFAULT 0,
        visits_per_year INT DEFAULT 2,
        completed_visits INT DEFAULT 0,
        start_date VARCHAR(50) NOT NULL,
        end_date VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        next_scheduled_visit VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e: any) {
    console.warn(`AMC Contracts table creation warning:`, e.message);
  }

  console.log('Project lifecycle migration completed successfully.');
}

if (process.argv[1]?.includes('project-lifecycle-updates')) {
  runProjectLifecycleMigration()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
