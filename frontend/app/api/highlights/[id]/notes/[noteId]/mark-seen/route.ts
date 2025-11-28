/**
 * Mark Note as Seen (WhatsApp-style Read Receipts)
 * PUT /api/highlights/:highlightId/notes/:noteId/mark-seen
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

    // Verify note exists
    const { data: note, error: noteError } = await supabaseAdmin
      .from('notes')
      .select('id, author_user_id, highlight_id, seen_at, seen_by')
      .eq('id', noteId)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify note belongs to highlight
    if (note.highlight_id !== highlightId) {
      return NextResponse.json({ error: 'Note does not belong to this highlight' }, { status: 400 });
    }

    // Prevent author from marking own message
    if (note.author_user_id === user.id) {
      return NextResponse.json({
        success: true,
        message: 'Cannot mark own message as seen',
        note: note
      }, { status: 200 });
    }

    // Check if already marked
    if (note.seen_at && note.seen_by) {
      return NextResponse.json({
        success: true,
        message: 'Note already marked as seen',
        note: note
      }, { status: 200 });
    }

    // Verify school access
    const { data: highlight, error: highlightError } = await supabaseAdmin
      .from('highlights')
      .select('id, school_id')
      .eq('id', highlightId)
      .single();

    if (highlightError || !highlight) {
      return NextResponse.json({ error: 'Highlight not found' }, { status: 404 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.school_id !== highlight.school_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Mark as seen
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
      return NextResponse.json(
        { error: `Failed to mark note as seen: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Note marked as seen:', noteId, 'by user:', user.id);

    return NextResponse.json({
      success: true,
      note: updatedNote,
      message: 'Note marked as seen'
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Server error in mark-seen endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
