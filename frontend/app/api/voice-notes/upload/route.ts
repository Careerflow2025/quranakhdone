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

    // Generate unique filename with proper extension based on mime type
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);

    // CRITICAL: Strip codec info from mime type (Supabase Storage rejects codecs)
    // audio/webm;codecs=opus → audio/webm
    const baseMimeType = audioFile.type.split(';')[0].trim();

    // Bucket only allows: audio/m4a, audio/mp3, audio/wav, audio/webm
    // Map incoming types to bucket-allowed types
    const mimeToExt: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/m4a': 'm4a',
      'audio/mp4': 'm4a',  // Map mp4 to m4a (bucket doesn't allow audio/mp4)
      'audio/ogg': 'webm'  // Map ogg to webm as fallback
    };

    const fileExt = mimeToExt[baseMimeType] || 'webm';

    // Map to bucket-allowed mime type
    const allowedMimeType = baseMimeType === 'audio/mp4' ? 'audio/m4a' :
                           baseMimeType === 'audio/mpeg' ? 'audio/mp3' :
                           baseMimeType === 'audio/ogg' ? 'audio/webm' :
                           baseMimeType;

    const fileName = `${profile.school_id}/${user.id}/${highlightId}/${timestamp}-${randomId}.${fileExt}`;

    console.log('🎵 Upload details:', {
      originalName: audioFile.name,
      originalMimeType: audioFile.type,
      baseMimeType: baseMimeType,
      allowedMimeType: allowedMimeType,
      size: audioFile.size,
      extension: fileExt,
      fileName: fileName
    });

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage - USE BUCKET-ALLOWED MIME TYPE
    // Bucket only accepts: audio/m4a, audio/mp3, audio/wav, audio/webm
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('voice-notes')
      .upload(fileName, buffer, {
        contentType: allowedMimeType,
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
