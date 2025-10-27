/**
 * Individual Event API Endpoints
 * GET /api/events/:id - Get single event details
 * PATCH /api/events/:id - Update an event
 * DELETE /api/events/:id - Delete an event
 *
 * Created: 2025-10-20
 * Purpose: Manage individual calendar events with update and delete operations
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  validateUpdateEventRequest,
  validateDeleteEventRequest,
  canUpdateEvent,
  canDeleteEvent,
} from '@/lib/validators/events';
import {
  GetEventResponse,
  UpdateEventResponse,
  DeleteEventResponse,
  EventErrorResponse,
  EventWithDetails,
} from '@/lib/types/events';

// ============================================================================
// GET /api/events/:id - Get Event Details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get authorization header and extract token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Missing authorization header',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Invalid token',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 3. Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
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

    // 4. Get event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select(
        `
        *,
        creator:created_by_user_id(user_id, display_name, email, role),
        class:class_id(id, name, room),
        assignment:assignment_id(id, title, status),
        participants:event_participants(
          id,
          user_id,
          status,
          user:user_id(user_id, display_name, email)
        )
      `
      )
      .eq('id', params.id)
      .eq('school_id', profile.school_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Event not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 5. Get related events if this is a recurring series
    let relatedEvents: EventWithDetails[] | undefined;
    if (event.is_recurring && !event.recurrence_parent_id) {
      // This is a parent event, get all instances
      const { data: instances } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('recurrence_parent_id', event.id)
        .order('start_date', { ascending: true });

      relatedEvents = instances || [];
    } else if (event.recurrence_parent_id) {
      // This is an instance, get parent and siblings
      const { data: siblings } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('recurrence_parent_id', event.recurrence_parent_id)
        .order('start_date', { ascending: true });

      relatedEvents = siblings || [];
    }

    // 6. Build event with details
    const eventWithDetails: EventWithDetails = {
      ...event,
      // FIXED: Convert PostgreSQL timestamp format to ISO 8601 for JavaScript Date compatibility
      start_date: event.start_date ? new Date(event.start_date).toISOString() : event.start_date,
      end_date: event.end_date ? new Date(event.end_date).toISOString() : event.end_date,
      created_at: event.created_at ? new Date(event.created_at).toISOString() : event.created_at,
      updated_at: event.updated_at ? new Date(event.updated_at).toISOString() : event.updated_at,
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
      participants: event.participants || undefined,
      participant_count: event.participants?.length || 0,
    };

    // 7. Return success response
    return NextResponse.json<GetEventResponse>(
      {
        success: true,
        data: {
          event: eventWithDetails,
          related_events: relatedEvents,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/events/:id:', error);
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
// PATCH /api/events/:id - Update Event
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get authorization header and extract token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Missing authorization header',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Invalid token',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 3. Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
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

    // 4. Get existing event
    const { data: existingEvent, error: existingError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', params.id)
      .eq('school_id', profile.school_id)
      .single();

    if (existingError || !existingEvent) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Event not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 5. Check permissions
    if (
      !canUpdateEvent(
        { userId: user.id, userRole: profile.role, schoolId: profile.school_id },
        existingEvent.created_by_user_id,
        existingEvent.school_id
      )
    ) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to update this event',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Parse and validate request body
    const body = await request.json();
    const validation = validateUpdateEventRequest(body);

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

    const updates = validation.data;

    // 7. Determine update scope
    const updateSeries = updates.update_series || false;
    let updatedCount = 0;

    // 8. Prepare update data
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Remove update_series from data sent to database
    delete (updateData as any).update_series;

    // 9. Execute update
    if (updateSeries && existingEvent.is_recurring && !existingEvent.recurrence_parent_id) {
      // Update parent event and all future instances
      const { error: parentError } = await supabaseAdmin
        .from('events')
        .update(updateData)
        .eq('id', params.id);

      if (parentError) {
        console.error('Failed to update parent event:', parentError);
        return NextResponse.json<EventErrorResponse>(
          {
            success: false,
            error: 'Failed to update event series',
            code: 'DATABASE_ERROR',
            details: { parentError },
          },
          { status: 500 }
        );
      }

      updatedCount++;

      // Update all instances
      const { data: instances, error: instancesError } = await supabaseAdmin
        .from('events')
        .update(updateData)
        .eq('recurrence_parent_id', params.id)
        .select();

      if (instancesError) {
        console.error('Failed to update instances:', instancesError);
      } else {
        updatedCount += instances?.length || 0;
      }
    } else {
      // Update single event only
      const { error: updateError } = await supabaseAdmin
        .from('events')
        .update(updateData)
        .eq('id', params.id);

      if (updateError) {
        console.error('Failed to update event:', updateError);
        return NextResponse.json<EventErrorResponse>(
          {
            success: false,
            error: 'Failed to update event',
            code: 'DATABASE_ERROR',
            details: { updateError },
          },
          { status: 500 }
        );
      }

      updatedCount = 1;
    }

    // 10. Get updated event with details
    const { data: updatedEvent } = await supabaseAdmin
      .from('events')
      .select(
        `
        *,
        creator:created_by_user_id(user_id, display_name, email, role),
        class:class_id(id, name, room),
        assignment:assignment_id(id, title, status)
      `
      )
      .eq('id', params.id)
      .single();

    if (!updatedEvent) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Failed to retrieve updated event',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }

    const eventWithDetails: EventWithDetails = {
      ...updatedEvent,
      // FIXED: Convert PostgreSQL timestamp format to ISO 8601 for JavaScript Date compatibility
      start_date: updatedEvent.start_date ? new Date(updatedEvent.start_date).toISOString() : updatedEvent.start_date,
      end_date: updatedEvent.end_date ? new Date(updatedEvent.end_date).toISOString() : updatedEvent.end_date,
      created_at: updatedEvent.created_at ? new Date(updatedEvent.created_at).toISOString() : updatedEvent.created_at,
      updated_at: updatedEvent.updated_at ? new Date(updatedEvent.updated_at).toISOString() : updatedEvent.updated_at,
      creator: updatedEvent.creator
        ? {
            id: updatedEvent.creator.user_id,
            display_name: updatedEvent.creator.display_name || 'Unknown',
            email: updatedEvent.creator.email,
            role: updatedEvent.creator.role,
          }
        : undefined,
      class: updatedEvent.class || undefined,
      assignment: updatedEvent.assignment || undefined,
      homework: updatedEvent.homework || undefined,
      target: updatedEvent.target || undefined,
    };

    // 11. Return success response
    return NextResponse.json<UpdateEventResponse>(
      {
        success: true,
        data: {
          event: eventWithDetails,
          updated_count: updatedCount > 1 ? updatedCount : undefined,
        },
        message:
          updatedCount > 1
            ? `Updated ${updatedCount} events in the series`
            : 'Event updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/events/:id:', error);
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
// DELETE /api/events/:id - Delete Event
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get authorization header and extract token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Missing authorization header',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Invalid token',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 3. Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
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

    // 4. Get existing event
    const { data: existingEvent, error: existingError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', params.id)
      .eq('school_id', profile.school_id)
      .single();

    if (existingError || !existingEvent) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Event not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 5. Check permissions
    if (
      !canDeleteEvent(
        { userId: user.id, userRole: profile.role, schoolId: profile.school_id },
        existingEvent.created_by_user_id,
        existingEvent.school_id
      )
    ) {
      return NextResponse.json<EventErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to delete this event',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Parse query parameters
    const { searchParams } = new URL(request.url);
    const deleteSeries = searchParams.get('delete_series') === 'true';

    let deletedCount = 0;

    // 7. Execute deletion
    if (deleteSeries && existingEvent.is_recurring && !existingEvent.recurrence_parent_id) {
      // Delete parent event and all instances
      // First delete all instances
      const { data: instances, error: instancesDeleteError } = await supabaseAdmin
        .from('events')
        .delete()
        .eq('recurrence_parent_id', params.id)
        .select();

      if (instancesDeleteError) {
        console.error('Failed to delete instances:', instancesDeleteError);
      } else {
        deletedCount += instances?.length || 0;
      }

      // Then delete parent
      const { error: parentDeleteError } = await supabaseAdmin
        .from('events')
        .delete()
        .eq('id', params.id);

      if (parentDeleteError) {
        console.error('Failed to delete parent event:', parentDeleteError);
        return NextResponse.json<EventErrorResponse>(
          {
            success: false,
            error: 'Failed to delete event series',
            code: 'DATABASE_ERROR',
            details: { parentDeleteError },
          },
          { status: 500 }
        );
      }

      deletedCount++;
    } else {
      // Delete single event only
      const { error: deleteError } = await supabaseAdmin
        .from('events')
        .delete()
        .eq('id', params.id);

      if (deleteError) {
        console.error('Failed to delete event:', deleteError);
        return NextResponse.json<EventErrorResponse>(
          {
            success: false,
            error: 'Failed to delete event',
            code: 'DATABASE_ERROR',
            details: { deleteError },
          },
          { status: 500 }
        );
      }

      deletedCount = 1;
    }

    // 8. Return success response
    return NextResponse.json<DeleteEventResponse>(
      {
        success: true,
        data: {
          deleted_count: deletedCount,
        },
        message:
          deletedCount > 1
            ? `Deleted ${deletedCount} events in the series`
            : 'Event deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/events/:id:', error);
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
