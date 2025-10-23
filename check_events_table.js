const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function checkEventsTable() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'wic@gmail.com',
    password: 'Test123456!'
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }

  console.log('✅ Logged in');

  // Try to query events table
  console.log('\n🔍 Checking if events table exists...');
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Events table check failed:', error.message);
    console.error('   Code:', error.code);
  } else {
    console.log('✅ Events table exists!');
    console.log('   Query returned successfully');
  }

  // Logout
  await supabase.auth.signOut();
}

checkEventsTable();
