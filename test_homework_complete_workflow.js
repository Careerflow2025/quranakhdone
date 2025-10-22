/**
 * Complete Homework System Workflow Test
 * Test Date: October 21, 2025
 *
 * This test validates the complete homework lifecycle:
 * Phase 1: Teacher creates homework (green highlight - pending status)
 * Phase 2: Student retrieves homework via GET /api/homework/student/:id
 * Phase 3: Teacher marks homework complete (green → gold transition)
 * Phase 4: Teacher adds text note/reply to homework
 * Phase 5: Verify complete workflow via GET /api/homework with filters
 *
 * Expected Results: 100% pass rate with all phases validated
 */

const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3017';

// Use existing test owner account (proven pattern from assignments test)
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

// ============================================================================
// Helper Functions
// ============================================================================

async function signIn(email, password, supabase) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(`Sign in failed for ${email}: ${error.message}`);
  }

  return data.session.access_token;
}

async function createTestAccounts() {
  console.log('\n📋 SETUP: Creating test accounts...');

  const timestamp = Date.now();
  const teacherEmail = `teacher.hw.${timestamp}@quranakh.test`;
  const studentEmail = `student.hw.${timestamp}@quranakh.test`;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Sign in as existing owner using Supabase client (proven pattern)
  console.log(`🔐 Authenticating as school owner: ${OWNER_EMAIL}`);
  const { data: ownerAuth, error: ownerError } = await supabase.auth.signInWithPassword({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD
  });

  if (ownerError) {
    throw new Error(`Owner login failed: ${ownerError.message}`);
  }

  console.log('✅ Owner authenticated');
  const ownerToken = ownerAuth.session.access_token;

  // Create teacher
  console.log(`\n🧑‍🏫 Creating teacher: ${teacherEmail}`);
  const teacherRes = await fetch(`${BASE_URL}/api/school/create-teacher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      name: 'Test Homework Teacher',
      email: teacherEmail,
      password: 'TestPass123!',
      bio: 'Test teacher for homework system',
    }),
  });
  const teacherData = await teacherRes.json();

  if (!teacherData.success) {
    throw new Error(`Teacher creation failed: ${teacherData.error}`);
  }

  const teacherId = teacherData.data.id;
  const teacherPassword = teacherData.data.password;
  console.log(`✅ Teacher created: ${teacherEmail}`);

  // Create student
  console.log(`\n👨‍🎓 Creating student: ${studentEmail}`);
  const studentRes = await fetch(`${BASE_URL}/api/school/create-student`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      name: 'Test Homework Student',
      email: studentEmail,
      password: 'TestPass123!',
      dob: '2010-01-01',
      gender: 'male',
    }),
  });
  const studentData = await studentRes.json();

  if (!studentData.success) {
    throw new Error(`Student creation failed: ${studentData.error}`);
  }

  const studentId = studentData.data.id;
  const studentPassword = studentData.data.password;
  console.log(`✅ Student created: ${studentEmail}`);

  // Get authentication tokens
  console.log('\n🔑 Authenticating as teacher and student...');
  const teacherToken = await signIn(teacherEmail, teacherPassword, supabase);
  const studentToken = await signIn(studentEmail, studentPassword, supabase);
  console.log('✅ Authentication complete\n');

  return {
    teacherId,
    studentId,
    teacherEmail,
    studentEmail,
    teacherToken,
    studentToken,
  };
}

function formatResult(phase, statusCode, success, details = '') {
  const emoji = success ? '✅' : '❌';
  const status = success ? 'PASS' : 'FAIL';
  console.log(`\n${emoji} ${phase}: ${status} (HTTP ${statusCode})`);
  if (details) console.log(`   ${details}`);
  return success;
}

// ============================================================================
// Test Phases
// ============================================================================

async function phase1_CreateHomework(teacherToken, studentId) {
  console.log('\n📝 PHASE 1: Teacher creates homework (pending status - green)');

  const response = await fetch(`${BASE_URL}/api/homework`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      student_id: studentId,
      surah: 1, // Al-Fatiha
      ayah_start: 1,
      ayah_end: 7,
      page_number: 1,
      note: 'Please memorize Surah Al-Fatiha with proper tajweed',
      type: 'memorization',
    }),
  });

  const data = await response.json();
  const success = response.status === 201 && data.success === true && data.homework.color === 'green';

  formatResult(
    'Phase 1 - Create Homework',
    response.status,
    success,
    success ? `Homework ID: ${data.homework.id}, Status: ${data.homework.status}` : data.error
  );

  return { success, homeworkId: data.homework?.id };
}

async function phase2_StudentRetrievesHomework(studentToken, studentId) {
  console.log('\n📖 PHASE 2: Student retrieves homework list');

  const response = await fetch(`${BASE_URL}/api/homework/student/${studentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
    },
  });

  const data = await response.json();
  const success = response.status === 200 &&
                 data.success === true &&
                 data.pending_homework.length > 0 &&
                 data.stats.total_pending === 1;

  formatResult(
    'Phase 2 - Student Retrieves',
    response.status,
    success,
    success ? `Pending: ${data.stats.total_pending}, Completed: ${data.stats.total_completed}` : data.error
  );

  return { success };
}

async function phase3_TeacherCompletesHomework(teacherToken, homeworkId) {
  console.log('\n✔️  PHASE 3: Teacher marks homework as complete (green → gold)');

  const response = await fetch(`${BASE_URL}/api/homework/${homeworkId}/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      completion_note: 'Excellent memorization! Keep up the good work.',
    }),
  });

  const data = await response.json();
  const success = response.status === 200 &&
                 data.success === true &&
                 data.homework.color === 'gold' &&
                 data.previous_color === 'green' &&
                 data.new_color === 'gold';

  formatResult(
    'Phase 3 - Complete Homework',
    response.status,
    success,
    success ? `Transition: ${data.previous_color} → ${data.new_color}` : data.error
  );

  return { success };
}

async function phase4_TeacherAddsNote(teacherToken, homeworkId) {
  console.log('\n💬 PHASE 4: Teacher adds text note to homework');

  const response = await fetch(`${BASE_URL}/api/homework/${homeworkId}/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      type: 'text',
      text: 'Remember to focus on makharij al-huroof (pronunciation points) for the letters.',
    }),
  });

  const data = await response.json();
  const success = response.status === 201 &&
                 data.success === true &&
                 data.note.type === 'text' &&
                 data.note.text !== null;

  formatResult(
    'Phase 4 - Add Note',
    response.status,
    success,
    success ? `Note ID: ${data.note.id}, Type: ${data.note.type}` : data.error
  );

  return { success };
}

async function phase5_VerifyCompletedHomework(studentToken, studentId) {
  console.log('\n🔍 PHASE 5: Verify homework now appears in completed list');

  const response = await fetch(`${BASE_URL}/api/homework/student/${studentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
    },
  });

  const data = await response.json();
  const success = response.status === 200 &&
                 data.success === true &&
                 data.completed_homework.length === 1 &&
                 data.stats.total_completed === 1 &&
                 data.stats.total_pending === 0 &&
                 data.completed_homework[0].notes.length > 0;

  formatResult(
    'Phase 5 - Verify Completion',
    response.status,
    success,
    success ? `Completed: ${data.stats.total_completed}, Notes: ${data.completed_homework[0].notes.length}` : data.error
  );

  return { success };
}

async function phase6_FilterHomeworkByStatus(teacherToken, studentId) {
  console.log('\n🔎 PHASE 6: Verify GET /api/homework with status filters');

  // Test filter for completed homework
  const response = await fetch(`${BASE_URL}/api/homework?student_id=${studentId}&status=completed`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${teacherToken}`,
    },
  });

  const data = await response.json();
  const success = response.status === 200 &&
                 data.success === true &&
                 data.homework.length === 1 &&
                 data.homework[0].color === 'gold';

  formatResult(
    'Phase 6 - Filter by Status',
    response.status,
    success,
    success ? `Found ${data.homework.length} completed homework(s)` : data.error
  );

  return { success };
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTests() {
  console.log('='.repeat(70));
  console.log('🧪 HOMEWORK SYSTEM - COMPLETE WORKFLOW TEST');
  console.log('='.repeat(70));
  console.log('Test Date: October 21, 2025');
  console.log('Expected: 6/6 phases PASS');
  console.log('='.repeat(70));

  let results = {
    total: 6,
    passed: 0,
    failed: 0,
    phases: [],
  };

  try {
    // Setup
    const accounts = await createTestAccounts();
    console.log('\n✅ Setup complete\n');

    // Phase 1: Create homework
    const p1 = await phase1_CreateHomework(accounts.teacherToken, accounts.studentId);
    results.phases.push({ name: 'Phase 1 - Create Homework', success: p1.success });
    if (p1.success) results.passed++; else results.failed++;
    if (!p1.success || !p1.homeworkId) throw new Error('Phase 1 failed - cannot continue');

    // Phase 2: Student retrieves
    const p2 = await phase2_StudentRetrievesHomework(accounts.studentToken, accounts.studentId);
    results.phases.push({ name: 'Phase 2 - Student Retrieves', success: p2.success });
    if (p2.success) results.passed++; else results.failed++;

    // Phase 3: Teacher completes
    const p3 = await phase3_TeacherCompletesHomework(accounts.teacherToken, p1.homeworkId);
    results.phases.push({ name: 'Phase 3 - Teacher Completes', success: p3.success });
    if (p3.success) results.passed++; else results.failed++;

    // Phase 4: Teacher adds note
    const p4 = await phase4_TeacherAddsNote(accounts.teacherToken, p1.homeworkId);
    results.phases.push({ name: 'Phase 4 - Add Note', success: p4.success });
    if (p4.success) results.passed++; else results.failed++;

    // Phase 5: Verify completion
    const p5 = await phase5_VerifyCompletedHomework(accounts.studentToken, accounts.studentId);
    results.phases.push({ name: 'Phase 5 - Verify Completion', success: p5.success });
    if (p5.success) results.passed++; else results.failed++;

    // Phase 6: Filter by status
    const p6 = await phase6_FilterHomeworkByStatus(accounts.teacherToken, accounts.studentId);
    results.phases.push({ name: 'Phase 6 - Filter by Status', success: p6.success });
    if (p6.success) results.passed++; else results.failed++;

  } catch (error) {
    console.error('\n❌ Test execution error:', error.message);
    results.error = error.message;
  }

  // Final Report
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL TEST RESULTS');
  console.log('='.repeat(70));

  results.phases.forEach((phase, index) => {
    console.log(`${phase.success ? '✅' : '❌'} ${phase.name}`);
  });

  console.log('\n' + '-'.repeat(70));
  console.log(`Total Phases: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ${results.failed > 0 ? '❌' : ''}`);
  console.log(`Pass Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));

  const allPassed = results.passed === results.total;
  if (allPassed) {
    console.log('\n🎉 SUCCESS: All phases passed! Homework System is PRODUCTION READY!\n');
  } else {
    console.log('\n⚠️  FAILED: Some phases failed. Review errors above.\n');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
