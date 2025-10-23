/**
 * Debug Teacher Creation
 * Purpose: See exact error response from teacher creation endpoint
 */

const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3013';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function debugTeacherCreation() {
  console.log('🔍 DEBUG: Teacher Creation Endpoint\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Authenticate as owner
  console.log('1️⃣  Authenticating as owner...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD
  });

  if (authError) {
    console.error('❌ Owner auth failed:', authError.message);
    return;
  }

  const ownerToken = authData.session.access_token;
  console.log('✅ Owner authenticated');
  console.log('   User ID:', authData.user.id);
  console.log('   Email:', authData.user.email);
  console.log('   Token (first 50 chars):', ownerToken.substring(0, 50) + '...');

  // 2. Get school ID
  console.log('\n2️⃣  Getting school ID...');
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('user_id', authData.user.id)
    .single();

  if (profileError || !profileData) {
    console.error('❌ Profile fetch failed:', profileError?.message || 'Unknown');
    return;
  }

  const schoolId = profileData.school_id;
  console.log('✅ School ID:', schoolId);

  // 3. Attempt to create teacher with detailed request logging
  console.log('\n3️⃣  Creating teacher...');
  const timestamp = Date.now();
  const teacherEmail = `teacher.debug.${timestamp}@quranakh.test`;

  const teacherPayload = {
    name: 'Debug Teacher',
    email: teacherEmail,
    password: 'TestPass123!',
    bio: 'Debug teacher for testing',
  };

  console.log('\nRequest details:');
  console.log('  URL:', `${BASE_URL}/api/school/create-teacher`);
  console.log('  Method: POST');
  console.log('  Headers:');
  console.log('    Content-Type: application/json');
  console.log('    Authorization: Bearer', ownerToken.substring(0, 30) + '...');
  console.log('  Payload:', JSON.stringify(teacherPayload, null, 2));

  const teacherRes = await fetch(`${BASE_URL}/api/school/create-teacher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: JSON.stringify(teacherPayload),
  });

  console.log('\nResponse status:', teacherRes.status);
  console.log('Response status text:', teacherRes.statusText);
  console.log('Response headers:', Object.fromEntries(teacherRes.headers.entries()));

  const teacherData = await teacherRes.json();
  console.log('\nResponse body:');
  console.log(JSON.stringify(teacherData, null, 2));

  if (teacherData.success) {
    console.log('\n✅ SUCCESS: Teacher created!');
    console.log('   Teacher ID:', teacherData.data?.id);
    console.log('   Teacher Email:', teacherData.data?.email);
  } else {
    console.log('\n❌ FAILED: Teacher creation failed');
    console.log('   Error:', teacherData.error);
    console.log('   Code:', teacherData.code);
    if (teacherData.details) {
      console.log('   Details:', JSON.stringify(teacherData.details, null, 2));
    }
  }
}

debugTeacherCreation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
