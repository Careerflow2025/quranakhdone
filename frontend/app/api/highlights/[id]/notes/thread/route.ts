/**
 * Get Conversation Thread for Highlight
 * GET /api/highlights/:id/notes/thread
 *
 * Returns full conversation with nested replies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const highlightId = params.id;

    // Verify highlight exists and user has access
    const { data: highlight } = await supabaseAdmin
      .from('highlights')
      .select('id, school_id')
      .eq('id', highlightId)
      .single();

    if (!highlight) {
      return NextResponse.json(
        { error: 'Highlight not found' },
        { status: 404 }
      );
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.school_id !== highlight.school_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Use the get_note_thread function for efficient recursive query
    const { data: thread, error: threadError } = await supabaseAdmin
      .rpc('get_note_thread', { p_highlight_id: highlightId });

    if (threadError) {
      console.error('❌ Thread query error:', threadError);
      return NextResponse.json(
        { error: 'Failed to load conversation thread' },
        { status: 500 }
      );
    }

    // Filter based on user role and visibility
    let filteredThread = thread || [];
    if (profile.role === 'parent') {
      // Parents only see notes marked visible_to_parent
      filteredThread = filteredThread.filter((note: any) => note.visible_to_parent);
    }

    return NextResponse.json({
      success: true,
      thread: filteredThread,
      count: filteredThread.length
    });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
