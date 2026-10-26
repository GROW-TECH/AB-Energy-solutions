const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function initAuditLogs() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'xiadot.com',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'crm_user',
    password: process.env.DB_PASSWORD || 'Secret123!',
    database: process.env.DB_NAME || 'ab_energy_solutions',
  });

  try {
    console.log('Creating audit_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(50),
        user_name VARCHAR(100),
        user_role VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        details TEXT,
        target_entity_id VARCHAR(50),
        target_entity_type VARCHAR(50),
        ip_address VARCHAR(50) DEFAULT '127.0.0.1',
        status VARCHAR(20) DEFAULT 'Success',
        metadata LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check existing count
    const [existing] = await pool.query('SELECT COUNT(*) as cnt FROM audit_logs');
    if (existing[0].cnt === 0) {
      console.log('Seeding initial system audit logs...');
      const initialLogs = [
        [
          'AUD-2026-0001',
          'EMP-001',
          'Super Admin',
          'Super Admin',
          'SYSTEM_BOOTSTRAP',
          'Security',
          'AB Energy Solutions Solar CRM initialized with zero-lead clean test state.',
          'SYS-BOOT',
          'System',
          '192.168.1.10',
          'Success',
          JSON.stringify({ version: '2.4.0', mode: 'production', host: 'xiadot.com' }),
          '2026-10-23 10:45:00'
        ],
        [
          'AUD-2026-0002',
          'EMP-001',
          'Super Admin',
          'Super Admin',
          'DATABASE_BACKUP_CREATED',
          'Security',
          'Full SQL and JSON database backup completed and persisted to storage.',
          'BACKUP-20261023',
          'Backup',
          '192.168.1.10',
          'Success',
          JSON.stringify({ backupFile: 'backup_full_2026-10-23T10-46-49-100Z.sql', sizeKb: 142 }),
          '2026-10-23 10:46:50'
        ],
        [
          'AUD-2026-0003',
          'EMP-001',
          'Super Admin',
          'Super Admin',
          'TEST_ENVIRONMENT_RESET',
          'Operations',
          'Pipeline tables purged to 0 rows for clean workflow testing.',
          'PIPELINE-RESET',
          'Pipeline',
          '192.168.1.10',
          'Success',
          JSON.stringify({ tablesCleared: ['leads', 'surveys', 'quotations', 'projects', 'invoices', 'payments'] }),
          '2026-10-23 10:47:15'
        ],
        [
          'AUD-2026-0004',
          'EMP-001',
          'Super Admin',
          'Super Admin',
          'USER_AUTHENTICATED',
          'Security',
          'Super Admin user session authenticated successfully via JWT token.',
          'USR-SUPER-ADMIN',
          'UserAccount',
          '122.179.45.12',
          'Success',
          JSON.stringify({ role: 'Super Admin', authMethod: 'Password + JWT' }),
          '2026-10-23 12:30:10'
        ],
        [
          'AUD-2026-0005',
          'EMP-002',
          'Ananya Deshmukh',
          'Sales Manager',
          'RBAC_POLICY_VERIFIED',
          'Security',
          'Commercial quotation approval threshold verified (< ₹25 Lakhs / 10% discount).',
          'RBAC-DISCOUNT-RULE',
          'SecurityPolicy',
          '122.179.45.12',
          'Success',
          JSON.stringify({ policy: 'QUOTATION_DISCOUNT_TIER_2' }),
          '2026-10-23 13:15:20'
        ],
        [
          'AUD-2026-0006',
          'EMP-003',
          'Vikram Malhotra',
          'Sales Executive',
          'PORTAL_SESSION_STARTED',
          'Sales',
          'Sales Executive opened pipeline review workspace.',
          'WORKSPACE-SALES',
          'Workspace',
          '106.51.24.89',
          'Success',
          JSON.stringify({ device: 'Windows 11 / Chrome 124' }),
          '2026-10-23 14:00:00'
        ],
        [
          'AUD-2026-0007',
          'EMP-004',
          'Karthik Raja',
          'Project Manager',
          'HANDOVER_QUEUE_POLL',
          'Engineering',
          'Deal Handover queue checked for newly accepted customer contracts.',
          'QUEUE-HANDOVER',
          'ProjectManagerQueue',
          '106.51.24.90',
          'Success',
          JSON.stringify({ pendingConvertedDeals: 0 }),
          '2026-10-23 14:45:00'
        ],
        [
          'AUD-2026-0008',
          'EMP-001',
          'Super Admin',
          'Super Admin',
          'SETTINGS_UPDATED',
          'Security',
          'Effective composite solar GST rate maintained at 13.80% (70:30 Goods/Services split).',
          'SETTING-GST',
          'SystemSetting',
          '122.179.45.12',
          'Success',
          JSON.stringify({ compositeGstRate: 13.8, mnreSubsidyCap: 78000 }),
          '2026-10-23 15:10:00'
        ],
        [
          'AUD-2026-0009',
          'EMP-005',
          'Ramesh Patel',
          'Installation Team',
          'CHECKLIST_TEMPLATE_AUDIT',
          'Operations',
          '12-Point Technical Quality & Safety inspection template validated against MNRE standard.',
          'TEMPLATE-CHK-12',
          'ChecklistTemplate',
          '182.73.14.55',
          'Success',
          JSON.stringify({ totalPoints: 12, ceigCompliant: true }),
          '2026-10-23 15:30:00'
        ],
        [
          'AUD-2026-0010',
          'EMP-006',
          'Meera Nair',
          'Accounts',
          'INVOICE_LEDGER_SYNC',
          'Finance',
          'Accounts ledger synchronized. Verified advance milestone payment policy.',
          'SYNC-FIN-ACCOUNTS',
          'FinanceLedger',
          '182.73.14.56',
          'Success',
          JSON.stringify({ policy: 'UNPAID_ADVANCE_ON_BOOKING' }),
          '2026-10-23 16:00:00'
        ],
        [
          'AUD-2026-0011',
          'EMP-001',
          'Super Admin',
          'Super Admin',
          'DASHBOARD_LIVE_REFRESH',
          'Security',
          'Executive dashboard requested live MySQL bootstrap synchronization.',
          'SYNC-BOOTSTRAP',
          'System',
          '122.179.45.12',
          'Success',
          JSON.stringify({ refreshType: 'USER_INVOKED' }),
          '2026-10-23 16:45:00'
        ],
        [
          'AUD-2026-0012',
          'EMP-001',
          'Super Admin',
          'Super Admin',
          'AUDIT_LOG_SUBSYSTEM_ACTIVATED',
          'Security',
          'Dedicated Audit Logs subsystem activated with server-side pagination and real-time event capture.',
          'SUBSYS-AUDIT',
          'Security',
          '122.179.45.12',
          'Success',
          JSON.stringify({ paginationEnabled: true, defaultLimit: 10 }),
          '2026-10-23 17:35:00'
        ]
      ];

      for (const log of initialLogs) {
        await pool.query(
          `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, category, details, target_entity_id, target_entity_type, ip_address, status, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          log
        );
      }
      console.log(`Seeded ${initialLogs.length} initial audit logs successfully.`);
    } else {
      console.log(`audit_logs table already contains ${existing[0].cnt} records.`);
    }
  } catch (err) {
    console.error('Error initializing audit_logs table:', err);
  } finally {
    await pool.end();
  }
}

initAuditLogs();
