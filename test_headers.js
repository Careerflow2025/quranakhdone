// Test if the service role key can be used in headers

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU2OTk2OSwiZXhwIjoyMDc2MTQ1OTY5fQ.dtbMQ2c0erz6yPx3dt7T7HBw89z2T6wF6CeMrkTqDrI';

console.log('Service Role Key length:', serviceRoleKey.length);
console.log('Contains newline?', serviceRoleKey.includes('\n'));
console.log('Contains carriage return?', serviceRoleKey.includes('\r'));
console.log('Newline positions:', [...serviceRoleKey].map((c, i) => c === '\n' ? i : null).filter(x => x !== null));
console.log('Service Role Key (JSON):', JSON.stringify(serviceRoleKey));
console.log('Service Role Key:', serviceRoleKey);

try {
  const headers = new Headers();
  console.log('\nTrying to append Authorization header...');
  headers.append('Authorization', `Bearer ${serviceRoleKey}`);
  console.log('✅ SUCCESS: Headers created');
  console.log('Authorization header:', headers.get('Authorization'));
} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error('Full error:', error);
}

try {
  console.log('\nTrying with fetch...');
  const response = await fetch('https://httpbin.org/headers', {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`
    }
  });
  console.log('✅ Fetch succeeded:', response.status);
  const data = await response.json();
  console.log('Headers sent:', data.headers);
} catch (error) {
  console.error('❌ Fetch ERROR:', error.message);
}
