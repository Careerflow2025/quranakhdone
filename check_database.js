// Quick database check script
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjY2MDAyOSwiZXhwIjoyMDQ4MjM2MDI5fQ.pCW55w-iq6F79WX0GkIQZA9v1HrS7hh0lR8Ar7TmjA0';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabase() {
  console.log('🔍 Checking database tables...\n');

  // Query to get all tables in public schema
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');

  if (error) {
    console.error('❌ Error querying tables:', error.message);
    // Try alternative method using raw SQL
    const { data: tables, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    });

    if (sqlError) {
      console.error('❌ SQL Error:', sqlError.message);
      process.exit(1);
    }

    console.log('✅ Tables found:', tables);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No tables found in public schema');
    return;
  }

  console.log(`✅ Found ${data.length} tables:\n`);
  data.forEach((row, index) => {
    console.log(`${index + 1}. ${row.table_name}`);
  });
}

checkDatabase().catch(console.error);
