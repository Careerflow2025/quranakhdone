const TEST_URL = 'http://localhost:3014';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testTeacherAPI() {
  console.log('\n🧪 Testing Teacher API on Port 3014\n');

  // Login as owner
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD
  });

  if (authError) {
    console.error('❌ Owner login failed:', authError.message);
    return;
  }

  console.log('✅ Owner authenticated');

  // Call API
  const response = await fetch(`${TEST_URL}/api/auth/create-teacher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.session.access_token}`
    },
    body: JSON.stringify({
      name: 'Test Teacher',
      email: `test.teacher.${Date.now()}@test.com`,
      password: 'Test123456!',
      phone: '+1234567890',
      subject: 'Quran',
      qualification: 'Ijazah',
      experience: '5 years'
    })
  });

  const result = await response.json();

  console.log(`\nResponse Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(result, null, 2));

  await supabase.auth.signOut();
}

testTeacherAPI();
