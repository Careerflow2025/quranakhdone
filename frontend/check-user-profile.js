// Quick script to check and create user_profiles entry
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU2OTk2OSwiZXhwIjoyMDc2MTQ1OTY5fQ.dtbMQ2c0erz6yPx3dt7T7HBw89z2T6wF6CeMrkTqDrI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndCreateProfile() {
  const testEmail = 'ridaapm@gmail.com';

  console.log('🔍 Checking user_profiles for:', testEmail);

  // 1. Check if user exists in auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error listing auth users:', authError);
    return;
  }

  const authUser = authUsers.users.find(u => u.email === testEmail);

  if (!authUser) {
    console.error('❌ No auth user found for', testEmail);
    return;
  }

  console.log('✅ Auth user found:', {
    id: authUser.id,
    email: authUser.email,
    created_at: authUser.created_at,
    user_metadata: authUser.user_metadata
  });

  // 2. Check if profiles entry exists (ACTUAL TABLE IN PRODUCTION!)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', authUser.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('❌ Error checking profiles:', profileError);

    // If table doesn't exist, show what tables ARE available
    console.log('\n📋 Checking available tables...');
    const { data: tables } = await supabase.rpc('get_tables') || {};
    console.log('Available tables:', tables);

    return;
  }

  if (profile) {
    console.log('✅ Profile already exists:', profile);
    return;
  }

  console.log('⚠️  No profiles entry found. Creating one...');

  // 3. Get school_id from schools table (first school or create default)
  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select('id, name')
    .limit(1);

  if (schoolsError) {
    console.error('❌ Error fetching schools:', schoolsError);
    return;
  }

  let schoolId;

  if (!schools || schools.length === 0) {
    console.log('📝 No schools found. Creating default school...');
    const { data: newSchool, error: createSchoolError } = await supabase
      .from('schools')
      .insert({
        name: 'Default School',
        timezone: 'Africa/Casablanca'
      })
      .select()
      .single();

    if (createSchoolError) {
      console.error('❌ Error creating school:', createSchoolError);
      return;
    }

    schoolId = newSchool.id;
    console.log('✅ Created default school:', newSchool);
  } else {
    schoolId = schools[0].id;
    console.log('✅ Using existing school:', schools[0]);
  }

  // 4. Create profiles entry (using ACTUAL table structure)
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      user_id: authUser.id,
      email: authUser.email,
      display_name: authUser.user_metadata?.name || authUser.email,
      role: authUser.user_metadata?.role || 'owner',
      school_id: schoolId
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Error creating profiles entry:', insertError);
    return;
  }

  console.log('✅ Successfully created profiles entry:', newProfile);
}

checkAndCreateProfile()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
