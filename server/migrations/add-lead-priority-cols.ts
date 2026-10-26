import { pool } from '../db.js';

async function migrate() {
  console.log('Migrating leads table schema for priority recommendation...');
  await pool.query(`
    ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS recommended_priority VARCHAR(32) NULL AFTER priority,
      ADD COLUMN IF NOT EXISTS priority_override_reason VARCHAR(255) NULL AFTER recommended_priority,
      ADD COLUMN IF NOT EXISTS buying_intent VARCHAR(64) NULL AFTER roof_type;
  `);
  console.log('Migration completed successfully.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
