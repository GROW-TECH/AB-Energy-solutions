import { pool } from '../db.js';

export async function runFeatureUpdatesMigration() {
  console.log('Running feature updates migration...');

  // 1. Leads table
  const leadCols = [
    "ADD COLUMN IF NOT EXISTS connection_space VARCHAR(50) DEFAULT 'Single Space'",
    "ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(150) NULL",
    "ADD COLUMN IF NOT EXISTS last_modified_role VARCHAR(50) NULL",
    "ADD COLUMN IF NOT EXISTS last_modified_at VARCHAR(50) NULL",
    "ADD COLUMN IF NOT EXISTS edit_history JSON NULL",
  ];
  for (const col of leadCols) {
    try {
      await pool.query(`ALTER TABLE leads ${col}`);
    } catch (e: any) {
      console.warn(`Leads alter warning (${col}):`, e.message);
    }
  }

  // 2. Quotations table
  const quoteCols = [
    "ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Medium'",
    "ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(150) NULL",
    "ADD COLUMN IF NOT EXISTS last_modified_role VARCHAR(50) NULL",
    "ADD COLUMN IF NOT EXISTS last_modified_at VARCHAR(50) NULL",
    "ADD COLUMN IF NOT EXISTS edit_history JSON NULL",
  ];
  for (const col of quoteCols) {
    try {
      await pool.query(`ALTER TABLE quotations ${col}`);
    } catch (e: any) {
      console.warn(`Quotations alter warning (${col}):`, e.message);
    }
  }

  // 3. Projects table
  const projCols = [
    "ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(150) NULL",
    "ADD COLUMN IF NOT EXISTS last_modified_role VARCHAR(50) NULL",
    "ADD COLUMN IF NOT EXISTS last_modified_at VARCHAR(50) NULL",
    "ADD COLUMN IF NOT EXISTS edit_history JSON NULL",
  ];
  for (const col of projCols) {
    try {
      await pool.query(`ALTER TABLE projects ${col}`);
    } catch (e: any) {
      console.warn(`Projects alter warning (${col}):`, e.message);
    }
  }

  // 4. Site surveys table
  const surveyCols = [
    "ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7) NULL",
    "ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7) NULL",
    "ADD COLUMN IF NOT EXISTS client_signature_data LONGTEXT NULL",
    "ADD COLUMN IF NOT EXISTS client_signed_at VARCHAR(50) NULL",
    "ADD COLUMN IF NOT EXISTS client_signer_name VARCHAR(150) NULL",
    "ADD COLUMN IF NOT EXISTS client_approval_doc_url TEXT NULL",
    "ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(150) NULL",
    "ADD COLUMN IF NOT EXISTS last_modified_role VARCHAR(50) NULL",
    "ADD COLUMN IF NOT EXISTS last_modified_at VARCHAR(50) NULL",
    "ADD COLUMN IF NOT EXISTS edit_history JSON NULL",
  ];
  for (const col of surveyCols) {
    try {
      await pool.query(`ALTER TABLE site_surveys ${col}`);
    } catch (e: any) {
      console.warn(`Surveys alter warning (${col}):`, e.message);
    }
  }

  console.log('Feature updates migration completed successfully.');
}

if (process.argv[1]?.includes('feature-updates')) {
  runFeatureUpdatesMigration()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

