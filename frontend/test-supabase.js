// TEST SUPABASE CONNECTION
// Run this with: node test-supabase.js

const { createClient } = require('@supabase/supabase-js');

// Your credentials from .env.local
const supabaseUrl = 'https://fljlcalacidwjeuosqlq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsamxjYWxhY2lkd2pldW9zcWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjE0MjAsImV4cCI6MjA3NDQ5NzQyMH0.l8FIvgB4-Dq53Jx0nsnaC3AUhutXuPQZvuMeccW4fAQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Test 1: Check if we can connect
  console.log('1️⃣ Testing basic connection...');
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('count(*)');

    if (error) {
      console.log('❌ Connection works but query failed:', error.message);
    } else {
      console.log('✅ Connected to Supabase successfully!');
      console.log('   Schools table count:', data);
    }
  } catch (err) {
    console.log('❌ Cannot connect:', err.message);
  }

  // Test 2: Check RLS status
  console.log('\n2️⃣ Checking RLS status...');
  try {
    // Try to insert a test school (will fail if RLS blocks it)
    const testSchool = {
      name: 'Test School ' + Date.now(),
      email: 'test' + Date.now() + '@test.com',
      timezone: 'UTC'
    };

    const { data, error } = await supabase
      .from('schools')
      .insert([testSchool]);

    if (error) {
      if (error.message.includes('row-level security')) {
        console.log('❌ RLS is BLOCKING inserts!');
        console.log('   Error:', error.message);
        console.log('\n   👉 RUN THIS SQL: EMERGENCY_FIX_RLS.sql');
      } else {
        console.log('❌ Other error:', error.message);
      }
    } else {
      console.log('✅ Insert worked! RLS allows registration.');

      // Clean up test data
      if (data && data[0]) {
        await supabase
          .from('schools')
          .delete()
          .eq('id', data[0].id);
      }
    }
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }

  console.log('\n📋 Summary:');
  console.log('- Supabase URL:', supabaseUrl);
  console.log('- Project ID: fljlcalacidwjeuosqlq');
  console.log('- If RLS is blocking, run EMERGENCY_FIX_RLS.sql in SQL Editor');
}

testConnection();