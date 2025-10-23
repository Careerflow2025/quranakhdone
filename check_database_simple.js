// Direct database check using Supabase REST API
const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjY2MDAyOSwiZXhwIjoyMDQ4MjM2MDI5fQ.pCW55w-iq6F79WX0GkIQZA9v1HrS7hh0lR8Ar7TmjA0';

// SQL query to get all tables
const sql = `
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
`;

async function checkDatabase() {
  console.log('🔍 Checking database tables...\n');

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Try direct query to a known table instead
      console.log('⚠️ RPC not available, trying direct table query...\n');

      const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (!tablesResponse.ok) {
        throw new Error(`HTTP error! status: ${tablesResponse.status}`);
      }

      const data = await tablesResponse.text();
      console.log('✅ Database connected. Response:', data);
      return;
    }

    const data = await response.json();
    console.log(`✅ Found tables:\n`);
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase();
