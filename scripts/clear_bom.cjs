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

  const [boms] = await conn.query("SELECT id FROM project_boms WHERE survey_id = 'SRV-2026-004'");
  for (const b of boms) {
    await conn.query("DELETE FROM bom_items WHERE bom_id = ?", [b.id]);
    await conn.query("DELETE FROM project_boms WHERE id = ?", [b.id]);
    console.log(`Deleted BOM ${b.id}`);
  }

  console.log('Cleared premature BOMs for SRV-2026-004.');
  await conn.end();
}

run().catch(console.error);
