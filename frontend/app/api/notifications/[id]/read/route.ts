/**
 * Mark Notification Read API Endpoint
 * PATCH /api/notifications/:id/read - Mark a single notification as read
 *
 * Created: 2025-10-20
 * Purpose: Mark individual notification as read with timestamp
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateMarkReadRequest,
  canMarkNotificationRead,
} from '@/lib/validators/notifications';
import {
  MarkReadResponse,
  NotificationErrorResponse,
  NotificationWithDetails,
  getTimeAgo,
} from '@/lib/types/notifications';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// PATCH /api/notifications/:id/read - Mark Notification as Read
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;

    // 1. Validate notification ID format
    const validation = validateMarkReadRequest({ notification_id: notificationId });

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

    // 2. Initialize Supabase client with auth
    const supabase = createClient();

    // 3. Get authenticated user
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

    // 4. Get user profile
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

    // 5. Get notification
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .select('id, school_id, user_id, channel, type, payload, sent_at, read_at, created_at')
      .eq('id', notificationId)
      .single();

    if (notificationError || !notification) {
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'Notification not found',
          code: 'NOTIFICATION_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 6. Verify notification belongs to user's school
    if (notification.school_id !== profile.school_id) {
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'Notification not found in your school',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Check permissions
    if (!canMarkNotificationRead({ userId: user.id, userRole: profile.role, schoolId: profile.school_id }, notification.user_id)) {
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to mark this notification as read',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Check if already read
    if (notification.read_at !== null) {
      // Already marked as read, return current state
      const { data: recipient } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .eq('user_id', notification.user_id)
        .single();

      const notificationWithDetails: NotificationWithDetails = {
        ...notification,
        recipient: recipient
          ? {
              id: recipient.user_id,
              display_name: recipient.display_name || 'Unknown',
              email: recipient.email,
            }
          : undefined,
        is_read: true,
        time_ago: getTimeAgo(notification.created_at),
      };

      return NextResponse.json<MarkReadResponse>(
        {
          success: true,
          data: {
            notification: notificationWithDetails,
          },
          message: 'Notification was already marked as read',
        },
        { status: 200 }
      );
    }

    // 9. Mark notification as read
    const now = new Date().toISOString();
    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('id', notificationId)
      .select()
      .single();

    if (updateError || !updatedNotification) {
      console.error('Failed to mark notification as read:', updateError);
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'Failed to mark notification as read',
          code: 'DATABASE_ERROR',
          details: { updateError },
        },
        { status: 500 }
      );
    }

    // 10. Get recipient details
    const { data: recipient } = await supabase
      .from('profiles')
      .select('user_id, display_name, email')
      .eq('user_id', updatedNotification.user_id)
      .single();

    // 11. Build response with notification details
    const notificationWithDetails: NotificationWithDetails = {
      ...updatedNotification,
      recipient: recipient
        ? {
            id: recipient.user_id,
            display_name: recipient.display_name || 'Unknown',
            email: recipient.email,
          }
        : undefined,
      is_read: true,
      time_ago: getTimeAgo(updatedNotification.created_at),
    };

    // 12. Return success response
    return NextResponse.json<MarkReadResponse>(
      {
        success: true,
        data: {
          notification: notificationWithDetails,
        },
        message: 'Notification marked as read',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/notifications/:id/read:', error);
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
