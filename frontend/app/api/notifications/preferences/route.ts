/**
 * Notification Preferences API Endpoints
 * GET /api/notifications/preferences - Get user notification preferences
 * PATCH /api/notifications/preferences - Update user notification preferences
 *
 * Created: 2025-10-20
 * Purpose: Manage user notification preferences and settings
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateUpdatePreferencesRequest,
  canUpdatePreferences,
} from '@/lib/validators/notifications';
import {
  GetPreferencesResponse,
  UpdatePreferencesResponse,
  NotificationErrorResponse,
  NotificationPreferencesWithDefaults,
  getDefaultPreferences,
} from '@/lib/types/notifications';

// ============================================================================
// GET /api/notifications/preferences - Get Notification Preferences
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

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('user_id') || user.id;

    // 5. Check permissions if viewing another user's preferences
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

      // Only admins and owners can view other users' preferences
      if (!['owner', 'admin'].includes(profile.role)) {
        return NextResponse.json<NotificationErrorResponse>(
          {
            success: false,
            error: 'Insufficient permissions to view these preferences',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
    }

    // 6. Get preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    // 7. If preferences don't exist, create with defaults
    let finalPreferences;
    if (preferencesError || !preferences) {
      const defaultPrefs = getDefaultPreferences(targetUserId);

      const { data: newPreferences, error: createError } = await supabase
        .from('notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single();

      if (createError) {
        console.error('Failed to create default preferences:', createError);
        return NextResponse.json<NotificationErrorResponse>(
          {
            success: false,
            error: 'Failed to create notification preferences',
            code: 'DATABASE_ERROR',
            details: { createError },
          },
          { status: 500 }
        );
      }

      finalPreferences = newPreferences;
    } else {
      finalPreferences = preferences;
    }

    // 8. Get device count for push notifications
    const { count: deviceCount } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    // 9. Build response with defaults
    const preferencesWithDefaults: NotificationPreferencesWithDefaults = {
      ...finalPreferences,
      has_push_devices: (deviceCount || 0) > 0,
      push_devices_count: deviceCount || 0,
    };

    // 10. Return success response
    return NextResponse.json<GetPreferencesResponse>(
      {
        success: true,
        data: {
          preferences: preferencesWithDefaults,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/notifications/preferences:', error);
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

// ============================================================================
// PATCH /api/notifications/preferences - Update Notification Preferences
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
    const validation = validateUpdatePreferencesRequest(body);

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

    const updates = validation.data;

    // 5. Parse query parameters for target user
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('user_id') || user.id;

    // 6. Check permissions
    if (!canUpdatePreferences({ userId: user.id, userRole: profile.role, schoolId: profile.school_id }, targetUserId)) {
      return NextResponse.json<NotificationErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to update these preferences',
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

    // 8. Check if preferences exist
    const { data: existingPreferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    // 9. Update or create preferences
    let updatedPreferences;
    if (existingPreferences) {
      // Update existing preferences
      const { data: updated, error: updateError } = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', targetUserId)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update preferences:', updateError);
        return NextResponse.json<NotificationErrorResponse>(
          {
            success: false,
            error: 'Failed to update preferences',
            code: 'DATABASE_ERROR',
            details: { updateError },
          },
          { status: 500 }
        );
      }

      updatedPreferences = updated;
    } else {
      // Create new preferences with defaults and updates
      const defaultPrefs = getDefaultPreferences(targetUserId);
      const { data: created, error: createError } = await supabase
        .from('notification_preferences')
        .insert({
          ...defaultPrefs,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create preferences:', createError);
        return NextResponse.json<NotificationErrorResponse>(
          {
            success: false,
            error: 'Failed to create preferences',
            code: 'DATABASE_ERROR',
            details: { createError },
          },
          { status: 500 }
        );
      }

      updatedPreferences = created;
    }

    // 10. Get device count
    const { count: deviceCount } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    // 11. Build response with defaults
    const preferencesWithDefaults: NotificationPreferencesWithDefaults = {
      ...updatedPreferences,
      has_push_devices: (deviceCount || 0) > 0,
      push_devices_count: deviceCount || 0,
    };

    // 12. Return success response
    return NextResponse.json<UpdatePreferencesResponse>(
      {
        success: true,
        data: {
          preferences: preferencesWithDefaults,
        },
        message: 'Notification preferences updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/notifications/preferences:', error);
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
