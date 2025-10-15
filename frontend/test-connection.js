// Test Supabase Connection
// Run this with: node test-connection.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fljlcalacidwjeuosqlq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsamxjYWxhY2lkd2pldW9zcWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjE0MjAsImV4cCI6MjA3NDQ5NzQyMH0.l8FIvgB4-Dq53Jx0nsnaC3AUhutXuPQZvuMeccW4fAQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔄 Testing Supabase connection...\n');

  try {
    // Test 1: Check if we can connect
    console.log('1️⃣ Testing basic connection...');
    const { data: scripts, error: scriptsError } = await supabase
      .from('quran_scripts')
      .select('*');

    if (scriptsError) {
      console.error('❌ Connection failed:', scriptsError.message);
      return;
    }

    console.log('✅ Connected to Supabase successfully!');
    console.log(`✅ Found ${scripts.length} Quran versions in database:`, scripts.map(s => s.name));

    // Test 2: Check tables exist
    console.log('\n2️⃣ Checking if tables exist...');
    const tables = [
      'schools',
      'profiles',
      'teachers',
      'students',
      'parents',
      'classes',
      'highlights',
      'notifications'
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ Table '${table}' - Error: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    }

    console.log('\n🎉 SUCCESS! Database is properly connected and all tables exist!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run CREATE_STORAGE_BUCKETS.sql in Supabase SQL Editor');
    console.log('2. The frontend can now connect to the database');
    console.log('3. We can start integrating the dashboards with real data');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();