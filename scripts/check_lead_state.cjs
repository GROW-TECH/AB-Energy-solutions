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

  const [leads] = await conn.query("SELECT id, name, status, recommended_kw FROM leads WHERE id = 'LEAD-2026-004'");
  const [surveys] = await conn.query("SELECT id, customer_name, status, recommended_kw FROM site_surveys WHERE id = 'SRV-2026-004' OR lead_id = 'LEAD-2026-004'");
  const [boms] = await conn.query("SELECT id, survey_id, status, total_estimated_cost FROM project_boms WHERE survey_id = 'SRV-2026-004'");
  const [quotes] = await conn.query("SELECT id, quotation_number, status, total_amount, lead_id, survey_id FROM quotations WHERE lead_id = 'LEAD-2026-004' OR survey_id = 'SRV-2026-004'");

  console.log('--- LEADS ---', leads);
  console.log('--- SURVEYS ---', surveys);
  console.log('--- BOMS ---', boms);
  console.log('--- QUOTATIONS ---', quotes);

  await conn.end();
}

run().catch(console.error);
