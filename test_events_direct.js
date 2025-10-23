const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testEventsDirectly() {
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

  console.log('✅ Logged in as:', authData.user.email);

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, school_id, role')
    .eq('user_id', authData.user.id)
    .single();

  console.log(`📚 School: ${profile.school_id}, Role: ${profile.role}`);

  // Test 1: Create event directly via Supabase
  console.log('\n📅 Test 1: Create Event via Supabase Client...');
  const { data: newEvent, error: createError } = await supabase
    .from('events')
    .insert({
      school_id: profile.school_id,
      created_by_user_id: profile.user_id,
      title: 'Direct Test Event',
      description: 'Testing direct Supabase access',
      event_type: 'class_session',
      start_date: new Date('2025-10-26T10:00:00.000Z').toISOString(),
      end_date: new Date('2025-10-26T11:00:00.000Z').toISOString(),
      all_day: false,
      location: 'Room 102',
      color: '#10B981',
      is_recurring: false
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Failed to create event:', createError.message);
    console.error('   Code:', createError.code);
    console.error('   Details:', createError.details);
  } else {
    console.log('✅ Event created successfully!');
    console.log(`   ID: ${newEvent.id}`);
    console.log(`   Title: ${newEvent.title}`);
  }

  // Test 2: List events with JOIN
  console.log('\n📅 Test 2: List Events with JOIN (testing SELECT query)...');
  const { data: events, error: listError } = await supabase
    .from('events')
    .select(`
      *,
      creator:created_by_user_id(user_id, display_name, email, role)
    `)
    .eq('school_id', profile.school_id)
    .order('start_date', { ascending: true })
    .limit(5);

  if (listError) {
    console.error('❌ Failed to list events:', listError.message);
    console.error('   Code:', listError.code);
  } else {
    console.log(`✅ Found ${events.length} events:`);
    events.forEach(e => {
      console.log(`   - ${e.title} (${e.event_type}) on ${e.start_date}`);
      if (e.creator) {
        console.log(`     Creator: ${e.creator.display_name || 'Unknown'}`);
      }
    });
  }

  // Test 3: Get single event by ID
  if (newEvent) {
    console.log('\n📅 Test 3: Get Single Event by ID...');
    const { data: singleEvent, error: getError } = await supabase
      .from('events')
      .select(`
        *,
        creator:created_by_user_id(user_id, display_name, email, role)
      `)
      .eq('id', newEvent.id)
      .single();

    if (getError) {
      console.error('❌ Failed to get event:', getError.message);
    } else {
      console.log('✅ Retrieved event:');
      console.log(`   ID: ${singleEvent.id}`);
      console.log(`   Title: ${singleEvent.title}`);
      console.log(`   Creator: ${singleEvent.creator?.display_name || 'Unknown'}`);
    }
  }

  // Test 4: Update event
  if (newEvent) {
    console.log('\n📅 Test 4: Update Event...');
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({
        title: 'Updated Direct Test Event',
        location: 'Room 201'
      })
      .eq('id', newEvent.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update event:', updateError.message);
    } else {
      console.log('✅ Event updated successfully!');
      console.log(`   New Title: ${updatedEvent.title}`);
      console.log(`   New Location: ${updatedEvent.location}`);
    }
  }

  // Test 5: Delete event
  if (newEvent) {
    console.log('\n📅 Test 5: Delete Event...');
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', newEvent.id);

    if (deleteError) {
      console.error('❌ Failed to delete event:', deleteError.message);
    } else {
      console.log('✅ Event deleted successfully!');
    }
  }

  await supabase.auth.signOut();
  console.log('\n👋 Done! All tests completed successfully.');
}

testEventsDirectly();
