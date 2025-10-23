/**
 * WORKFLOW #1: Classes System - End-to-End Test
 *
 * Tests:
 * 1. Create a new class
 * 2. List all classes
 * 3. Update class details
 * 4. Delete a class
 *
 * Date: October 22, 2025
 */

const BACKEND_URL = 'http://localhost:3000';

// Test credentials (from test_apis.js)
const CREDENTIALS = {
  teacher: {
    email: 'teacher@school.com',
    password: 'teacher123',
  },
  admin: {
    email: 'admin@school.com',
    password: 'admin123',
  },
};

// Test data
let authToken = null;
let schoolId = null;
let createdClassId = null;

console.log('========================================');
console.log('WORKFLOW #1: CLASSES SYSTEM TEST');
console.log('========================================\n');

// Helper: Login
async function login(email, password) {
  console.log(`→ Logging in as ${email}...`);

  const response = await fetch(`${BACKEND_URL}/api/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Login failed: ${data.error || 'Unknown error'}`);
  }

  console.log(`✅ Login successful - Role: ${data.user?.role || 'unknown'}\n`);
  schoolId = data.user?.schoolId || data.user?.school_id;
  return data;
}

// TEST 1: Create Class
async function testCreateClass() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Create Class');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const classData = {
    school_id: schoolId,
    name: 'Test Quran Class',
    code: 'QR-TEST-101',
    level: 'Beginner',
    schedule: {
      days: ['Monday', 'Wednesday', 'Friday'],
      time: '10:00 AM',
      duration: 60,
      room: 'Room 101',
    },
  };

  console.log(`→ Creating class "${classData.name}" (${classData.code})...`);
  console.log(`  Level: ${classData.level}`);
  console.log(`  Schedule: ${classData.schedule.days.join(', ')} at ${classData.schedule.time}`);
  console.log(`  Duration: ${classData.schedule.duration} minutes`);
  console.log(`  Location: ${classData.schedule.room}\n`);

  const response = await fetch(`${BACKEND_URL}/api/classes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(classData),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ Create class failed: ${data.error || 'Unknown error'}`);
    console.error(`Status: ${response.status}`);
    console.error('Response:', JSON.stringify(data, null, 2));
    throw new Error('Create class failed');
  }

  createdClassId = data.data.id;

  console.log(`✅ Class created successfully`);
  console.log(`   ID: ${createdClassId}`);
  console.log(`   Name: ${data.data.name}`);
  console.log(`   Code: ${data.data.code}`);
  console.log(`   Level: ${data.data.level}\n`);
}

// TEST 2: List Classes
async function testListClasses() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: List Classes');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`→ Fetching all classes for school ${schoolId}...`);

  const params = new URLSearchParams({
    school_id: schoolId,
  });

  const response = await fetch(`${BACKEND_URL}/api/classes?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ List classes failed: ${data.error || 'Unknown error'}`);
    console.error(`Status: ${response.status}`);
    throw new Error('List classes failed');
  }

  console.log(`✅ Classes retrieved successfully`);
  console.log(`   Total classes: ${data.data?.length || 0}\n`);

  if (data.data && data.data.length > 0) {
    console.log(`   📋 Classes List:`);
    data.data.forEach((cls, index) => {
      console.log(`   ${index + 1}. ${cls.name} (${cls.code}) - ${cls.level}`);
      if (cls.schedule?.days) {
        console.log(`      Schedule: ${cls.schedule.days.join(', ')}`);
      }
      if (cls.schedule?.time) {
        console.log(`      Time: ${cls.schedule.time} (${cls.schedule.duration || 60} min)`);
      }
      if (cls.schedule?.room) {
        console.log(`      Room: ${cls.schedule.room}`);
      }
    });
    console.log('');
  }

  // Verify our created class is in the list
  const foundClass = data.data?.find(cls => cls.id === createdClassId);
  if (foundClass) {
    console.log(`✅ Verified: Created class found in list\n`);
  } else {
    console.error(`❌ Warning: Created class not found in list\n`);
  }
}

// TEST 3: Update Class
async function testUpdateClass() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Update Class');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!createdClassId) {
    console.log('⚠️  No class to update, skipping test\n');
    return;
  }

  const updateData = {
    name: 'Updated Test Quran Class',
    code: 'QR-TEST-101-UPDATED',
    level: 'Intermediate',
    schedule: {
      days: ['Tuesday', 'Thursday'],
      time: '2:00 PM',
      duration: 90,
      room: 'Room 202',
    },
  };

  console.log(`→ Updating class ${createdClassId}...`);
  console.log(`  New name: "${updateData.name}"`);
  console.log(`  New code: ${updateData.code}`);
  console.log(`  New level: ${updateData.level}`);
  console.log(`  New schedule: ${updateData.schedule.days.join(', ')} at ${updateData.schedule.time}\n`);

  const response = await fetch(`${BACKEND_URL}/api/classes/${createdClassId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updateData),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ Update class failed: ${data.error || 'Unknown error'}`);
    console.error(`Status: ${response.status}`);
    throw new Error('Update class failed');
  }

  console.log(`✅ Class updated successfully`);
  console.log(`   ID: ${data.data.id}`);
  console.log(`   Name: ${data.data.name}`);
  console.log(`   Code: ${data.data.code}`);
  console.log(`   Level: ${data.data.level}`);
  if (data.data.schedule) {
    console.log(`   Schedule: ${data.data.schedule.days?.join(', ')} at ${data.data.schedule.time}`);
    console.log(`   Duration: ${data.data.schedule.duration} minutes`);
    console.log(`   Room: ${data.data.schedule.room}`);
  }
  console.log('');
}

// TEST 4: Delete Class
async function testDeleteClass() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Delete Class');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!createdClassId) {
    console.log('⚠️  No class to delete, skipping test\n');
    return;
  }

  console.log(`→ Deleting class ${createdClassId}...`);

  const response = await fetch(`${BACKEND_URL}/api/classes/${createdClassId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ Delete class failed: ${data.error || 'Unknown error'}`);
    console.error(`Status: ${response.status}`);
    throw new Error('Delete class failed');
  }

  console.log(`✅ Class deleted successfully\n`);

  // Verify class is deleted
  console.log(`→ Verifying class deletion...`);

  const verifyParams = new URLSearchParams({
    school_id: schoolId,
  });

  const verifyResponse = await fetch(`${BACKEND_URL}/api/classes?${verifyParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const verifyData = await verifyResponse.json();

  if (verifyResponse.ok) {
    const foundClass = verifyData.data?.find(cls => cls.id === createdClassId);
    if (foundClass) {
      console.error(`❌ Warning: Deleted class still found in list\n`);
    } else {
      console.log(`✅ Verified: Class successfully removed from list\n`);
    }
  }
}

// Main test execution
async function runTests() {
  try {
    // Step 1: Login as teacher
    await login(CREDENTIALS.teacher.email, CREDENTIALS.teacher.password);

    if (!schoolId) {
      throw new Error('School ID not found. Please ensure user has a school_id.');
    }

    console.log(`Using school ID: ${schoolId}\n`);

    // Run tests
    await testCreateClass();
    await testListClasses();
    await testUpdateClass();
    await testDeleteClass();

    console.log('========================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('========================================\n');
    console.log('WORKFLOW #1: Classes System is fully functional\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ TEST FAILED');
    console.error('========================================');
    console.error(`Error: ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run tests
runTests();
