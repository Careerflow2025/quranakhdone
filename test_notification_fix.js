// Quick test to verify notification bug fix
require('dotenv').config({ path: './frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3020';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testNotificationFix() {
  console.log('\n🧪 TESTING NOTIFICATION BUG FIX\n');

  try {
    // 1. Authenticate as owner
    console.log('1️⃣  Authenticating...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD
    });

    if (authError) throw new Error(`Auth failed: ${authError.message}`);
    const ownerToken = authData.session.access_token;
    console.log('✅ Authenticated');

    // 2. Get school_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('user_id', authData.user.id)
      .single();

    const schoolId = profile.school_id;
    console.log(`✅ School ID: ${schoolId}`);

    // 3. Create a teacher
    console.log('\n2️⃣  Creating test teacher...');
    const teacherRes = await fetch(`${BASE_URL}/api/school/create-teacher`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Teacher Notif',
        email: `teacher.notif.${Date.now()}@test.com`,
        password: 'Test123456!'
      })
    });

    const teacherData = await teacherRes.json();
    if (!teacherData.success) throw new Error(`Teacher creation failed: ${JSON.stringify(teacherData)}`);

    const teacherId = teacherData.data.teacher.id;
    const teacherToken = teacherData.data.auth.access_token;
    console.log(`✅ Teacher created: ${teacherId}`);

    // 4. Create a student
    console.log('\n3️⃣  Creating test student...');
    const studentRes = await fetch(`${BASE_URL}/api/school/create-student`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Student Notif',
        email: `student.notif.${Date.now()}@test.com`,
        password: 'Test123456!'
      })
    });

    const studentData = await studentRes.json();
    if (!studentData.success) throw new Error(`Student creation failed: ${JSON.stringify(studentData)}`);

    const studentId = studentData.data.student.id;
    console.log(`✅ Student created: ${studentId}`);

    // 5. CREATE HOMEWORK - This is the critical test!
    console.log('\n4️⃣  Creating homework (CRITICAL TEST)...');
    const homeworkRes = await fetch(`${BASE_URL}/api/homework`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${teacherToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        student_id: studentId,
        surah: 1,
        ayah_start: 1,
        ayah_end: 7,
        note: 'Test notification fix',
        type: 'recap'
      })
    });

    const homeworkData = await homeworkRes.json();

    if (homeworkData.success) {
      console.log('✅ HOMEWORK CREATED SUCCESSFULLY!');
      console.log(`   Homework ID: ${homeworkData.data.id}`);
      console.log('\n🎉 SUCCESS: No notification errors detected!');
      console.log('   The notification bug has been FIXED! ✓');
      return true;
    } else {
      console.log('❌ HOMEWORK CREATION FAILED:');
      console.log(JSON.stringify(homeworkData, null, 2));
      return false;
    }

  } catch (error) {
    console.log(`\n❌ TEST FAILED: ${error.message}`);
    return false;
  }
}

testNotificationFix()
  .then(success => {
    console.log(`\n${success ? '✅' : '❌'} Test ${success ? 'PASSED' : 'FAILED'}\n`);
    process.exit(success ? 0 : 1);
  });
