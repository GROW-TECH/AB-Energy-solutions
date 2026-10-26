const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function backup() {
  const db = await mysql.createConnection({
    host: 'xiadot.com',
    user: 'ab_energy_solutions',
    password: 'ab_energy_solutions',
    database: 'ab_energy_solutions',
    port: 3306
  });

  const [tables] = await db.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log('Found tables to backup:', tableNames);

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupJsonPath = path.join(backupDir, `backup_full_${timestamp}.json`);
  const backupSqlPath = path.join(backupDir, `backup_full_${timestamp}.sql`);

  const backupData = {};
  let sqlDump = `-- AB ENERGY SOLUTIONS CRM DATABASE BACKUP\n-- Generated: ${new Date().toISOString()}\n\n`;

  for (const table of tableNames) {
    const [rows] = await db.query(`SELECT * FROM \`${table}\``);
    backupData[table] = rows;
    console.log(`Backed up ${table}: ${rows.length} rows`);

    if (rows.length > 0) {
      sqlDump += `-- Table: ${table}\n`;
      for (const row of rows) {
        const keys = Object.keys(row);
        const vals = Object.values(row).map(v => {
          if (v === null) return 'NULL';
          if (typeof v === 'number') return v;
          if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
          return `'${String(v).replace(/'/g, "''")}'`;
        });
        sqlDump += `INSERT INTO \`${table}\` (\`${keys.join('`, `')}\`) VALUES (${vals.join(', ')});\n`;
      }
      sqlDump += '\n';
    }
  }

  fs.writeFileSync(backupJsonPath, JSON.stringify(backupData, null, 2), 'utf-8');
  fs.writeFileSync(backupSqlPath, sqlDump, 'utf-8');

  console.log('\n[SUCCESS] Backup completed successfully:');
  console.log('JSON Backup:', backupJsonPath);
  console.log('SQL Dump:  ', backupSqlPath);

  await db.end();
}

backup().catch(err => {
  console.error('[ERROR] Backup failed:', err);
  process.exit(1);
});
