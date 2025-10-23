const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testBulkTeachers() {
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

  console.log('\n👥 Step 2: Test Bulk Create Teachers API (3 teachers)...');

  const teachersData = {
    teachers: [
      {
        name: 'Khalid Ibn Walid',
        email: 'khalid.walid@wic.edu',
        password: 'Teacher123!',
        bio: 'Expert in Quran recitation and memorization'
      },
      {
        name: 'Aisha Bint Abu Bakr',
        email: 'aisha.abubakar@wic.edu',
        password: 'Teacher123!',
        bio: 'Specialist in Tajweed and Qira\'at'
      },
      {
        name: 'Umar Al-Faruq',
        email: 'umar.faruq@wic.edu',
        password: 'Teacher123!',
        bio: 'Islamic studies and Quran teacher with 15 years experience'
      }
    ]
  };

  try {
    const cookieHeader = `sb-rlfvubgyogkkqbjjmjwd-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;

    const response = await fetch('http://localhost:3007/api/school/bulk-create-teachers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(teachersData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Bulk teachers creation completed!');
      console.log('📊 Summary:', JSON.stringify(result.summary, null, 2));
      console.log('📋 Results:', JSON.stringify(result.results, null, 2));

      // Verify in database
      console.log('\n🔍 Step 3: Verify teachers in database...');
      const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('*, profiles!inner(email, display_name)')
        .in('profiles.email', teachersData.teachers.map(t => t.email));

      if (teachersError) {
        console.error('❌ Database verification failed:', teachersError.message);
      } else {
        console.log(`✅ Found ${teachers.length} teachers in database`);
        teachers.forEach(t => {
          console.log(`  - ${t.profiles.display_name} (${t.profiles.email})`);
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

testBulkTeachers();
