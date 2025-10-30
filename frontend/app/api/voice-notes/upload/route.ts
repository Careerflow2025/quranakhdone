/**
 * Upload Voice Note to Supabase Storage
 * POST /api/voice-notes/upload
 *
 * Accepts audio blob and uploads to voice-notes bucket
 * Returns public URL for saved audio file
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // Get form data with audio file
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const highlightId = formData.get('highlightId') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (!highlightId) {
      return NextResponse.json(
        { error: 'Highlight ID required' },
        { status: 400 }
      );
    }

    // Get user's school_id for proper file organization
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('school_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileExt = audioFile.name.split('.').pop() || 'm4a';
    const fileName = `${profile.school_id}/${user.id}/${highlightId}/${timestamp}-${randomId}.${fileExt}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('voice-notes')
      .upload(fileName, buffer, {
        contentType: audioFile.type || 'audio/m4a',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload audio: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from('voice-notes')
      .getPublicUrl(fileName);

    console.log('✅ Voice note uploaded:', fileName);

    return NextResponse.json({
      success: true,
      audioUrl: urlData.publicUrl,
      fileName: fileName
    });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
