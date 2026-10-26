import { pool } from '../db.js';
import { hashPassword } from '../utils/security.js';

export interface DemoAccountDef {
  username: string;
  defaultPassword: string;
  role: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  employeeId?: string;
  customerId?: string;
}

export const DEMO_ACCOUNTS: DemoAccountDef[] = [
  {
    username: 'superadmin',
    defaultPassword: 'SuperAdmin@123',
    role: 'Super Admin',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@abenergy.in',
    phone: '+91 98201-11223',
    department: 'Executive Management',
    employeeId: 'EMP-01',
  },
  {
    username: 'salesmanager',
    defaultPassword: 'SalesManager@123',
    role: 'Sales Manager',
    name: 'Ananya Deshmukh',
    email: 'ananya.d@abenergy.in',
    phone: '+91 98450-44556',
    department: 'Solar Residential Sales',
    employeeId: 'EMP-02',
  },
  {
    username: 'salesexecutive',
    defaultPassword: 'SalesExec@123',
    role: 'Sales Executive',
    name: 'Vikram Mehta (Sales)',
    email: 'vikram.mehta@abenergy.in',
    phone: '+91 98112-77880',
    department: 'Direct Solar Sales',
    employeeId: 'EMP-06',
  },
  {
    username: 'surveyengineer',
    defaultPassword: 'SurveyEng@123',
    role: 'Survey Engineer',
    name: 'Vikram Mehta',
    email: 'vikram.m@abenergy.in',
    phone: '+91 98112-77889',
    department: 'Technical & Site Engineering',
    employeeId: 'EMP-03',
  },
  {
    username: 'projectmanager',
    defaultPassword: 'ProjectMgr@123',
    role: 'Project Manager',
    name: 'Karthik Raja',
    email: 'karthik.r@abenergy.in',
    phone: '+91 97909-33221',
    department: 'Solar EPC Operations',
    employeeId: 'EMP-04',
  },
  {
    username: 'installation',
    defaultPassword: 'Install@123',
    role: 'Installation Team',
    name: 'Muthu Vel',
    email: 'muthu.epc@abenergy.in',
    phone: '+91 97401-88990',
    department: 'Field EPC & Commissioning',
    employeeId: 'EMP-07',
  },
  {
    username: 'accounts',
    defaultPassword: 'Accounts@123',
    role: 'Accounts',
    name: 'Priya Raman',
    email: 'priya.accounts@abenergy.in',
    phone: '+91 98802-55667',
    department: 'Finance & Taxation',
    employeeId: 'EMP-08',
  },
  {
    username: 'service',
    defaultPassword: 'Service@123',
    role: 'Service Team',
    name: 'Suresh Patil',
    email: 'suresh.p@abenergy.in',
    phone: '+91 98441-55443',
    department: 'O&M & Client Service',
    employeeId: 'EMP-05',
  },
  {
    username: 'customer',
    defaultPassword: 'Customer@123',
    role: 'Customer',
    name: 'Nandini Dairy Cooperative (Mysuru)',
    email: 'procurement@nandinidairy.coop',
    phone: '+91 94498-33221',
    department: 'Client Portal',
    customerId: 'CUST-2026-001',
  },
];

export async function runAuthMigration(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Create user_accounts table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_accounts (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(150) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        password_salt VARCHAR(64) NOT NULL,
        role VARCHAR(50) NOT NULL,
        employee_id VARCHAR(50) NULL,
        customer_id VARCHAR(50) NULL,
        name VARCHAR(150) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Add username and password columns to employees if not already present
    await pool.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS username VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS password_salt VARCHAR(64) NULL;
    `);

    // 3. Add username and password columns to customers if not already present
    await pool.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS username VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS password_salt VARCHAR(64) NULL;
    `);

    // 4. Idempotently provision the 9 demo accounts
    for (const acc of DEMO_ACCOUNTS) {
      // Check if user account already exists in user_accounts
      const [existingUser]: any = await pool.query(
        'SELECT id, username FROM user_accounts WHERE username = ? OR email = ? LIMIT 1',
        [acc.username, acc.email]
      );

      const { hash, salt } = hashPassword(acc.defaultPassword);

      if (!existingUser || existingUser.length === 0) {
        const userId = acc.employeeId || acc.customerId || `USR-${Date.now().toString().slice(-6)}`;
        await pool.query(
          `INSERT INTO user_accounts (id, username, email, password_hash, password_salt, role, employee_id, customer_id, name, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [userId, acc.username, acc.email, hash, salt, acc.role, acc.employeeId || null, acc.customerId || null, acc.name]
        );
      }

      // If it's an employee account, ensure employee row exists in employees table
      if (acc.employeeId) {
        const [empRow]: any = await pool.query(
          'SELECT id FROM employees WHERE id = ? OR email = ? LIMIT 1',
          [acc.employeeId, acc.email]
        );

        if (!empRow || empRow.length === 0) {
          await pool.query(
            `INSERT INTO employees (id, name, email, phone, role, department, username, password_hash, password_salt, active_leads_count, completed_projects_count, location)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'Bengaluru HQ')`,
            [acc.employeeId, acc.name, acc.email, acc.phone, acc.role, acc.department, acc.username, hash, salt]
          );
        } else {
          // Safely attach username and hash if missing
          await pool.query(
            `UPDATE employees 
             SET username = COALESCE(username, ?),
                 password_hash = COALESCE(password_hash, ?),
                 password_salt = COALESCE(password_salt, ?)
             WHERE id = ?`,
            [acc.username, hash, salt, empRow[0].id]
          );
        }
      }

      // If it's a customer account, ensure customer record has credentials linked
      if (acc.customerId) {
        await pool.query(
          `UPDATE customers 
           SET username = COALESCE(username, ?),
               password_hash = COALESCE(password_hash, ?),
               password_salt = COALESCE(password_salt, ?)
           WHERE id = ?`,
          [acc.username, hash, salt, acc.customerId]
        );
      }
    }

    return { success: true, message: 'Authentication tables and demo accounts provisioned successfully.' };
  } catch (error: any) {
    console.error('Migration error:', error);
    return { success: false, message: error.message };
  }
}

// Allow direct CLI execution: node server/migrations/init-auth.ts
if (process.argv[1]?.includes('init-auth')) {
  runAuthMigration()
    .then(res => {
      console.log('Result:', res);
      process.exit(res.success ? 0 : 1);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
