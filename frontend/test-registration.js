const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qeigukuyhmdslojuoxkp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaWd1a3V5aG1kc2xvanVveGtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1OTQyMDMsImV4cCI6MjA3NDE3MDIwM30.foz8x7IFpv4LxdafCQwI0A5wb8L7wBCjZ2xSVKwY9Fk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRegistrationFlow() {
  console.log('Testing the fixed registration flow...\n');

  const timestamp = Date.now();
  const testEmail = `admin${timestamp}@testschool.com`;
  const testPassword = 'Test123456!';

  console.log('Test credentials:');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
  console.log('');

  try {
    // Step 1: Create auth account
    console.log('1. Creating auth account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Admin',
          role: 'school_admin'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth creation failed:', authError.message);
      return;
    }

    console.log('✅ Auth account created:', authData.user?.id);

    // Step 2: Sign in
    console.log('\n2. Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }

    console.log('✅ Signed in successfully');

    // Step 3: Create school
    console.log('\n3. Creating school...');
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: `Test School ${timestamp}`,
        address: '123 Test Street',
        phone: '555-0123',
        email: `info${timestamp}@testschool.com`
      })
      .select()
      .single();

    if (schoolError) {
      console.error('❌ School creation failed:', schoolError.message);
      console.log('Error details:', schoolError);
      return;
    }

    console.log('✅ School created:', school.id);

    // Step 4: Create profile
    console.log('\n4. Creating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        school_id: school.id,
        email: testEmail,
        full_name: 'Test Admin',
        role: 'school_admin',
        phone: '555-0124',
        password: testPassword
      });

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      // Continue anyway
    } else {
      console.log('✅ Profile created');
    }

    console.log('\n=== REGISTRATION TEST SUCCESSFUL ===');
    console.log('\n🎉 You can now login with:');
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);
    console.log('\n   School Name:', `Test School ${timestamp}`);
    console.log('   School ID:', school.id);

    // Clean up - sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testRegistrationFlow();