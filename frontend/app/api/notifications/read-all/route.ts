/**
 * Mark All Notifications Read API Endpoint
 * PATCH /api/notifications/read-all - Mark all notifications as read
 *
 * Created: 2025-10-20
 * Purpose: Mark all user notifications as read, optionally filtered by type
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateMarkAllReadRequest,
  canMarkNotificationRead,
} from '@/lib/validators/notifications';
import {
  MarkAllReadResponse,
  NotificationErrorResponse,
} from '@/lib/types/notifications';

// ============================================================================
// PATCH /api/notifications/read-all - Mark All Notifications as Read
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    // 1. Initialize Supabase client with auth
    const supabase = createClient();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 3. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validation = validateMarkAllReadRequest(body);

    if (!validation.success) {
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: validation.error || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { errors: validation.errors },
        },
        { status: 400 }
      );
    }

    const { user_id, type } = validation.data;

    // 5. Determine target user (default to authenticated user)
    const targetUserId = user_id || user.id;

    // 6. Verify target user exists and is in same school
    if (targetUserId !== user.id) {
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('user_id, school_id')
        .eq('user_id', targetUserId)
        .single();

      if (!targetProfile || targetProfile.school_id !== profile.school_id) {
        return NextResponse.json<NotificationErrorResponse>(
          {
            success: false,
            error: 'Target user not found in your school',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }

      // 7. Check permissions for marking another user's notifications
      if (!canMarkNotificationRead({ userId: user.id, userRole: profile.role, schoolId: profile.school_id }, targetUserId)) {
        return NextResponse.json<NotificationErrorResponse>(
          {
            success: false,
            error: 'Insufficient permissions to mark notifications as read for this user',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
    }

    // 8. Build update query
    let query = supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', targetUserId)
      .eq('school_id', profile.school_id)
      .is('read_at', null); // Only update unread notifications

    // Apply type filter if specified
    if (type) {
      query = query.eq('type', type);
    }

    // 9. Execute update
    const { data: updatedNotifications, error: updateError } = await query.select();

    if (updateError) {
      console.error('Failed to mark all notifications as read:', updateError);
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'Failed to mark notifications as read',
          code: 'DATABASE_ERROR',
          details: { updateError },
        },
        { status: 500 }
      );
    }

    // 10. Count updated notifications
    const markedCount = updatedNotifications?.length || 0;

    // 11. Build response message
    let message = '';
    if (markedCount === 0) {
      message = type
        ? `No unread ${type} notifications to mark as read`
        : 'No unread notifications to mark as read';
    } else if (markedCount === 1) {
      message = type
        ? `Marked 1 ${type} notification as read`
        : 'Marked 1 notification as read';
    } else {
      message = type
        ? `Marked ${markedCount} ${type} notifications as read`
        : `Marked ${markedCount} notifications as read`;
    }

    // 12. Return success response
    return NextResponse.json<MarkAllReadResponse>(
      {
        success: true,
        data: {
          marked_count: markedCount,
        },
        message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/notifications/read-all:', error);
    return NextResponse.json<NotificationErrorResponse>(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: { error: String(error) },
      },
      { status: 500 }
    );
  }
}
