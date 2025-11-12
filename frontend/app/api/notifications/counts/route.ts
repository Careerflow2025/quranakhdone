/**
 * Notification Counts API Endpoint
 * GET /api/notifications/counts - Get unread notification counts per section
 *
 * Purpose: Retrieve unread counts for each section to display on sidebar badges
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/notifications/counts
 * Returns unread notification counts grouped by section
 */
export async function GET(request: NextRequest) {
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

    // 3. Get user profile to ensure they're in a school
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 4. Get unread notification counts per section using database function
    const { data: counts, error: countsError } = await supabase
      .rpc('get_unread_notification_counts', {
        p_user_id: user.id
      });

    if (countsError) {
      console.error('Error fetching notification counts:', countsError);
      return NextResponse.json(
        { error: 'Failed to fetch notification counts' },
        { status: 500 }
      );
    }

    // 5. Format counts as an object for easy access
    const countsMap: Record<string, number> = {};
    (counts || []).forEach((item: { section: string; count: number }) => {
      countsMap[item.section] = item.count;
    });

    return NextResponse.json({
      success: true,
      data: {
        counts: countsMap,
        total: Object.values(countsMap).reduce((sum: number, count: number) => sum + count, 0),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/counts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
