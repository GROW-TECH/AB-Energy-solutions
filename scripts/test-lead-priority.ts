const BASE_URL = 'http://localhost:3000';

async function runLeadPriorityTests() {
  console.log('--- Testing Lead Priority Recommendation & Lead Creation ---');

  // 1. Authenticate as Sales Executive
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'salesexecutive', password: 'SalesExec@123' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('✅ Sales Executive logged in, token acquired');

  // 2. Test Recommendation for Urgent (C&I scale)
  const recUrgent = await fetch(`${BASE_URL}/api/leads/recommend-priority`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      monthlyBill: 35000,
      sanctionLoad: 30,
      roofAreaSqFt: 3000,
      buyingIntent: 'Immediate (< 15 days)',
    }),
  });
  const dataUrgent = await recUrgent.json();
  console.log(
    dataUrgent.data.recommendedPriority === 'Urgent' ? '✅ PASS' : '❌ FAIL',
    `Urgent Recommendation for 35k bill: got ${dataUrgent.data.recommendedPriority}`
  );

  // 3. Test Recommendation for High (₹14,500 Sivaram commercial villa)
  const recHigh = await fetch(`${BASE_URL}/api/leads/recommend-priority`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      monthlyBill: 14500,
      sanctionLoad: 15,
      roofAreaSqFt: 1500,
      buyingIntent: 'Immediate (< 15 days)',
    }),
  });
  const dataHigh = await recHigh.json();
  console.log(
    dataHigh.data.recommendedPriority === 'High' ? '✅ PASS' : '❌ FAIL',
    `High Recommendation for 14.5k bill: got ${dataHigh.data.recommendedPriority}`
  );

  // 4. Test Recommendation for Medium (Standard residential PM Surya Ghar)
  const recMed = await fetch(`${BASE_URL}/api/leads/recommend-priority`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      monthlyBill: 4500,
      sanctionLoad: 4,
      roofAreaSqFt: 450,
      buyingIntent: '1-2 months',
    }),
  });
  const dataMed = await recMed.json();
  console.log(
    dataMed.data.recommendedPriority === 'Medium' ? '✅ PASS' : '❌ FAIL',
    `Medium Recommendation for 4.5k bill: got ${dataMed.data.recommendedPriority}`
  );

  // 5. Test Recommendation for Low (Future / Under-construction)
  const recLow = await fetch(`${BASE_URL}/api/leads/recommend-priority`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      monthlyBill: 1800,
      sanctionLoad: 2,
      buyingIntent: 'Future (> 3 months)',
      notes: 'Building under construction, inquiry only',
    }),
  });
  const dataLow = await recLow.json();
  console.log(
    dataLow.data.recommendedPriority === 'Low' ? '✅ PASS' : '❌ FAIL',
    `Low Recommendation for under-construction: got ${dataLow.data.recommendedPriority}`
  );

  // 6. Test Unauthenticated access to /recommend-priority returns 401
  const recUnauth = await fetch(`${BASE_URL}/api/leads/recommend-priority`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthlyBill: 20000 }),
  });
  console.log(
    recUnauth.status === 401 ? '✅ PASS' : '❌ FAIL',
    `Unauthenticated /recommend-priority rejected with 401 (status: ${recUnauth.status})`
  );

  // 7. Test Lead Insertion with recommended_priority, override reason, and buying intent
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const createLeadRes = await fetch(`${BASE_URL}/api/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: `LD-TEST-${Date.now()}`,
      name: 'Sivaram Krishnan Test',
      phone: testPhone,
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      address: '74, Cross Cut Road, Gandhipuram',
      monthlyBill: 14500,
      sanctionLoad: 15,
      roofAreaSqFt: 1500,
      roofType: 'RCC Flat',
      source: 'Website',
      status: 'New',
      priority: 'Urgent',
      recommendedPriority: 'High',
      priorityOverrideReason: 'Customer requested immediate emergency quote today',
      buyingIntent: 'Immediate (< 15 days)',
      assignedToId: 'EMP-06',
      assignedToName: 'Vikram Mehta (Sales)',
      recommendedKw: 10,
      estimatedBudget: 550000,
      notes: 'Requires 10kW with Bifacial DCR panels',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  });
  const createLeadData = await createLeadRes.json();
  console.log(
    createLeadRes.status === 200 && createLeadData.success ? '✅ PASS' : '❌ FAIL',
    `Create Lead with recommendation & override metadata (status: ${createLeadRes.status})`
  );

  console.log('\n--- All Lead Priority & Workflow Tests Completed ---');
}

runLeadPriorityTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
