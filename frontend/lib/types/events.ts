/**
 * Calendar Events System Type Definitions
 *
 * Created: 2025-10-20
 * Purpose: Complete type system for calendar and event management
 * Features: Event CRUD, recurring events, class integration, iCal export
 */

// ============================================================================
// Database Row Types
// ============================================================================

export type EventType =
  | 'assignment_due'
  | 'homework_due'
  | 'target_due'
  | 'class_session'
  | 'school_event'
  | 'holiday'
  | 'exam'
  | 'meeting'
  | 'reminder'
  | 'other';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // Every N days/weeks/months/years
  count?: number; // End after N occurrences
  until?: string; // End date (ISO format)
  by_weekday?: number[]; // For weekly: 0=Sun, 1=Mon, ..., 6=Sat
  by_month_day?: number; // For monthly: 1-31
  by_month?: number; // For yearly: 1-12
}

export interface EventRow {
  id: string;
  school_id: string;
  created_by_user_id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  start_date: string; // ISO datetime
  end_date: string; // ISO datetime
  all_day: boolean;
  location: string | null;
  color: string | null; // Hex color for calendar display

  // Recurrence
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  recurrence_parent_id: string | null; // For recurring instances

  // Linked resources
  class_id: string | null; // Optional class association
  assignment_id: string | null; // Link to assignment
  homework_id: string | null; // Link to homework
  target_id: string | null; // Link to target

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface EventParticipantRow {
  id: string;
  event_id: string;
  user_id: string;
  status: 'invited' | 'accepted' | 'declined' | 'maybe';
  created_at: string;
}

// ============================================================================
// Enhanced Types with Relations
// ============================================================================

export interface EventWithDetails extends EventRow {
  creator?: {
    id: string;
    display_name: string;
    email: string;
    role: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
  };
  class?: {
    id: string;
    name: string;
    room: string | null;
  };
  assignment?: {
    id: string;
    title: string;
    status: string;
  };
  homework?: {
    id: string;
    ayah_reference: string;
  };
  target?: {
    id: string;
    title: string;
  };
  participants?: EventParticipantRow[];
  participant_count?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource?: {
    type: EventType;
    color: string;
    description: string | null;
  };
}

// ============================================================================
// API Request Types
// ============================================================================

export interface CreateEventRequest {
  title: string;
  description?: string;
  event_type: EventType;
  start_date: string; // ISO datetime
  end_date: string; // ISO datetime
  all_day?: boolean;
  location?: string;
  color?: string;

  // Recurrence
  is_recurring?: boolean;
  recurrence_rule?: RecurrenceRule;

  // Linked resources
  class_id?: string;
  assignment_id?: string;
  homework_id?: string;
  target_id?: string;

  // Participants
  participant_user_ids?: string[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  event_type?: EventType;
  start_date?: string;
  end_date?: string;
  all_day?: boolean;
  location?: string;
  color?: string;

  // Cannot update recurrence for existing events
  // Cannot update linked resources after creation

  // For single instance updates only
  update_series?: boolean; // If true, update all future occurrences
}

export interface ListEventsRequest {
  start_date?: string; // Filter events starting after this date
  end_date?: string; // Filter events ending before this date
  event_type?: EventType;
  class_id?: string;
  created_by_user_id?: string;
  include_recurring?: boolean; // Expand recurring events in range
  limit?: number;
  offset?: number;
}

export interface DeleteEventRequest {
  delete_series?: boolean; // For recurring events: delete all or just this one
}

export interface ICalExportRequest {
  start_date?: string;
  end_date?: string;
  event_type?: EventType;
  class_id?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CreateEventResponse {
  success: true;
  data: {
    event: EventWithDetails;
    recurrence_count?: number; // If recurring, how many instances created
  };
  message: string;
}

export interface ListEventsResponse {
  success: true;
  data: {
    events: EventWithDetails[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };
    summary: {
      total_events: number;
      by_type: Record<EventType, number>;
    };
  };
}

export interface GetEventResponse {
  success: true;
  data: {
    event: EventWithDetails;
    related_events?: EventWithDetails[]; // For recurring series
  };
}

export interface UpdateEventResponse {
  success: true;
  data: {
    event: EventWithDetails;
    updated_count?: number; // If updating series
  };
  message: string;
}

export interface DeleteEventResponse {
  success: true;
  data: {
    deleted_count: number;
  };
  message: string;
}

export interface ICalExportResponse {
  success: true;
  data: {
    ical_data: string; // iCalendar format string
    event_count: number;
    filename: string;
  };
}

export interface EventErrorResponse {
  success: false;
  error: string;
  code: EventErrorCode;
  details?: Record<string, unknown>;
}

export type EventErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INVALID_DATE_RANGE'
  | 'INVALID_RECURRENCE'
  | 'CONFLICT'
  | 'RESOURCE_NOT_FOUND'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get event color based on type
 */
export function getEventTypeColor(type: EventType): string {
  const colors: Record<EventType, string> = {
    assignment_due: '#EF4444', // Red
    homework_due: '#F59E0B', // Amber
    target_due: '#10B981', // Green
    class_session: '#3B82F6', // Blue
    school_event: '#8B5CF6', // Purple
    holiday: '#EC4899', // Pink
    exam: '#DC2626', // Dark Red
    meeting: '#14B8A6', // Teal
    reminder: '#6B7280', // Gray
    other: '#9CA3AF', // Light Gray
  };
  return colors[type] || '#9CA3AF';
}

/**
 * Get event type display name
 */
export function getEventTypeName(type: EventType): string {
  const names: Record<EventType, string> = {
    assignment_due: 'Assignment Due',
    homework_due: 'Homework Due',
    target_due: 'Target Due',
    class_session: 'Class Session',
    school_event: 'School Event',
    holiday: 'Holiday',
    exam: 'Exam',
    meeting: 'Meeting',
    reminder: 'Reminder',
    other: 'Other',
  };
  return names[type] || 'Event';
}

/**
 * Get event type icon
 */
export function getEventTypeIcon(type: EventType): string {
  const icons: Record<EventType, string> = {
    assignment_due: '📝',
    homework_due: '📖',
    target_due: '🎯',
    class_session: '🏫',
    school_event: '🎓',
    holiday: '🎉',
    exam: '📊',
    meeting: '👥',
    reminder: '⏰',
    other: '📅',
  };
  return icons[type] || '📅';
}

/**
 * Format event date range for display
 */
export function formatEventDateRange(start: string, end: string, allDay: boolean): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (allDay) {
    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString();
    } else {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
  } else {
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}`;
    } else {
      return `${startDate.toLocaleString()} - ${endDate.toLocaleString()}`;
    }
  }
}

/**
 * Check if event is in the past
 */
export function isEventPast(endDate: string): boolean {
  return new Date(endDate) < new Date();
}

/**
 * Check if event is happening now
 */
export function isEventNow(startDate: string, endDate: string): boolean {
  const now = new Date();
  return new Date(startDate) <= now && now <= new Date(endDate);
}

/**
 * Check if event is upcoming (within next 7 days)
 */
export function isEventUpcoming(startDate: string): boolean {
  const now = new Date();
  const start = new Date(startDate);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return start > now && start <= sevenDaysFromNow;
}

/**
 * Generate recurrence description text
 */
export function getRecurrenceDescription(rule: RecurrenceRule): string {
  const { frequency, interval, count, until } = rule;

  let desc = `Every ${interval > 1 ? interval + ' ' : ''}`;

  switch (frequency) {
    case 'daily':
      desc += interval === 1 ? 'day' : 'days';
      break;
    case 'weekly':
      desc += interval === 1 ? 'week' : 'weeks';
      if (rule.by_weekday && rule.by_weekday.length > 0) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        desc += ' on ' + rule.by_weekday.map((d) => days[d]).join(', ');
      }
      break;
    case 'monthly':
      desc += interval === 1 ? 'month' : 'months';
      if (rule.by_month_day) {
        desc += ` on day ${rule.by_month_day}`;
      }
      break;
    case 'yearly':
      desc += interval === 1 ? 'year' : 'years';
      if (rule.by_month) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        desc += ` in ${months[rule.by_month - 1]}`;
      }
      break;
  }

  if (count) {
    desc += `, ${count} times`;
  } else if (until) {
    desc += `, until ${new Date(until).toLocaleDateString()}`;
  }

  return desc;
}

/**
 * Validate date range
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
}

/**
 * Validate recurrence rule
 */
export function isValidRecurrenceRule(rule: RecurrenceRule): boolean {
  if (rule.interval < 1) return false;
  if (rule.count !== undefined && rule.count < 1) return false;
  if (rule.count !== undefined && rule.until !== undefined) return false; // Can't have both

  if (rule.frequency === 'weekly' && rule.by_weekday) {
    if (rule.by_weekday.some((d) => d < 0 || d > 6)) return false;
  }

  if (rule.frequency === 'monthly' && rule.by_month_day) {
    if (rule.by_month_day < 1 || rule.by_month_day > 31) return false;
  }

  if (rule.frequency === 'yearly' && rule.by_month) {
    if (rule.by_month < 1 || rule.by_month > 12) return false;
  }

  return true;
}

/**
 * Generate iCalendar VEVENT component
 */
export function generateVEvent(event: EventWithDetails): string {
  const lines: string[] = [];

  lines.push('BEGIN:VEVENT');
  lines.push(`UID:${event.id}@quranakh.com`);
  lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
  lines.push(`DTSTART:${new Date(event.start_date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
  lines.push(`DTEND:${new Date(event.end_date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
  lines.push(`SUMMARY:${event.title}`);

  if (event.description) {
    lines.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${event.location}`);
  }

  if (event.creator) {
    lines.push(`ORGANIZER;CN=${event.creator.display_name}:mailto:${event.creator.email}`);
  }

  if (event.color) {
    lines.push(`COLOR:${event.color}`);
  }

  lines.push(`STATUS:CONFIRMED`);
  lines.push('END:VEVENT');

  return lines.join('\r\n');
}

/**
 * Convert event to calendar format
 */
export function toCalendarEvent(event: EventWithDetails): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    start: new Date(event.start_date),
    end: new Date(event.end_date),
    allDay: event.all_day,
    resource: {
      type: event.event_type,
      color: event.color || getEventTypeColor(event.event_type),
      description: event.description,
    },
  };
}

// ============================================================================
// Constants
// ============================================================================

export const EVENT_CONSTANTS = {
  DEFAULT_PAGINATION_LIMIT: 50,
  MAX_PAGINATION_LIMIT: 500,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_LOCATION_LENGTH: 500,
  MAX_RECURRENCE_COUNT: 365, // Max 365 occurrences
  MAX_DATE_RANGE_DAYS: 365 * 2, // Max 2 years in single query
  DEFAULT_EVENT_DURATION_HOURS: 1,
  ICAL_VERSION: '2.0',
  ICAL_PRODID: '-//QuranAkh//Calendar//EN',
} as const;

export const EVENT_TYPES: EventType[] = [
  'assignment_due',
  'homework_due',
  'target_due',
  'class_session',
  'school_event',
  'holiday',
  'exam',
  'meeting',
  'reminder',
  'other',
];

export const RECURRENCE_FREQUENCIES: RecurrenceFrequency[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
];
