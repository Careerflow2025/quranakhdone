const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testParentUpdate() {
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

  console.log('\n🔍 Step 2: Get Amina Al-Zahra parent details...');

  const { data: parent, error: parentError } = await supabase
    .from('parents')
    .select('*, profiles!inner(*), parent_students!inner(student_id)')
    .eq('profiles.email', 'amina.alzahra@parent.com')
    .single();

  if (parentError) {
    console.error('❌ Parent not found:', parentError.message);
    return;
  }

  console.log('✅ Parent found:', {
    id: parent.id,
    user_id: parent.user_id,
    name: parent.profiles.display_name,
    linkedStudents: parent.parent_students.length
  });

  console.log('\n✏️ Step 3: Test Update Parent API...');

  const updateData = {
    parentId: parent.id,
    userId: parent.user_id,
    name: 'Amina Al-Zahra Umm Fatima',
    studentIds: parent.parent_students.map(ps => ps.student_id)
  };

  try {
    const cookieHeader = `sb-rlfvubgyogkkqbjjmjwd-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;

    const response = await fetch('http://localhost:3006/api/school/update-parent', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Parent updated successfully!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));

      // Verify in database
      console.log('\n🔍 Step 4: Verify updates in database...');
      const { data: updatedParent, error: verifyError } = await supabase
        .from('parents')
        .select('*, profiles!inner(*), parent_students!inner(student_id)')
        .eq('id', parent.id)
        .single();

      if (verifyError) {
        console.error('❌ Verification failed:', verifyError.message);
      } else {
        console.log('✅ Updated parent data:', JSON.stringify({
          name: updatedParent.profiles.display_name,
          linkedStudents: updatedParent.parent_students.length
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

testParentUpdate();
