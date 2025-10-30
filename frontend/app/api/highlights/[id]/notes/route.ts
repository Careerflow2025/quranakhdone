/**
 * Notes API for Highlights
 * POST /api/highlights/:id/notes - Create a note for a highlight
 *
 * Created: 2025-10-22
 * Purpose: Add text and voice notes to highlights
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// POST /api/highlights/:id/notes - Create Note
// ============================================================================

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

    // Parse request body
    const body = await req.json();
    const { type, text, audio_url } = body;
    const highlightId = params.id;

    // Validate required fields
    if (!type || (type !== 'text' && type !== 'audio')) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "text" or "audio"' },
        { status: 400 }
      );
    }

    if (type === 'text' && !text) {
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

    // Verify highlight is in same school
    if (highlight.school_id !== profile.school_id) {
      return NextResponse.json(
        { error: 'Cannot create note for highlight in different school' },
        { status: 403 }
      );
    }

    // Create note
    const { data: note, error: noteError } = await supabaseAdmin
      .from('notes')
      .insert({
        highlight_id: highlightId,
        author_user_id: user.id,
        type: type,
        text: type === 'text' ? text : null,
        audio_url: type === 'audio' ? audio_url : null
      })
      .select()
      .single();

    if (noteError) {
      console.error('❌ Note creation error:', noteError);
      return NextResponse.json(
        { error: `Failed to create note: ${noteError.message}` },
        { status: 400 }
      );
    }

    console.log('✅ Note created successfully:', note.id);

    return NextResponse.json({
      success: true,
      data: note,
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
