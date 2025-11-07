import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// PUT - Mark highlight as completed (turn gold)
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

    const highlightId = params.id;

    // Get the highlight to verify school and get current color
    const { data: highlight, error: fetchError } = await supabaseAdmin
      .from('highlights')
      .select('*')
      .eq('id', highlightId)
      .eq('school_id', profile.school_id)
      .single();

    if (fetchError || !highlight) {
      return NextResponse.json(
        { error: 'Highlight not found' },
        { status: 404 }
      );
    }

    // Update highlight: save previous color and change to gold
    const { data: updatedHighlight, error: updateError } = await supabaseAdmin
      .from('highlights')
      .update({
        previous_color: highlight.color, // Save original color
        color: 'gold', // Change to gold
        completed_at: new Date().toISOString(),
        completed_by: user.id
      })
      .eq('id', highlightId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to complete highlight:', updateError);
      return NextResponse.json(
        { error: `Failed to complete highlight: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Highlight marked as completed:', highlightId);

    // Check if this highlight is linked to an assignment
    // If yes, mark the assignment as completed too
    const { data: linkedAssignments, error: linkError } = await supabaseAdmin
      .from('assignment_highlights')
      .select('assignment_id')
      .eq('highlight_id', highlightId);

    if (!linkError && linkedAssignments && linkedAssignments.length > 0) {
      console.log(`🔗 Found ${linkedAssignments.length} linked assignment(s) for highlight ${highlightId}`);

      // Update all linked assignments to completed status
      for (const link of linkedAssignments) {
        const { error: assignmentUpdateError } = await supabaseAdmin
          .from('assignments')
          .update({ status: 'completed' })
          .eq('id', link.assignment_id);

        if (assignmentUpdateError) {
          console.error(`❌ Failed to complete assignment ${link.assignment_id}:`, assignmentUpdateError);
        } else {
          console.log(`✅ Assignment ${link.assignment_id} marked as completed`);
        }
      }
    } else {
      console.log('ℹ️ No linked assignments found for this highlight');
    }

    return NextResponse.json({
      success: true,
      data: updatedHighlight,
      highlight: updatedHighlight
    });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
