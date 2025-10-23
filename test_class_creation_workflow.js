const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';
const BASE_URL = 'http://localhost:3013';

const OWNER_EMAIL = 'admin@testquranacademy.com';
const OWNER_PASSWORD = 'Password123!';

async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🏫 CLASS CREATION WORKFLOW TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  function recordTest(name, passed, details = '') {
    results.total++;
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}`);
      if (details) console.log(`   ${details}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}`);
      if (details) console.log(`   ${details}`);
    }
    results.tests.push({ name, passed, details });
  }

  let ownerToken = null;
  let schoolId = null;
  let createdClassId = null;

  try {
    // ===================================================================
    // PHASE 1: AUTHENTICATION & SETUP
    // ===================================================================
    console.log('📋 PHASE 1: Authentication & Setup\n');

    // Test 1: Owner Login
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD
    });

    if (authError || !authData.session) {
      recordTest('Owner Authentication', false, `Login failed: ${authError?.message || 'No session'}`);
      throw new Error('Cannot proceed without authentication');
    }

    ownerToken = authData.session.access_token;
    recordTest('Owner Authentication', true, `Token obtained: ${ownerToken.substring(0, 20)}...`);

    // Test 2: Get School ID
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError || !profileData?.school_id) {
      recordTest('Retrieve School ID', false, `Failed: ${profileError?.message || 'No school_id'}`);
      throw new Error('Cannot proceed without school_id');
    }

    schoolId = profileData.school_id;
    recordTest('Retrieve School ID', true, `School ID: ${schoolId}`);

    // Test 3: Count existing classes
    const { data: existingClasses, error: countError } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId);

    const initialCount = countError ? 0 : (existingClasses?.length || 0);
    recordTest('Count Existing Classes', !countError, `Found ${initialCount} existing classes`);

    // ===================================================================
    // PHASE 2: CLASS CREATION VIA API
    // ===================================================================
    console.log('\n📋 PHASE 2: Create Class via API\n');

    // Test 4: Create a new class via POST /api/school/classes
    const classData = {
      name: `Test Class ${Date.now()}`,
      room: '101',
      schedule: 'Mon-Wed-Fri 9:00 AM'
    };

    const createResponse = await fetch(`${BASE_URL}/api/school/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify(classData)
    });

    const createResult = await createResponse.json();

    if (createResponse.status === 200 && createResult.success && createResult.class) {
      createdClassId = createResult.class.id;
      recordTest('Create Class via API', true,
        `Class created: ${createResult.class.name} (ID: ${createdClassId})`);
    } else {
      recordTest('Create Class via API', false,
        `Status: ${createResponse.status}, Error: ${createResult.error || 'Unknown'}`);
    }

    // Test 5: Verify class exists in database
    const { data: verifyClass, error: verifyError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', createdClassId)
      .single();

    if (!verifyError && verifyClass) {
      recordTest('Verify Class in Database', true,
        `Class found: ${verifyClass.name}, School: ${verifyClass.school_id}`);
    } else {
      recordTest('Verify Class in Database', false,
        `Error: ${verifyError?.message || 'Class not found'}`);
    }

    // ===================================================================
    // PHASE 3: FETCH CLASSES VIA API
    // ===================================================================
    console.log('\n📋 PHASE 3: Fetch Classes via API\n');

    // Test 6: GET all classes via API
    const fetchResponse = await fetch(`${BASE_URL}/api/school/classes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ownerToken}`
      }
    });

    const fetchResult = await fetchResponse.json();

    if (fetchResponse.status === 200 && fetchResult.success && Array.isArray(fetchResult.classes)) {
      const foundClass = fetchResult.classes.find(c => c.id === createdClassId);
      if (foundClass) {
        recordTest('Fetch Classes via API', true,
          `Found ${fetchResult.classes.length} classes, including our new class`);
      } else {
        recordTest('Fetch Classes via API', false,
          `Class list returned but our class not found in the list`);
      }
    } else {
      recordTest('Fetch Classes via API', false,
        `Status: ${fetchResponse.status}, Error: ${fetchResult.error || 'Unknown'}`);
    }

    // ===================================================================
    // PHASE 4: RLS POLICY VERIFICATION
    // ===================================================================
    console.log('\n📋 PHASE 4: RLS Policy Verification\n');

    // Test 7: Verify school isolation (try to fetch another school's classes)
    const { data: allSchools, error: schoolsError } = await supabase
      .from('schools')
      .select('id')
      .neq('id', schoolId)
      .limit(1);

    if (!schoolsError && allSchools && allSchools.length > 0) {
      const otherSchoolId = allSchools[0].id;

      // Try to query classes from another school (should return empty due to RLS)
      const { data: otherClasses, error: otherError } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', otherSchoolId);

      if (!otherError && otherClasses && otherClasses.length === 0) {
        recordTest('RLS School Isolation', true,
          `Cannot see other school's classes (as expected)`);
      } else if (otherError) {
        recordTest('RLS School Isolation', true,
          `Query blocked by RLS (as expected)`);
      } else {
        recordTest('RLS School Isolation', false,
          `WARNING: Can see ${otherClasses?.length || 0} classes from another school!`);
      }
    } else {
      recordTest('RLS School Isolation', true,
        `No other schools to test isolation (single school in database)`);
    }

    // ===================================================================
    // PHASE 5: CLEANUP (DELETE CLASS)
    // ===================================================================
    console.log('\n📋 PHASE 5: Cleanup - Delete Test Class\n');

    // Test 8: Delete the test class
    const deleteResponse = await fetch(`${BASE_URL}/api/school/classes?id=${createdClassId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ownerToken}`
      }
    });

    const deleteResult = await deleteResponse.json();

    if (deleteResponse.status === 200 && deleteResult.success) {
      recordTest('Delete Class via API', true, `Class deleted successfully`);
    } else {
      recordTest('Delete Class via API', false,
        `Status: ${deleteResponse.status}, Error: ${deleteResult.error || 'Unknown'}`);
    }

    // Test 9: Verify class no longer exists
    const { data: deletedClass, error: deletedError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', createdClassId)
      .single();

    if (deletedError && deletedError.code === 'PGRST116') {
      recordTest('Verify Class Deleted', true, `Class no longer in database (as expected)`);
    } else if (deletedClass) {
      recordTest('Verify Class Deleted', false, `Class still exists in database!`);
    } else {
      recordTest('Verify Class Deleted', true, `Class not found (deleted successfully)`);
    }

  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    console.error(error.stack);
  }

  // ===================================================================
  // FINAL RESULTS
  // ===================================================================
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Total Tests:  ${results.total}`);
  console.log(`✅ Passed:    ${results.passed} (${Math.round(results.passed/results.total*100)}%)`);
  console.log(`❌ Failed:    ${results.failed} (${Math.round(results.failed/results.total*100)}%)`);
  console.log('\n═══════════════════════════════════════════════════════════\n');

  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Class creation workflow is fully functional.\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Review the errors above.\n');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests();
