const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qeigukuyhmdslojuoxkp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaWd1a3V5aG1kc2xvanVveGtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1OTQyMDMsImV4cCI6MjA3NDE3MDIwM30.foz8x7IFpv4LxdafCQwI0A5wb8L7wBCjZ2xSVKwY9Fk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('Checking actual database schema...\n');

  // Get sample school to see what columns exist
  const { data: schools, error } = await supabase
    .from('schools')
    .select('*')
    .limit(1);

  if (!error && schools && schools.length > 0) {
    console.log('Schools table columns found:');
    console.log(Object.keys(schools[0]));
    console.log('\nSample data:');
    console.log(JSON.stringify(schools[0], null, 2));
  } else if (error) {
    console.log('Error:', error);
  } else {
    console.log('No schools found in database');
  }

  // Get sample profile
  console.log('\n---\n');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (!profileError && profiles && profiles.length > 0) {
    console.log('Profiles table columns found:');
    console.log(Object.keys(profiles[0]));
    console.log('\nSample data:');
    console.log(JSON.stringify(profiles[0], null, 2));
  }

  // Try minimal school creation with only required fields
  console.log('\n---\nTrying minimal school creation...\n');

  const { data: newSchool, error: createError } = await supabase
    .from('schools')
    .insert({
      name: 'Test School Minimal ' + Date.now()
    })
    .select()
    .single();

  if (createError) {
    console.log('❌ Minimal creation failed:', createError.message);
    console.log('Error code:', createError.code);
  } else {
    console.log('✅ Minimal school created:', newSchool);

    // Clean up
    await supabase.from('schools').delete().eq('id', newSchool.id);
  }
}

checkSchema().catch(console.error);