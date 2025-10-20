/**
 * Calendar Events API Endpoints
 * POST /api/events - Create a new event (with optional recurrence)
 * GET /api/events - List events with filters and pagination
 *
 * Created: 2025-10-20
 * Purpose: Manage calendar events with recurring event support
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateCreateEventRequest,
  validateListEventsRequest,
  canCreateEvent,
  canViewEvents,
} from '@/lib/validators/events';
import {
  CreateEventResponse,
  ListEventsResponse,
  EventErrorResponse,
  EventWithDetails,
  RecurrenceRule,
  getEventTypeColor,
  EVENT_CONSTANTS,
} from '@/lib/types/events';

// ============================================================================
// Helper: Generate Recurring Event Instances
// ============================================================================

function generateRecurringInstances(
  baseEvent: any,
  rule: RecurrenceRule,
  maxCount: number = EVENT_CONSTANTS.MAX_RECURRENCE_COUNT
): any[] {
  const instances: any[] = [];
  const start = new Date(baseEvent.start_date);
  const end = new Date(baseEvent.end_date);
  const duration = end.getTime() - start.getTime();

  let currentDate = new Date(start);
  let count = 0;
  const maxOccurrences = rule.count || maxCount;
  const untilDate = rule.until ? new Date(rule.until) : null;

  while (count < maxOccurrences) {
    // Check if we've passed the until date
    if (untilDate && currentDate > untilDate) {
      break;
    }

    // Check frequency-specific conditions
    let shouldInclude = true;

    if (rule.frequency === 'weekly' && rule.by_weekday) {
      const dayOfWeek = currentDate.getDay();
      shouldInclude = rule.by_weekday.includes(dayOfWeek);
    }

    if (rule.frequency === 'monthly' && rule.by_month_day) {
      shouldInclude = currentDate.getDate() === rule.by_month_day;
    }

    if (rule.frequency === 'yearly' && rule.by_month) {
      shouldInclude = currentDate.getMonth() + 1 === rule.by_month;
    }

    if (shouldInclude) {
      const instanceStart = new Date(currentDate);
      const instanceEnd = new Date(currentDate.getTime() + duration);

      instances.push({
        ...baseEvent,
        start_date: instanceStart.toISOString(),
        end_date: instanceEnd.toISOString(),
      });

      count++;
    }

    // Increment currentDate based on frequency
    switch (rule.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + rule.interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * rule.interval);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + rule.interval);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + rule.interval);
        break;
    }

    // Safety check: don't loop forever
    if (count > maxCount * 2) {
      console.warn('Recurrence generation exceeded safety limit');
      break;
    }
  }

  return instances;
}

// ============================================================================
// POST /api/events - Create Event
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

    // 4. Parse and validate request body
    const body = await request.json();
    const validation = validateCreateEventRequest(body);

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

    const {
      title,
      description,
      event_type,
      start_date,
      end_date,
      all_day,
      location,
      color,
      is_recurring,
      recurrence_rule,
      class_id,
      assignment_id,
      homework_id,
      target_id,
      participant_user_ids,
    } = validation.data;

    // 5. Check permissions
    if (!canCreateEvent({ userId: user.id, userRole: profile.role, schoolId: profile.school_id }, profile.school_id)) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to create events',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Verify linked resources exist (if provided)
    if (class_id) {
      const { data: classExists } = await supabase
        .from('classes')
        .select('id, school_id')
        .eq('id', class_id)
        .single();

      if (!classExists || classExists.school_id !== profile.school_id) {
        return NextResponse.json<EventErrorResponse>(
          {
            success: false,
            error: 'Class not found in your school',
            code: 'RESOURCE_NOT_FOUND',
          },
          { status: 404 }
        );
      }
    }

    if (assignment_id) {
      const { data: assignmentExists } = await supabase
        .from('assignments')
        .select('id, school_id')
        .eq('id', assignment_id)
        .single();

      if (!assignmentExists || assignmentExists.school_id !== profile.school_id) {
        return NextResponse.json<EventErrorResponse>(
          {
            success: false,
            error: 'Assignment not found in your school',
            code: 'RESOURCE_NOT_FOUND',
          },
          { status: 404 }
        );
      }
    }

    // 7. Prepare base event data
    const baseEventData = {
      school_id: profile.school_id,
      created_by_user_id: user.id,
      title,
      description: description || null,
      event_type,
      start_date,
      end_date,
      all_day: all_day || false,
      location: location || null,
      color: color || getEventTypeColor(event_type),
      is_recurring: is_recurring || false,
      recurrence_rule: recurrence_rule || null,
      recurrence_parent_id: null,
      class_id: class_id || null,
      assignment_id: assignment_id || null,
      homework_id: homework_id || null,
      target_id: target_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 8. Create event(s)
    let createdEvents: any[] = [];
    let recurrenceCount = 0;

    if (is_recurring && recurrence_rule) {
      // Create parent event
      const { data: parentEvent, error: parentError } = await supabase
        .from('events')
        .insert(baseEventData)
        .select()
        .single();

      if (parentError || !parentEvent) {
        console.error('Failed to create parent event:', parentError);
        return NextResponse.json<EventErrorResponse>(
          {
            success: false,
            error: 'Failed to create event',
            code: 'DATABASE_ERROR',
            details: { parentError },
          },
          { status: 500 }
        );
      }

      createdEvents.push(parentEvent);

      // Generate recurring instances
      const instances = generateRecurringInstances(baseEventData, recurrence_rule);
      recurrenceCount = instances.length;

      // Create instances (skip first one as it's the parent)
      for (let i = 1; i < instances.length; i++) {
        const instanceData = {
          ...instances[i],
          recurrence_parent_id: parentEvent.id,
        };

        const { data: instanceEvent } = await supabase
          .from('events')
          .insert(instanceData)
          .select()
          .single();

        if (instanceEvent) {
          createdEvents.push(instanceEvent);
        }
      }
    } else {
      // Create single event
      const { data: singleEvent, error: singleError } = await supabase
        .from('events')
        .insert(baseEventData)
        .select()
        .single();

      if (singleError || !singleEvent) {
        console.error('Failed to create event:', singleError);
        return NextResponse.json<EventErrorResponse>(
          {
            success: false,
            error: 'Failed to create event',
            code: 'DATABASE_ERROR',
            details: { singleError },
          },
          { status: 500 }
        );
      }

      createdEvents.push(singleEvent);
    }

    // 9. Add participants (if provided)
    if (participant_user_ids && participant_user_ids.length > 0) {
      const participantsData = participant_user_ids.flatMap((userId) =>
        createdEvents.map((event) => ({
          event_id: event.id,
          user_id: userId,
          status: 'invited',
        }))
      );

      await supabase.from('event_participants').insert(participantsData);
    }

    // 10. Get creator details for response
    const { data: creator } = await supabase
      .from('profiles')
      .select('user_id, display_name, email, role')
      .eq('user_id', user.id)
      .single();

    // 11. Build response with event details
    const primaryEvent = createdEvents[0];
    const eventWithDetails: EventWithDetails = {
      ...primaryEvent,
      creator: creator
        ? {
            id: creator.user_id,
            display_name: creator.display_name || 'Unknown',
            email: creator.email,
            role: creator.role,
          }
        : undefined,
    };

    // 12. Return success response
    return NextResponse.json<CreateEventResponse>(
      {
        success: true,
        data: {
          event: eventWithDetails,
          recurrence_count: recurrenceCount > 0 ? recurrenceCount : undefined,
        },
        message: is_recurring
          ? `Created recurring event with ${recurrenceCount} occurrences`
          : 'Event created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/events:', error);
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

// ============================================================================
// GET /api/events - List Events
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

    // 4. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryData = {
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      event_type: searchParams.get('event_type') || undefined,
      class_id: searchParams.get('class_id') || undefined,
      created_by_user_id: searchParams.get('created_by_user_id') || undefined,
      include_recurring: searchParams.get('include_recurring') !== 'false',
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : EVENT_CONSTANTS.DEFAULT_PAGINATION_LIMIT,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const validation = validateListEventsRequest(queryData);

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

    const {
      start_date,
      end_date,
      event_type,
      class_id,
      created_by_user_id,
      limit,
      offset,
    } = validation.data;

    // 5. Check permissions
    if (!canViewEvents({ userId: user.id, userRole: profile.role, schoolId: profile.school_id }, profile.school_id)) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to view events',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Build query
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
      `,
        { count: 'exact' }
      )
      .eq('school_id', profile.school_id);

    // Apply filters
    if (start_date) {
      query = query.gte('end_date', start_date); // Events ending after start date
    }

    if (end_date) {
      query = query.lte('start_date', end_date); // Events starting before end date
    }

    if (event_type) {
      query = query.eq('event_type', event_type);
    }

    if (class_id) {
      query = query.eq('class_id', class_id);
    }

    if (created_by_user_id) {
      query = query.eq('created_by_user_id', created_by_user_id);
    }

    // Apply pagination and ordering
    query = query
      .order('start_date', { ascending: true })
      .range(offset!, offset! + limit! - 1);

    // 7. Execute query
    const { data: events, error: eventsError, count } = await query;

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

    // 8. Process events with details
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

    // 9. Calculate summary by type
    const byType: Record<string, number> = {};
    eventsWithDetails.forEach((event) => {
      byType[event.event_type] = (byType[event.event_type] || 0) + 1;
    });

    // 10. Calculate pagination metadata
    const totalCount = count || 0;
    const hasMore = offset! + limit! < totalCount;

    // 11. Return success response
    return NextResponse.json<ListEventsResponse>(
      {
        success: true,
        data: {
          events: eventsWithDetails,
          pagination: {
            total: totalCount,
            limit: limit!,
            offset: offset!,
            has_more: hasMore,
          },
          summary: {
            total_events: totalCount,
            by_type: byType,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/events:', error);
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
