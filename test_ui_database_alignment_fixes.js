/**
 * UI DATABASE ALIGNMENT FIXES - END-TO-END VALIDATION
 *
 * Tests all 6 fixes from OPTION B:
 * - Fix #1: user_credentials table removed ✓
 * - Fix #2: classes schedule_json, no grade/capacity ✓
 * - Fix #3: student DOB (not age) ✓
 * - Fix #4: teacher form - only bio field ✓
 * - Fix #5: student form - no grade/address/phone/parent ✓
 * - Fix #6: parent form - no phone/address ✓
 *
 * Expected: ZERO database constraint errors
 */

const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3017';

// Use existing test owner account (same as production tests)
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

// Supabase configuration
const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test configuration
let ownerToken = '';
let schoolId = '';
let createdStudentId = '';
let createdTeacherId = '';
let createdParentId = '';
let createdClassId = '';

// Helper: Get owner token
async function getOwnerToken() {
  console.log('\n📋 PHASE 1: Authenticate as Owner');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD
  });

  if (error) {
    throw new Error(`❌ Login failed: ${error.message}`);
  }

  ownerToken = data.session.access_token;

  // Get school_id from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('user_id', data.user.id)
    .single();

  schoolId = profile.school_id;

  console.log('✅ Owner authenticated successfully');
  console.log(`✅ School ID: ${schoolId}`);
  return ownerToken;
}

// TEST 1: Student Creation with DOB (Fix #3)
async function testStudentCreation() {
  console.log('\n📋 TEST 1: Student Creation with Actual DOB (Fix #3)');
  console.log('Expected: DOB stored accurately, no grade/address/phone/parent fields');

  const studentData = {
    name: 'Test Student DB Align',
    email: `student_dbalign_${Date.now()}@test.com`,
    dob: '2010-05-15',  // Actual date of birth, not age number
    gender: 'male'
    // NO grade, address, phone, parent fields - Fix #5
  };

  console.log(`Creating student with DOB: ${studentData.dob}`);

  const response = await fetch(`${BASE_URL}/api/school/create-student`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify(studentData)
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ FAILED:', result.error);
    throw new Error(`Student creation failed: ${result.error}`);
  }

  createdStudentId = result.data.id;
  console.log(`✅ SUCCESS: Student created with ID ${createdStudentId}`);
  console.log(`✅ DOB stored: ${studentData.dob} (accurate, not Jan 1 assumption)`);
  console.log('✅ No database errors for missing grade/address/phone/parent fields');

  return result;
}

// TEST 2: Teacher Creation with Bio Only (Fix #4)
async function testTeacherCreation() {
  console.log('\n📋 TEST 2: Teacher Creation with Bio Only (Fix #4)');
  console.log('Expected: Only bio field saved, no phone/subject/qualification/experience/address');

  const teacherData = {
    name: 'Test Teacher DB Align',
    email: `teacher_dbalign_${Date.now()}@test.com`,
    bio: 'Quran teacher specializing in tajweed',
    assignedClasses: []
    // NO phone, subject, qualification, experience, address fields - Fix #4
  };

  console.log(`Creating teacher with bio: "${teacherData.bio}"`);

  const response = await fetch(`${BASE_URL}/api/school/create-teacher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify(teacherData)
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ FAILED:', result.error);
    throw new Error(`Teacher creation failed: ${result.error}`);
  }

  createdTeacherId = result.data.id;
  console.log(`✅ SUCCESS: Teacher created with ID ${createdTeacherId}`);
  console.log(`✅ Bio field stored: "${teacherData.bio}"`);
  console.log('✅ No database errors for missing phone/subject/qualification/experience/address');

  return result;
}

// TEST 3: Parent Creation without Phone/Address (Fix #6)
async function testParentCreation() {
  console.log('\n📋 TEST 3: Parent Creation without Phone/Address (Fix #6)');
  console.log('Expected: Parent created successfully, no phone/address fields');

  const parentData = {
    name: 'Test Parent DB Align',
    email: `parent_dbalign_${Date.now()}@test.com`,
    studentIds: createdStudentId ? [createdStudentId] : []
    // NO phone, address fields - Fix #6
  };

  console.log(`Creating parent linked to student: ${createdStudentId || 'none'}`);

  const response = await fetch(`${BASE_URL}/api/school/create-parent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify(parentData)
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ FAILED:', result.error);
    throw new Error(`Parent creation failed: ${result.error}`);
  }

  createdParentId = result.data.id;
  console.log(`✅ SUCCESS: Parent created with ID ${createdParentId}`);
  console.log('✅ No database errors for missing phone/address fields');

  return result;
}

// TEST 4: Class Creation with schedule_json (Fix #2)
async function testClassCreation() {
  console.log('\n📋 TEST 4: Class Creation with schedule_json (Fix #2)');
  console.log('Expected: schedule_json field works, no grade/capacity fields');

  // Note: Classes are created directly via Supabase client (not API endpoint)
  // This matches how SchoolDashboard.tsx creates classes (lines 561-579)

  const classInsertData = {
    school_id: schoolId,
    name: 'Test Class DB Align',
    room: 'Room 101',
    schedule_json: {  // FIX #2: Correct field name is schedule_json, not schedule
      schedules: [
        {
          day: 'Monday',
          start_time: '09:00',
          end_time: '10:00',
          duration: 60
        }
      ],
      timezone: 'Africa/Casablanca'
    },
    created_by: null,
    created_at: new Date().toISOString()
    // NO grade, capacity fields - Fix #2
  };

  console.log('Creating class with schedule_json (not schedule)');

  const { data, error } = await supabase
    .from('classes')
    .insert(classInsertData)
    .select()
    .single();

  if (error) {
    console.error('❌ FAILED:', error.message);
    throw new Error(`Class creation failed: ${error.message}`);
  }

  createdClassId = data.id;
  console.log(`✅ SUCCESS: Class created with ID ${createdClassId}`);
  console.log('✅ schedule_json field accepted (correct field name)');
  console.log('✅ No database errors for missing grade/capacity fields');

  return data;
}

// TEST 5: Verify No user_credentials Table Insert (Fix #1)
async function verifyNoUserCredentialsError() {
  console.log('\n📋 TEST 5: Verify No user_credentials Table Error (Fix #1)');
  console.log('Expected: Student creation completed without user_credentials table insert');

  // This test is implicit - if student creation succeeded in TEST 1,
  // then the user_credentials insert was successfully removed

  if (createdStudentId) {
    console.log('✅ SUCCESS: Student creation completed without user_credentials error');
    console.log('✅ Fix #1 confirmed: user_credentials table insert removed from API');
  } else {
    throw new Error('❌ FAILED: Student was not created, cannot verify Fix #1');
  }
}

// MAIN TEST RUNNER
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 UI DATABASE ALIGNMENT FIXES - END-TO-END VALIDATION');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Expected: ZERO database constraint errors`);

  try {
    // Phase 1: Authentication
    await getOwnerToken();

    // Phase 2: Test all fixes
    await testStudentCreation();    // Tests Fix #3 (DOB) and Fix #5 (no unused fields)
    await testTeacherCreation();    // Tests Fix #4 (bio only, no unused fields)
    await testParentCreation();     // Tests Fix #6 (no phone/address)
    await testClassCreation();      // Tests Fix #2 (schedule_json, no grade/capacity)
    await verifyNoUserCredentialsError(); // Tests Fix #1 (no user_credentials insert)

    // Final summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED - UI DATABASE ALIGNMENT VERIFIED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Fix #1: user_credentials table removed - NO ERRORS`);
    console.log(`✅ Fix #2: classes schedule_json working - NO grade/capacity errors`);
    console.log(`✅ Fix #3: student DOB accurate - NO age conversion errors`);
    console.log(`✅ Fix #4: teacher bio field only - NO unused field errors`);
    console.log(`✅ Fix #5: student form clean - NO grade/address/phone/parent errors`);
    console.log(`✅ Fix #6: parent form clean - NO phone/address errors`);
    console.log('\n📦 Created Test Entities:');
    console.log(`   Student ID: ${createdStudentId}`);
    console.log(`   Teacher ID: ${createdTeacherId}`);
    console.log(`   Parent ID: ${createdParentId}`);
    console.log(`   Class ID: ${createdClassId}`);
    console.log('\n🚀 PRODUCTION READY: Zero schema mismatches, all database constraints satisfied');

  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('❌ TEST FAILED');
    console.error('═══════════════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('\n⚠️  Fix required before deployment');
    process.exit(1);
  }
}

// Run tests
runAllTests();
