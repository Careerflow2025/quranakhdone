/**
 * Send Notification API Endpoint
 * POST /api/notifications/send - Send a notification to a user
 *
 * Created: 2025-10-20
 * Purpose: Send notifications across multiple channels with preference filtering
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateSendNotificationRequest,
  canSendNotification,
} from '@/lib/validators/notifications';
import {
  SendNotificationResponse,
  NotificationErrorResponse,
  NotificationWithDetails,
  NotificationChannel,
  shouldSendNotification,
  isQuietHours,
  getNotificationTitle,
  getNotificationBody,
} from '@/lib/types/notifications';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// POST /api/notifications/send - Send Notification
// ============================================================================

export async function POST(request: NextRequest) {
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
    const validation = validateSendNotificationRequest(body);

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

    const { user_id, type, channels, payload, scheduled_for } = validation.data;

    // 5. Verify target user exists
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('profiles')
      .select('user_id, school_id, display_name, email')
      .eq('user_id', user_id)
      .single();

    if (targetProfileError || !targetProfile) {
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'Target user not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 6. Check permissions
    if (!canSendNotification({ userId: user.id, userRole: profile.role, schoolId: profile.school_id }, targetProfile.school_id)) {
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to send notifications',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Verify same school
    if (targetProfile.school_id !== profile.school_id) {
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'Cannot send notifications to users in other schools',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Get target user's notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    // 9. Check if it's quiet hours (only affects push and email, not in_app)
    const isCurrentlyQuietHours = isQuietHours(preferences);

    // 10. Filter channels based on preferences and quiet hours
    const allowedChannels: NotificationChannel[] = [];
    const deliveryStatus: Record<string, 'sent' | 'queued' | 'failed'> = {};

    for (const channel of channels) {
      // Check if notification should be sent based on preferences
      if (shouldSendNotification(type, channel, preferences)) {
        // Respect quiet hours for push and email (but always send in_app)
        if (channel === 'in_app' || !isCurrentlyQuietHours) {
          allowedChannels.push(channel);
        } else {
          // During quiet hours, queue email/push for later
          if (channel === 'email' || channel === 'push') {
            deliveryStatus[channel] = 'queued';
          }
        }
      } else {
        deliveryStatus[channel] = 'failed';
      }
    }

    // 11. If no channels allowed, return error
    if (allowedChannels.length === 0 && Object.values(deliveryStatus).every(s => s === 'failed')) {
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'No channels allowed based on user preferences',
          code: 'DELIVERY_FAILED',
          details: {
            message: 'User has disabled all requested notification channels',
            preferences: preferences,
          },
        },
        { status: 400 }
      );
    }

    // 12. Create notification records for allowed channels
    const notificationRecords = [];
    const now = new Date().toISOString();

    for (const channel of allowedChannels) {
      const notificationData = {
        school_id: profile.school_id,
        user_id: user_id,
        channel: channel,
        type: type,
        payload: payload,
        sent_at: scheduled_for ? null : now, // If scheduled, set sent_at to null
        created_at: now,
      };

      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (notificationError) {
        console.error(`Failed to create ${channel} notification:`, notificationError);
        deliveryStatus[channel] = 'failed';
      } else {
        notificationRecords.push(notification);
        deliveryStatus[channel] = scheduled_for ? 'queued' : 'sent';
      }
    }

    // 13. Handle push notifications - check for device tokens
    if (allowedChannels.includes('push')) {
      const { data: devices } = await supabase
        .from('devices')
        .select('id, push_token, platform')
        .eq('user_id', user_id);

      if (!devices || devices.length === 0) {
        // No devices registered, mark as failed
        deliveryStatus['push'] = 'failed';
        console.warn(`No push devices registered for user ${user_id}`);
      } else {
        // TODO: Send actual push notifications to devices
        // This would integrate with OneSignal, Firebase, or similar service
        // For now, we just log that we would send
        console.log(`Would send push to ${devices.length} device(s) for user ${user_id}`);
        deliveryStatus['push'] = deliveryStatus['push'] || 'sent';
      }
    }

    // 14. Handle email notifications
    if (allowedChannels.includes('email')) {
      // TODO: Queue email for sending via Resend or SendGrid
      // For now, we just log that we would send
      const emailTitle = getNotificationTitle(type, payload);
      const emailBody = getNotificationBody(type, payload);
      console.log(`Would send email to ${targetProfile.email}:`, {
        title: emailTitle,
        body: emailBody,
      });
      deliveryStatus['email'] = deliveryStatus['email'] || 'queued';
    }

    // 15. If all notifications failed, return error
    if (notificationRecords.length === 0) {
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'Failed to create notification records',
          code: 'DATABASE_ERROR',
          details: { deliveryStatus },
        },
        { status: 500 }
      );
    }

    // 16. Build response with notification details
    const primaryNotification = notificationRecords[0];
    const notificationWithDetails: NotificationWithDetails = {
      ...primaryNotification,
      recipient: {
        id: targetProfile.user_id,
        display_name: targetProfile.display_name || 'Unknown',
        email: targetProfile.email,
      },
      is_read: false,
      time_ago: 'just now',
    };

    // 17. Return success response
    return NextResponse.json<SendNotificationResponse>(
      {
        success: true,
        data: {
          notification: notificationWithDetails,
          delivery_status: deliveryStatus,
        },
        message: scheduled_for
          ? `Notification scheduled for ${new Date(scheduled_for).toLocaleString()}`
          : `Notification sent successfully across ${allowedChannels.length} channel(s)`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/notifications/send:', error);
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
