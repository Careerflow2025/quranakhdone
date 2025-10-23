const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testTeacherCreation() {
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
  console.log('🎫 Access Token:', authData.session.access_token.substring(0, 50) + '...');

  console.log('\n👨‍🏫 Step 2: Test Create Teacher API...');

  const teacherData = {
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@wic.edu',
    password: 'Teacher123!',
    phone: '+212-600-123456',
    subject: 'Quran & Tajweed',
    qualification: 'Master in Islamic Studies',
    experience: '5',
    address: 'Casablanca, Morocco',
    bio: 'Experienced Quran teacher specializing in Tajweed'
  };

  try {
    // Note: The API uses cookies-based auth, so we need to send cookies
    // Node.js fetch doesn't send cookies automatically, so we'll send the session manually
    const cookieHeader = `sb-rlfvubgyogkkqbjjmjwd-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;

    const response = await fetch('http://localhost:3005/api/school/create-teacher', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(teacherData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Teacher created successfully!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));

      // Verify in database
      console.log('\n🔍 Step 3: Verify teacher exists in database...');
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*, profiles!inner(*)')
        .eq('profiles.email', teacherData.email)
        .single();

      if (teacherError) {
        console.error('❌ Database verification failed:', teacherError.message);
      } else {
        console.log('✅ Teacher found in database:', teacher);
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

testTeacherCreation();
