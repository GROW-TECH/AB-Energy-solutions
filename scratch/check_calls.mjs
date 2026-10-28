import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'xiadot.com',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'ab_energy_solutions',
    password: process.env.DB_PASSWORD || 'ab_energy_solutions',
    database: process.env.DB_NAME || 'ab_energy_solutions'
  });

  const [calls] = await conn.query('SELECT id, employee_id, employee_name, employee_phone, customer_phone, call_type, duration_seconds, created_at FROM call_logs ORDER BY id DESC LIMIT 10');
  console.log('RECENT CALLS:', JSON.stringify(calls, null, 2));

  const [emps] = await conn.query('SELECT id, name, phone, role FROM employees WHERE name LIKE ? OR phone LIKE ?', ['%Siva%', '%96552%']);
  console.log('MATCHED EMPLOYEES:', JSON.stringify(emps, null, 2));

  await conn.end();
}

main().catch(console.error);
