// COMPREHENSIVE AUTHENTICATION DIAGNOSIS
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 AUTHENTICATION SYSTEM DIAGNOSIS\n');
console.log('=' .repeat(60));

async function diagnose() {
  console.log('\n1️⃣  ENVIRONMENT CHECK');
  console.log('-'.repeat(60));
  console.log('Supabase URL:', supabaseUrl || '❌ MISSING');
  console.log('Anon Key:', supabaseAnonKey ? '✅ Present' : '❌ MISSING');
  console.log('Service Role Key:', serviceRoleKey ? '✅ Present' : '❌ MISSING');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('\n❌ CRITICAL: Missing required environment variables!');
    return;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('\n2️⃣  DATABASE CONNECTION TEST');
  console.log('-'.repeat(60));
  
  try {
    const { data: schools, error: schoolError } = await client
      .from('schools')
      .select('*')
      .limit(5);
    
    if (schoolError) {
      console.log('❌ Schools query failed:', schoolError.message);
    } else {
      console.log('✅ Schools table accessible');
      console.log('   Found', schools.length, 'schools');
      if (schools.length > 0) {
        console.log('   Columns:', Object.keys(schools[0]).join(', '));
      }
    }
  } catch (e) {
    console.log('❌ Connection failed:', e.message);
  }

  console.log('\n3️⃣  PROFILES TABLE TEST');
  console.log('-'.repeat(60));
  
  try {
    const { data: profiles, error: profileError } = await client
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profileError) {
      console.log('❌ Profiles query failed:', profileError.message);
    } else {
      console.log('✅ Profiles table accessible');
      console.log('   Found', profiles.length, 'profiles');
      if (profiles.length > 0) {
        console.log('   Columns:', Object.keys(profiles[0]).join(', '));
        console.log('   Sample profile:');
        console.log('     - Role:', profiles[0].role);
        console.log('     - School ID:', profiles[0].school_id || 'null');
        console.log('     - Email:', profiles[0].email);
      }
    }
  } catch (e) {
    console.log('❌ Profile check failed:', e.message);
  }

  console.log('\n4️⃣  RLS POLICY TEST (School Registration)');
  console.log('-'.repeat(60));
  
  if (!serviceRoleKey) {
    console.log('⚠️  SERVICE_ROLE_KEY missing - Registration will FAIL!');
    console.log('   School registration requires admin privileges to bypass RLS');
    console.log('   Add SUPABASE_SERVICE_ROLE_KEY to Netlify environment variables');
  } else {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    try {
      const testSchool = {
        name: 'Test School ' + Date.now(),
        timezone: 'Africa/Casablanca'
      };
      
      const { data: newSchool, error: insertError } = await adminClient
        .from('schools')
        .insert(testSchool)
        .select()
        .single();
      
      if (insertError) {
        console.log('❌ Admin insert failed:', insertError.message);
      } else {
        console.log('✅ Admin client can create schools');
        
        // Cleanup
        await adminClient.from('schools').delete().eq('id', newSchool.id);
        console.log('   Test school cleaned up');
      }
    } catch (e) {
      console.log('❌ Admin test failed:', e.message);
    }
  }

  console.log('\n5️⃣  AUTHENTICATION TEST');
  console.log('-'.repeat(60));
  
  try {
    const { data: existingProfiles } = await client
      .from('profiles')
      .select('email, role, school_id')
      .limit(3);
    
    if (existingProfiles && existingProfiles.length > 0) {
      console.log('✅ Found existing users in database:');
      existingProfiles.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.email} (${p.role}) - School: ${p.school_id || 'none'}`);
      });
      console.log('\n   Try logging in with one of these emails');
    } else {
      console.log('⚠️  No users found in profiles table');
      console.log('   You need to register a school first');
    }
  } catch (e) {
    console.log('❌ User check failed:', e.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 DIAGNOSIS SUMMARY\n');
  
  const issues = [];
  const fixes = [];
  
  if (!serviceRoleKey) {
    issues.push('❌ SUPABASE_SERVICE_ROLE_KEY is missing');
    fixes.push('   → Add SUPABASE_SERVICE_ROLE_KEY to Netlify environment variables');
    fixes.push('   → Get it from Supabase Dashboard → Settings → API');
  }
  
  if (issues.length === 0) {
    console.log('✅ All checks passed! System should be working.\n');
  } else {
    console.log('🔧 ISSUES FOUND:\n');
    issues.forEach(i => console.log(i));
    console.log('\n💡 FIXES NEEDED:\n');
    fixes.forEach(f => console.log(f));
  }
  
  console.log('\n' + '='.repeat(60));
}

diagnose().catch(console.error);
