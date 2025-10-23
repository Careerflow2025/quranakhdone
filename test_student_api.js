const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testStudentCreation() {
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

  console.log('\n👨‍🎓 Step 2: Test Create Student API...');

  const studentData = {
    name: 'Fatima Al-Zahra',
    email: 'fatima.alzahra@wic.edu',
    age: '10',
    gender: 'female'
  };

  try {
    const cookieHeader = `sb-rlfvubgyogkkqbjjmjwd-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;

    const response = await fetch('http://localhost:3006/api/school/create-student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(studentData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Student created successfully!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));

      // Verify in database
      console.log('\n🔍 Step 3: Verify student exists in database...');
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*, profiles!inner(*)')
        .eq('profiles.email', studentData.email)
        .single();

      if (studentError) {
        console.error('❌ Database verification failed:', studentError.message);
      } else {
        console.log('✅ Student found in database:', JSON.stringify(student, null, 2));
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

testStudentCreation();
