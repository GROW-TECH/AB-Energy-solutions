require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Running migration: auto-quotation-workflow & item-wise GST...');

  // 1. Add quotation_id to site_surveys if missing
  const [surveyCols] = await pool.query('DESCRIBE site_surveys');
  const surveyColNames = surveyCols.map(c => c.Field);
  if (!surveyColNames.includes('quotation_id')) {
    console.log('Adding quotation_id to site_surveys...');
    await pool.query('ALTER TABLE site_surveys ADD COLUMN quotation_id VARCHAR(50) NULL AFTER status');
  }

  // 2. Add item-wise GST columns to quotations if missing
  const [quoteCols] = await pool.query('DESCRIBE quotations');
  const quoteColNames = quoteCols.map(c => c.Field);

  if (!quoteColNames.includes('tax_mode')) {
    await pool.query("ALTER TABLE quotations ADD COLUMN tax_mode VARCHAR(20) DEFAULT 'ITEMIZED' AFTER approval_status");
  }
  if (!quoteColNames.includes('total_cgst')) {
    await pool.query("ALTER TABLE quotations ADD COLUMN total_cgst DECIMAL(12,2) DEFAULT 0.00 AFTER gst_amount");
  }
  if (!quoteColNames.includes('total_sgst')) {
    await pool.query("ALTER TABLE quotations ADD COLUMN total_sgst DECIMAL(12,2) DEFAULT 0.00 AFTER total_cgst");
  }
  if (!quoteColNames.includes('total_igst')) {
    await pool.query("ALTER TABLE quotations ADD COLUMN total_igst DECIMAL(12,2) DEFAULT 0.00 AFTER total_sgst");
  }
  if (!quoteColNames.includes('amount_in_words')) {
    await pool.query("ALTER TABLE quotations ADD COLUMN amount_in_words TEXT NULL AFTER net_total");
  }

  // 3. Add index on survey_id for fast lookup & idempotency
  const [indexes] = await pool.query('SHOW INDEX FROM quotations');
  const indexNames = indexes.map(i => i.Key_name);
  if (!indexNames.includes('idx_quotations_survey_id')) {
    console.log('Adding index idx_quotations_survey_id...');
    await pool.query('CREATE INDEX idx_quotations_survey_id ON quotations (survey_id)');
  }

  console.log('Migration completed successfully!');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
