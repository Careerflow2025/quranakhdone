const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testSingleEvent() {
  console.log('🔐 Login...');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'wic@gmail.com',
    password: 'Test123456!'
  });

  if (authError) {
    console.error('❌ Login failed:', authError.message);
    return;
  }

  console.log('✅ Logged in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('user_id', authData.user.id)
    .single();

  const { data: firstClass } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .limit(1)
    .single();

  console.log(`📚 School: ${profile.school_id}`);
  if (firstClass) console.log(`🏫 Class: ${firstClass.name}`);

  // Create event via API
  console.log('\n📅 Creating single event...');

  const eventData = {
    title: 'Test Event API Fix',
    description: 'Testing after fixing SELECT queries',
    event_type: 'class_session',
    start_date: new Date('2025-10-25T10:00:00.000Z').toISOString(),
    end_date: new Date('2025-10-25T11:00:00.000Z').toISOString(),
    all_day: false,
    location: 'Room 101',
    color: '#3B82F6',
    is_recurring: false,
    class_id: firstClass?.id
  };

  try {
    const cookieHeader = `sb-rlfvubgyogkkqbjjmjwd-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;

    console.log('Fetching http://localhost:3007/api/events with POST...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch('http://localhost:3007/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(eventData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`Response status: ${response.status}`);

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Event created successfully!');
      console.log(`   ID: ${result.data.event.id}`);
      console.log(`   Title: ${result.data.event.title}`);
    } else {
      console.error('❌ Failed to create event:', result);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Request timed out after 10 seconds');
    } else {
      console.error('❌ Error:', error.message);
    }
  }

  await supabase.auth.signOut();
  console.log('\n👋 Done');
}

testSingleEvent();
