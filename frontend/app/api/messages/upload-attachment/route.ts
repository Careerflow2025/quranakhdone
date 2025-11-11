/**
 * Message Attachment Upload API Endpoint
 * POST /api/messages/upload-attachment - Upload file to Supabase Storage
 *
 * Purpose: Upload files before sending messages, return URLs for attachment records
 * Storage Path: attachments/{school_id}/{user_id}/{message_id_temp}/{uuid}.{ext}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/mpeg',
  'audio/wav',
  'audio/m4a',
  'audio/mp4',
];

interface UploadResponse {
  success: true;
  url: string;
  mime_type: string;
  file_name: string;
  file_size: number;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client with auth
    const supabase = createClientWithAuth();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // Get user profile for school_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const messageIdTemp = formData.get('message_id_temp') as string; // Temporary ID for grouping uploads

    if (!file) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'No file provided',
          code: 'MISSING_FILE',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          code: 'FILE_TOO_LARGE',
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: `File type ${file.type} is not allowed`,
          code: 'INVALID_FILE_TYPE',
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const uniqueFilename = `${timestamp}-${randomString}.${fileExt}`;

    // Storage path: attachments/{school_id}/{user_id}/{message_id_temp}/{unique_filename}
    const storagePath = `${profile.school_id}/${user.id}/${messageIdTemp || 'temp'}/${uniqueFilename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Failed to upload file',
          code: 'UPLOAD_ERROR',
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(storagePath);

    return NextResponse.json<UploadResponse>(
      {
        success: true,
        url: urlData.publicUrl,
        mime_type: file.type,
        file_name: file.name,
        file_size: file.size,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/messages/upload-attachment:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
