/**
 * Add Note to Highlight (with conversation threading)
 * POST /api/highlights/:id/notes/add
 *
 * Supports:
 * - Top-level notes (teacher explains highlight)
 * - Threaded replies (endless teacher-student conversation)
 * - Both text and audio notes
 * - Parent visibility control
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // Parse request body
    const body = await req.json();
    const {
      type = 'text',
      text,
      audio_url,
      parent_note_id,
      visible_to_parent = true
    } = body;
    const highlightId = params.id;

    // Validate required fields
    if (type === 'text' && !text?.trim()) {
      return NextResponse.json(
        { error: 'Text content required for text notes' },
        { status: 400 }
      );
    }

    if (type === 'audio' && !audio_url) {
      return NextResponse.json(
        { error: 'Audio URL required for audio notes' },
        { status: 400 }
      );
    }

    // Verify highlight exists and user has access
    const { data: highlight, error: highlightError } = await supabaseAdmin
      .from('highlights')
      .select('id, school_id, student_id, teacher_id')
      .eq('id', highlightId)
      .single();

    if (highlightError || !highlight) {
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
        { error: 'Access denied - different school' },
        { status: 403 }
      );
    }

    // Verify parent note exists if this is a reply
    if (parent_note_id) {
      const { data: parentNote } = await supabaseAdmin
        .from('notes')
        .select('id, highlight_id')
        .eq('id', parent_note_id)
        .eq('highlight_id', highlightId)
        .single();

      if (!parentNote) {
        return NextResponse.json(
          { error: 'Parent note not found or belongs to different highlight' },
          { status: 400 }
        );
      }
    }

    // Create note
    const { data: note, error: noteError } = await supabaseAdmin
      .from('notes')
      .insert({
        highlight_id: highlightId,
        author_user_id: user.id,
        type: type,
        text: type === 'text' ? text.trim() : null,
        audio_url: type === 'audio' ? audio_url : null,
        parent_note_id: parent_note_id || null,
        visible_to_parent: visible_to_parent
      })
      .select(`
        *,
        author:profiles!author_user_id(display_name, role)
      `)
      .single();

    if (noteError) {
      console.error('❌ Note creation error:', noteError);
      return NextResponse.json(
        { error: `Failed to create note: ${noteError.message}` },
        { status: 400 }
      );
    }

    console.log('✅ Note created successfully:', note.id, parent_note_id ? `(reply to ${parent_note_id})` : '(top-level)');

    return NextResponse.json({
      success: true,
      note: note
    }, { status: 201 });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
