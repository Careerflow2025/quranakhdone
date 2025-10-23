/**
 * Debug Parent Creation
 * Purpose: See exact error response from parent creation endpoint
 */

const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3013';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function debugParentCreation() {
  console.log('🔍 DEBUG: Parent Creation Endpoint\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Authenticate as owner
  console.log('1️⃣  Authenticating as owner...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD
  });

  if (authError) {
    console.error('❌ Owner auth failed:', authError.message);
    return;
  }

  const ownerToken = authData.session.access_token;
  console.log('✅ Owner authenticated');
  console.log('   User ID:', authData.user.id);
  console.log('   Email:', authData.user.email);
  console.log('   Token (first 50 chars):', ownerToken.substring(0, 50) + '...');

  // 2. Attempt to create parent with detailed request logging
  console.log('\n2️⃣  Creating parent...');
  const timestamp = Date.now();
  const parentEmail = `parent.debug.${timestamp}@quranakh.test`;

  const parentPayload = {
    name: 'Debug Parent',
    email: parentEmail,
    password: 'TestPass123!',
    phone: '+212-600000001',
  };

  console.log('\nRequest details:');
  console.log('  URL:', `${BASE_URL}/api/school/create-parent`);
  console.log('  Method: POST');
  console.log('  Headers:');
  console.log('    Content-Type: application/json');
  console.log('    Authorization: Bearer', ownerToken.substring(0, 30) + '...');
  console.log('  Payload:', JSON.stringify(parentPayload, null, 2));

  const parentRes = await fetch(`${BASE_URL}/api/school/create-parent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: JSON.stringify(parentPayload),
  });

  console.log('\nResponse status:', parentRes.status);
  console.log('Response status text:', parentRes.statusText);
  console.log('Response headers:', Object.fromEntries(parentRes.headers.entries()));

  const parentData = await parentRes.json();
  console.log('\nResponse body:');
  console.log(JSON.stringify(parentData, null, 2));

  if (parentData.success) {
    console.log('\n✅ SUCCESS: Parent created!');
    console.log('   Parent ID:', parentData.data?.id);
    console.log('   Parent Email:', parentData.data?.email);
  } else {
    console.log('\n❌ FAILED: Parent creation failed');
    console.log('   Error:', parentData.error);
    console.log('   Code:', parentData.code);
    if (parentData.details) {
      console.log('   Details:', JSON.stringify(parentData.details, null, 2));
    }
  }
}

debugParentCreation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
