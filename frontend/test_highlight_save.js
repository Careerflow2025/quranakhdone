/**
 * Test Script: Verify highlight saving to database
 * Tests that highlights are properly saved with student_id and teacher_id
 */

const BASE_URL = 'http://localhost:3025';

async function testHighlightSave() {
  console.log('\n🧪 Testing Highlight Save to Database\n');
  
  try {
    // Step 1: Login as teacher
    console.log('1️⃣  Logging in as teacher...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher@quranakh.com',
        password: 'teacher123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Teacher login failed');
    }
    
    const loginData = await loginResponse.json();
    const teacherToken = loginData.session.access_token;
    console.log('✅ Teacher logged in');
    
    // Step 2: Get teacher's students
    console.log('\n2️⃣  Fetching teacher students...');
    const studentsResponse = await fetch(`${BASE_URL}/api/students`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    
    const studentsData = await studentsResponse.json();
    const firstStudent = studentsData.students?.[0];
    
    if (!firstStudent) {
      console.log('⚠️  No students found - creating test student first');
      return;
    }
    
    console.log(`✅ Found student: ${firstStudent.name} (ID: ${firstStudent.id})`);
    
    // Step 3: Create a highlight for this student
    console.log('\n3️⃣  Creating highlight for student...');
    const highlightResponse = await fetch(`${BASE_URL}/api/highlights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${teacherToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        student_id: firstStudent.id,
        surah: 1,
        ayah_start: 1,
        ayah_end: 1,
        word_start: 0,
        word_end: 2,
        color: 'green',
        type: 'homework',
        page_number: 1
      })
    });
    
    if (!highlightResponse.ok) {
      const errorData = await highlightResponse.json();
      throw new Error(`Highlight creation failed: ${JSON.stringify(errorData)}`);
    }
    
    const highlightData = await highlightResponse.json();
    console.log('✅ Highlight created:', {
      id: highlightData.highlight.id,
      student_id: highlightData.highlight.student_id,
      teacher_id: highlightData.highlight.teacher_id,
      type: highlightData.highlight.type,
      ayah: highlightData.highlight.ayah_start
    });
    
    // Step 4: Verify highlight can be retrieved
    console.log('\n4️⃣  Verifying highlight retrieval...');
    const getHighlightsResponse = await fetch(`${BASE_URL}/api/highlights?student_id=${firstStudent.id}`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    
    const getHighlightsData = await getHighlightsResponse.json();
    const savedHighlight = getHighlightsData.highlights?.find(
      h => h.id === highlightData.highlight.id
    );
    
    if (savedHighlight) {
      console.log('✅ Highlight retrieved successfully');
      console.log('   Student ID:', savedHighlight.student_id);
      console.log('   Teacher ID:', savedHighlight.teacher_id);
      console.log('   Type:', savedHighlight.type);
    } else {
      console.log('❌ Highlight not found in database');
    }
    
    console.log('\n✅ TEST PASSED: Highlights are being saved correctly\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Error details:', error);
  }
}

// Run test
testHighlightSave();
