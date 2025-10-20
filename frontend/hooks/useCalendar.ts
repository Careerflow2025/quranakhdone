/**
 * useCalendar Hook - Calendar and Event Data Fetching and Management
 * Created: 2025-10-20
 * Purpose: Custom hook for Calendar/Events system following established patterns
 * Pattern: Matches useMessages.ts and useGradebook.ts - useAuthStore, callbacks, error handling, pagination
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  EventWithDetails,
  CreateEventRequest,
  UpdateEventRequest,
  RecurrenceRule,
  EventType,
  ListEventsResponse,
  CreateEventResponse,
  UpdateEventResponse,
  GetEventResponse,
  DeleteEventResponse,
} from '@/lib/types/events';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CreateEventData {
  title: string;
  description?: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  all_day?: boolean;
  location?: string;
  color?: string;
  is_recurring?: boolean;
  recurrence_rule?: RecurrenceRule;
  class_id?: string;
  assignment_id?: string;
  homework_id?: string;
  target_id?: string;
  participant_user_ids?: string[];
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  event_type?: EventType;
  start_date?: string;
  end_date?: string;
  all_day?: boolean;
  location?: string;
  color?: string;
  update_series?: boolean;
}

export interface EventFilters {
  start_date?: string;
  end_date?: string;
  event_type?: EventType;
  class_id?: string;
  created_by_user_id?: string;
}

export type CalendarView = 'month' | 'week' | 'day' | 'list';

export interface EventSummary {
  total_events: number;
  by_type: Record<string, number>;
}

// ============================================================================
// Custom Hook
// ============================================================================

export function useCalendar(initialView: CalendarView = 'month') {
  const { user } = useAuthStore();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventWithDetails | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<EventWithDetails[]>([]);
  const [currentView, setCurrentView] = useState<CalendarView>(initialView);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<EventFilters>({});
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination (for list view)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // ============================================================================
  // Event Operations
  // ============================================================================

  /**
   * Fetch events with filters
   */
  const fetchEvents = useCallback(
    async (customFilters?: EventFilters) => {
      if (!user) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const activeFilters = customFilters || filters;

        // Build query parameters
        const params = new URLSearchParams();
        if (activeFilters.start_date) params.append('start_date', activeFilters.start_date);
        if (activeFilters.end_date) params.append('end_date', activeFilters.end_date);
        if (activeFilters.event_type) params.append('event_type', activeFilters.event_type);
        if (activeFilters.class_id) params.append('class_id', activeFilters.class_id);
        if (activeFilters.created_by_user_id) params.append('created_by_user_id', activeFilters.created_by_user_id);
        params.append('limit', String(ITEMS_PER_PAGE));
        params.append('offset', String((currentPage - 1) * ITEMS_PER_PAGE));

        const response = await fetch(`/api/events?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch events');
        }

        const data: ListEventsResponse = await response.json();

        setEvents(data.data.events);
        setSummary(data.data.summary);
        setTotalItems(data.data.pagination.total);
        setTotalPages(Math.ceil(data.data.pagination.total / ITEMS_PER_PAGE));
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
      } finally {
        setIsLoading(false);
      }
    },
    [user, filters, currentPage]
  );

  /**
   * Fetch single event by ID
   */
  const fetchEvent = useCallback(
    async (eventId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/events/${eventId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch event');
        }

        const data: GetEventResponse = await response.json();

        setCurrentEvent(data.data.event);
        setRelatedEvents(data.data.related_events || []);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch event');
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  /**
   * Create new event
   */
  const createEvent = useCallback(
    async (eventData: CreateEventData): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create event');
        }

        const data: CreateEventResponse = await response.json();

        // Refresh events list
        await fetchEvents();

        return true;
      } catch (err) {
        console.error('Error creating event:', err);
        setError(err instanceof Error ? err.message : 'Failed to create event');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, fetchEvents]
  );

  /**
   * Update existing event
   */
  const updateEvent = useCallback(
    async (eventId: string, updates: UpdateEventData): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const response = await fetch(`/api/events/${eventId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update event');
        }

        const data: UpdateEventResponse = await response.json();

        // Update current event if viewing
        if (currentEvent && currentEvent.id === eventId) {
          setCurrentEvent(data.data.event);
        }

        // Refresh events list
        await fetchEvents();

        return true;
      } catch (err) {
        console.error('Error updating event:', err);
        setError(err instanceof Error ? err.message : 'Failed to update event');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, currentEvent, fetchEvents]
  );

  /**
   * Delete event
   */
  const deleteEvent = useCallback(
    async (eventId: string, deleteSeries: boolean = false): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const params = deleteSeries ? '?delete_series=true' : '';
        const response = await fetch(`/api/events/${eventId}${params}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete event');
        }

        // Clear current event if deleted
        if (currentEvent && currentEvent.id === eventId) {
          setCurrentEvent(null);
          setRelatedEvents([]);
        }

        // Refresh events list
        await fetchEvents();

        return true;
      } catch (err) {
        console.error('Error deleting event:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete event');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, currentEvent, fetchEvents]
  );

  /**
   * Export events to iCalendar format
   */
  const exportToICal = useCallback(
    async (exportFilters?: EventFilters): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const activeFilters = exportFilters || filters;

        // Build query parameters
        const params = new URLSearchParams();
        if (activeFilters.start_date) params.append('start_date', activeFilters.start_date);
        if (activeFilters.end_date) params.append('end_date', activeFilters.end_date);
        if (activeFilters.event_type) params.append('event_type', activeFilters.event_type);
        if (activeFilters.class_id) params.append('class_id', activeFilters.class_id);

        const response = await fetch(`/api/events/ical?${params.toString()}`, {
          method: 'GET',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to export calendar');
        }

        // Download the iCal file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Extract filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : 'calendar.ics';

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        return true;
      } catch (err) {
        console.error('Error exporting calendar:', err);
        setError(err instanceof Error ? err.message : 'Failed to export calendar');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, filters]
  );

  // ============================================================================
  // View Management
  // ============================================================================

  /**
   * Change calendar view
   */
  const changeView = useCallback((view: CalendarView) => {
    setCurrentView(view);
  }, []);

  /**
   * Navigate to specific date
   */
  const navigateToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  /**
   * Navigate to previous period (month/week/day based on view)
   */
  const navigatePrevious = useCallback(() => {
    const newDate = new Date(currentDate);

    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'list':
        setCurrentPage((prev) => Math.max(1, prev - 1));
        return;
    }

    setCurrentDate(newDate);
  }, [currentDate, currentView]);

  /**
   * Navigate to next period (month/week/day based on view)
   */
  const navigateNext = useCallback(() => {
    const newDate = new Date(currentDate);

    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'list':
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
        return;
    }

    setCurrentDate(newDate);
  }, [currentDate, currentView, totalPages]);

  /**
   * Navigate to today
   */
  const navigateToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // ============================================================================
  // Filter Management
  // ============================================================================

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: EventFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Clear current event
   */
  const clearCurrentEvent = useCallback(() => {
    setCurrentEvent(null);
    setRelatedEvents([]);
  }, []);

  /**
   * Refresh data
   */
  const refreshData = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  /**
   * Change page (for list view)
   */
  const changePage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Initial data fetch
   */
  useEffect(() => {
    if (user) {
      // Calculate date range based on current view and date
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (currentView !== 'list') {
        const viewDate = new Date(currentDate);

        switch (currentView) {
          case 'day':
            startDate = new Date(viewDate.setHours(0, 0, 0, 0)).toISOString();
            endDate = new Date(viewDate.setHours(23, 59, 59, 999)).toISOString();
            break;
          case 'week':
            const weekStart = new Date(viewDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            startDate = weekStart.toISOString();

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            endDate = weekEnd.toISOString();
            break;
          case 'month':
            const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
            startDate = monthStart.toISOString();

            const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59, 999);
            endDate = monthEnd.toISOString();
            break;
        }

        // Fetch with date range
        fetchEvents({ ...filters, start_date: startDate, end_date: endDate });
      } else {
        // List view - fetch with pagination
        fetchEvents();
      }
    }
  }, [user, currentDate, currentView, currentPage, filters]);

  // ============================================================================
  // Return Interface
  // ============================================================================

  return {
    // State
    isLoading,
    error,
    events,
    currentEvent,
    relatedEvents,
    currentView,
    currentDate,
    filters,
    summary,
    isSubmitting,

    // Pagination (for list view)
    currentPage,
    totalPages,
    totalItems,

    // Event operations
    fetchEvents,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    clearCurrentEvent,
    exportToICal,

    // View management
    changeView,
    navigateToDate,
    navigatePrevious,
    navigateNext,
    navigateToToday,

    // Filter management
    updateFilters,
    clearFilters,

    // Utility
    refreshData,
    changePage,
  };
}
