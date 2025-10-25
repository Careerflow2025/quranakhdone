import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// POST - Link highlights to an assignment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const assignmentId = params.id;
    const body = await req.json();
    const { highlight_ids } = body;

    if (!highlight_ids || !Array.isArray(highlight_ids) || highlight_ids.length === 0) {
      return NextResponse.json(
        { error: 'highlight_ids array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Verify assignment exists and user has permission
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('school_id', profile.school_id)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Verify user is the teacher who created the assignment
    if (profile.role === 'teacher') {
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacher || teacher.id !== assignment.created_by_teacher_id) {
        return NextResponse.json(
          { error: 'You do not have permission to modify this assignment' },
          { status: 403 }
        );
      }
    } else if (profile.role !== 'owner' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only teachers, owners, or admins can modify assignments' },
        { status: 403 }
      );
    }

    // Verify all highlights exist and belong to the same school
    const { data: highlights, error: highlightsError } = await supabaseAdmin
      .from('highlights')
      .select('id')
      .in('id', highlight_ids)
      .eq('school_id', profile.school_id);

    if (highlightsError) {
      return NextResponse.json(
        { error: `Failed to verify highlights: ${highlightsError.message}` },
        { status: 500 }
      );
    }

    if (!highlights || highlights.length !== highlight_ids.length) {
      return NextResponse.json(
        { error: 'Some highlights were not found or do not belong to your school' },
        { status: 404 }
      );
    }

    // Create assignment-highlight links (ignore duplicates)
    const links = highlight_ids.map((highlightId: string) => ({
      assignment_id: assignmentId,
      highlight_id: highlightId
    }));

    const { data: createdLinks, error: linkError } = await supabaseAdmin
      .from('assignment_highlights')
      .upsert(links, { onConflict: 'assignment_id,highlight_id' })
      .select();

    if (linkError) {
      console.error('❌ Failed to link highlights:', linkError);
      return NextResponse.json(
        { error: `Failed to link highlights: ${linkError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Linked ${createdLinks?.length || 0} highlights to assignment ${assignmentId}`);

    return NextResponse.json({
      success: true,
      data: {
        assignment_id: assignmentId,
        linked_highlights: createdLinks?.length || 0
      },
      message: `Successfully linked ${createdLinks?.length || 0} highlight(s) to assignment`
    });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get all highlights for an assignment
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const assignmentId = params.id;

    // Get assignment highlights with full highlight details
    const { data: assignmentHighlights, error: highlightsError } = await supabaseAdmin
      .from('assignment_highlights')
      .select(`
        id,
        created_at,
        highlights (*)
      `)
      .eq('assignment_id', assignmentId);

    if (highlightsError) {
      console.error('❌ Failed to fetch highlights:', highlightsError);
      return NextResponse.json(
        { error: `Failed to fetch highlights: ${highlightsError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assignmentHighlights || [],
      count: assignmentHighlights?.length || 0
    });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
