const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testStudentUpdate() {
  console.log('🔐 Step 1: Login as wic@gmail.com...');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'wic@gmail.com',
    password: 'Test123456!'
  });

  if (authError) {
    console.error('❌ Login failed:', authError.message);
    return;
  }

  console.log('✅ Login successful!');
  console.log('👤 User ID:', authData.user.id);

  console.log('\n🔍 Step 2: Get Fatima Al-Zahra student details...');

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*, profiles!inner(*)')
    .eq('profiles.email', 'fatima.alzahra@wic.edu')
    .single();

  if (studentError) {
    console.error('❌ Student not found:', studentError.message);
    return;
  }

  console.log('✅ Student found:', {
    id: student.id,
    user_id: student.user_id,
    name: student.profiles.display_name,
    dob: student.dob,
    gender: student.gender
  });

  console.log('\n✏️ Step 3: Test Update Student API...');

  const updateData = {
    studentId: student.id,
    userId: student.user_id,
    name: 'Fatima Al-Zahra Bint Ahmed',
    age: '11',
    gender: 'female'
  };

  try {
    const cookieHeader = `sb-rlfvubgyogkkqbjjmjwd-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;

    const response = await fetch('http://localhost:3006/api/school/update-student', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Student updated successfully!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));

      // Verify in database
      console.log('\n🔍 Step 4: Verify updates in database...');
      const { data: updatedStudent, error: verifyError } = await supabase
        .from('students')
        .select('*, profiles!inner(*)')
        .eq('id', student.id)
        .single();

      if (verifyError) {
        console.error('❌ Verification failed:', verifyError.message);
      } else {
        console.log('✅ Updated student data:', JSON.stringify({
          name: updatedStudent.profiles.display_name,
          dob: updatedStudent.dob,
          gender: updatedStudent.gender
        }, null, 2));
      }
    } else {
      console.error('❌ API Error:', response.status, result);
    }
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }

  // Logout
  await supabase.auth.signOut();
  console.log('\n👋 Logged out');
}

testStudentUpdate();
