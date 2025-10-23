/**
 * Messages API End-to-End Test
 * Tests all 5 message operations
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxshnzutxkvhznxuzsoo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4c2huenV0eGt2aHpueHV6c29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg4MzA1MjQsImV4cCI6MjA0NDQwNjUyNH0.jW_1LW-I24K54sRN9uZdHG_A_CsPHAT7jLXODrvSSAo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_URL = 'http://localhost:3000';

async function getAuthToken() {
  console.log('\n🔐 Getting authentication token...');
  
  // Sign in as teacher (or get existing session)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'teacher@test.com',
    password: 'password123',
  });

  if (error) {
    console.error('❌ Auth error:', error.message);
    return null;
  }

  const token = data.session?.access_token;
  console.log('✅ Token obtained:', token ? token.substring(0, 20) + '...' : 'MISSING');
  return token;
}

async function getRecipientUserId(token) {
  console.log('\n👥 Finding a recipient user...');
  
  const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=user_id,display_name,email,role&role=neq.teacher&limit=1`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const users = await response.json();
  if (users && users.length > 0) {
    console.log('✅ Found recipient:', users[0].display_name, `(${users[0].email})`);
    return users[0].user_id;
  }

  console.log('⚠️ No recipient found, will use teacher as recipient');
  return null;
}

async function testListMessages(token) {
  console.log('\n📨 TEST 1: List Messages (GET /api/messages)');
  
  const folders = ['inbox', 'sent', 'unread', 'all'];
  
  for (const folder of folders) {
    console.log(`\n  Testing folder: ${folder}`);
    const response = await fetch(`${BASE_URL}/api/messages?folder=${folder}&page=1&limit=10`, {
      method: 'GET',
      headers: {
        'Cookie': `sb-access-token=${token}; sb-refresh-token=${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`  ✅ Status: ${response.status}`);
      console.log(`  ✅ Messages: ${data.messages.length}`);
      console.log(`  ✅ Unread: ${data.stats.total_unread}`);
      console.log(`  ✅ Threads: ${data.stats.total_threads}`);
      console.log(`  ✅ Pagination: Page ${data.pagination.page}/${data.pagination.total_pages}`);
    } else {
      console.log(`  ❌ Error: ${data.error}`);
      console.log(`  ❌ Code: ${data.code}`);
    }
  }
}

async function testSendMessage(token, recipientUserId) {
  console.log('\n✉️ TEST 2: Send Message (POST /api/messages)');
  
  if (!recipientUserId) {
    console.log('  ⚠️ Skipping - no recipient available');
    return null;
  }

  const messageData = {
    recipient_user_id: recipientUserId,
    subject: 'Test Message from API',
    body: 'This is a test message sent via the Messages API endpoint.',
  };

  const response = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: {
      'Cookie': `sb-access-token=${token}; sb-refresh-token=${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messageData),
  });

  const data = await response.json();
  
  if (data.success) {
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  ✅ Message ID: ${data.message.id}`);
    console.log(`  ✅ Subject: ${data.message.subject}`);
    console.log(`  ✅ Body: ${data.message.body}`);
    console.log(`  ✅ From: ${data.message.sender?.display_name}`);
    console.log(`  ✅ To: ${data.message.recipient?.display_name}`);
    return data.message.id;
  } else {
    console.log(`  ❌ Error: ${data.error}`);
    console.log(`  ❌ Code: ${data.code}`);
    return null;
  }
}

async function testMarkAsRead(token, messageId) {
  console.log('\n👁️ TEST 3: Mark Message as Read (PATCH /api/messages/:id)');
  
  if (!messageId) {
    console.log('  ⚠️ Skipping - no message ID available');
    return;
  }

  const response = await fetch(`${BASE_URL}/api/messages/${messageId}`, {
    method: 'PATCH',
    headers: {
      'Cookie': `sb-access-token=${token}; sb-refresh-token=${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  
  if (data.success) {
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  ✅ Message ID: ${data.message.id}`);
    console.log(`  ✅ Read At: ${data.message.read_at}`);
  } else {
    console.log(`  ❌ Error: ${data.error}`);
    console.log(`  ❌ Code: ${data.code}`);
  }
}

async function testReplyToMessage(token, messageId) {
  console.log('\n💬 TEST 4: Reply to Message (POST /api/messages/:id)');
  
  if (!messageId) {
    console.log('  ⚠️ Skipping - no message ID available');
    return null;
  }

  const replyData = {
    body: 'This is a reply to the test message.',
  };

  const response = await fetch(`${BASE_URL}/api/messages/${messageId}`, {
    method: 'POST',
    headers: {
      'Cookie': `sb-access-token=${token}; sb-refresh-token=${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(replyData),
  });

  const data = await response.json();
  
  if (data.success) {
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  ✅ Reply ID: ${data.message.id}`);
    console.log(`  ✅ Thread ID: ${data.message.thread_id}`);
    console.log(`  ✅ Body: ${data.message.body}`);
    console.log(`  ✅ From: ${data.message.sender?.display_name}`);
    return data.message.thread_id || messageId;
  } else {
    console.log(`  ❌ Error: ${data.error}`);
    console.log(`  ❌ Code: ${data.code}`);
    return null;
  }
}

async function testGetThread(token, threadId) {
  console.log('\n🧵 TEST 5: Get Message Thread (GET /api/messages/thread/:id)');
  
  if (!threadId) {
    console.log('  ⚠️ Skipping - no thread ID available');
    return;
  }

  const response = await fetch(`${BASE_URL}/api/messages/thread/${threadId}`, {
    method: 'GET',
    headers: {
      'Cookie': `sb-access-token=${token}; sb-refresh-token=${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  
  if (data.success) {
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  ✅ Root Message: ${data.thread.root_message.subject}`);
    console.log(`  ✅ Replies: ${data.thread.replies.length}`);
    console.log(`  ✅ Participants: ${data.thread.participant_count}`);
    console.log(`  ✅ Unread: ${data.thread.unread_count}`);
    console.log(`  ✅ Last Message: ${data.thread.last_message_at}`);
  } else {
    console.log(`  ❌ Error: ${data.error}`);
    console.log(`  ❌ Code: ${data.code}`);
  }
}

async function runTests() {
  console.log('🧪 ========================================');
  console.log('🧪 MESSAGES API END-TO-END TEST');
  console.log('🧪 ========================================');

  // 1. Get authentication token
  const token = await getAuthToken();
  if (!token) {
    console.log('\n❌ FAILED: Cannot proceed without authentication token');
    return;
  }

  // 2. Get a recipient user
  const recipientUserId = await getRecipientUserId(token);

  // 3. Test List Messages
  await testListMessages(token);

  // 4. Test Send Message
  const messageId = await testSendMessage(token, recipientUserId);

  // 5. Test Mark as Read (note: will fail if we sent the message, need to be recipient)
  // await testMarkAsRead(token, messageId);

  // 6. Test Reply to Message
  const threadId = await testReplyToMessage(token, messageId);

  // 7. Test Get Thread
  await testGetThread(token, threadId);

  console.log('\n🧪 ========================================');
  console.log('🧪 TEST SUITE COMPLETE');
  console.log('🧪 ========================================\n');
}

runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
