const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testStudentDeletion() {
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

  console.log('\n🔍 Step 2: Get Fatima student ID...');

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, profiles!inner(email, display_name)')
    .eq('profiles.email', 'fatima.alzahra@wic.edu')
    .single();

  if (studentError) {
    console.error('❌ Student not found:', studentError.message);
    return;
  }

  console.log('✅ Student found:', {
    id: student.id,
    name: student.profiles.display_name,
    email: student.profiles.email
  });

  console.log('\n🗑️ Step 3: Test Delete Student API...');

  try {
    const cookieHeader = `sb-rlfvubgyogkkqbjjmjwd-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;

    const response = await fetch('http://localhost:3006/api/school/delete-students', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify({
        studentIds: [student.id]
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Student deleted successfully!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));

      // Verify deletion in database
      console.log('\n🔍 Step 4: Verify student no longer exists...');
      const { data: deletedStudent, error: verifyError } = await supabase
        .from('students')
        .select('*')
        .eq('id', student.id)
        .single();

      if (verifyError) {
        console.log('✅ Confirmed: Student does not exist in database');
      } else {
        console.error('❌ ERROR: Student still exists!', deletedStudent);
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

testStudentDeletion();
