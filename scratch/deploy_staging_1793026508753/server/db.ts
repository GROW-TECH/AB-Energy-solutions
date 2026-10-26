import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'xiadot.com',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'ab_energy_solutions',
  password: process.env.DB_PASSWORD || 'ab_energy_solutions',
  database: process.env.DB_NAME || 'ab_energy_solutions',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
