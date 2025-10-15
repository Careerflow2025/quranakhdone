const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qeigukuyhmdslojuoxkp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaWd1a3V5aG1kc2xvanVveGtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1OTQyMDMsImV4cCI6MjA3NDE3MDIwM30.foz8x7IFpv4LxdafCQwI0A5wb8L7wBCjZ2xSVKwY9Fk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLS() {
  console.log('Checking RLS policies for schools table...\n');

  // Try to insert a school without authentication
  console.log('1. Testing school creation (anonymous)...');
  const { data: newSchool, error: schoolError } = await supabase
    .from('schools')
    .insert({
      name: 'Test School ' + Date.now(),
      email: 'test@example.com',
      phone: '1234567890',
      address: 'Test Address',
      timezone: 'America/New_York'
    })
    .select()
    .single();

  if (schoolError) {
    console.error('❌ Cannot create school as anonymous:', schoolError.message);

    if (schoolError.message.includes('row-level security')) {
      console.log('\n⚠️  RLS is blocking anonymous inserts.');
      console.log('This is the issue! The registration needs to happen differently.');
    }
  } else {
    console.log('✅ School created successfully:', newSchool.id);

    // Clean up
    await supabase.from('schools').delete().eq('id', newSchool.id);
    console.log('   (Test school cleaned up)');
  }

  console.log('\n2. Checking table columns...');
  const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
    table_name: 'schools'
  }).select('*');

  if (!columnsError && columns) {
    console.log('Schools table columns:', columns);
  }

  console.log('\n=== RLS Check Complete ===');
  console.log('\nRECOMMENDATION:');
  console.log('The school registration should either:');
  console.log('1. Use a service role key (server-side) to bypass RLS');
  console.log('2. Have special RLS policies allowing anonymous school creation');
  console.log('3. Use Supabase Edge Functions with admin privileges');
}

// Also try with direct SQL to check columns
async function checkColumns() {
  console.log('\n3. Getting table structure directly...');

  // Query to get column information
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .limit(0);

  if (!error) {
    console.log('Query successful - table exists and is accessible');
  } else {
    console.log('Error accessing table:', error);
  }
}

checkRLS()
  .then(() => checkColumns())
  .catch(console.error);