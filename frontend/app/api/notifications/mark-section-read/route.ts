/**
 * Mark Section Notifications as Read API Endpoint
 * POST /api/notifications/mark-section-read - Mark all notifications in a section as read
 *
 * Purpose: Mark all unread notifications for a specific section as read when user clicks on it
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/notifications/mark-section-read
 * Marks all unread notifications for a section as read
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Initialize Supabase client with auth from Authorization header
    const supabase = createClientWithAuth();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { section } = body;

    if (!section) {
      return NextResponse.json(
        { error: 'Section parameter is required' },
        { status: 400 }
      );
    }

    // 4. Mark all notifications for this section as read using database function
    const { error: updateError } = await supabase
      .rpc('mark_section_notifications_read', {
        p_user_id: user.id,
        p_section: section
      });

    if (updateError) {
      console.error('Error marking notifications as read:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `All notifications in ${section} marked as read`,
    });
  } catch (error) {
    console.error('Error in POST /api/notifications/mark-section-read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
