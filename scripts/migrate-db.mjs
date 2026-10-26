import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  console.log('Connecting to MySQL on ' + process.env.DB_HOST + '...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  console.log('Connected! Reading schema.sql...');
  const sql = fs.readFileSync(path.resolve(__dirname, '../schema.sql'), 'utf-8');

  console.log('Applying schema to database...');
  await conn.query(sql);

  console.log('Verifying created tables...');
  const [tables] = await conn.query('SHOW TABLES;');
  console.log('Successfully created tables:');
  console.table(tables);

  await conn.end();
  console.log('Migration complete!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
