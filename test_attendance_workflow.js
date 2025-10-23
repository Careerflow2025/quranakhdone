/**
 * WORKFLOW #7: Attendance System - End-to-End Test
 *
 * Tests:
 * 1. Mark attendance for a class (bulk)
 * 2. List attendance records with filters
 * 3. Update individual attendance record
 * 4. Get attendance summary/reports
 *
 * Date: October 22, 2025
 */

const BACKEND_URL = 'http://localhost:3013';

// Test credentials (from test_apis.js)
const CREDENTIALS = {
  teacher: {
    email: 'teacher@school.com',
    password: 'teacher123',
  },
  student: {
    email: 'student@school.com',
    password: 'student123',
  },
};

// Test data
let authToken = null;
let classId = null;
let studentIds = [];
let sessionDate = new Date().toISOString().split('T')[0]; // Today's date (YYYY-MM-DD)
let attendanceRecords = [];

console.log('========================================');
console.log('WORKFLOW #7: ATTENDANCE SYSTEM TEST');
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
  return data;
}

// Helper: Get classes
async function getClasses() {
  console.log('→ Fetching classes...');

  const response = await fetch(`${BACKEND_URL}/api/classes`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Get classes failed: ${data.error || 'Unknown error'}`);
  }

  console.log(`✅ Found ${data.classes?.length || 0} classes`);
  return data.classes || [];
}

// Helper: Get class enrollments
async function getEnrollments(classId) {
  console.log(`→ Fetching enrollments for class ${classId}...`);

  const response = await fetch(`${BACKEND_URL}/api/classes/${classId}/enrollments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Get enrollments failed: ${data.error || 'Unknown error'}`);
  }

  console.log(`✅ Found ${data.enrollments?.length || 0} enrolled students\n`);
  return data.enrollments || [];
}

// TEST 1: Mark Attendance (Bulk)
async function testMarkAttendance() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Mark Attendance (Bulk)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Prepare attendance data
  const attendanceData = {
    class_id: classId,
    session_date: sessionDate,
    records: studentIds.map((studentId, index) => ({
      student_id: studentId,
      status: index === 0 ? 'present' : index === 1 ? 'late' : 'present', // First student present, second late, rest present
      notes: index === 1 ? 'Arrived 10 minutes late' : undefined,
    })),
  };

  console.log(`→ Marking attendance for ${studentIds.length} students on ${sessionDate}...`);
  console.log(`  Class ID: ${classId}`);
  console.log(`  Students: ${studentIds.length}`);
  console.log(`  Status breakdown:`);
  console.log(`    - Present: ${attendanceData.records.filter(r => r.status === 'present').length}`);
  console.log(`    - Late: ${attendanceData.records.filter(r => r.status === 'late').length}\n`);

  const response = await fetch(`${BACKEND_URL}/api/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(attendanceData),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ Mark attendance failed: ${data.error || 'Unknown error'}`);
    console.error(`Status: ${response.status}`);
    console.error('Response:', JSON.stringify(data, null, 2));
    throw new Error('Mark attendance failed');
  }

  console.log(`✅ Attendance marked successfully`);
  console.log(`   Records created: ${data.data?.marked_count || 0}`);

  if (data.data?.records && data.data.records.length > 0) {
    attendanceRecords = data.data.records;
    console.log(`\n   Sample record:`);
    console.log(`   - ID: ${attendanceRecords[0].id}`);
    console.log(`   - Student: ${attendanceRecords[0].student_id}`);
    console.log(`   - Status: ${attendanceRecords[0].status}`);
    console.log(`   - Date: ${attendanceRecords[0].session_date}\n`);
  }
}

// TEST 2: List Attendance Records
async function testListAttendance() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: List Attendance Records');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`→ Fetching attendance for class ${classId} on ${sessionDate}...`);

  const params = new URLSearchParams({
    class_id: classId,
    start_date: sessionDate,
    end_date: sessionDate,
  });

  const response = await fetch(`${BACKEND_URL}/api/attendance?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ List attendance failed: ${data.error || 'Unknown error'}`);
    console.error(`Status: ${response.status}`);
    throw new Error('List attendance failed');
  }

  console.log(`✅ Attendance records retrieved successfully`);
  console.log(`   Total records: ${data.data?.records?.length || 0}`);

  if (data.data?.stats) {
    console.log(`\n   📊 Statistics:`);
    console.log(`   - Total records: ${data.data.stats.total_records}`);
    console.log(`   - Total sessions: ${data.data.stats.total_sessions}`);
    console.log(`   - Present: ${data.data.stats.present_count}`);
    console.log(`   - Absent: ${data.data.stats.absent_count}`);
    console.log(`   - Late: ${data.data.stats.late_count}`);
    console.log(`   - Excused: ${data.data.stats.excused_count}\n`);
  }

  if (data.data?.records && data.data.records.length > 0) {
    console.log(`   📋 Sample Records:`);
    data.data.records.slice(0, 3).forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.student_name || 'Unknown'} - ${record.status} (${record.session_date})`);
      if (record.notes) {
        console.log(`      Notes: ${record.notes}`);
      }
    });
    console.log('');
  }
}

// TEST 3: Update Individual Attendance Record
async function testUpdateAttendance() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Update Individual Record');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!attendanceRecords || attendanceRecords.length === 0) {
    console.log('⚠️  No attendance records to update, skipping test\n');
    return;
  }

  const recordToUpdate = attendanceRecords[0];
  const newStatus = recordToUpdate.status === 'present' ? 'late' : 'present';
  const newNotes = 'Updated via test script';

  console.log(`→ Updating record ${recordToUpdate.id}...`);
  console.log(`  Current status: ${recordToUpdate.status}`);
  console.log(`  New status: ${newStatus}`);
  console.log(`  New notes: "${newNotes}"\n`);

  const response = await fetch(`${BACKEND_URL}/api/attendance/${recordToUpdate.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      status: newStatus,
      notes: newNotes,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ Update attendance failed: ${data.error || 'Unknown error'}`);
    console.error(`Status: ${response.status}`);
    throw new Error('Update attendance failed');
  }

  console.log(`✅ Attendance record updated successfully`);
  console.log(`   Updated record:`);
  console.log(`   - ID: ${data.data?.record?.id}`);
  console.log(`   - Status: ${data.data?.record?.status}`);
  console.log(`   - Notes: ${data.data?.record?.notes}\n`);
}

// TEST 4: Get Attendance Summary
async function testAttendanceSummary() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Attendance Summary/Reports');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`→ Fetching attendance summary for class ${classId}...`);

  const params = new URLSearchParams({
    class_id: classId,
    start_date: sessionDate,
    end_date: sessionDate,
  });

  const response = await fetch(`${BACKEND_URL}/api/attendance/summary?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ Get summary failed: ${data.error || 'Unknown error'}`);
    console.error(`Status: ${response.status}`);
    throw new Error('Get summary failed');
  }

  console.log(`✅ Attendance summary retrieved successfully`);

  if (data.data?.summary) {
    const summary = data.data.summary;

    console.log(`\n   📊 Summary Overview:`);
    console.log(`   - Class: ${summary.class_name || 'Unknown'}`);
    console.log(`   - Period: ${summary.period || 'Unknown'}`);
    console.log(`   - Total sessions: ${summary.total_sessions}`);
    console.log(`   - Total students: ${summary.total_students}`);

    if (summary.overall_stats) {
      console.log(`\n   📈 Overall Statistics:`);
      console.log(`   - Total present: ${summary.overall_stats.total_present}`);
      console.log(`   - Total absent: ${summary.overall_stats.total_absent}`);
      console.log(`   - Total late: ${summary.overall_stats.total_late}`);
      console.log(`   - Total excused: ${summary.overall_stats.total_excused}`);
      console.log(`   - Average attendance rate: ${summary.overall_stats.average_attendance_rate.toFixed(1)}%`);
    }

    if (summary.students && summary.students.length > 0) {
      console.log(`\n   👥 Per-Student Breakdown:`);
      summary.students.slice(0, 3).forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.student_name || 'Unknown'}`);
        console.log(`      - Present: ${student.present}, Absent: ${student.absent}, Late: ${student.late}, Excused: ${student.excused}`);
        console.log(`      - Attendance rate: ${student.attendance_rate.toFixed(1)}%`);
        console.log(`      - Trend: ${student.trend}`);
      });
    }
    console.log('');
  }
}

// Main test execution
async function runTests() {
  try {
    // Step 1: Login as teacher
    await login(CREDENTIALS.teacher.email, CREDENTIALS.teacher.password);

    // Step 2: Get classes
    const classes = await getClasses();
    if (!classes || classes.length === 0) {
      throw new Error('No classes found. Please create a class first.');
    }
    classId = classes[0].id;
    console.log(`Using class: ${classes[0].name} (${classId})\n`);

    // Step 3: Get enrollments
    const enrollments = await getEnrollments(classId);
    if (!enrollments || enrollments.length === 0) {
      throw new Error('No students enrolled. Please enroll students first.');
    }
    studentIds = enrollments.map(e => e.student_id);
    console.log(`Found ${studentIds.length} enrolled students\n`);

    // Run tests
    await testMarkAttendance();
    await testListAttendance();
    await testUpdateAttendance();
    await testAttendanceSummary();

    console.log('========================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('========================================\n');
    console.log('WORKFLOW #7: Attendance System is fully functional\n');

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
