/**
 * Mark Note as Seen (WhatsApp-style Read Receipts)
 * PUT /api/highlights/:highlightId/notes/:noteId/mark-seen
 *
 * Updates seen_at and seen_by when a message is opened by the recipient
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
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
    const noteId = params.noteId;

    // ============================================================================
    // STEP 1: Verify note exists and get its details
    // ============================================================================
    const { data: note, error: noteError } = await supabaseAdmin
      .from('notes')
      .select('id, author_user_id, highlight_id, seen_at, seen_by')
      .eq('id', noteId)
      .single();

    if (noteError || !note) {
      console.error('❌ Note not found:', noteId, noteError);
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Verify note belongs to the specified highlight
    if (note.highlight_id !== highlightId) {
      console.error('❌ Note does not belong to highlight:', noteId, highlightId);
      return NextResponse.json(
        { error: 'Note does not belong to this highlight' },
        { status: 400 }
      );
    }

    // ============================================================================
    // STEP 2: Prevent author from marking their own message as seen
    // ============================================================================
    if (note.author_user_id === user.id) {
      console.log('ℹ️ Author cannot mark own message as seen:', noteId);
      return NextResponse.json(
        {
          success: true,
          message: 'Cannot mark own message as seen',
          note: note
        },
        { status: 200 }
      );
    }

    // ============================================================================
    // STEP 3: Check if already marked as seen
    // ============================================================================
    if (note.seen_at && note.seen_by) {
      console.log('ℹ️ Note already marked as seen:', noteId);
      return NextResponse.json(
        {
          success: true,
          message: 'Note already marked as seen',
          note: note
        },
        { status: 200 }
      );
    }

    // ============================================================================
    // STEP 4: Verify user has access to the highlight (same school)
    // ============================================================================
    const { data: highlight, error: highlightError } = await supabaseAdmin
      .from('highlights')
      .select('id, school_id')
      .eq('id', highlightId)
      .single();

    if (highlightError || !highlight) {
      console.error('❌ Highlight not found:', highlightId, highlightError);
      return NextResponse.json(
        { error: 'Highlight not found' },
        { status: 404 }
      );
    }

    // Get user profile to verify school
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile not found:', user.id, profileError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    if (profile.school_id !== highlight.school_id) {
      console.error('❌ Cross-school access attempt:', user.id, profile.school_id, highlight.school_id);
      return NextResponse.json(
        { error: 'Access denied - different school' },
        { status: 403 }
      );
    }

    // ============================================================================
    // STEP 5: Mark note as seen
    // ============================================================================
    const now = new Date().toISOString();
    const { data: updatedNote, error: updateError } = await supabaseAdmin
      .from('notes')
      .update({
        seen_at: now,
        seen_by: user.id
      })
      .eq('id', noteId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to mark note as seen:', noteId, updateError);
      return NextResponse.json(
        { error: `Failed to mark note as seen: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Note marked as seen:', noteId, 'by user:', user.id, 'at:', now);

    return NextResponse.json({
      success: true,
      note: updatedNote,
      message: 'Note marked as seen'
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Server error in mark-seen endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
