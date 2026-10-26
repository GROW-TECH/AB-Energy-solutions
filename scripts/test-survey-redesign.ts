import { pool } from '../server/db.js';

const BASE_URL = 'http://localhost:3000/api';

async function loginUser(username: string, password: string):Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!data.success || !data.token) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(data)}`);
  }
  return data.token;
}

async function runTests() {
  console.log('====================================================');
  console.log('AB Energy Solutions — Survey Redesign Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Authenticate roles
  const surveyToken = await loginUser('surveyengineer', 'SurveyEng@123');
  const pmToken = await loginUser('projectmanager', 'ProjectMgr@123');
  const custToken = await loginUser('customer', 'Customer@123');
  assert(Boolean(surveyToken && pmToken && custToken), 'Login successful for Survey Engineer, Project Manager, and Customer');

  // 2. Test Customer Data Isolation: Sivaram, Siva P, Uma
  const resSivaram = await fetch(`${BASE_URL}/surveys/SRV-2026-013`, {
    headers: { Authorization: `Bearer ${surveyToken}` }
  });
  const dataSivaram = await resSivaram.json();
  assert(dataSivaram.success && dataSivaram.survey.customerName === 'Sivaram Krishnan', 'SRV-2026-013 belongs to Sivaram Krishnan');

  const resSivaP = await fetch(`${BASE_URL}/surveys/SRV-2026-010`, {
    headers: { Authorization: `Bearer ${surveyToken}` }
  });
  const dataSivaP = await resSivaP.json();
  assert(dataSivaP.success && dataSivaP.survey.customerName === 'Siva P', 'SRV-2026-010 belongs to Siva P');

  const resUma = await fetch(`${BASE_URL}/surveys/SRV-2026-011`, {
    headers: { Authorization: `Bearer ${surveyToken}` }
  });
  const dataUma = await resUma.json();
  assert(dataUma.success && dataUma.survey.customerName === 'Uma', 'SRV-2026-011 belongs to Uma');

  // 3. Test That Editing Sivaram Does NOT Alter Siva P or Uma
  const originalSivaPRoof = dataSivaP.survey.roofAreaSqFt;
  const originalUmaRoof = dataUma.survey.roofAreaSqFt;

  const testRoofArea = 1550;
  const testShadowFree = 1320;
  const resUpdateSivaram = await fetch(`${BASE_URL}/surveys/SRV-2026-013/draft`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${surveyToken}` 
    },
    body: JSON.stringify({
      roofAreaSqFt: testRoofArea,
      shadowFreeAreaSqFt: testShadowFree,
      roofDimensionsShape: 'L-Shaped Custom',
      measurementStatus: 'Engineer Entered',
      mainMeterStatus: 'Pass',
      mainMeterNotes: 'Bidirectional meter compatible with BESCOM net-metering',
      dbCondition: 'Pass',
      earthingStatus: 'Pass',
      earthingResistanceOhms: 3.4,
      waterproofingStatus: 'Good',
      mountingStructureType: 'Standard Elevated',
      feasibilityVerdict: 'Feasible',
      notes: 'Test site inspection notes for Sivaram',
    })
  });
  const updateResult = await resUpdateSivaram.json();
  assert(updateResult.success && updateResult.survey.roofAreaSqFt === testRoofArea, 'Sivaram draft updated to 1550 sq.ft and L-Shaped');

  // Verify Siva P and Uma were NOT changed
  const verifySivaP = await (await fetch(`${BASE_URL}/surveys/SRV-2026-010`, { headers: { Authorization: `Bearer ${surveyToken}` } })).json();
  const verifyUma = await (await fetch(`${BASE_URL}/surveys/SRV-2026-011`, { headers: { Authorization: `Bearer ${surveyToken}` } })).json();
  assert(verifySivaP.survey.roofAreaSqFt === originalSivaPRoof, 'Siva P measurements completely unaffected by Sivaram edit');
  assert(verifyUma.survey.roofAreaSqFt === originalUmaRoof, 'Uma measurements completely unaffected by Sivaram edit');

  // 4. Test Photo Uploads with Honest Geo-Tagging
  // 4A: Photo with Real GPS
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const resPhotoGps = await fetch(`${BASE_URL}/surveys/SRV-2026-013/photos`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${surveyToken}` 
    },
    body: JSON.stringify({
      category: 'full_rooftop_view',
      fileName: 'sivaram_roof_south.png',
      base64Data: sampleBase64,
      latitude: 11.016844,
      longitude: 76.955832,
      gpsAccuracyMeters: 8.5,
      caption: 'Full rooftop view facing South from parapet'
    })
  });
  const photoGpsData = await resPhotoGps.json();
  assert(
    photoGpsData.success && 
    photoGpsData.photo.geoVerified === true && 
    photoGpsData.photo.latitude === 11.016844 &&
    photoGpsData.photo.verificationStatus === 'Uploaded',
    'Real GPS photo uploaded and geo-verified honestly'
  );

  // 4B: Photo with NO GPS (Honesty enforcement: never fabricate coordinates)
  const resPhotoNoGps = await fetch(`${BASE_URL}/surveys/SRV-2026-013/photos`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${surveyToken}` 
    },
    body: JSON.stringify({
      category: 'main_electricity_meter',
      fileName: 'sivaram_discom_meter.png',
      base64Data: sampleBase64,
      latitude: null,
      longitude: null,
      caption: 'Main 3-phase LT meter'
    })
  });
  const photoNoGpsData = await resPhotoNoGps.json();
  assert(
    photoNoGpsData.success && 
    photoNoGpsData.photo.geoVerified === false && 
    photoNoGpsData.photo.latitude === null,
    'Non-GPS photo recorded honestly without fabricated coordinates'
  );

  // 5. Test Submission Checklist Validation
  // If an incomplete survey attempts to submit:
  const resChecklistFail = await fetch(`${BASE_URL}/surveys/SRV-2026-002/submit`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${surveyToken}` 
    },
    body: JSON.stringify({ bypassWithExceptions: false })
  });
  const checklistFailData = await resChecklistFail.json();
  assert(
    resChecklistFail.status === 400 && 
    checklistFailData.success === false && 
    checklistFailData.checklistErrors?.length > 0,
    'Incomplete survey rejected by pre-submission checklist'
  );

  // Submit Sivaram's survey (which has measurements and required photos)
  const resSubmitSivaram = await fetch(`${BASE_URL}/surveys/SRV-2026-013/submit`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${surveyToken}` 
    },
    body: JSON.stringify({ comments: 'Technical rooftop audit complete. All measurements verified on site.' })
  });
  const submitData = await resSubmitSivaram.json();
  assert(
    submitData.success && 
    submitData.survey.status === 'Submitted for Review',
    'Sivaram survey status updated to "Submitted for Review"'
  );

  // 6. Test Review & Approval Workflow
  // 6A: Test "Changes Required" workflow
  const resChangesReq = await fetch(`${BASE_URL}/surveys/SRV-2026-013/review`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pmToken}` 
    },
    body: JSON.stringify({
      decision: 'Changes Required',
      comments: 'Please verify lightning arrester position and cable run length.'
    })
  });
  const changesReqData = await resChangesReq.json();
  assert(
    changesReqData.success && 
    changesReqData.survey.status === 'Changes Required' &&
    changesReqData.survey.reviewHistory.some((h: any) => h.action === 'Changes Required'),
    '"Changes Required" returns survey for correction and preserves audit history'
  );

  // 6B: Test "Approved" workflow
  const resApprove = await fetch(`${BASE_URL}/surveys/SRV-2026-013/review`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pmToken}` 
    },
    body: JSON.stringify({
      decision: 'Approved',
      comments: 'Approved 15kW turnkey solar installation. Roof integrity verified.'
    })
  });
  const approveData = await resApprove.json();
  assert(
    approveData.success && 
    approveData.survey.status === 'Approved' &&
    approveData.survey.reviewHistory.some((h: any) => h.action === 'Approved'),
    'Supervisor approved survey and audit trail recorded'
  );

  // 7. Verify Lead Status Updated to "Survey Completed" upon Approval
  const [leadRows]: any = await pool.query('SELECT status FROM leads WHERE id = ?', ['LD-2026-028']);
  assert(leadRows[0]?.status === 'Survey Completed', 'Lead LD-2026-028 updated to "Survey Completed" upon approval');

  // 8. Test Duplicate Protection & Server-side Unique ID Generation
  const resReopen = await fetch(`${BASE_URL}/surveys`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${surveyToken}` 
    },
    body: JSON.stringify({
      leadId: 'LD-2026-028',
      customerName: 'Sivaram Krishnan'
    })
  });
  const reopenData = await resReopen.json();
  assert(
    reopenData.success && 
    reopenData.reopened === true && 
    reopenData.survey.id === 'SRV-2026-013',
    'Reopening survey for existing lead returns existing survey without creating duplicates'
  );

  // 9. Test Security & RBAC: Customer cannot review survey
  const resCustReview = await fetch(`${BASE_URL}/surveys/SRV-2026-013/review`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}` 
    },
    body: JSON.stringify({
      decision: 'Approved',
      comments: 'Hacked approval'
    })
  });
  assert(resCustReview.status === 403, 'Customer role blocked from reviewing or approving survey (403 Forbidden)');

  // 10. Test Cleanup of test photo
  const resDeletePhoto = await fetch(`${BASE_URL}/surveys/SRV-2026-013/photos/${photoGpsData.photo.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${surveyToken}` }
  });
  const deleteResult = await resDeletePhoto.json();
  assert(deleteResult.success === true, 'Survey photo deleted successfully with authorization check');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
