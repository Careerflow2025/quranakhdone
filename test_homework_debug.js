/**
 * Debug Script for Homework Creation
 * Purpose: Get detailed error information from homework creation endpoint
 */

const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3013';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function debugHomeworkCreation() {
  console.log('🔍 DEBUG: Starting homework creation debug...\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Authenticate as owner
  console.log('1️⃣  Authenticating as owner...');
  const { data: ownerAuth, error: ownerError } = await supabase.auth.signInWithPassword({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD
  });

  if (ownerError) {
    console.error('❌ Owner auth failed:', ownerError.message);
    return;
  }

  const ownerToken = ownerAuth.session.access_token;
  console.log('✅ Owner authenticated');

  // 2. Create teacher
  console.log('\n2️⃣  Creating teacher...');
  const timestamp = Date.now();
  const teacherEmail = `teacher.debug.${timestamp}@quranakh.test`;

  const teacherRes = await fetch(`${BASE_URL}/api/school/create-teacher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      name: 'Debug Teacher',
      email: teacherEmail,
      password: 'TestPass123!',
      bio: 'Debug teacher for homework testing',
    }),
  });

  const teacherData = await teacherRes.json();
  if (!teacherData.success) {
    console.error('❌ Teacher creation failed:', teacherData.error);
    return;
  }

  const teacherId = teacherData.data.id;
  console.log('✅ Teacher created:', teacherId);

  // 3. Authenticate as teacher
  console.log('\n3️⃣  Authenticating as teacher...');
  const { data: teacherAuth, error: teacherAuthError } = await supabase.auth.signInWithPassword({
    email: teacherEmail,
    password: teacherData.data.password
  });

  if (teacherAuthError) {
    console.error('❌ Teacher auth failed:', teacherAuthError.message);
    return;
  }

  const teacherToken = teacherAuth.session.access_token;
  console.log('✅ Teacher authenticated');

  // 4. Create student
  console.log('\n4️⃣  Creating student...');
  const studentEmail = `student.debug.${timestamp}@quranakh.test`;

  const studentRes = await fetch(`${BASE_URL}/api/school/create-student`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      name: 'Debug Student',
      email: studentEmail,
      password: 'TestPass123!',
      dob: '2010-01-01',
      gender: 'male',
    }),
  });

  const studentData = await studentRes.json();
  if (!studentData.success) {
    console.error('❌ Student creation failed:', studentData.error);
    return;
  }

  const studentId = studentData.data.id;
  console.log('✅ Student created:', studentId);

  // 5. Attempt to create homework with detailed request logging
  console.log('\n5️⃣  Creating homework...');
  console.log('Request details:');
  console.log('  URL:', `${BASE_URL}/api/homework`);
  console.log('  Method: POST');
  console.log('  Auth: Bearer <token>');

  const homeworkPayload = {
    student_id: studentId,
    surah: 1,
    ayah_start: 1,
    ayah_end: 7,
    page_number: 1,
    note: 'Debug homework',
    type: 'memorization',
  };
  console.log('  Payload:', JSON.stringify(homeworkPayload, null, 2));

  const homeworkRes = await fetch(`${BASE_URL}/api/homework`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`,
    },
    body: JSON.stringify(homeworkPayload),
  });

  console.log('\nResponse status:', homeworkRes.status);
  console.log('Response headers:', Object.fromEntries(homeworkRes.headers.entries()));

  const homeworkData = await homeworkRes.json();
  console.log('\nResponse body:');
  console.log(JSON.stringify(homeworkData, null, 2));

  if (homeworkData.success) {
    console.log('\n✅ SUCCESS: Homework created!');
  } else {
    console.log('\n❌ FAILED: Homework creation failed');
    console.log('Error message:', homeworkData.error);
    console.log('Error code:', homeworkData.code);
    if (homeworkData.details) {
      console.log('Error details:', JSON.stringify(homeworkData.details, null, 2));
    }
  }
}

debugHomeworkCreation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
