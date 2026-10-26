const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'xiadot.com',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'ab_energy_solutions',
    password: process.env.DB_PASSWORD || 'ab_energy_solutions',
    database: process.env.DB_NAME || 'ab_energy_solutions',
    waitForConnections: true,
    connectionLimit: 5,
  });

  console.log('Connecting to database...');

  // Helper function to safely add columns if they do not exist
  async function addColumnIfNotExists(tableName, columnName, columnDef) {
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM ${tableName} LIKE '${columnName}'`);
      if (cols.length === 0) {
        await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
        console.log(`+ Added column ${tableName}.${columnName}`);
      } else {
        console.log(`= Column ${tableName}.${columnName} already exists`);
      }
    } catch (err) {
      console.error(`Error adding ${tableName}.${columnName}:`, err.message);
    }
  }

  // 1. purchase_orders
  await addColumnIfNotExists('purchase_orders', 'quotation_id', 'VARCHAR(50) NULL');
  await addColumnIfNotExists('purchase_orders', 'grand_total', 'DECIMAL(12,2) NULL');
  await addColumnIfNotExists('purchase_orders', 'subtotal', 'DECIMAL(12,2) NULL');
  await addColumnIfNotExists('purchase_orders', 'tax_amount', 'DECIMAL(12,2) NULL');
  await addColumnIfNotExists('purchase_orders', 'grn_number', 'VARCHAR(100) NULL');
  await addColumnIfNotExists('purchase_orders', 'customer_name', 'VARCHAR(150) NULL');
  await addColumnIfNotExists('purchase_orders', 'customer_phone', 'VARCHAR(50) NULL');
  await addColumnIfNotExists('purchase_orders', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  // 2. goods_receipt_notes
  await addColumnIfNotExists('goods_receipt_notes', 'grn_number', 'VARCHAR(100) NULL');
  await addColumnIfNotExists('goods_receipt_notes', 'quotation_id', 'VARCHAR(50) NULL');
  await addColumnIfNotExists('goods_receipt_notes', 'delivery_challan_no', 'VARCHAR(100) NULL');
  await addColumnIfNotExists('goods_receipt_notes', 'supplier_invoice_no', 'VARCHAR(100) NULL');
  await addColumnIfNotExists('goods_receipt_notes', 'customer_signature_name', 'VARCHAR(150) NULL');
  await addColumnIfNotExists('goods_receipt_notes', 'customer_signature_phone', 'VARCHAR(50) NULL');
  await addColumnIfNotExists('goods_receipt_notes', 'customer_signature_data', 'LONGTEXT NULL');
  await addColumnIfNotExists('goods_receipt_notes', 'customer_signature_date', 'VARCHAR(50) NULL');
  await addColumnIfNotExists('goods_receipt_notes', 'signed_pdf_url', 'VARCHAR(500) NULL');
  await addColumnIfNotExists('goods_receipt_notes', 'status', "VARCHAR(50) DEFAULT 'Delivered'");
  await addColumnIfNotExists('goods_receipt_notes', 'notes', 'TEXT NULL');
  await addColumnIfNotExists('goods_receipt_notes', 'items_summary', 'LONGTEXT NULL');

  // 3. projects
  await addColumnIfNotExists('projects', 'site_readiness_confirmed', 'TINYINT(1) DEFAULT 0');
  await addColumnIfNotExists('projects', 'site_readiness_notes', 'TEXT NULL');
  await addColumnIfNotExists('projects', 'site_readiness_date', 'VARCHAR(50) NULL');
  await addColumnIfNotExists('projects', 'scheduled_installation_date', 'VARCHAR(50) NULL');
  await addColumnIfNotExists('projects', 'grn_id', 'VARCHAR(50) NULL');
  await addColumnIfNotExists('projects', 'signed_grn_pdf_url', 'VARCHAR(500) NULL');
  await addColumnIfNotExists('projects', 'po_id', 'VARCHAR(50) NULL');
  await addColumnIfNotExists('projects', 'material_readiness_status', "VARCHAR(50) DEFAULT 'Pending Indent'");

  // 4. notifications
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      target_role VARCHAR(50) NULL,
      target_id VARCHAR(50) NULL,
      target_type VARCHAR(50) NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('+ Created/verified table: notifications');

  console.log('Database alignment complete!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
