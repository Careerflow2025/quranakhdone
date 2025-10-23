// Direct API Test - Create Teacher Account
// Date: 2025-10-21
// Purpose: Bypass UI, use working API directly to create teacher account

const TEST_URL = 'http://localhost:3013';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

const TEACHER_DATA = {
  name: 'API Teacher Hassan',
  email: 'api.teacher@quranakh.test',
  password: 'ApiTeacher123!',
  phone: '+1234567890',
  qualifications: 'Ijazah in Hafs, 10 years experience',
  experience: '10 years'
};

async function testDirectAPI() {
  console.log('\n🎯 DIRECT API TEACHER CREATION TEST');
  console.log('='.repeat(70));
  console.log('Strategy: Use /api/auth/create-teacher endpoint directly');
  console.log('Expected: Real database record + auth account creation\n');

  try {
    // Step 1: Get owner session token
    console.log('🔐 Step 1: Login as owner to get auth token...');
    const loginRes = await fetch(`${TEST_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: OWNER_EMAIL,
        password: OWNER_PASSWORD,
        role: 'school'  // Owner role
      })
    });

    const loginData = await loginRes.json();

    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.error}`);
    }

    const accessToken = loginData.session?.access_token;
    if (!accessToken) {
      throw new Error('No access token received from login');
    }

    console.log('✅ Login successful');
    console.log(`   Access token: ${accessToken.substring(0, 20)}...`);
    console.log(`   User ID: ${loginData.user?.id}\n`);

    // Step 2: Create teacher account via API
    console.log('📡 Step 2: Call /api/auth/create-teacher...');
    console.log('   Request payload:');
    console.log(`   - Name: ${TEACHER_DATA.name}`);
    console.log(`   - Email: ${TEACHER_DATA.email}`);
    console.log(`   - Password: ${TEACHER_DATA.password}`);
    console.log(`   - Phone: ${TEACHER_DATA.phone}`);
    console.log(`   - Qualifications: ${TEACHER_DATA.qualifications}\n`);

    const createRes = await fetch(`${TEST_URL}/api/auth/create-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(TEACHER_DATA)
    });

    const createData = await createRes.json();

    console.log('📊 API Response:');
    console.log(`   Status: ${createRes.status}`);
    console.log(`   Success: ${createData.success ? '✅ YES' : '❌ NO'}`);

    if (!createData.success) {
      console.log(`   Error: ${createData.error}`);
      if (createData.details) {
        console.log(`   Details: ${JSON.stringify(createData.details, null, 2)}`);
      }
      throw new Error(`API returned success=false: ${createData.error}`);
    }

    console.log('\n✅ TEACHER ACCOUNT CREATED SUCCESSFULLY!');
    console.log('\n📋 Created Credentials:');
    console.log('='.repeat(70));
    console.log(`   Email: ${createData.credentials?.email || createData.teacher?.email}`);
    console.log(`   Password: ${createData.credentials?.password || TEACHER_DATA.password}`);
    console.log(`   Teacher ID: ${createData.teacher?.id}`);
    console.log(`   Login URL: ${createData.credentials?.loginUrl || `${TEST_URL}/login`}`);

    // Step 3: Verify database record
    console.log('\n🔍 Step 3: Verify database record...');

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, email, display_name, role')
      .eq('email', TEACHER_DATA.email);

    if (profileError) {
      console.log(`⚠️  Profile query error: ${profileError.message}`);
    } else if (profiles && profiles.length > 0) {
      console.log('✅ Profile record found:');
      console.log(`   User ID: ${profiles[0].user_id}`);
      console.log(`   Email: ${profiles[0].email}`);
      console.log(`   Name: ${profiles[0].display_name}`);
      console.log(`   Role: ${profiles[0].role}`);
    } else {
      console.log('⚠️  No profile record found');
    }

    const { data: teachers, error: teacherError } = await supabase
      .from('teachers')
      .select('id, user_id')
      .eq('user_id', profiles?.[0]?.user_id || createData.teacher?.user_id);

    if (teacherError) {
      console.log(`⚠️  Teacher query error: ${teacherError.message}`);
    } else if (teachers && teachers.length > 0) {
      console.log('✅ Teacher record found:');
      console.log(`   Teacher ID: ${teachers[0].id}`);
      console.log(`   User ID: ${teachers[0].user_id}`);
    } else {
      console.log('⚠️  No teacher record found');
    }

    // Step 4: Test login
    console.log('\n🔓 Step 4: Test login with created credentials...');

    const teacherLoginRes = await fetch(`${TEST_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEACHER_DATA.email,
        password: TEACHER_DATA.password,
        role: 'teacher'  // Teacher role
      })
    });

    const teacherLoginData = await teacherLoginRes.json();

    if (teacherLoginData.success) {
      console.log('✅ Teacher login successful!');
      console.log(`   User ID: ${teacherLoginData.user?.id}`);
      console.log(`   Email: ${teacherLoginData.user?.email}`);
      console.log(`   Role: ${teacherLoginData.user?.role}`);
    } else {
      console.log('❌ Teacher login failed:');
      console.log(`   Error: ${teacherLoginData.error}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ API DIRECT TEST COMPLETE');
    console.log('='.repeat(70));
    console.log('\nNext: Test teacher dashboard with browser automation\n');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testDirectAPI();
