import { pool } from '../server/db.js';

async function main() {
  const ids = ['SRV-2026-013', 'SRV-2026-010', 'SRV-2026-011'];
  for (const id of ids) {
    const [rows]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [id]);
    console.log(`\n=== SURVEY ${id} ===`);
    console.log(JSON.stringify(rows[0] || 'NOT FOUND', null, 2));
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
