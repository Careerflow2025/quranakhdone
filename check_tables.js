// Verify database tables using Service Role Key
const supabaseUrl = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjY2MDAyOSwiZXhwIjoyMDQ4MjM2MDI5fQ.pCW55w-iq6F79WX0GkIQZA9v1HrS7hh0lR8Ar7TmjA0';

async function checkTables() {
  console.log('🔍 Verifying database tables...\\n');

  const sql = `
    SELECT
      table_name,
      (SELECT COUNT(*) FROM information_schema.columns
       WHERE table_schema='public' AND table_name=t.table_name) as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

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
      console.log('⚠️ RPC method not available, using direct query...\\n');

      // Fallback: count using fetch to each table directly
      const tables = [
        'schools', 'profiles', 'students', 'teachers', 'parents', 'parent_students',
        'classes', 'class_teachers', 'class_enrollments', 'quran_scripts', 'quran_surahs',
        'quran_ayahs', 'highlights', 'notes', 'homework', 'assignments', 'assignment_events',
        'assignment_submissions', 'assignment_attachments', 'targets', 'target_milestones',
        'target_students', 'rubrics', 'rubric_criteria', 'assignment_rubrics', 'grades',
        'ayah_mastery', 'attendance', 'messages', 'notifications', 'devices',
        'calendar_events', 'activity_logs', 'school_settings', 'mushaf_pages', 'pen_annotations'
      ];

      let existingCount = 0;
      for (const table of tables) {
        const r = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=0`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        if (r.ok) {
          existingCount++;
          console.log(`✅ ${table}`);
        }
      }

      console.log(`\\n📊 Total tables found: ${existingCount}/${tables.length}`);

      // Check for Quran data
      const scriptsResp = await fetch(`${supabaseUrl}/rest/v1/quran_scripts?select=count`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'count=exact'
        }
      });

      if (scriptsResp.ok) {
        const count = scriptsResp.headers.get('content-range')?.split('/')[1];
        console.log(`\\n🕌 Quran Scripts: ${count || 0} (expected: 6)`);
      }

      return;
    }

    const data = await response.json();
    console.log(`✅ Found ${data.length} tables:\\n`);
    data.forEach((row, i) => {
      console.log(`${i + 1}. ${row.table_name} (${row.column_count} columns)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables();
