const mysql = require('mysql2/promise');

async function resetDb() {
  const db = await mysql.createConnection({
    host: 'xiadot.com',
    user: 'ab_energy_solutions',
    password: 'ab_energy_solutions',
    database: 'ab_energy_solutions',
    port: 3306
  });

  console.log('Resetting CRM pipeline tables for clean single-lead test...');

  await db.query('SET FOREIGN_KEY_CHECKS = 0');

  const tablesToClear = [
    'survey_photos',
    'survey_review_history',
    'site_surveys',
    'quotations',
    'invoices',
    'payments',
    'projects',
    'follow_ups',
    'leads',
    'customers'
  ];

  for (const table of tablesToClear) {
    await db.query(`DELETE FROM \`${table}\``);
    console.log(`[CLEARED] Table ${table} is now empty.`);
  }

  await db.query('SET FOREIGN_KEY_CHECKS = 1');

  // Verify
  for (const table of tablesToClear) {
    const [rows] = await db.query(`SELECT COUNT(*) as cnt FROM \`${table}\``);
    console.log(`Table ${table} row count: ${rows[0].cnt}`);
  }

  console.log('\n[SUCCESS] Pipeline tables completely cleared for clean test flow!');
  await db.end();
}

resetDb().catch(err => {
  console.error('[ERROR] Reset failed:', err);
  process.exit(1);
});
