/**
 * Debug Profile Query
 * Investigate why profile query is returning null
 */

const { createClient } = require('@supabase/supabase-js');

const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function debugProfile() {
  console.log('🔍 Debugging Profile Query\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Authenticate
  console.log(`🔐 Authenticating as: ${OWNER_EMAIL}`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD
  });

  if (authError) {
    console.error('❌ Auth Error:', authError.message);
    return;
  }

  console.log('✅ Authentication successful');
  console.log('User ID:', authData.user.id);
  console.log('Email:', authData.user.email);

  // Try to get profile
  console.log('\n📋 Querying profile by email...');
  const { data: profileByEmail, error: profileByEmailError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', OWNER_EMAIL)
    .single();

  console.log('Profile by email result:');
  console.log('Data:', profileByEmail);
  console.log('Error:', profileByEmailError);

  // Try by user_id
  console.log('\n📋 Querying profile by user_id...');
  const { data: profileByUserId, error: profileByUserIdError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', authData.user.id)
    .single();

  console.log('Profile by user_id result:');
  console.log('Data:', profileByUserId);
  console.log('Error:', profileByUserIdError);

  // List all profiles
  console.log('\n📋 Listing all profiles...');
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('profiles')
    .select('user_id, email, role, school_id')
    .limit(10);

  console.log('All profiles result:');
  console.log('Count:', allProfiles?.length || 0);
  console.log('Data:', allProfiles);
  console.log('Error:', allProfilesError);
}

debugProfile().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
