// VERIFY DATABASE SCHEMA - Check if all required tables exist
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const client = createClient(supabaseUrl, supabaseAnonKey);

async function verifySchema() {
  console.log('🔍 VERIFYING DATABASE SCHEMA\n');
  console.log('='.repeat(70));
  
  const requiredTables = [
    'schools',
    'profiles', 
    'teachers',
    'students',
    'parents',
    'parent_students',
    'classes',
    'teacher_classes',
    'student_progress'
  ];
  
  const results = {};
  
  for (const table of requiredTables) {
    try {
      const { data, error, count } = await client
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42P01') {
          results[table] = { exists: false, error: 'Table does not exist' };
        } else if (error.message.includes('permission denied') || error.message.includes('row-level security')) {
          results[table] = { exists: true, accessible: false, error: 'RLS blocking access' };
        } else {
          results[table] = { exists: true, accessible: false, error: error.message };
        }
      } else {
        results[table] = { exists: true, accessible: true, count: count || 0 };
      }
    } catch (e) {
      results[table] = { exists: false, error: e.message };
    }
  }
  
  console.log('\n📊 TABLE STATUS:\n');
  
  let allGood = true;
  const missingTables = [];
  const rlsIssues = [];
  
  for (const [table, status] of Object.entries(results)) {
    if (!status.exists) {
      console.log(`❌ ${table.padEnd(20)} - MISSING`);
      missingTables.push(table);
      allGood = false;
    } else if (!status.accessible) {
      console.log(`⚠️  ${table.padEnd(20)} - EXISTS but ${status.error}`);
      rlsIssues.push(table);
    } else {
      console.log(`✅ ${table.padEnd(20)} - OK (${status.count} rows)`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📋 SCHEMA ANALYSIS\n');
  
  if (missingTables.length > 0) {
    console.log('❌ MISSING TABLES:', missingTables.join(', '));
    console.log('\n💡 ACTION REQUIRED:');
    console.log('   → Run database migration SQL to create missing tables');
    console.log('   → Check if you\'re connected to the correct Supabase project');
  }
  
  if (rlsIssues.length > 0) {
    console.log('\n⚠️  RLS POLICY ISSUES:', rlsIssues.join(', '));
    console.log('\n💡 THIS IS NORMAL:');
    console.log('   → Some tables require authentication to query');
    console.log('   → RLS policies are protecting your data');
  }
  
  if (allGood && rlsIssues.length === 0) {
    console.log('✅ ALL TABLES EXIST AND ARE ACCESSIBLE!\n');
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Test if we can read sample data
  console.log('\n🔍 TESTING DATA ACCESS:\n');
  
  try {
    const { data: schools } = await client.from('schools').select('*').limit(1);
    console.log('Schools:', schools?.length || 0, 'found');
    
    const { data: profiles } = await client.from('profiles').select('*').limit(1);
    console.log('Profiles:', profiles?.length || 0, 'found');
    
    if ((!schools || schools.length === 0) && (!profiles || profiles.length === 0)) {
      console.log('\n⚠️  DATABASE IS EMPTY');
      console.log('   → You need to register a school first');
      console.log('   → But registration requires SUPABASE_SERVICE_ROLE_KEY!');
    }
  } catch (e) {
    console.log('❌ Data access test failed:', e.message);
  }
  
  console.log('\n' + '='.repeat(70));
}

verifySchema().catch(console.error);
