const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testTeacherDeletion() {
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

  console.log('\n🔍 Step 2: Get Ahmed teacher ID...');

  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('id, profiles!inner(email, display_name)')
    .eq('profiles.email', 'ahmed.hassan@wic.edu')
    .single();

  if (teacherError) {
    console.error('❌ Teacher not found:', teacherError.message);
    return;
  }

  console.log('✅ Teacher found:', {
    id: teacher.id,
    name: teacher.profiles.display_name,
    email: teacher.profiles.email
  });

  console.log('\n🗑️ Step 3: Test Delete Teacher API...');

  try {
    const cookieHeader = `sb-rlfvubgyogkkqbjjmjwd-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;

    const response = await fetch('http://localhost:3006/api/school/delete-teachers', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify({
        teacherIds: [teacher.id]
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Teacher deleted successfully!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));

      // Verify deletion in database
      console.log('\n🔍 Step 4: Verify teacher no longer exists...');
      const { data: deletedTeacher, error: verifyError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacher.id)
        .single();

      if (verifyError) {
        console.log('✅ Confirmed: Teacher does not exist in database');
      } else {
        console.error('❌ ERROR: Teacher still exists!', deletedTeacher);
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

testTeacherDeletion();
