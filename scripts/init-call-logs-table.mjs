import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function initCallLogsTable() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ab_energy_solutions',
  });

  console.log('Connecting to MySQL and ensuring call_logs table exists...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS call_logs (
      id VARCHAR(50) PRIMARY KEY,
      employee_id VARCHAR(50),
      employee_name VARCHAR(150),
      employee_phone VARCHAR(50),
      customer_phone VARCHAR(50) NOT NULL,
      customer_name VARCHAR(150),
      lead_id VARCHAR(50),
      call_type ENUM('INCOMING', 'OUTGOING', 'MISSED', 'REJECTED') NOT NULL,
      call_status ENUM('ANSWERED', 'MISSED', 'NO_ANSWER', 'BUSY', 'FAILED') DEFAULT 'ANSWERED',
      duration_seconds INT DEFAULT 0,
      call_time DATETIME NOT NULL,
      sim_slot INT DEFAULT 1,
      disposition VARCHAR(100),
      notes TEXT,
      is_resolved BOOLEAN DEFAULT FALSE,
      resolved_at DATETIME,
      resolved_by VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_call_log (employee_phone, customer_phone, call_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('call_logs table verified / created successfully!');

  // Check if we should insert a few realistic seed records for immediate testing
  const [existing] = await pool.query('SELECT COUNT(*) as cnt FROM call_logs');
  if (existing[0].cnt === 0) {
    console.log('Inserting initial mock call logs for demonstration...');
    await pool.query(`
      INSERT INTO call_logs (id, employee_id, employee_name, employee_phone, customer_phone, customer_name, lead_id, call_type, call_status, duration_seconds, call_time, disposition, notes, is_resolved)
      VALUES 
        ('CALL-2026-001', 'EMP-001', 'A. Boopathi (MD)', '+919655247872', '+919845012345', 'Vikrant Deshpande', 'LEAD-2026-001', 'OUTGOING', 'ANSWERED', 245, NOW() - INTERVAL 25 MINUTE, 'Interested in 20kW', 'Customer confirmed site visit for tomorrow 11 AM', TRUE),
        ('CALL-2026-002', 'EMP-002', 'Karthik Raja (Sales)', '+919876543210', '+919443322110', 'Ramesh Kumar (Salem)', 'LEAD-2026-002', 'MISSED', 'MISSED', 0, NOW() - INTERVAL 45 MINUTE, NULL, 'Urgent callback requested from Facebook inquiry', FALSE),
        ('CALL-2026-003', 'EMP-002', 'Karthik Raja (Sales)', '+919876543210', '+919788112233', 'Anand Textiles', 'LEAD-2026-003', 'OUTGOING', 'ANSWERED', 512, NOW() - INTERVAL 2 HOUR, 'High Intent', 'Discussed 50kW commercial rooftop system with subsidy', TRUE),
        ('CALL-2026-004', 'EMP-003', 'Priya Sundaram (Telecaller)', '+919123456789', '+919944556677', 'Dr. Meenakshi', 'LEAD-2026-004', 'INCOMING', 'ANSWERED', 180, NOW() - INTERVAL 3 HOUR, 'Follow-up Needed', 'Inquired about PM Surya Ghar subsidy application status', TRUE),
        ('CALL-2026-005', 'EMP-003', 'Priya Sundaram (Telecaller)', '+919123456789', '+919894011223', 'Suresh Babu', NULL, 'MISSED', 'MISSED', 0, NOW() - INTERVAL 10 MINUTE, NULL, 'New inbound caller - not yet in CRM', FALSE);
    `);
    console.log('Sample call records inserted.');
  }

  await pool.end();
  console.log('Done!');
}

initCallLogsTable().catch(err => {
  console.error('Error creating call_logs table:', err);
  process.exit(1);
});
