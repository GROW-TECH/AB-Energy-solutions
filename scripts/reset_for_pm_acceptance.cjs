const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  // 1. Delete previous quotation so the fresh one will be generated upon PM acceptance
  await conn.query("DELETE FROM quotations WHERE lead_id = 'LEAD-2026-004' OR survey_id = 'SRV-2026-004'");
  console.log('1. Cleared existing quotations for LEAD-2026-004.');

  // 2. Set BOM status back to 'Submitted' (awaiting PM approval)
  await conn.query(`
    UPDATE project_boms 
    SET status = 'Submitted', approved_by_id = NULL, approved_by_name = NULL, revision_comments = NULL, updated_at = NOW() 
    WHERE survey_id = 'SRV-2026-004' OR id = 'BOM-941315'
  `);
  console.log("2. Set BOM-941315 status to 'Submitted'.");

  // 3. Set survey status to 'Completed' (survey is completed, BOM is submitted, awaiting PM approval)
  await conn.query("UPDATE site_surveys SET status = 'Completed' WHERE id = 'SRV-2026-004'");
  console.log("3. Set SRV-2026-004 status to 'Completed'.");

  // 4. Set lead status
  await conn.query("UPDATE leads SET status = 'Site Survey Scheduled' WHERE id = 'LEAD-2026-004'");
  console.log("4. Set LEAD-2026-004 status to 'Site Survey Scheduled'.");

  // Verify
  const [boms] = await conn.query("SELECT id, status, total_estimated_cost FROM project_boms WHERE survey_id = 'SRV-2026-004'");
  const [srv] = await conn.query("SELECT id, customer_name, status FROM site_surveys WHERE id = 'SRV-2026-004'");
  console.log('CURRENT BOM:', boms);
  console.log('CURRENT SURVEY:', srv);

  await conn.end();
}

run().catch(console.error);
