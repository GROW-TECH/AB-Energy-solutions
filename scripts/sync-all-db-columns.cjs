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

  const safeAlter = async (query) => {
    try {
      await db.query(query);
      console.log('Executed:', query.slice(0, 75));
    } catch (e) {
      console.log('Note (skipped):', e.message);
    }
  };

  // 1. notifications table: support both recipient_role and target_role
  await safeAlter("ALTER TABLE notifications ADD COLUMN recipient_role VARCHAR(100) NULL AFTER title");
  await safeAlter("UPDATE notifications SET recipient_role = target_role WHERE recipient_role IS NULL AND target_role IS NOT NULL");

  // 2. customer_documents: add alias columns so id_number_masked / is_verified / created_at never fail
  await safeAlter("ALTER TABLE customer_documents ADD COLUMN id_number_masked VARCHAR(100) NULL AFTER id_number");
  await safeAlter("ALTER TABLE customer_documents ADD COLUMN is_verified TINYINT(1) DEFAULT 1 AFTER id_number_masked");
  await safeAlter("ALTER TABLE customer_documents ADD COLUMN created_at VARCHAR(50) NULL");

  // 3. installation_attendance: add alias columns for site_lead_name, present_team_members, latitude, longitude
  await safeAlter("ALTER TABLE installation_attendance ADD COLUMN site_lead_name VARCHAR(150) NULL AFTER team_lead_name");
  await safeAlter("ALTER TABLE installation_attendance ADD COLUMN present_team_members LONGTEXT NULL AFTER technicians_present");
  await safeAlter("ALTER TABLE installation_attendance ADD COLUMN latitude DECIMAL(10, 6) NULL AFTER gps_lat");
  await safeAlter("ALTER TABLE installation_attendance ADD COLUMN longitude DECIMAL(10, 6) NULL AFTER gps_lng");

  console.log('DB alignment complete!');
  await db.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
