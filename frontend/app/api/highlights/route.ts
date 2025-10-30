import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// POST - Create a new highlight
export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { student_id, surah, ayah_start, ayah_end, color, type, note, page_number, word_start, word_end } = body;

    // Validate required fields
    if (!student_id || !surah || !ayah_start || !ayah_end || !color) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, surah, ayah_start, ayah_end, color' },
        { status: 400 }
      );
    }

    // Get teacher_id if user is a teacher
    let teacher_id = null;
    if (profile.role === 'teacher') {
      const { data: teacher, error: teacherError } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacher && !teacherError) {
        teacher_id = teacher.id;
      }
    }

    // Verify student belongs to same school
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Verify student is in same school
    const { data: studentProfile, error: studentProfileError } = await supabaseAdmin
      .from('profiles')
      .select('school_id')
      .eq('user_id', student.user_id)
      .single();

    if (studentProfileError || !studentProfile || studentProfile.school_id !== profile.school_id) {
      return NextResponse.json(
        { error: 'Cannot create highlight for student in different school' },
        { status: 403 }
      );
    }

    // Create highlight
    const { data: highlight, error: highlightError } = await supabaseAdmin
      .from('highlights')
      .insert({
        school_id: profile.school_id,
        teacher_id: teacher_id,
        student_id: student_id,
        surah: parseInt(surah),
        ayah_start: parseInt(ayah_start),
        ayah_end: parseInt(ayah_end),
        word_start: word_start !== undefined && word_start !== null ? parseInt(word_start) : null,
        word_end: word_end !== undefined && word_end !== null ? parseInt(word_end) : null,
        page_number: page_number ? parseInt(page_number) : null,
        color: color,
        type: type || null,
        note: note || null,
        previous_color: null,
        completed_at: null,
        completed_by: null
      })
      .select()
      .single();

    if (highlightError) {
      console.error('❌ Highlight creation error:', highlightError);
      return NextResponse.json(
        { error: `Failed to create highlight: ${highlightError.message}` },
        { status: 400 }
      );
    }

    console.log('✅ Highlight created successfully:', highlight.id);

    // ============================================================================
    // AUTOMATIC ASSIGNMENT CREATION - Core Workflow Feature
    // ============================================================================
    // When a highlight is created (except for 'completed' type), automatically
    // create a corresponding assignment. This ensures highlights show up in
    // assignments tab across all dashboards.
    // ============================================================================

    let assignment = null;

    // Only create assignment if NOT completed and NOT homework type
    // (homework highlights are displayed in homework tab, not assignment tab)
    if (type && type !== 'completed' && type !== 'homework') {
      try {
        // Generate assignment title based on highlight type
        const assignmentTitles: Record<string, string> = {
          'recap': 'Recap',
          'tajweed': 'Tajweed Practice',
          'haraka': 'Haraka Correction',
          'letter': 'Letter Correction'
        };

        const title = `${assignmentTitles[type] || 'Assignment'} - Surah ${surah}, Ayah ${ayah_start}${ayah_end !== ayah_start ? `-${ayah_end}` : ''}`;

        // Generate description
        const description = word_start !== null && word_end !== null
          ? `Practice ${type} for specific words in Surah ${surah}, Ayah ${ayah_start}`
          : `Practice ${type} for full ayah in Surah ${surah}, Ayah ${ayah_start}`;

        // Calculate due date based on type
        const now = new Date();
        const daysToAdd = type === 'recap' ? 7 : 3; // 7 days for recap, 3 days for others
        const dueDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

        // Create assignment
        const { data: createdAssignment, error: assignmentError } = await supabaseAdmin
          .from('assignments')
          .insert({
            school_id: profile.school_id,
            created_by_teacher_id: teacher_id,
            student_id: student_id,
            title: title,
            description: description,
            status: 'assigned',
            due_at: dueDate.toISOString(),
            reopen_count: 0
          })
          .select()
          .single();

        if (!assignmentError && createdAssignment) {
          assignment = createdAssignment;
          console.log('✅ Assignment created automatically:', createdAssignment.id);

          // Create assignment event
          await supabaseAdmin
            .from('assignment_events')
            .insert({
              assignment_id: createdAssignment.id,
              event_type: 'created',
              actor_user_id: user.id,
              from_status: null,
              to_status: 'assigned',
              meta: {
                highlight_id: highlight.id,
                auto_created: true,
                surah: surah,
                ayah_start: ayah_start,
                ayah_end: ayah_end
              }
            });

          console.log('✅ Assignment event created');
        } else {
          console.error('⚠️ Failed to create assignment:', assignmentError);
          // Don't fail the highlight creation if assignment fails
        }
      } catch (assignmentCreationError: any) {
        console.error('⚠️ Error during assignment creation:', assignmentCreationError);
        // Don't fail the highlight creation if assignment fails
      }
    } else if (type === 'homework') {
      console.log('ℹ️ Homework highlight - no assignment created (shows in homework tab)');
    } else if (type === 'completed') {
      console.log('ℹ️ Completed highlight - no assignment created');
    }

    return NextResponse.json({
      success: true,
      data: highlight,
      highlight: highlight,
      assignment: assignment, // Include assignment if created
      message: assignment
        ? `Highlight and assignment created successfully`
        : `Highlight created successfully`
    }, { status: 201 });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Fetch highlights for a student
export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    // Get student_id and teacher_id from query params
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get('student_id');
    const teacher_id = searchParams.get('teacher_id');

    let query = supabaseAdmin
      .from('highlights')
      .select(`
        *,
        notes (
          id,
          author_user_id,
          type,
          text,
          audio_url,
          created_at
        )
      `)
      .eq('school_id', profile.school_id);

    // Filter by student if provided
    if (student_id) {
      query = query.eq('student_id', student_id);
    }

    // Filter by teacher if provided (get highlights created by this teacher)
    if (teacher_id) {
      query = query.eq('teacher_id', teacher_id);
    }

    // If user is a student, only show their own highlights
    if (profile.role === 'student') {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (student) {
        query = query.eq('student_id', student.id);
      }
    }

    const { data: highlights, error: highlightsError } = await query.order('created_at', { ascending: false });

    if (highlightsError) {
      console.error('Error fetching highlights:', highlightsError);
      return NextResponse.json(
        { error: `Failed to fetch highlights: ${highlightsError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: highlights || [],
      highlights: highlights || []
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
