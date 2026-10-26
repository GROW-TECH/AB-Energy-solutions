import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, category: string, name: string, details?: string) {
  results.push({
    category,
    name,
    passed: !!condition,
    details: condition ? undefined : details,
  });
  const symbol = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} [${category}] ${name}${details && !condition ? ` - ${details}` : ''}`);
}

async function runSecuritySuite() {
  console.log('===============================================================');
  console.log('  AB ENERGY SOLUTIONS CRM — SPRINT 1 SECURITY TEST SUITE       ');
  console.log('===============================================================');

  const demoAccounts = [
    { role: 'Super Admin', user: 'superadmin', pass: 'SuperAdmin@123', expectedRole: 'Super Admin' },
    { role: 'Sales Manager', user: 'salesmanager', pass: 'SalesManager@123', expectedRole: 'Sales Manager' },
    { role: 'Sales Executive', user: 'salesexecutive', pass: 'SalesExec@123', expectedRole: 'Sales Executive' },
    { role: 'Survey Engineer', user: 'surveyengineer', pass: 'SurveyEng@123', expectedRole: 'Survey Engineer' },
    { role: 'Project Manager', user: 'projectmanager', pass: 'ProjectMgr@123', expectedRole: 'Project Manager' },
    { role: 'Installation Team', user: 'installation', pass: 'Install@123', expectedRole: 'Installation Team' },
    { role: 'Accounts', user: 'accounts', pass: 'Accounts@123', expectedRole: 'Accounts' },
    { role: 'Service Team', user: 'service', pass: 'Service@123', expectedRole: 'Service Team' },
    { role: 'Customer', user: 'customer', pass: 'Customer@123', expectedRole: 'Customer' },
  ];

  const tokens: Record<string, string> = {};

  // 1. AUTHENTICATION TESTS
  console.log('\n--- 1. AUTHENTICATION TESTS ---');

  for (const acc of demoAccounts) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: acc.user, password: acc.pass }),
      });
      const data = await res.json();
      const loginSuccess = res.status === 200 && data.success === true && !!data.token && data.user.role === acc.expectedRole;
      assert(
        loginSuccess,
        'Auth',
        `Demo Account Login: ${acc.role} (${acc.user})`,
        `status: ${res.status}, success: ${data.success}, role: ${data?.user?.role}`
      );
      if (loginSuccess) {
        tokens[acc.role] = data.token;
      }
    } catch (err: any) {
      assert(false, 'Auth', `Demo Account Login: ${acc.role}`, err.message);
    }
  }

  // Invalid Password
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'superadmin', password: 'WrongPassword999!' }),
    });
    assert(res.status === 401, 'Auth', 'Invalid password returns 401', `status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Auth', 'Invalid password returns 401', err.message);
  }

  // Non-existent Username
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'non_existent_user_xyz', password: 'AnyPassword@123' }),
    });
    assert(res.status === 401, 'Auth', 'Non-existent username returns 401', `status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Auth', 'Non-existent username returns 401', err.message);
  }

  // Missing Credentials
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '' }),
    });
    assert(res.status === 400, 'Auth', 'Missing credentials returns 400', `status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Auth', 'Missing credentials returns 400', err.message);
  }

  // Session verification: /api/auth/me with valid token
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokens['Super Admin']}` },
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.success && data.user.role === 'Super Admin',
      'Auth',
      'GET /api/auth/me validates valid JWT token',
      `status: ${res.status}, role: ${data?.user?.role}`
    );
  } catch (err: any) {
    assert(false, 'Auth', 'GET /api/auth/me validates valid JWT token', err.message);
  }

  // Session verification: /api/auth/me with invalid/forged token
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer forged.invalid.token' },
    });
    assert(res.status === 401, 'Auth', 'GET /api/auth/me rejects forged token with 401', `status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Auth', 'GET /api/auth/me rejects forged token with 401', err.message);
  }

  // Logout endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['Super Admin']}` },
    });
    assert(res.status === 200, 'Auth', 'POST /api/auth/logout returns 200', `status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Auth', 'POST /api/auth/logout returns 200', err.message);
  }

  // 2. AUTHORIZATION & RBAC TESTS
  console.log('\n--- 2. AUTHORIZATION & RBAC TESTS ---');

  // Unauthenticated /api/bootstrap blocked
  try {
    const res = await fetch(`${BASE_URL}/api/bootstrap`);
    assert(res.status === 401, 'RBAC', 'Unauthenticated GET /api/bootstrap returns 401', `status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'RBAC', 'Unauthenticated GET /api/bootstrap returns 401', err.message);
  }

  // Sales Executive cannot verify/create payment
  try {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens['Sales Executive']}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentNumber: 'PAY-TEST-001',
        amount: 50000,
        customerId: 'CUST-2026-001',
      }),
    });
    assert(
      res.status === 403,
      'RBAC',
      'Sales Executive cannot record payments (POST /api/payments returns 403)',
      `status: ${res.status}`
    );
  } catch (err: any) {
    assert(false, 'RBAC', 'Sales Executive cannot record payments', err.message);
  }

  // Accounts can record payments
  try {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens['Accounts']}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentNumber: `PAY-TEST-${Date.now()}`,
        invoiceId: 'INV-2026-001',
        customerId: 'CUST-2026-001',
        customerName: 'Nandini Dairy Cooperative',
        amount: 100,
        paymentMode: 'NEFT',
        transactionRef: 'TEST-REF-001',
        status: 'Success',
      }),
    });
    assert(
      res.status === 201 || res.status === 200,
      'RBAC',
      'Accounts role CAN record payments (POST /api/payments returns 200/201)',
      `status: ${res.status}`
    );
  } catch (err: any) {
    assert(false, 'RBAC', 'Accounts role CAN record payments', err.message);
  }

  // Installation Team cannot create invoices
  try {
    const res = await fetch(`${BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens['Installation Team']}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceNumber: 'INV-TEST-001',
        amount: 200000,
      }),
    });
    assert(
      res.status === 403,
      'RBAC',
      'Installation Team cannot create invoices (POST /api/invoices returns 403)',
      `status: ${res.status}`
    );
  } catch (err: any) {
    assert(false, 'RBAC', 'Installation Team cannot create invoices', err.message);
  }

  // Survey Engineer cannot access/create financial invoices
  try {
    const res = await fetch(`${BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens['Survey Engineer']}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceNumber: 'INV-TEST-002',
        amount: 300000,
      }),
    });
    assert(
      res.status === 403,
      'RBAC',
      'Survey Engineer cannot create invoices (POST /api/invoices returns 403)',
      `status: ${res.status}`
    );
  } catch (err: any) {
    assert(false, 'RBAC', 'Survey Engineer cannot create invoices', err.message);
  }

  // Sales Executive cannot delete leads (requires Sales Manager or Super Admin)
  try {
    const res = await fetch(`${BASE_URL}/api/leads/LEAD-TEST-001`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokens['Sales Executive']}`,
      },
    });
    assert(
      res.status === 403,
      'RBAC',
      'Sales Executive cannot delete leads (DELETE /api/leads/:id returns 403)',
      `status: ${res.status}`
    );
  } catch (err: any) {
    assert(false, 'RBAC', 'Sales Executive cannot delete leads', err.message);
  }

  // 3. CUSTOMER DATA ISOLATION TESTS
  console.log('\n--- 3. CUSTOMER DATA ISOLATION TESTS ---');

  // Customer calling GET /api/bootstrap receives ONLY their own data
  try {
    const res = await fetch(`${BASE_URL}/api/bootstrap`, {
      headers: { Authorization: `Bearer ${tokens['Customer']}` },
    });
    const data = await res.json();
    const d = data.data;

    const noLeadsExposed = !d.leads || d.leads.length === 0;
    const onlyOwnCustomer = d.customers && d.customers.length === 1 && d.customers[0].id === 'CUST-2026-001';
    const noOtherCustomerProjects = !d.projects || d.projects.every((p: any) => p.customerId === 'CUST-2026-001');
    const noOtherCustomerInvoices = !d.invoices || d.invoices.every((i: any) => i.customerId === 'CUST-2026-001');
    const noEmployeesExposed = !d.employees || d.employees.length === 0;

    assert(noLeadsExposed, 'Data Isolation', 'Customer bootstrap hides internal sales leads');
    assert(onlyOwnCustomer, 'Data Isolation', 'Customer bootstrap returns strictly own customer record (CUST-2026-001)');
    assert(noOtherCustomerProjects, 'Data Isolation', 'Customer bootstrap projects filtered by customerId');
    assert(noOtherCustomerInvoices, 'Data Isolation', 'Customer bootstrap invoices filtered by customerId');
    assert(noEmployeesExposed, 'Data Isolation', 'Customer bootstrap excludes internal employee staff list');
  } catch (err: any) {
    assert(false, 'Data Isolation', 'Customer bootstrap isolation check', err.message);
  }

  // Customer token attempting to access /api/leads receives 403
  try {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      headers: { Authorization: `Bearer ${tokens['Customer']}` },
    });
    assert(res.status === 403, 'Data Isolation', 'Customer cannot access GET /api/leads (returns 403)', `status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Data Isolation', 'Customer cannot access GET /api/leads', err.message);
  }

  // Customer token attempting to access /api/invoices receives 403
  try {
    const res = await fetch(`${BASE_URL}/api/invoices`, {
      headers: { Authorization: `Bearer ${tokens['Customer']}` },
    });
    assert(res.status === 403, 'Data Isolation', 'Customer cannot access internal GET /api/invoices (returns 403)', `status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Data Isolation', 'Customer cannot access internal GET /api/invoices', err.message);
  }

  // 4. SECRET LEAKAGE PREVENTION
  console.log('\n--- 4. SECRET LEAKAGE PREVENTION ---');

  // Check that /api/bootstrap never includes password_hash or password_salt
  try {
    const res = await fetch(`${BASE_URL}/api/bootstrap`, {
      headers: { Authorization: `Bearer ${tokens['Super Admin']}` },
    });
    const data = await res.json();
    const rawJson = JSON.stringify(data);
    const noPasswordHash = !rawJson.includes('password_hash') && !rawJson.includes('password_salt');
    assert(noPasswordHash, 'Security', 'GET /api/bootstrap omits password hashes and salts');
  } catch (err: any) {
    assert(false, 'Security', 'GET /api/bootstrap secret omission', err.message);
  }

  // Check that /api/auth/login never returns password_hash
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'superadmin', password: 'SuperAdmin@123' }),
    });
    const data = await res.json();
    const noHashInLogin = !('password_hash' in data.user) && !('password_salt' in data.user);
    assert(noHashInLogin, 'Security', 'POST /api/auth/login omits password hashes and salts from response');
  } catch (err: any) {
    assert(false, 'Security', 'POST /api/auth/login secret omission', err.message);
  }

  // SUMMARY REPORT
  console.log('\n===============================================================');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`  RESULTS: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('===============================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runSecuritySuite().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
