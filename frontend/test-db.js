const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qeigukuyhmdslojuoxkp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaWd1a3V5aG1kc2xvanVveGtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1OTQyMDMsImV4cCI6MjA3NDE3MDIwM30.foz8x7IFpv4LxdafCQwI0A5wb8L7wBCjZ2xSVKwY9Fk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabase() {
  console.log('Testing Supabase connection...\n');

  // Test 1: Check if schools table exists
  console.log('1. Checking schools table...');
  const { data: schools, error: schoolError } = await supabase
    .from('schools')
    .select('*')
    .limit(5);

  if (schoolError) {
    console.error('❌ Schools table error:', schoolError.message);
  } else {
    console.log('✅ Schools table accessible. Found', schools.length, 'schools');
  }

  // Test 2: Check if profiles table exists
  console.log('\n2. Checking profiles table...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);

  if (profileError) {
    console.error('❌ Profiles table error:', profileError.message);
  } else {
    console.log('✅ Profiles table accessible. Found', profiles.length, 'profiles');
  }

  // Test 3: Try to create a test school (will rollback)
  console.log('\n3. Testing school creation...');
  const testSchool = {
    name: 'Test School ' + Date.now(),
    email: 'test@example.com',
    phone: '1234567890',
    address: 'Test Address',
    timezone: 'America/New_York',
    settings: {
      features: {
        quranHighlights: true,
        attendance: true,
        messaging: true,
        reports: true
      }
    }
  };

  const { data: newSchool, error: createError } = await supabase
    .from('schools')
    .insert(testSchool)
    .select()
    .single();

  if (createError) {
    console.error('❌ Cannot create school:', createError.message);
    console.error('   Error details:', createError);
  } else {
    console.log('✅ School creation works! Created school ID:', newSchool.id);

    // Clean up - delete the test school
    const { error: deleteError } = await supabase
      .from('schools')
      .delete()
      .eq('id', newSchool.id);

    if (!deleteError) {
      console.log('   (Test school cleaned up)');
    }
  }

  // Test 4: Check authentication
  console.log('\n4. Testing authentication...');
  const { data: authUser, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser.user) {
    console.log('⚠️  No authenticated user (this is normal for anon access)');
  } else {
    console.log('✅ Authenticated as:', authUser.user.email);
  }

  // Test 5: Check if we can sign up a new user
  console.log('\n5. Testing user signup...');
  const testEmail = `test${Date.now()}@example.com`;
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!',
    options: {
      data: {
        full_name: 'Test User',
        role: 'school_admin'
      }
    }
  });

  if (signupError) {
    console.error('❌ Cannot sign up new user:', signupError.message);
  } else {
    console.log('✅ User signup works! User ID:', signupData.user?.id);
  }

  console.log('\n=== Database Test Complete ===\n');

  // Summary
  console.log('SUMMARY:');
  if (!schoolError && !profileError) {
    console.log('✅ Database tables are accessible');
  }
  if (!createError) {
    console.log('✅ Can create new schools');
  }
  if (!signupError) {
    console.log('✅ Can create new users');
  }

  if (schoolError || profileError || createError || signupError) {
    console.log('\n⚠️  Some operations failed. Check Supabase dashboard:');
    console.log('   1. Ensure tables are created');
    console.log('   2. Check Row Level Security (RLS) policies');
    console.log('   3. Ensure anonymous authentication is enabled');
  }
}

testDatabase().catch(console.error);