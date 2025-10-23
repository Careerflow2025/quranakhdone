const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testParentCreation() {
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

  console.log('\n👨‍👩‍👧 Step 2: Test Create Parent API (linked to Fatima)...');

  const parentData = {
    name: 'Amina Al-Zahra',
    email: 'amina.alzahra@parent.com',
    password: 'Parent123!',
    studentIds: ['d597bd89-4719-496f-8fd5-025e329dcd3b'] // Fatima's student ID
  };

  try {
    const cookieHeader = `sb-rlfvubgyogkkqbjjmjwd-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;

    const response = await fetch('http://localhost:3006/api/school/create-parent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(parentData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Parent created successfully!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));

      // Verify in database
      console.log('\n🔍 Step 3: Verify parent exists in database...');
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .select('*, profiles!inner(*)')
        .eq('profiles.email', parentData.email)
        .single();

      if (parentError) {
        console.error('❌ Database verification failed:', parentError.message);
      } else {
        console.log('✅ Parent found in database:', JSON.stringify(parent, null, 2));
      }

      // Verify parent-student linkage
      console.log('\n🔗 Step 4: Verify parent-student linkage...');
      const { data: links, error: linkError } = await supabase
        .from('parent_students')
        .select('*, students!inner(*, profiles!inner(*))')
        .eq('parent_id', result.data.id);

      if (linkError) {
        console.error('❌ Link verification failed:', linkError.message);
      } else {
        console.log('✅ Parent-student links found:', JSON.stringify(links, null, 2));
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

testParentCreation();
