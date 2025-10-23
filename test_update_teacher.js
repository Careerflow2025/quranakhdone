const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testTeacherUpdate() {
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

  console.log('\n🔍 Step 2: Get Ahmed Hassan teacher details...');

  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('*, profiles!inner(*)')
    .eq('profiles.email', 'ahmed.hassan@wic.edu')
    .single();

  if (teacherError) {
    console.error('❌ Teacher not found:', teacherError.message);
    return;
  }

  console.log('✅ Teacher found:', {
    id: teacher.id,
    user_id: teacher.user_id,
    name: teacher.profiles.display_name,
    bio: teacher.bio,
    active: teacher.active
  });

  console.log('\n✏️ Step 3: Test Update Teacher API...');

  const updateData = {
    teacherId: teacher.id,
    userId: teacher.user_id,
    name: 'Ahmed Hassan Al-Qari',
    bio: 'Senior Quran teacher with 10+ years experience in Tajweed and Quranic sciences. Certified Hafiz with Ijazah in multiple Qira\'at.',
    active: true
  };

  try {
    const cookieHeader = `sb-rlfvubgyogkkqbjjmjwd-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;

    const response = await fetch('http://localhost:3006/api/school/update-teacher', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Teacher updated successfully!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));

      // Verify in database
      console.log('\n🔍 Step 4: Verify updates in database...');
      const { data: updatedTeacher, error: verifyError } = await supabase
        .from('teachers')
        .select('*, profiles!inner(*)')
        .eq('id', teacher.id)
        .single();

      if (verifyError) {
        console.error('❌ Verification failed:', verifyError.message);
      } else {
        console.log('✅ Updated teacher data:', JSON.stringify({
          name: updatedTeacher.profiles.display_name,
          bio: updatedTeacher.bio,
          active: updatedTeacher.active
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

testTeacherUpdate();
