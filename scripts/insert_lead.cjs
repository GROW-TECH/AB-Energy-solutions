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

  // 1. Delete any old BOM for this test survey
  await conn.query(`DELETE FROM project_boms WHERE survey_id = 'SRV-2026-004'`);

  // 2. Insert fresh new lead
  await conn.query(`
    INSERT INTO leads (
      id, name, email, phone, city, state, address, pincode, 
      source, status, priority, recommended_priority, assigned_to_id, assigned_to_name, 
      monthly_bill, sanction_load, roof_area_sqft, roof_type, buying_intent, 
      recommended_kw, estimated_budget, notes, customer_type, system_type, created_at, updated_at
    ) VALUES (
      'LEAD-2026-004', 'Vikrant Deshpande (Deshpande Precision Engineering)', 'vikrant.d@deshpande-engg.in', '+91 97412-55890',
      'Bengaluru', 'Karnataka', 'Plot 18, Electronic City Phase 1, Hosur Road', '560100',
      'Website / Inbound', 'New', 'High', 'High', 'EMP-02', 'Ananya Deshmukh',
      24500, 25, 2200, 'RCC Flat Terrace', 'Immediate (Within 15 days)',
      20.00, 920000, 'Commercial facility requiring 20kWp solar to offset daytime CNC machinery load. Ready for immediate technical survey.',
      'Commercial', 'On-Grid', NOW(), NOW()
    ) ON DUPLICATE KEY UPDATE 
      status='New', 
      name='Vikrant Deshpande (Deshpande Precision Engineering)',
      phone='+91 97412-55890',
      recommended_kw=20.00;
  `);

  // 3. Insert fresh scheduled survey
  await conn.query(`
    INSERT INTO site_surveys (
      id, lead_id, lead_name, customer_name, phone, address, scheduled_date,
      engineer_id, engineer_name, status, roof_area_sqft, shadow_free_area_sqft, roof_type,
      azimuth_angle, tilt_angle, existing_sanction_load_kw, grid_phase, distance_to_lt_panel_meters,
      recommended_kw, panel_quantity, estimated_generation_units_per_year, estimated_annual_savings,
      estimated_cost, payback_years, co2_reduction_tons_per_year, notes
    ) VALUES (
      'SRV-2026-004', 'LEAD-2026-004', 'Vikrant Deshpande (Deshpande Precision Engineering)', 'Vikrant Deshpande',
      '+91 97412-55890', 'Plot 18, Electronic City Phase 1, Hosur Road, Bengaluru', CURDATE(),
      'EMP-03', 'Vikram Mehta', 'Scheduled', 2200, 2000, 'RCC Flat Terrace',
      180, 15, 25, 'Three Phase', 18,
      20.00, 36, 29200, 233600,
      920000, 3.9, 23.5, 'RCC flat rooftop with direct parapet access. LT panel located in ground floor electrical room.'
    ) ON DUPLICATE KEY UPDATE 
      status='Scheduled', 
      customer_name='Vikrant Deshpande',
      phone='+91 97412-55890',
      recommended_kw=20.00;
  `);

  console.log('SUCCESS: Inserted LEAD-2026-004 and SRV-2026-004!');
  await conn.end();
}

run().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
