/**
 * List Notifications API Endpoint
 * GET /api/notifications - List notifications with pagination and filters
 *
 * Created: 2025-10-20
 * Purpose: Retrieve user's notifications with filtering, pagination, and summary stats
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateListNotificationsRequest,
  canViewUserNotifications,
} from '@/lib/validators/notifications';
import {
  ListNotificationsResponse,
  NotificationErrorResponse,
  NotificationWithDetails,
  getTimeAgo,
  NOTIFICATION_CONSTANTS,
} from '@/lib/types/notifications';

// ============================================================================
// GET /api/notifications - List Notifications
// ============================================================================

export async function GET(request: NextRequest) {
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

    // 4. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryData = {
      user_id: searchParams.get('user_id') || undefined,
      channel: searchParams.get('channel') || undefined,
      type: searchParams.get('type') || undefined,
      read: searchParams.get('read') ? searchParams.get('read') === 'true' : undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : NOTIFICATION_CONSTANTS.DEFAULT_PAGINATION_LIMIT,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
    };

    const validation = validateListNotificationsRequest(queryData);

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

    const { user_id, channel, type, read, limit, offset, start_date, end_date } =
      validation.data;

    // 5. Determine target user (default to authenticated user)
    const targetUserId = user_id || user.id;

    // 6. Check permissions
    if (!canViewUserNotifications({ userId: user.id, userRole: profile.role, schoolId: profile.school_id }, targetUserId)) {
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to view these notifications',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Verify target user exists and is in same school
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
    }

    // 8. Build query for notifications
    let query = supabase
      .from('notifications')
      .select(
        `
        *,
        recipient:user_id(user_id, display_name, email)
      `,
        { count: 'exact' }
      )
      .eq('user_id', targetUserId)
      .eq('school_id', profile.school_id);

    // Apply filters
    if (channel) {
      query = query.eq('channel', channel);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (read !== undefined) {
      if (read === true) {
        query = query.not('read_at', 'is', null);
      } else {
        query = query.is('read_at', null);
      }
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset!, offset! + limit! - 1);

    // 9. Execute query
    const { data: notifications, error: notificationsError, count } = await query;

    if (notificationsError) {
      console.error('Notifications fetch error:', notificationsError);
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch notifications',
          code: 'DATABASE_ERROR',
          details: { notificationsError },
        },
        { status: 500 }
      );
    }

    // 10. Get total unread count (without filters except user_id)
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .eq('school_id', profile.school_id)
      .is('read_at', null);

    // 11. Process notifications with details
    const notificationsWithDetails: NotificationWithDetails[] = (notifications || []).map(
      (notification: any) => ({
        id: notification.id,
        school_id: notification.school_id,
        user_id: notification.user_id,
        channel: notification.channel,
        type: notification.type,
        payload: notification.payload,
        sent_at: notification.sent_at,
        read_at: notification.read_at,
        created_at: notification.created_at,
        recipient: notification.recipient
          ? {
              id: notification.recipient.user_id,
              display_name: notification.recipient.display_name || 'Unknown',
              email: notification.recipient.email,
            }
          : undefined,
        is_read: notification.read_at !== null,
        time_ago: getTimeAgo(notification.created_at),
      })
    );

    // 12. Calculate pagination metadata
    const totalCount = count || 0;
    const hasMore = offset! + limit! < totalCount;

    // 13. Return success response
    return NextResponse.json<ListNotificationsResponse>(
      {
        success: true,
        data: {
          notifications: notificationsWithDetails,
          pagination: {
            total: totalCount,
            limit: limit!,
            offset: offset!,
            has_more: hasMore,
          },
          summary: {
            unread_count: unreadCount || 0,
            total_count: totalCount,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/notifications:', error);
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
