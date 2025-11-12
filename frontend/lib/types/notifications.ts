/**
 * Real-Time Notification Badge System
 *
 * Purpose: Section-based notification badges on sidebar/navigation icons
 * Features: Real-time updates, unread counts per section, mark as read on click
 * Created: 2025-11-12
 */

// ============================================================================
// Core Types
// ============================================================================

export type NotificationSection =
  | 'assignments'
  | 'highlights'
  | 'gradebook'
  | 'mastery'
  | 'attendance'
  | 'targets'
  | 'classes'
  | 'messages'
  | 'credentials'
  | 'analytics';

export type NotificationType =
  // Assignment notifications
  | 'assignment_created'
  | 'assignment_viewed'
  | 'assignment_submitted'
  | 'assignment_reviewed'
  | 'assignment_completed'
  | 'assignment_reopened'
  | 'assignment_due_soon'
  | 'assignment_overdue'
  // Highlight notifications
  | 'highlight_created'
  | 'highlight_updated'
  | 'highlight_deleted'
  | 'highlight_note_added'
  // Gradebook notifications
  | 'grade_posted'
  | 'grade_updated'
  | 'rubric_attached'
  // Mastery notifications
  | 'mastery_level_updated'
  | 'mastery_milestone_reached'
  // Attendance notifications
  | 'attendance_marked'
  | 'attendance_updated'
  // Target notifications
  | 'target_created'
  | 'target_updated'
  | 'target_completed'
  // Class notifications
  | 'class_created'
  | 'class_updated'
  | 'student_enrolled'
  | 'teacher_assigned'
  // Message notifications
  | 'message_received'
  | 'message_reply'
  | 'group_message_received'
  // Credential notifications
  | 'credentials_sent'
  | 'user_created'
  // Analytics notifications
  | 'report_generated'
  | 'export_ready';

export interface NotificationMetadata {
  // Assignment related
  assignment_id?: string;
  student_id?: string;
  teacher_id?: string;
  // Highlight related
  highlight_id?: string;
  ayah_id?: string;
  // Grade related
  grade_id?: string;
  criterion_id?: string;
  score?: number;
  // Mastery related
  mastery_id?: string;
  level?: string;
  // Attendance related
  attendance_id?: string;
  session_date?: string;
  status?: string;
  // Target related
  target_id?: string;
  // Class related
  class_id?: string;
  // Message related
  message_id?: string;
  conversation_id?: string;
  sender_id?: string;
  // Credential related
  credential_id?: string;
  user_id?: string;
  role?: string;
  // Analytics related
  report_id?: string;
  export_id?: string;
  // Navigation
  url?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  user_id: string;
  school_id: string;
  section: NotificationSection;
  type: NotificationType;
  title: string;
  message: string;
  metadata: NotificationMetadata;
  read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationCount {
  section: NotificationSection;
  count: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateNotificationInput {
  user_id: string;
  school_id: string;
  section: NotificationSection;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
}

export interface UpdateNotificationInput {
  read?: boolean;
  read_at?: string | null;
}

export interface NotificationFilters {
  section?: NotificationSection;
  type?: NotificationType;
  read?: boolean;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// Section Configuration for UI
// ============================================================================

export interface SectionConfig {
  section: NotificationSection;
  label: string;
  icon: string;
  color: string;
  route: string;
}

export const SECTION_CONFIGS: Record<NotificationSection, Omit<SectionConfig, 'section'>> = {
  assignments: {
    label: 'Assignments',
    icon: '📋',
    color: 'blue',
    route: '/assignments',
  },
  highlights: {
    label: 'Highlights',
    icon: '✨',
    color: 'yellow',
    route: '/highlights',
  },
  gradebook: {
    label: 'Gradebook',
    icon: '📊',
    color: 'green',
    route: '/gradebook',
  },
  mastery: {
    label: 'Mastery',
    icon: '🎯',
    color: 'purple',
    route: '/mastery',
  },
  attendance: {
    label: 'Attendance',
    icon: '📅',
    color: 'indigo',
    route: '/attendance',
  },
  targets: {
    label: 'Targets',
    icon: '🎯',
    color: 'orange',
    route: '/targets',
  },
  classes: {
    label: 'Classes',
    icon: '🏫',
    color: 'cyan',
    route: '/classes',
  },
  messages: {
    label: 'Messages',
    icon: '💬',
    color: 'pink',
    route: '/messages',
  },
  credentials: {
    label: 'Credentials',
    icon: '🔑',
    color: 'red',
    route: '/credentials',
  },
  analytics: {
    label: 'Analytics',
    icon: '📈',
    color: 'teal',
    route: '/analytics',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get section configuration
 */
export function getSectionConfig(section: NotificationSection): SectionConfig {
  return {
    section,
    ...SECTION_CONFIGS[section],
  };
}

/**
 * Format notification message based on type
 */
export function formatNotificationMessage(
  type: NotificationType,
  metadata: NotificationMetadata
): { title: string; message: string } {
  switch (type) {
    case 'assignment_created':
      return {
        title: 'New Assignment',
        message: 'A new assignment has been created for you',
      };
    case 'assignment_submitted':
      return {
        title: 'Assignment Submitted',
        message: 'Student has submitted their assignment',
      };
    case 'assignment_completed':
      return {
        title: 'Assignment Completed',
        message: 'Your assignment has been marked as completed',
      };
    case 'assignment_due_soon':
      return {
        title: 'Assignment Due Soon',
        message: 'You have an assignment due within 24 hours',
      };
    case 'highlight_created':
      return {
        title: 'New Highlight',
        message: 'A new highlight has been added',
      };
    case 'grade_posted':
      return {
        title: 'New Grade',
        message: `Grade posted: ${metadata.score || 'N/A'}`,
      };
    case 'message_received':
      return {
        title: 'New Message',
        message: 'You have received a new message',
      };
    case 'credentials_sent':
      return {
        title: 'Credentials Sent',
        message: 'Login credentials have been sent',
      };
    default:
      return {
        title: 'New Notification',
        message: 'You have a new notification',
      };
  }
}

/**
 * Get time ago string from timestamp
 */
export function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;

  return past.toLocaleDateString();
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Partial<Record<NotificationType, string>> = {
    assignment_created: '📝',
    assignment_submitted: '✅',
    assignment_reviewed: '👀',
    assignment_completed: '🎉',
    assignment_reopened: '🔄',
    assignment_due_soon: '⏰',
    assignment_overdue: '⚠️',
    highlight_created: '✨',
    grade_posted: '📊',
    mastery_level_updated: '⬆️',
    message_received: '💬',
    credentials_sent: '🔑',
  };

  return icons[type] || '🔔';
}
