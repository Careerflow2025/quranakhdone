// Check Owner Profile in Database
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOwner() {
  console.log('\n🔍 OWNER PROFILE CHECK');
  console.log('='.repeat(70) + '\n');

  const OWNER_EMAIL = 'wic@gmail.com';

  // Check auth.users table
  console.log('1. Checking auth.users table...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log('❌ Error listing users:', authError.message);
  } else {
    const ownerAuth = authUsers.users.find(u => u.email === OWNER_EMAIL);
    if (ownerAuth) {
      console.log('✅ Found in auth.users:');
      console.log(`   User ID: ${ownerAuth.id}`);
      console.log(`   Email: ${ownerAuth.email}`);
      console.log(`   Created: ${ownerAuth.created_at}`);
    } else {
      console.log('❌ NOT found in auth.users');
    }
  }

  // Check profiles table
  console.log('\n2. Checking profiles table...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', OWNER_EMAIL);

  if (profileError) {
    console.log('❌ Error querying profiles:', profileError.message);
  } else if (profiles && profiles.length > 0) {
    console.log('✅ Found in profiles:');
    profiles.forEach(p => {
      console.log(`   ID: ${p.id || p.user_id}`);
      console.log(`   Email: ${p.email}`);
      console.log(`   Name: ${p.display_name || p.name}`);
      console.log(`   Role: ${p.role}`);
      console.log(`   School ID: ${p.school_id}`);
    });
  } else {
    console.log('❌ NOT found in profiles table');
  }

  // List all profiles to see what exists
  console.log('\n3. All profiles in database:');
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('email, display_name, role')
    .limit(10);

  if (allProfiles && allProfiles.length > 0) {
    allProfiles.forEach(p => {
      console.log(`   - ${p.email} (${p.role}) - ${p.display_name}`);
    });
  } else {
    console.log('   (Empty - no profiles exist)');
  }

  console.log('\n');
}

checkOwner();
