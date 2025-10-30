/**
 * iCalendar Export API Endpoint
 * GET /api/events/ical - Export events in iCalendar (.ics) format
 *
 * Created: 2025-10-20
 * Purpose: Generate RFC 5545 compliant iCalendar files for external calendar integration
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateICalExportRequest,
  canExportIcal,
} from '@/lib/validators/events';
import {
  ICalExportResponse,
  EventErrorResponse,
  EventWithDetails,
  generateVEvent,
  EVENT_CONSTANTS,
} from '@/lib/types/events';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// Helper: Generate iCalendar File
// ============================================================================

function generateICalendar(events: EventWithDetails[], schoolName: string): string {
  const lines: string[] = [];

  // Header
  lines.push('BEGIN:VCALENDAR');
  lines.push(`VERSION:${EVENT_CONSTANTS.ICAL_VERSION}`);
  lines.push(`PRODID:${EVENT_CONSTANTS.ICAL_PRODID}`);
  lines.push(`CALSCALE:GREGORIAN`);
  lines.push(`METHOD:PUBLISH`);
  lines.push(`X-WR-CALNAME:${schoolName} - QuranAkh Calendar`);
  lines.push(`X-WR-TIMEZONE:UTC`);
  lines.push(`X-WR-CALDESC:Calendar events from ${schoolName} on QuranAkh`);

  // Add events
  for (const event of events) {
    lines.push(generateVEvent(event));
  }

  // Footer
  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

// ============================================================================
// GET /api/events/ical - Export iCalendar
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
      return NextResponse.json<EventErrorResponse>(
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
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Get school details
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .eq('id', profile.school_id)
      .single();

    if (schoolError || !school) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'School not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 5. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryData = {
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      event_type: searchParams.get('event_type') || undefined,
      class_id: searchParams.get('class_id') || undefined,
    };

    const validation = validateICalExportRequest(queryData);

    if (!validation.success) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: validation.error || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { errors: validation.errors },
        },
        { status: 400 }
      );
    }

    const { start_date, end_date, event_type, class_id } = validation.data;

    // 6. Check permissions
    if (!canExportIcal({ userId: user.id, userRole: profile.role, schoolId: profile.school_id }, profile.school_id)) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to export calendar',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Build query
    let query = supabase
      .from('events')
      .select(
        `
        *,
        creator:created_by_user_id(user_id, display_name, email, role),
        class:class_id(id, name, room),
        assignment:assignment_id(id, title, status),
        homework:homework_id(id),
        target:target_id(id, title)
      `
      )
      .eq('school_id', profile.school_id);

    // Apply filters
    if (start_date) {
      query = query.gte('end_date', start_date);
    }

    if (end_date) {
      query = query.lte('start_date', end_date);
    }

    if (event_type) {
      query = query.eq('event_type', event_type);
    }

    if (class_id) {
      query = query.eq('class_id', class_id);
    }

    // Order by start date
    query = query.order('start_date', { ascending: true });

    // 8. Execute query
    const { data: events, error: eventsError } = await query;

    if (eventsError) {
      console.error('Events fetch error:', eventsError);
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch events',
          code: 'DATABASE_ERROR',
          details: { eventsError },
        },
        { status: 500 }
      );
    }

    // 9. Process events with details
    const eventsWithDetails: EventWithDetails[] = (events || []).map((event: any) => ({
      ...event,
      creator: event.creator
        ? {
            id: event.creator.user_id,
            display_name: event.creator.display_name || 'Unknown',
            email: event.creator.email,
            role: event.creator.role,
          }
        : undefined,
      class: event.class || undefined,
      assignment: event.assignment || undefined,
      homework: event.homework || undefined,
      target: event.target || undefined,
    }));

    // 10. Generate iCalendar file
    const iCalData = generateICalendar(eventsWithDetails, school.name);

    // 11. Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${school.name.replace(/\s+/g, '_')}_Calendar_${dateStr}.ics`;

    // 12. Return iCalendar file as downloadable response
    return new NextResponse(iCalData, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/events/ical:', error);
    return NextResponse.json<EventErrorResponse>(
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
