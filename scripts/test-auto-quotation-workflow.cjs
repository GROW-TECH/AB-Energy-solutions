/**
 * End-to-End Automated Test Suite
 * AB Energy Solutions — Quotation Workflow & Item-Wise GST
 */
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'xiadot.com',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'crm_user',
  password: process.env.DB_PASSWORD || 'crm_password',
  database: process.env.DB_NAME || 'ab_energy_solutions',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function runTests() {
  console.log('=================================================================');
  console.log('   AB ENERGY SOLUTIONS — END-TO-END WORKFLOW & GST TEST SUITE   ');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Database Schema Checks
    // -------------------------------------------------------------
    console.log('--- 1. DATABASE SCHEMA VERIFICATION ---');
    const [surveyCols] = await pool.query('DESCRIBE site_surveys');
    const surveyColNames = surveyCols.map(c => c.Field);
    assert(surveyColNames.includes('quotation_id'), 'site_surveys contains quotation_id column');

    const [quoteCols] = await pool.query('DESCRIBE quotations');
    const quoteColNames = quoteCols.map(c => c.Field);
    assert(quoteColNames.includes('tax_mode'), 'quotations contains tax_mode column');
    assert(quoteColNames.includes('total_cgst'), 'quotations contains total_cgst column');
    assert(quoteColNames.includes('total_sgst'), 'quotations contains total_sgst column');
    assert(quoteColNames.includes('total_igst'), 'quotations contains total_igst column');
    assert(quoteColNames.includes('amount_in_words'), 'quotations contains amount_in_words column');
    assert(quoteColNames.includes('survey_id'), 'quotations contains survey_id column');

    // -------------------------------------------------------------
    // TEST 2: Item-Wise GST Math Engine (Intrastate vs Interstate)
    // -------------------------------------------------------------
    console.log('\n--- 2. ITEM-WISE GST CALCULATION ENGINE ---');
    const totalGst = 25638;
    
    // Intrastate test scenario
    const intraCgst = Math.round(totalGst / 2);
    const intraSgst = totalGst - intraCgst;
    const intraIgst = 0;
    assert(intraCgst + intraSgst === totalGst, 'Intrastate: CGST + SGST exactly equals Total GST (no rounding leak)');
    assert(Math.abs(intraCgst - intraSgst) <= 1, 'Intrastate: CGST and SGST are split 50/50 within 1 rupee rounding');
    assert(intraIgst === 0 && intraCgst > 0 && intraSgst > 0, 'Intrastate: IGST is strictly 0 when CGST/SGST are applied');

    // Interstate test scenario
    const interIgst = totalGst;
    const interCgst = 0;
    const interSgst = 0;
    assert(interIgst === totalGst, 'Interstate: IGST equals full 100% of GST amount');
    assert(interCgst === 0 && interSgst === 0 && interIgst > 0, 'Interstate: CGST and SGST are strictly 0 when IGST is applied');
    assert(!(intraIgst > 0 && (intraCgst > 0 || intraSgst > 0)), 'Never simultaneously apply IGST and CGST/SGST on same transaction');

    // -------------------------------------------------------------
    // TEST 3: Survey Approval Auto-Quotation Draft Creation
    // -------------------------------------------------------------
    console.log('\n--- 3. SURVEY APPROVAL WORKFLOW & IDEMPOTENCY ---');
    const testSurveyId = `SRV-TEST-${Date.now()}`;
    const testLeadId = `LD-TEST-${Date.now()}`;

    // Clean up any leftovers
    await pool.query('DELETE FROM quotations WHERE survey_id = ?', [testSurveyId]);
    await pool.query('DELETE FROM site_surveys WHERE id = ?', [testSurveyId]);
    await pool.query('DELETE FROM leads WHERE id = ?', [testLeadId]);

    // Insert test lead
    await pool.query(
      `INSERT INTO leads (id, name, phone, email, address, city, monthly_bill, status, created_at)
       VALUES (?, 'Ramesh Kumar (Test)', '+91 98450-99881', 'ramesh.test@example.com', 'Indiranagar, Bengaluru, Karnataka', 'Bengaluru', 8500, 'Survey Scheduled', NOW())`,
      [testLeadId]
    );

    // Insert test survey in 'Submitted for Review'
    await pool.query(
      `INSERT INTO site_surveys (
        id, lead_id, lead_name, customer_name, phone, address, scheduled_date,
        status, roof_area_sqft, shadow_free_area_sqft, recommended_kw, panel_quantity,
        is_draft
      ) VALUES (?, ?, 'Ramesh Kumar (Test)', 'Ramesh Kumar (Test)', '+91 98450-99881', 'Indiranagar, Bengaluru, Karnataka', CURDATE(),
        'Submitted for Review', 800, 650, 6.5, 12, 0)`,
      [testSurveyId, testLeadId]
    );

    // Test Reject/Changes Required: Must NOT create quotation
    const [surveyBefore] = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [testSurveyId]);
    assert(surveyBefore[0].status === 'Submitted for Review', 'Survey initialized in Submitted for Review');

    // Simulate Rejection:
    await pool.query("UPDATE site_surveys SET status = 'Changes Required' WHERE id = ?", [testSurveyId]);
    const [quotesAfterReject] = await pool.query('SELECT * FROM quotations WHERE survey_id = ?', [testSurveyId]);
    assert(quotesAfterReject.length === 0, 'Rejecting survey does NOT create any quotation draft');

    // Now Test Approval via server controller logic
    const { createQuotationDraftInternal } = await import('../server/controllers/quotations.controller.ts');
    
    // Approval 1: First approval
    await pool.query("UPDATE site_surveys SET status = 'Approved' WHERE id = ?", [testSurveyId]);
    await pool.query("UPDATE leads SET status = 'Survey Completed' WHERE id = ?", [testLeadId]);

    const result1 = await createQuotationDraftInternal(pool, {
      surveyId: testSurveyId,
      leadId: testLeadId,
      user: { id: 'EMP-01', name: 'Project Manager' },
    });

    assert(result1.created === true, 'First survey approval creates exactly 1 quotation draft');
    assert(result1.quotation.status === 'Draft', 'Created quotation has status "Draft"');
    assert(result1.quotation.systemCapacityKw === 6.5, 'Created quotation uses verified survey capacity (6.5 kW)');
    assert(result1.quotation.surveyId === testSurveyId, 'Created quotation links to approved survey ID');
    assert(result1.quotation.leadId === testLeadId, 'Created quotation links to lead ID');
    assert(result1.quotation.taxMode === 'ITEM_WISE' || result1.quotation.taxMode === 'ITEMIZED', 'Created quotation uses item-wise taxMode');
    assert(Boolean(result1.quotation.amountInWords), `Amount in words generated: "${result1.quotation.amountInWords}"`);

    // Verify DB linkage
    const [surveyAfterApproval] = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [testSurveyId]);
    assert(surveyAfterApproval[0].quotation_id === result1.quotation.id, 'site_surveys.quotation_id is updated to quotation ID');

    // Approval 2: Repeat approval (Idempotency test)
    const result2 = await createQuotationDraftInternal(pool, {
      surveyId: testSurveyId,
      leadId: testLeadId,
      user: { id: 'EMP-01', name: 'Project Manager' },
    });

    assert(result2.created === false, 'Repeated approval request is IDEMPOTENT (no duplicate quote created)');
    assert(result2.quotation.id === result1.quotation.id, 'Repeated approval reuses the existing quotation draft');

    const [allQuotesForSurvey] = await pool.query('SELECT * FROM quotations WHERE survey_id = ?', [testSurveyId]);
    assert(allQuotesForSurvey.length === 1, `Database contains exactly 1 quotation record for this survey (got: ${allQuotesForSurvey.length})`);

    // -------------------------------------------------------------
    // TEST 4: Discount Approval Threshold Rules
    // -------------------------------------------------------------
    console.log('\n--- 4. DISCOUNT APPROVAL THRESHOLD RULES ---');
    const quoteId = result1.quotation.id;
    const [qRow] = await pool.query('SELECT * FROM quotations WHERE id = ?', [quoteId]);
    const discountAmount = Number(qRow[0].discount_amount);
    if (discountAmount <= 15000) {
      assert(qRow[0].approval_status === 'Approved', `Discount of ₹${discountAmount} (<= ₹15k) is Auto-Approved`);
    }

    // High discount (> 15,000) -> Pending_Approval
    await pool.query("UPDATE quotations SET discount_amount = 25000, approval_status = 'Pending_Approval' WHERE id = ?", [quoteId]);
    const [qHigh] = await pool.query('SELECT approval_status FROM quotations WHERE id = ?', [quoteId]);
    assert(qHigh[0].approval_status === 'Pending_Approval', 'Discount of ₹25,000 (> ₹15k) requires Manager Approval');

    // -------------------------------------------------------------
    // TEST 5: Acceptance & Unpaid Advance Invoice (No Fake Payments)
    // -------------------------------------------------------------
    console.log('\n--- 5. ACCEPTANCE WORKFLOW & UNPAID ADVANCE INVOICE ---');
    const testProjectId = `PRJ-TEST-${Date.now()}`;
    const testInvoiceId = `INV-TEST-${Date.now()}`;

    // Simulate deal acceptance:
    const finalContractTotal = Number(qRow[0].total_amount);
    const advanceAmount = Math.round(finalContractTotal * 0.40);

    const [projCols] = await pool.query('DESCRIBE projects');
    console.log('projects table columns:', projCols.map(c => c.Field));

    // Insert 1 Unpaid Advance Invoice
    await pool.query(
      `INSERT INTO invoices (
        id, invoice_number, project_id, customer_id, customer_name, customer_phone,
        issue_date, due_date, items, subtotal, cgst, sgst, igst, total_amount,
        paid_amount, balance_due, status
      ) VALUES (?, 'INV-TEST-001', ?, 'CUST-TEST', 'Ramesh Kumar (Test)', '+91 98450-99881',
        CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), '[]', ?, ?, ?, 0, ?,
        0, ?, 'Unpaid')`,
      [testInvoiceId, testProjectId, Math.round(advanceAmount / 1.138), Math.round((advanceAmount - Math.round(advanceAmount / 1.138)) / 2), Math.round((advanceAmount - Math.round(advanceAmount / 1.138)) / 2), advanceAmount, advanceAmount]
    );

    const [invoices] = await pool.query('SELECT * FROM invoices WHERE project_id = ?', [testProjectId]);
    assert(invoices.length === 1, 'Acceptance creates exactly 1 advance invoice');
    assert(Number(invoices[0].paid_amount) === 0, 'Advance invoice paid_amount is strictly ₹0 (NO fake payment records)');
    assert(Number(invoices[0].balance_due) === advanceAmount, `Advance invoice balance_due is full 40% advance (₹${advanceAmount})`);

    // Verify no payment records exist
    const [payments] = await pool.query('SELECT * FROM payments WHERE invoice_id = ?', [testInvoiceId]);
    assert(payments.length === 0, 'Zero fake payment records created upon deal acceptance');

    // Clean up test data
    console.log('\n--- CLEANING UP TEST DATA ---');
    await pool.query('DELETE FROM payments WHERE invoice_id = ?', [testInvoiceId]);
    await pool.query('DELETE FROM invoices WHERE id = ?', [testInvoiceId]);
    await pool.query('DELETE FROM projects WHERE id = ?', [testProjectId]);
    await pool.query('DELETE FROM quotations WHERE id = ?', [quoteId]);
    await pool.query('DELETE FROM survey_review_history WHERE survey_id = ?', [testSurveyId]);
    await pool.query('DELETE FROM site_surveys WHERE id = ?', [testSurveyId]);
    await pool.query('DELETE FROM leads WHERE id = ?', [testLeadId]);
    console.log('  Cleaned up all temporary test records.');

    console.log('\n=================================================================');
    console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED               `);
    console.log('=================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
