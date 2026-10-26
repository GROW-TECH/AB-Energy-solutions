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

  const [items] = await conn.query("SELECT id, category, item_name, quantity, estimated_unit_cost, estimated_total_cost FROM bom_items WHERE bom_id = 'BOM-941315'");
  console.log('Items in BOM-941315:', items.length, items);

  await conn.end();
}

run().catch(console.error);
