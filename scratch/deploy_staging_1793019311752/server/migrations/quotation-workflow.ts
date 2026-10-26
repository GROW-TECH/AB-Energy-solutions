import { pool } from '../db.js';

export async function runQuotationMigration(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Add missing quotation columns idempotently
    const columnsToAdd = [
      { name: 'proposal_type', def: "VARCHAR(50) DEFAULT 'Final_Technical'" },
      { name: 'package_tier', def: "VARCHAR(50) DEFAULT 'Standard'" },
      { name: 'subtotal', def: "DECIMAL(12,2) DEFAULT 0" },
      { name: 'discount_amount', def: "DECIMAL(12,2) DEFAULT 0" },
      { name: 'discount_approved_by', def: "VARCHAR(50) NULL" },
      { name: 'subsidy_amount', def: "DECIMAL(12,2) DEFAULT 0" },
      { name: 'taxable_amount', def: "DECIMAL(12,2) DEFAULT 0" },
      { name: 'gst_rate', def: "DECIMAL(5,2) DEFAULT 13.80" },
      { name: 'gst_amount', def: "DECIMAL(12,2) DEFAULT 0" },
      { name: 'net_total', def: "DECIMAL(12,2) DEFAULT 0" },
      { name: 'approval_status', def: "VARCHAR(50) DEFAULT 'Approved'" },
      { name: 'survey_id', def: "VARCHAR(50) NULL" },
      { name: 'pdf_url', def: "VARCHAR(255) NULL" },
      { name: 'converted_to_project_id', def: "VARCHAR(50) NULL" },
      { name: 'idempotency_key', def: "VARCHAR(100) NULL" },
    ];

    const [existingCols]: any = await pool.query('DESCRIBE quotations');
    const existingColNames = new Set(existingCols.map((c: any) => c.Field.toLowerCase()));

    for (const col of columnsToAdd) {
      if (!existingColNames.has(col.name.toLowerCase())) {
        await pool.query(`ALTER TABLE quotations ADD COLUMN ${col.name} ${col.def}`);
        console.log(`[Migration] Added column ${col.name} to quotations`);
      }
    }

    return { success: true, message: 'Quotation workflow migration executed successfully.' };
  } catch (err: any) {
    console.error('Quotation migration failed:', err);
    return { success: false, message: err.message };
  }
}
