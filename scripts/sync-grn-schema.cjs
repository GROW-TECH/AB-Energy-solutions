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

  console.log('Synchronizing schema for goods_receipt_notes and grn_items...');

  const safeAlter = async (query) => {
    try {
      await db.query(query);
      console.log('Executed:', query.slice(0, 70));
    } catch (e) {
      console.log('Note (skipped or exists):', e.message);
    }
  };

  // 1. goods_receipt_notes alterations
  await safeAlter("ALTER TABLE goods_receipt_notes MODIFY COLUMN challan_number VARCHAR(100) NULL DEFAULT ''");
  await safeAlter("ALTER TABLE goods_receipt_notes MODIFY COLUMN received_date VARCHAR(50) NULL");
  await safeAlter("ALTER TABLE goods_receipt_notes MODIFY COLUMN created_at VARCHAR(50) NULL");
  await safeAlter("ALTER TABLE goods_receipt_notes ADD COLUMN delivery_warehouse VARCHAR(150) NULL AFTER delivery_location");
  await safeAlter("ALTER TABLE goods_receipt_notes ADD COLUMN verified_by VARCHAR(150) NULL AFTER received_by_name");

  // 2. grn_items alterations
  await safeAlter("ALTER TABLE grn_items ADD COLUMN category VARCHAR(100) NULL AFTER item_name");
  await safeAlter("ALTER TABLE grn_items ADD COLUMN unit VARCHAR(32) NULL AFTER item_name");
  await safeAlter("ALTER TABLE grn_items ADD COLUMN ordered_quantity DECIMAL(10,2) NULL");
  await safeAlter("ALTER TABLE grn_items ADD COLUMN received_quantity DECIMAL(10,2) NULL");
  await safeAlter("ALTER TABLE grn_items ADD COLUMN accepted_quantity DECIMAL(10,2) NULL");
  await safeAlter("ALTER TABLE grn_items ADD COLUMN rejected_quantity DECIMAL(10,2) NULL");

  console.log('Schema alignment complete!');
  await db.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
