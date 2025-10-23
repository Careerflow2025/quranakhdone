/**
 * PRODUCTION ECOSYSTEM COMPLETE TEST
 * ==================================
 * Test Date: October 21, 2025
 * Purpose: End-to-end validation of complete QuranAkh ecosystem
 *
 * This test validates the entire production workflow:
 * - School setup with teachers, students, parents
 * - Parent-student linking (including multi-child parents)
 * - Class creation and enrollment
 * - Teacher dashboard verification
 * - Assignment and homework creation
 * - School monitoring dashboard
 * - Student management (highlights, notes, voice notes)
 * - Student dashboard verification
 * - Parent dashboard verification
 *
 * Expected: Complete ecosystem functioning with all roles interconnected
 */

const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3020';

// Use existing test owner account
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

// Supabase configuration
const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

// Test results tracking
const testResults = {
  phases: [],
  passed: 0,
  failed: 0,
  errors: []
};

// Test data storage
const testData = {
  schoolId: null,
  ownerToken: null,
  teachers: [],
  students: [],
  parents: [],
  classes: [],
  assignments: [],
  homework: [],
  highlights: []
};

// ============================================================================
// Helper Functions
// ============================================================================

function logPhase(phaseNumber, phaseName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`PHASE ${phaseNumber}: ${phaseName}`);
  console.log(`${'='.repeat(80)}\n`);
}

function logResult(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${testName}`);
  if (details) console.log(`   ${details}`);

  testResults.phases.push({ testName, passed, details });
  if (passed) testResults.passed++;
  else {
    testResults.failed++;
    testResults.errors.push({ testName, details });
  }
}

async function signIn(email, password) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw new Error(`Sign in failed for ${email}: ${error.message}`);
  return data.session.access_token;
}

async function apiCall(endpoint, method, token, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  return { status: response.status, data };
}

// ============================================================================
// PHASE 1: Setup School Ecosystem
// ============================================================================

async function phase1_setupEcosystem() {
  logPhase(1, 'Setup School Ecosystem');

  try {
    // Authenticate as owner and get user data
    console.log(`🔐 Authenticating as school owner: ${OWNER_EMAIL}`);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD
    });

    if (authError) throw new Error(`Owner login failed: ${authError.message}`);

    testData.ownerToken = authData.session.access_token;
    logResult('Owner authentication', true, OWNER_EMAIL);

    // Get school ID using the authenticated user's ID
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      throw new Error(`Profile not found: ${profileError?.message || 'Unknown error'}`);
    }

    testData.schoolId = profileData.school_id;
    logResult('School ID retrieved', true, testData.schoolId);

    // Create 2 teachers
    console.log('\n🧑‍🏫 Creating 2 teachers...');
    const timestamp = Date.now();

    for (let i = 1; i <= 2; i++) {
      const teacherEmail = `teacher${i}.prod.${timestamp}@quranakh.test`;
      const { status, data } = await apiCall(
        '/api/school/create-teacher',
        'POST',
        testData.ownerToken,
        {
          name: `Production Teacher ${i}`,
          email: teacherEmail,
          password: 'TestPass123!',
          bio: `Production test teacher ${i}`
        }
      );

      if (status === 200 && data.success) {
        testData.teachers.push({
          id: data.data.id,
          email: teacherEmail,
          password: data.data.password,
          name: `Production Teacher ${i}`
        });
        logResult(`Create Teacher ${i}`, true, teacherEmail);
      } else {
        logResult(`Create Teacher ${i}`, false, data.error || 'Unknown error');
      }
    }

    // Create 6 students
    console.log('\n👨‍🎓 Creating 6 students...');

    for (let i = 1; i <= 6; i++) {
      const studentEmail = `student${i}.prod.${timestamp}@quranakh.test`;
      const { status, data } = await apiCall(
        '/api/school/create-student',
        'POST',
        testData.ownerToken,
        {
          name: `Student ${i}`,
          email: studentEmail,
          password: 'TestPass123!',
          dob: '2010-01-01',
          gender: i % 2 === 0 ? 'female' : 'male'
        }
      );

      if (status === 200 && data.success) {
        testData.students.push({
          id: data.data.id,
          email: studentEmail,
          password: data.data.password,
          name: `Student ${i}`
        });
        logResult(`Create Student ${i}`, true, studentEmail);
      } else {
        logResult(`Create Student ${i}`, false, data.error || 'Unknown error');
      }
    }

    // Create 5 parents
    console.log('\n👨‍👩‍👧‍👦 Creating 5 parents...');

    for (let i = 1; i <= 5; i++) {
      const parentEmail = `parent${i}.prod.${timestamp}@quranakh.test`;
      const { status, data } = await apiCall(
        '/api/school/create-parent',
        'POST',
        testData.ownerToken,
        {
          name: `Parent ${i}`,
          email: parentEmail,
          password: 'TestPass123!',
          phone: `+212-${600000000 + i}`
        }
      );

      if (status === 200 && data.success) {
        testData.parents.push({
          id: data.data.id,
          email: parentEmail,
          password: data.data.password,
          name: `Parent ${i}`
        });
        logResult(`Create Parent ${i}`, true, parentEmail);
      } else {
        logResult(`Create Parent ${i}`, false, data.error || 'Unknown error');
      }
    }

  } catch (error) {
    console.error('❌ Phase 1 Error:', error.message);
    logResult('Phase 1 Setup', false, error.message);
  }
}

// ============================================================================
// PHASE 2: Link Parents to Students
// ============================================================================

async function phase2_linkParents() {
  logPhase(2, 'Link Parents to Students');

  try {
    // Parent 1 → Student 1 and Student 2 (multi-child test)
    console.log('\n👨‍👩‍👧‍👦 Linking Parent 1 to 2 students...');

    for (let i = 0; i < 2; i++) {
      const { status, data } = await apiCall(
        '/api/school/link-parent-student',
        'POST',
        testData.ownerToken,
        {
          parent_id: testData.parents[0].id,
          student_id: testData.students[i].id
        }
      );

      if (status === 201 || status === 200) {
        logResult(`Link Parent 1 to Student ${i + 1}`, true, `${testData.parents[0].name} → ${testData.students[i].name}`);
      } else {
        logResult(`Link Parent 1 to Student ${i + 1}`, false, data.error || 'Unknown error');
      }
    }

    // Parents 2-5 → Students 3-6 (one-to-one)
    console.log('\n👨‍👩‍👧 Linking Parents 2-5 to Students 3-6 (one-to-one)...');

    for (let i = 1; i < 5; i++) {
      const { status, data } = await apiCall(
        '/api/school/link-parent-student',
        'POST',
        testData.ownerToken,
        {
          parent_id: testData.parents[i].id,
          student_id: testData.students[i + 1].id
        }
      );

      if (status === 201 || status === 200) {
        logResult(`Link Parent ${i + 1} to Student ${i + 2}`, true, `${testData.parents[i].name} → ${testData.students[i + 1].name}`);
      } else {
        logResult(`Link Parent ${i + 1} to Student ${i + 2}`, false, data.error || 'Unknown error');
      }
    }

  } catch (error) {
    console.error('❌ Phase 2 Error:', error.message);
    logResult('Phase 2 Link Parents', false, error.message);
  }
}

// ============================================================================
// PHASE 3: Create Classes and Assign Students/Teachers
// ============================================================================

async function phase3_createClasses() {
  logPhase(3, 'Create Classes and Assign Students/Teachers');

  try {
    // Create Class 1
    console.log('\n📚 Creating Class 1...');
    const { status: status1, data: data1 } = await apiCall(
      '/api/classes',
      'POST',
      testData.ownerToken,
      {
        name: 'Quran Memorization Class A',
        description: 'Beginner level Quran memorization',
        teacher_id: testData.teachers[0].id,
        student_ids: [testData.students[0].id, testData.students[1].id, testData.students[2].id]
      }
    );

    if (status1 === 201 && data1.success) {
      testData.classes.push({
        id: data1.data.id,
        name: 'Quran Memorization Class A',
        teacher: testData.teachers[0],
        students: testData.students.slice(0, 3)
      });
      logResult('Create Class 1', true, `${testData.teachers[0].name} with 3 students`);
    } else {
      logResult('Create Class 1', false, data1.error || 'Unknown error');
    }

    // Create Class 2
    console.log('\n📚 Creating Class 2...');
    const { status: status2, data: data2 } = await apiCall(
      '/api/classes',
      'POST',
      testData.ownerToken,
      {
        name: 'Tajweed Rules Class B',
        description: 'Advanced Tajweed rules',
        teacher_id: testData.teachers[1].id,
        student_ids: [testData.students[3].id, testData.students[4].id]
      }
    );

    if (status2 === 201 && data2.success) {
      testData.classes.push({
        id: data2.data.id,
        name: 'Tajweed Rules Class B',
        teacher: testData.teachers[1],
        students: testData.students.slice(3, 5)
      });
      logResult('Create Class 2', true, `${testData.teachers[1].name} with 2 students`);
    } else {
      logResult('Create Class 2', false, data2.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Phase 3 Error:', error.message);
    logResult('Phase 3 Create Classes', false, error.message);
  }
}

// ============================================================================
// PHASE 4: Test Teacher Dashboard
// ============================================================================

async function phase4_testTeacherDashboard() {
  logPhase(4, 'Test Teacher Dashboard');

  try {
    // Authenticate as Teacher 1
    console.log(`\n🧑‍🏫 Authenticating as ${testData.teachers[0].email}...`);
    const teacher1Token = await signIn(testData.teachers[0].email, testData.teachers[0].password);
    logResult('Teacher 1 Authentication', true, testData.teachers[0].name);

    // Get teacher's classes
    console.log('\n📊 Fetching teacher classes...');
    const { status, data } = await apiCall('/api/classes/my-classes', 'GET', teacher1Token);

    if (status === 200 && data.success) {
      const hasCorrectClass = data.data.some(cls => cls.name === 'Quran Memorization Class A');
      const hasCorrectStudentCount = data.data.some(cls => cls.students && cls.students.length === 3);

      logResult('Teacher Dashboard - Classes Visible', hasCorrectClass, `Found class: ${hasCorrectClass}`);
      logResult('Teacher Dashboard - Students Visible', hasCorrectStudentCount, `Student count: ${hasCorrectStudentCount ? 3 : 'incorrect'}`);
    } else {
      logResult('Teacher Dashboard - Fetch Classes', false, data.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Phase 4 Error:', error.message);
    logResult('Phase 4 Teacher Dashboard', false, error.message);
  }
}

// ============================================================================
// PHASE 5: Teacher Creates Assignments and Homework
// ============================================================================

async function phase5_createAssignmentsHomework() {
  logPhase(5, 'Teacher Creates Assignments and Homework');

  try {
    // Get teacher token
    const teacherToken = await signIn(testData.teachers[0].email, testData.teachers[0].password);

    // Create assignment for Student 1
    console.log('\n📝 Creating assignment for Student 1...');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const { status: assignStatus, data: assignData } = await apiCall(
      '/api/assignments',
      'POST',
      teacherToken,
      {
        student_id: testData.students[0].id,
        title: 'Memorize Surah Al-Fatiha',
        description: 'Complete memorization with proper Tajweed',
        due_at: dueDate.toISOString()
      }
    );

    if (assignStatus === 201 && assignData.success) {
      testData.assignments.push(assignData.data);
      logResult('Create Assignment', true, assignData.data.title);
    } else {
      logResult('Create Assignment', false, assignData.error || 'Unknown error');
    }

    // Create homework for Student 1
    console.log('\n📗 Creating homework for Student 1...');
    const { status: hwStatus, data: hwData } = await apiCall(
      '/api/homework',
      'POST',
      teacherToken,
      {
        student_id: testData.students[0].id,
        surah: 1,
        ayah_start: 1,
        ayah_end: 7,
        page_number: 1,
        note: 'Practice pronunciation of the opening chapter',
        type: 'memorization'
      }
    );

    if (hwStatus === 201 && hwData.success) {
      testData.homework.push(hwData.data);
      logResult('Create Homework', true, `Surah ${hwData.data.surah}, Ayah ${hwData.data.ayah_start}-${hwData.data.ayah_end}`);
    } else {
      logResult('Create Homework', false, hwData.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Phase 5 Error:', error.message);
    logResult('Phase 5 Create Assignments/Homework', false, error.message);
  }
}

// ============================================================================
// PHASE 6: Test School Dashboard Monitoring
// ============================================================================

async function phase6_testSchoolDashboard() {
  logPhase(6, 'Test School Dashboard Monitoring');

  try {
    // Get all assignments (school view)
    console.log('\n📊 Fetching all assignments (school view)...');
    const { status: assignStatus, data: assignData } = await apiCall(
      '/api/assignments',
      'GET',
      testData.ownerToken
    );

    if (assignStatus === 200 && assignData.success) {
      const hasAssignment = assignData.data.some(a => a.title === 'Memorize Surah Al-Fatiha');
      logResult('School Dashboard - Assignment Visible', hasAssignment, `Found: ${hasAssignment ? 'Yes' : 'No'}`);
    } else {
      logResult('School Dashboard - Fetch Assignments', false, assignData.error || 'Unknown error');
    }

    // Get all homework (school view)
    console.log('\n📊 Fetching all homework (school view)...');
    const { status: hwStatus, data: hwData } = await apiCall(
      '/api/homework',
      'GET',
      testData.ownerToken
    );

    if (hwStatus === 200 && hwData.success) {
      const hasHomework = hwData.data.some(h => h.surah === 1 && h.ayah_start === 1);
      logResult('School Dashboard - Homework Visible', hasHomework, `Found: ${hasHomework ? 'Yes' : 'No'}`);
    } else {
      logResult('School Dashboard - Fetch Homework', false, hwData.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Phase 6 Error:', error.message);
    logResult('Phase 6 School Dashboard', false, error.message);
  }
}

// ============================================================================
// PHASE 7: Student Management (Highlights, Notes, Voice Notes)
// ============================================================================

async function phase7_studentManagement() {
  logPhase(7, 'Student Management - Highlights, Notes, Voice Notes');

  try {
    const teacherToken = await signIn(testData.teachers[0].email, testData.teachers[0].password);

    // Create highlight (homework)
    console.log('\n🖍️ Creating homework highlight...');
    const { status: hlStatus, data: hlData } = await apiCall(
      '/api/highlights',
      'POST',
      teacherToken,
      {
        student_id: testData.students[0].id,
        surah: 2,
        ayah_start: 1,
        ayah_end: 5,
        color: 'green',
        type: 'homework',
        note: 'Review these ayahs for next class'
      }
    );

    if (hlStatus === 201 && hlData.success) {
      testData.highlights.push(hlData.data);
      logResult('Create Highlight (Homework)', true, `Surah ${hlData.data.surah}`);

      // Add text note to highlight
      console.log('\n📝 Adding text note to highlight...');
      const { status: noteStatus, data: noteData } = await apiCall(
        `/api/highlights/${hlData.data.id}/notes`,
        'POST',
        teacherToken,
        {
          type: 'text',
          text: 'Pay special attention to the pronunciation of the letter Qaf in these ayahs.'
        }
      );

      if (noteStatus === 201 && noteData.success) {
        logResult('Add Text Note', true, 'Note added successfully');
      } else {
        logResult('Add Text Note', false, noteData.error || 'Unknown error');
      }

      // Add voice note (simulated - we'll create the record)
      console.log('\n🎤 Adding voice note to highlight...');
      const { status: voiceStatus, data: voiceData } = await apiCall(
        `/api/highlights/${hlData.data.id}/notes`,
        'POST',
        teacherToken,
        {
          type: 'audio',
          audio_url: 'https://example.com/voice-notes/test-note-123.m4a'
        }
      );

      if (voiceStatus === 201 && voiceData.success) {
        logResult('Add Voice Note', true, 'Voice note added successfully');
      } else {
        logResult('Add Voice Note', false, voiceData.error || 'Unknown error');
      }

    } else {
      logResult('Create Highlight (Homework)', false, hlData.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Phase 7 Error:', error.message);
    logResult('Phase 7 Student Management', false, error.message);
  }
}

// ============================================================================
// PHASE 8: Test Student Dashboard
// ============================================================================

async function phase8_testStudentDashboard() {
  logPhase(8, 'Test Student Dashboard');

  try {
    // Authenticate as Student 1
    console.log(`\n👨‍🎓 Authenticating as ${testData.students[0].email}...`);
    const student1Token = await signIn(testData.students[0].email, testData.students[0].password);
    logResult('Student 1 Authentication', true, testData.students[0].name);

    // Get student assignments
    console.log('\n📚 Fetching student assignments...');
    const { status: assignStatus, data: assignData } = await apiCall(
      `/api/assignments?student_id=${testData.students[0].id}`,
      'GET',
      student1Token
    );

    if (assignStatus === 200 && assignData.success) {
      const hasAssignment = assignData.data.some(a => a.title === 'Memorize Surah Al-Fatiha');
      logResult('Student Dashboard - Assignments Visible', hasAssignment, `Found assignment: ${hasAssignment}`);
    } else {
      logResult('Student Dashboard - Fetch Assignments', false, assignData.error || 'Unknown error');
    }

    // Get student homework
    console.log('\n📗 Fetching student homework...');
    const { status: hwStatus, data: hwData } = await apiCall(
      `/api/homework/student/${testData.students[0].id}`,
      'GET',
      student1Token
    );

    if (hwStatus === 200 && hwData.success) {
      const hasHomework = hwData.pending_homework && hwData.pending_homework.length > 0;
      logResult('Student Dashboard - Homework Visible', hasHomework, `Pending: ${hwData.pending_homework?.length || 0}`);
    } else {
      logResult('Student Dashboard - Fetch Homework', false, hwData.error || 'Unknown error');
    }

    // Get student highlights
    console.log('\n🖍️ Fetching student highlights...');
    const { status: hlStatus, data: hlData } = await apiCall(
      `/api/highlights?student_id=${testData.students[0].id}`,
      'GET',
      student1Token
    );

    if (hlStatus === 200 && hlData.success) {
      const hasHighlights = hlData.data && hlData.data.length > 0;
      const hasNotes = hasHighlights && hlData.data.some(h => h.notes && h.notes.length > 0);
      logResult('Student Dashboard - Highlights Visible', hasHighlights, `Count: ${hlData.data?.length || 0}`);
      logResult('Student Dashboard - Notes Visible', hasNotes, `Has notes: ${hasNotes}`);
    } else {
      logResult('Student Dashboard - Fetch Highlights', false, hlData.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Phase 8 Error:', error.message);
    logResult('Phase 8 Student Dashboard', false, error.message);
  }
}

// ============================================================================
// PHASE 9: Test Parent Dashboard
// ============================================================================

async function phase9_testParentDashboard() {
  logPhase(9, 'Test Parent Dashboard');

  try {
    // Authenticate as Parent 1 (linked to Student 1 and 2)
    console.log(`\n👨‍👩‍👧‍👦 Authenticating as ${testData.parents[0].email}...`);
    const parent1Token = await signIn(testData.parents[0].email, testData.parents[0].password);
    logResult('Parent 1 Authentication', true, testData.parents[0].name);

    // Get parent's children
    console.log('\n👶 Fetching parent children...');
    const { status: childStatus, data: childData } = await apiCall(
      '/api/parents/my-children',
      'GET',
      parent1Token
    );

    if (childStatus === 200 && childData.success) {
      const childCount = childData.data.length;
      const hasMultipleChildren = childCount === 2;
      logResult('Parent Dashboard - Children Visible', hasMultipleChildren, `Child count: ${childCount} (expected: 2)`);

      // Get assignments for first child (Student 1)
      if (childData.data.length > 0) {
        const firstChild = childData.data[0];
        console.log(`\n📚 Fetching assignments for child: ${firstChild.name}...`);

        const { status: assignStatus, data: assignData } = await apiCall(
          `/api/assignments?student_id=${firstChild.id}`,
          'GET',
          parent1Token
        );

        if (assignStatus === 200 && assignData.success) {
          const hasAssignment = assignData.data.some(a => a.title === 'Memorize Surah Al-Fatiha');
          logResult('Parent Dashboard - Child Assignments Visible', hasAssignment, `Can see child assignments: ${hasAssignment}`);
        } else {
          logResult('Parent Dashboard - Fetch Child Assignments', false, assignData.error || 'Unknown error');
        }

        // Get homework for first child
        console.log(`\n📗 Fetching homework for child: ${firstChild.name}...`);

        const { status: hwStatus, data: hwData } = await apiCall(
          `/api/homework/student/${firstChild.id}`,
          'GET',
          parent1Token
        );

        if (hwStatus === 200 && hwData.success) {
          const hasHomework = hwData.pending_homework && hwData.pending_homework.length > 0;
          logResult('Parent Dashboard - Child Homework Visible', hasHomework, `Pending: ${hwData.pending_homework?.length || 0}`);
        } else {
          logResult('Parent Dashboard - Fetch Child Homework', false, hwData.error || 'Unknown error');
        }
      }
    } else {
      logResult('Parent Dashboard - Fetch Children', false, childData.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Phase 9 Error:', error.message);
    logResult('Phase 9 Parent Dashboard', false, error.message);
  }
}

// ============================================================================
// Main Test Execution
// ============================================================================

async function runAllTests() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                  PRODUCTION ECOSYSTEM COMPLETE TEST                          ║');
  console.log('║                          October 21, 2025                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  try {
    await phase1_setupEcosystem();
    await phase2_linkParents();
    await phase3_createClasses();
    await phase4_testTeacherDashboard();
    await phase5_createAssignmentsHomework();
    await phase6_testSchoolDashboard();
    await phase7_studentManagement();
    await phase8_testStudentDashboard();
    await phase9_testParentDashboard();

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
  }

  // Print final results
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const total = testResults.passed + testResults.failed;
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                            FINAL TEST RESULTS                                ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📊 Total Tests: ${total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Pass Rate: ${passRate}%`);
  console.log('');

  if (testResults.failed > 0) {
    console.log('❌ FAILED TESTS:');
    testResults.errors.forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.testName}`);
      console.log(`      ${err.details}`);
    });
    console.log('');
  }

  if (passRate === 100) {
    console.log('🎉 SUCCESS: All tests passed! Production ecosystem is functioning correctly!');
  } else if (passRate >= 80) {
    console.log('⚠️  WARNING: Most tests passed but some issues detected. Review failed tests.');
  } else {
    console.log('🚨 CRITICAL: Many tests failed. System requires significant fixes.');
  }

  console.log('');
  console.log('Test data saved:');
  console.log(`  - ${testData.teachers.length} teachers created`);
  console.log(`  - ${testData.students.length} students created`);
  console.log(`  - ${testData.parents.length} parents created`);
  console.log(`  - ${testData.classes.length} classes created`);
  console.log(`  - ${testData.assignments.length} assignments created`);
  console.log(`  - ${testData.homework.length} homework items created`);
  console.log(`  - ${testData.highlights.length} highlights created`);
  console.log('');
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
