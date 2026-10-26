const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  console.log('Creating purchase_order_items table if not exists...');
  await db.query(`
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id VARCHAR(64) PRIMARY KEY,
      po_id VARCHAR(64) NOT NULL,
      sku VARCHAR(64) DEFAULT 'SOL-ITEM',
      item_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) DEFAULT 'General BOS',
      quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
      unit VARCHAR(32) DEFAULT 'Nos',
      unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
      total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
      received_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_po_id (po_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('purchase_order_items table verified!');

  const [cols] = await db.query('DESCRIBE purchase_order_items');
  console.log('Columns in purchase_order_items:', cols.map(c => c.Field));
  await db.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
