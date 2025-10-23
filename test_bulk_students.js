const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testBulkStudents() {
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

  console.log('\n👥 Step 2: Test Bulk Create Students API (5 students)...');

  const studentsData = {
    students: [
      {
        name: 'Hassan Ali',
        email: 'hassan.ali@wic.edu',
        age: '12',
        gender: 'male'
      },
      {
        name: 'Maryam Yusuf',
        email: 'maryam.yusuf@wic.edu',
        age: '10',
        gender: 'female'
      },
      {
        name: 'Abdullah Rahman',
        email: 'abdullah.rahman@wic.edu',
        age: '11',
        gender: 'male'
      },
      {
        name: 'Zainab Ahmed',
        email: 'zainab.ahmed@wic.edu',
        age: '9',
        gender: 'female'
      },
      {
        name: 'Ibrahim Khalil',
        email: 'ibrahim.khalil@wic.edu',
        age: '13',
        gender: 'male'
      }
    ]
  };

  try {
    const cookieHeader = `sb-rlfvubgyogkkqbjjmjwd-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;

    const response = await fetch('http://localhost:3007/api/school/bulk-create-students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(studentsData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Bulk students creation completed!');
      console.log('📊 Summary:', JSON.stringify(result.summary, null, 2));
      console.log('📋 Results (with passwords):', JSON.stringify(result.results, null, 2));

      // Verify in database
      console.log('\n🔍 Step 3: Verify students in database...');
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*, profiles!inner(email, display_name)')
        .in('profiles.email', studentsData.students.map(s => s.email));

      if (studentsError) {
        console.error('❌ Database verification failed:', studentsError.message);
      } else {
        console.log(`✅ Found ${students.length} students in database`);
        students.forEach(s => {
          console.log(`  - ${s.profiles.display_name} (${s.profiles.email})`);
        });
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

testBulkStudents();
