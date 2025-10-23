const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testParentDeletion() {
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

  console.log('\n🔍 Step 2: Get Amina parent ID...');

  const { data: parent, error: parentError } = await supabase
    .from('parents')
    .select('id, profiles!inner(email, display_name)')
    .eq('profiles.email', 'amina.alzahra@parent.com')
    .single();

  if (parentError) {
    console.error('❌ Parent not found:', parentError.message);
    return;
  }

  console.log('✅ Parent found:', {
    id: parent.id,
    name: parent.profiles.display_name,
    email: parent.profiles.email
  });

  console.log('\n🗑️ Step 3: Test Delete Parent API...');

  try {
    const cookieHeader = `sb-rlfvubgyogkkqbjjmjwd-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;

    const response = await fetch('http://localhost:3006/api/school/delete-parents', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify({
        parentIds: [parent.id]
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Parent deleted successfully!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));

      // Verify deletion in database
      console.log('\n🔍 Step 4: Verify parent no longer exists...');
      const { data: deletedParent, error: verifyError } = await supabase
        .from('parents')
        .select('*')
        .eq('id', parent.id)
        .single();

      if (verifyError) {
        console.log('✅ Confirmed: Parent does not exist in database');
      } else {
        console.error('❌ ERROR: Parent still exists!', deletedParent);
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

testParentDeletion();
