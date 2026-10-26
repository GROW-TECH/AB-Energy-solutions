const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetQuotation() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'xiadot.com',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'ab_energy_solutions',
    password: process.env.DB_PASSWORD || 'ab_energy_solutions',
    database: process.env.DB_NAME || 'ab_energy_solutions',
  });

  console.log('Connecting to database...');

  const quotationId = 'QT-2026-00023';
  const projectId = 'PROJECT-2026-023';

  // 1. Delete any POs, PO items, GRNs, GRN items tied to this quotation or project
  const [pos] = await pool.query('SELECT id FROM purchase_orders WHERE quotation_id = ? OR project_id = ?', [quotationId, projectId]);
  for (const po of pos) {
    await pool.query('DELETE FROM goods_receipt_notes WHERE po_id = ?', [po.id]);
    await pool.query('DELETE FROM purchase_order_items WHERE po_id = ?', [po.id]);
    await pool.query('DELETE FROM purchase_orders WHERE id = ?', [po.id]);
    console.log(`Deleted PO ${po.id}`);
  }
  await pool.query('DELETE FROM goods_receipt_notes WHERE quotation_id = ? OR project_id = ?', [quotationId, projectId]);

  // 2. Delete payments and invoices for this project
  await pool.query('DELETE FROM payments WHERE project_id = ?', [projectId]);
  await pool.query('DELETE FROM invoices WHERE project_id = ?', [projectId]);
  console.log(`Deleted invoices for ${projectId}`);

  // 3. Delete the project
  await pool.query('DELETE FROM projects WHERE id = ? OR quotation_id = ?', [projectId, quotationId]);
  console.log(`Deleted project ${projectId}`);

  // 4. Reset quotation to Customer_Accepted with NULL project conversion
  await pool.query(
    "UPDATE quotations SET status = 'Customer_Accepted', converted_to_project_id = NULL WHERE id = ?",
    [quotationId]
  );
  console.log(`Reset quotation ${quotationId} to 'Customer_Accepted' with converted_to_project_id = NULL`);

  // Verify
  const [rows] = await pool.query('SELECT id, quotation_number, status, converted_to_project_id, lead_name, total_amount FROM quotations WHERE id = ?', [quotationId]);
  console.log('Updated Quotation:', rows[0]);

  await pool.end();
  console.log('Reset complete successfully!');
}

resetQuotation().catch(err => {
  console.error('Error resetting quotation:', err);
  process.exit(1);
});
