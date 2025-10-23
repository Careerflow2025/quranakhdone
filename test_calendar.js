const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function testCalendar() {
  console.log('🔐 Step 1: Login as wic@gmail.com (Owner)...');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'wic@gmail.com',
    password: 'Test123456!'
  });

  if (authError) {
    console.error('❌ Login failed:', authError.message);
    return;
  }

  console.log('✅ Login successful!');

  // Get school_id and first class_id for testing
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

  const schoolId = profile.school_id;
  const classId = firstClass?.id;

  console.log(`📚 Using school_id: ${schoolId}`);
  if (classId) console.log(`🏫 Using class: ${firstClass.name} (${classId})`);

  // Prepare auth cookie
  const cookieHeader = `sb-rlfvubgyogkkqbjjmjwd-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;

  // ============================================================================
  // Test 1: Create Single Event
  // ============================================================================
  console.log('\n📅 Test 1: Create Single Event...');

  const singleEventData = {
    title: 'Test Quran Class',
    description: 'Testing single event creation',
    event_type: 'class_session',
    start_date: new Date('2025-10-25T10:00:00.000Z').toISOString(),
    end_date: new Date('2025-10-25T11:00:00.000Z').toISOString(),
    all_day: false,
    location: 'Room 101',
    color: '#3B82F6',
    is_recurring: false,
    class_id: classId
  };

  try {
    const response1 = await fetch('http://localhost:3007/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(singleEventData)
    });

    const result1 = await response1.json();

    if (response1.ok && result1.success) {
      console.log('✅ Single event created successfully!');
      console.log(`   ID: ${result1.data.event.id}`);
      console.log(`   Title: ${result1.data.event.title}`);
      console.log(`   Type: ${result1.data.event.event_type}`);
      console.log(`   Start: ${result1.data.event.start_date}`);
      console.log(`   Creator: ${result1.data.event.creator?.display_name}`);
    } else {
      console.error('❌ Failed to create single event:', result1.error || result1);
    }
  } catch (error) {
    console.error('💥 Test 1 failed:', error.message);
  }

  // ============================================================================
  // Test 2: Create Daily Recurring Event (5 days)
  // ============================================================================
  console.log('\n📅 Test 2: Create Daily Recurring Event (5 days)...');

  const recurringEventData = {
    title: 'Daily Morning Review',
    description: 'Testing daily recurring event',
    event_type: 'class_session',
    start_date: new Date('2025-10-21T09:00:00.000Z').toISOString(),
    end_date: new Date('2025-10-21T09:30:00.000Z').toISOString(),
    all_day: false,
    location: 'Room 102',
    color: '#10B981',
    is_recurring: true,
    recurrence_rule: {
      frequency: 'daily',
      interval: 1,
      count: 5
    },
    class_id: classId
  };

  let parentEventId = null;

  try {
    const response2 = await fetch('http://localhost:3007/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(recurringEventData)
    });

    const result2 = await response2.json();

    if (response2.ok && result2.success) {
      console.log('✅ Recurring event created successfully!');
      console.log(`   ID: ${result2.data.event.id}`);
      console.log(`   Title: ${result2.data.event.title}`);
      console.log(`   Recurrence Count: ${result2.data.recurrence_count}`);
      console.log(`   Message: ${result2.message}`);
      parentEventId = result2.data.event.id;
    } else {
      console.error('❌ Failed to create recurring event:', result2.error || result2);
    }
  } catch (error) {
    console.error('💥 Test 2 failed:', error.message);
  }

  // ============================================================================
  // Test 3: List Events with Filters
  // ============================================================================
  console.log('\n📅 Test 3: List Events with Date Range Filter...');

  try {
    const startDate = new Date('2025-10-01T00:00:00.000Z').toISOString();
    const endDate = new Date('2025-10-31T23:59:59.999Z').toISOString();

    const response3 = await fetch(
      `http://localhost:3007/api/events?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&limit=20`,
      {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader
        }
      }
    );

    const result3 = await response3.json();

    if (response3.ok && result3.success) {
      console.log('✅ Events listed successfully!');
      console.log(`   Total Events: ${result3.data.pagination.total}`);
      console.log(`   Events Returned: ${result3.data.events.length}`);
      console.log(`   Summary by Type:`, result3.data.summary.by_type);
      console.log(`   Has More: ${result3.data.pagination.has_more}`);
    } else {
      console.error('❌ Failed to list events:', result3.error || result3);
    }
  } catch (error) {
    console.error('💥 Test 3 failed:', error.message);
  }

  // ============================================================================
  // Test 4: Get Single Event Details
  // ============================================================================
  if (parentEventId) {
    console.log('\n📅 Test 4: Get Single Event Details...');

    try {
      const response4 = await fetch(`http://localhost:3007/api/events/${parentEventId}`, {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader
        }
      });

      const result4 = await response4.json();

      if (response4.ok && result4.success) {
        console.log('✅ Event details retrieved successfully!');
        console.log(`   ID: ${result4.data.event.id}`);
        console.log(`   Title: ${result4.data.event.title}`);
        console.log(`   Is Recurring: ${result4.data.event.is_recurring}`);
        console.log(`   Related Events: ${result4.data.related_events?.length || 0}`);
      } else {
        console.error('❌ Failed to get event details:', result4.error || result4);
      }
    } catch (error) {
      console.error('💥 Test 4 failed:', error.message);
    }
  }

  // ============================================================================
  // Test 5: Update Single Event
  // ============================================================================
  if (parentEventId) {
    console.log('\n📅 Test 5: Update Single Event (Change Title and Location)...');

    const updateData = {
      title: 'Updated Morning Review',
      location: 'Room 202',
      update_series: false
    };

    try {
      const response5 = await fetch(`http://localhost:3007/api/events/${parentEventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader
        },
        body: JSON.stringify(updateData)
      });

      const result5 = await response5.json();

      if (response5.ok && result5.success) {
        console.log('✅ Event updated successfully!');
        console.log(`   New Title: ${result5.data.event.title}`);
        console.log(`   New Location: ${result5.data.event.location}`);
        console.log(`   Message: ${result5.message}`);
      } else {
        console.error('❌ Failed to update event:', result5.error || result5);
      }
    } catch (error) {
      console.error('💥 Test 5 failed:', error.message);
    }
  }

  // ============================================================================
  // Test 6: Update Entire Recurring Series
  // ============================================================================
  if (parentEventId) {
    console.log('\n📅 Test 6: Update Entire Recurring Series...');

    const seriesUpdateData = {
      title: 'Updated Series Title',
      color: '#EF4444',
      update_series: true
    };

    try {
      const response6 = await fetch(`http://localhost:3007/api/events/${parentEventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader
        },
        body: JSON.stringify(seriesUpdateData)
      });

      const result6 = await response6.json();

      if (response6.ok && result6.success) {
        console.log('✅ Event series updated successfully!');
        console.log(`   New Title: ${result6.data.event.title}`);
        console.log(`   New Color: ${result6.data.event.color}`);
        console.log(`   Updated Count: ${result6.data.updated_count}`);
        console.log(`   Message: ${result6.message}`);
      } else {
        console.error('❌ Failed to update series:', result6.error || result6);
      }
    } catch (error) {
      console.error('💥 Test 6 failed:', error.message);
    }
  }

  // ============================================================================
  // Test 7: Verify in Database
  // ============================================================================
  console.log('\n🔍 Test 7: Verify Events in Database...');

  try {
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_type, start_date, is_recurring, recurrence_parent_id')
      .eq('school_id', schoolId)
      .order('start_date', { ascending: true });

    if (eventsError) {
      console.error('❌ Database verification failed:', eventsError.message);
    } else {
      console.log(`✅ Found ${events.length} events in database`);

      const singleEvents = events.filter(e => !e.is_recurring && !e.recurrence_parent_id);
      const parentEvents = events.filter(e => e.is_recurring && !e.recurrence_parent_id);
      const instanceEvents = events.filter(e => e.recurrence_parent_id !== null);

      console.log(`   Single Events: ${singleEvents.length}`);
      console.log(`   Recurring Parents: ${parentEvents.length}`);
      console.log(`   Recurring Instances: ${instanceEvents.length}`);

      console.log('\n   Event Details:');
      events.forEach(e => {
        const type = e.recurrence_parent_id ? '  [Instance]' : e.is_recurring ? '[Parent]' : '[Single]';
        console.log(`   ${type} ${e.title} (${e.event_type}) - ${e.start_date}`);
      });
    }
  } catch (error) {
    console.error('💥 Test 7 failed:', error.message);
  }

  // ============================================================================
  // Test 8: Test Weekly Recurring Event (Specific Weekdays)
  // ============================================================================
  console.log('\n📅 Test 8: Create Weekly Recurring Event (Monday & Wednesday)...');

  const weeklyEventData = {
    title: 'Weekly Advanced Class',
    description: 'Testing weekly recurring on specific weekdays',
    event_type: 'class_session',
    start_date: new Date('2025-10-21T14:00:00.000Z').toISOString(), // October 21 is Monday
    end_date: new Date('2025-10-21T15:00:00.000Z').toISOString(),
    all_day: false,
    location: 'Room 103',
    color: '#8B5CF6',
    is_recurring: true,
    recurrence_rule: {
      frequency: 'weekly',
      interval: 1,
      by_weekday: [1, 3], // Monday = 1, Wednesday = 3
      count: 6
    },
    class_id: classId
  };

  try {
    const response8 = await fetch('http://localhost:3007/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(weeklyEventData)
    });

    const result8 = await response8.json();

    if (response8.ok && result8.success) {
      console.log('✅ Weekly recurring event created successfully!');
      console.log(`   ID: ${result8.data.event.id}`);
      console.log(`   Title: ${result8.data.event.title}`);
      console.log(`   Recurrence Count: ${result8.data.recurrence_count}`);
      console.log(`   Weekdays: Monday & Wednesday`);
    } else {
      console.error('❌ Failed to create weekly event:', result8.error || result8);
    }
  } catch (error) {
    console.error('💥 Test 8 failed:', error.message);
  }

  // ============================================================================
  // Test 9: Delete Single Event (Clean Up)
  // ============================================================================
  if (parentEventId) {
    console.log('\n📅 Test 9: Delete Entire Recurring Series (Cleanup)...');

    try {
      const response9 = await fetch(
        `http://localhost:3007/api/events/${parentEventId}?delete_series=true`,
        {
          method: 'DELETE',
          headers: {
            'Cookie': cookieHeader
          }
        }
      );

      const result9 = await response9.json();

      if (response9.ok && result9.success) {
        console.log('✅ Event series deleted successfully!');
        console.log(`   Deleted Count: ${result9.data.deleted_count}`);
        console.log(`   Message: ${result9.message}`);
      } else {
        console.error('❌ Failed to delete series:', result9.error || result9);
      }
    } catch (error) {
      console.error('💥 Test 9 failed:', error.message);
    }
  }

  // Logout
  await supabase.auth.signOut();
  console.log('\n👋 Logged out');
  console.log('\n✅ Calendar testing completed!');
}

testCalendar();
