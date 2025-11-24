// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// PUT - Complete an assignment and turn all related highlights gold
export async function PUT(
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

    // STEP 1: Get assignment and verify authorization
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('school_id', (profile as any).school_id)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Verify user has permission (teacher who created it, or owner/admin)
    if ((profile as any).role === 'teacher') {
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacher || (teacher as any).id !== (assignment as any).created_by_teacher_id) {
        return NextResponse.json(
          { error: 'You do not have permission to complete this assignment' },
          { status: 403 }
        );
      }
    } else if ((profile as any).role !== 'owner' && (profile as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Only teachers, owners, or admins can complete assignments' },
        { status: 403 }
      );
    }

    // STEP 2: Update assignment status to 'completed'
    // @ts-ignore - Type inference issue with Supabase client
    const { data: updatedAssignment, error: updateError } = await supabaseAdmin
      .from('assignments')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update assignment:', updateError);
      return NextResponse.json(
        { error: `Failed to update assignment: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Assignment marked as completed:', assignmentId);

    // STEP 3: Get all highlights linked to this assignment
    const { data: assignmentHighlights, error: highlightsError } = await supabaseAdmin
      .from('assignment_highlights')
      .select('highlight_id')
      .eq('assignment_id', assignmentId);

    if (highlightsError) {
      console.error('❌ Failed to fetch assignment highlights:', highlightsError);
      // Don't fail the request, just log the error
    }

    const highlightIds = assignmentHighlights?.map((ah: any) => ah.highlight_id) || [];
    console.log(`📝 Found ${highlightIds.length} highlights to mark as completed`);

    // STEP 4: Mark all related highlights as completed (turn gold)
    let completedCount = 0;
    if (highlightIds.length > 0) {
      const { data: completedHighlights, error: completeError } = await supabaseAdmin
        .from('highlights')
        .update({
          previous_color: supabaseAdmin.raw('color'), // Save current color
          color: 'gold', // Turn gold
          completed_at: new Date().toISOString(),
          completed_by: user.id
        })
        .in('id', highlightIds)
        .select();

      if (completeError) {
        console.error('❌ Failed to complete highlights:', completeError);
        // Don't fail the request, assignment is still completed
      } else {
        completedCount = completedHighlights?.length || 0;
        console.log(`✅ Marked ${completedCount} highlights as completed (gold)`);
      }
    }

    // STEP 5: Create assignment event
    await supabaseAdmin
      .from('assignment_events')
      .insert({
        assignment_id: assignmentId,
        event_type: 'completed',
        actor_user_id: user.id,
        from_status: assignment.status,
        to_status: 'completed',
        meta: {
          highlights_completed: completedCount
        }
      });

    return NextResponse.json({
      success: true,
      data: {
        assignment: updatedAssignment,
        highlights_completed: completedCount
      },
      message: `Assignment completed successfully. ${completedCount} highlight(s) marked as completed.`
    });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
