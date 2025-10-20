/**
 * Notification System Type Definitions
 *
 * Created: 2025-10-20
 * Purpose: Complete type system for multi-channel notification system
 * Features: In-app, email, push notifications, user preferences, event-driven
 */

// ============================================================================
// Database Row Types
// ============================================================================

export type NotificationChannel = 'in_app' | 'email' | 'push';

export type NotificationType =
  | 'assignment_created'
  | 'assignment_submitted'
  | 'assignment_reviewed'
  | 'assignment_completed'
  | 'assignment_reopened'
  | 'assignment_due_soon'
  | 'assignment_overdue'
  | 'homework_assigned'
  | 'homework_completed'
  | 'target_created'
  | 'target_milestone_completed'
  | 'target_due_soon'
  | 'grade_submitted'
  | 'mastery_improved'
  | 'message_received'
  | 'system_announcement';

export interface NotificationRow {
  id: string;
  school_id: string;
  user_id: string;
  channel: NotificationChannel;
  type: NotificationType;
  payload: Record<string, unknown>;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface DeviceRow {
  id: string;
  user_id: string;
  push_token: string;
  platform: 'ios' | 'android' | 'web';
  updated_at: string;
}

// Notification preferences stored in user profiles or separate table
export interface NotificationPreferenceRow {
  user_id: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  assignment_notifications: boolean;
  homework_notifications: boolean;
  target_notifications: boolean;
  grade_notifications: boolean;
  mastery_notifications: boolean;
  message_notifications: boolean;
  quiet_hours_start: string | null; // HH:MM format
  quiet_hours_end: string | null; // HH:MM format
  updated_at: string;
}

// ============================================================================
// Enhanced Types with Relations
// ============================================================================

export interface NotificationWithDetails extends NotificationRow {
  recipient?: {
    id: string;
    display_name: string;
    email: string;
  };
  is_read: boolean;
  time_ago?: string; // Human-readable time (e.g., "2 hours ago")
}

export interface NotificationPreferencesWithDefaults
  extends NotificationPreferenceRow {
  has_push_devices: boolean;
  push_devices_count: number;
}

// ============================================================================
// API Request Types
// ============================================================================

export interface SendNotificationRequest {
  user_id: string;
  type: NotificationType;
  channels: NotificationChannel[];
  payload: Record<string, unknown>;
  scheduled_for?: string; // ISO timestamp for future delivery
}

export interface BulkSendNotificationRequest {
  user_ids: string[];
  type: NotificationType;
  channels: NotificationChannel[];
  payload: Record<string, unknown>;
}

export interface ListNotificationsRequest {
  user_id?: string; // If admin/teacher wants to view specific user's notifications
  channel?: NotificationChannel;
  type?: NotificationType;
  read?: boolean; // Filter by read/unread
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
}

export interface MarkReadRequest {
  notification_id: string;
}

export interface MarkAllReadRequest {
  user_id?: string; // For marking all user's notifications as read
  type?: NotificationType; // Optional: mark all of specific type as read
}

export interface UpdatePreferencesRequest {
  in_app_enabled?: boolean;
  email_enabled?: boolean;
  push_enabled?: boolean;
  assignment_notifications?: boolean;
  homework_notifications?: boolean;
  target_notifications?: boolean;
  grade_notifications?: boolean;
  mastery_notifications?: boolean;
  message_notifications?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
}

export interface RegisterDeviceRequest {
  push_token: string;
  platform: 'ios' | 'android' | 'web';
}

// ============================================================================
// API Response Types
// ============================================================================

export interface SendNotificationResponse {
  success: true;
  data: {
    notification: NotificationWithDetails;
    delivery_status: {
      in_app?: 'sent' | 'failed';
      email?: 'queued' | 'sent' | 'failed';
      push?: 'queued' | 'sent' | 'failed';
    };
  };
  message: string;
}

export interface BulkSendNotificationResponse {
  success: true;
  data: {
    sent_count: number;
    failed_count: number;
    notifications: NotificationWithDetails[];
  };
  message: string;
}

export interface ListNotificationsResponse {
  success: true;
  data: {
    notifications: NotificationWithDetails[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };
    summary: {
      unread_count: number;
      total_count: number;
    };
  };
}

export interface MarkReadResponse {
  success: true;
  data: {
    notification: NotificationWithDetails;
  };
  message: string;
}

export interface MarkAllReadResponse {
  success: true;
  data: {
    marked_count: number;
  };
  message: string;
}

export interface GetPreferencesResponse {
  success: true;
  data: {
    preferences: NotificationPreferencesWithDefaults;
  };
}

export interface UpdatePreferencesResponse {
  success: true;
  data: {
    preferences: NotificationPreferencesWithDefaults;
  };
  message: string;
}

export interface RegisterDeviceResponse {
  success: true;
  data: {
    device: DeviceRow;
  };
  message: string;
}

export interface NotificationErrorResponse {
  success: false;
  error: string;
  code: NotificationErrorCode;
  details?: Record<string, unknown>;
}

export type NotificationErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INVALID_CHANNEL'
  | 'INVALID_TYPE'
  | 'USER_NOT_FOUND'
  | 'NOTIFICATION_NOT_FOUND'
  | 'DELIVERY_FAILED'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR';

// ============================================================================
// Notification Payload Types
// ============================================================================

export interface AssignmentNotificationPayload {
  assignment_id: string;
  assignment_title: string;
  student_name: string;
  teacher_name: string;
  due_at?: string;
  status?: string;
  reason?: string; // For reopened
}

export interface HomeworkNotificationPayload {
  homework_id: string;
  student_name: string;
  teacher_name: string;
  ayah_reference: string; // e.g., "Surah 1, Ayah 1-7"
  due_at?: string;
}

export interface TargetNotificationPayload {
  target_id: string;
  target_title: string;
  milestone_title?: string;
  student_name?: string;
  class_name?: string;
  due_at?: string;
  progress_percentage?: number;
}

export interface GradeNotificationPayload {
  assignment_id: string;
  assignment_title: string;
  student_name: string;
  overall_score: number;
  letter_grade: string;
  graded_by: string;
}

export interface MasteryNotificationPayload {
  student_name: string;
  ayah_reference: string;
  old_level: string;
  new_level: string;
  surah: number;
  ayah: number;
}

export interface MessageNotificationPayload {
  message_id: string;
  sender_name: string;
  message_preview: string; // First 100 chars
  thread_id?: string;
}

export interface SystemAnnouncementPayload {
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get notification title based on type
 */
export function getNotificationTitle(
  type: NotificationType,
  payload: Record<string, unknown>
): string {
  const p = payload as any;

  const titles: Record<NotificationType, string> = {
    assignment_created: `New Assignment: ${p.assignment_title || 'Assignment'}`,
    assignment_submitted: `${p.student_name || 'Student'} submitted: ${p.assignment_title || 'Assignment'}`,
    assignment_reviewed: `Assignment Reviewed: ${p.assignment_title || 'Assignment'}`,
    assignment_completed: `Assignment Completed: ${p.assignment_title || 'Assignment'}`,
    assignment_reopened: `Assignment Reopened: ${p.assignment_title || 'Assignment'}`,
    assignment_due_soon: `Due Soon: ${p.assignment_title || 'Assignment'}`,
    assignment_overdue: `Overdue: ${p.assignment_title || 'Assignment'}`,
    homework_assigned: `New Homework: ${p.ayah_reference || 'Quran Practice'}`,
    homework_completed: `Homework Completed by ${p.student_name || 'Student'}`,
    target_created: `New Target: ${p.target_title || 'Goal'}`,
    target_milestone_completed: `Milestone Completed: ${p.milestone_title || 'Milestone'}`,
    target_due_soon: `Target Due Soon: ${p.target_title || 'Goal'}`,
    grade_submitted: `Grade Received: ${p.assignment_title || 'Assignment'}`,
    mastery_improved: `Mastery Improved: ${p.ayah_reference || 'Ayah'}`,
    message_received: `New Message from ${p.sender_name || 'User'}`,
    system_announcement: p.title || 'System Announcement',
  };

  return titles[type] || 'Notification';
}

/**
 * Get notification body/description based on type
 */
export function getNotificationBody(
  type: NotificationType,
  payload: Record<string, unknown>
): string {
  const p = payload as any;

  const bodies: Record<NotificationType, string> = {
    assignment_created: `Due ${p.due_at ? new Date(p.due_at).toLocaleDateString() : 'soon'}`,
    assignment_submitted: `Submitted for review on ${new Date().toLocaleDateString()}`,
    assignment_reviewed: `Your teacher has reviewed your work`,
    assignment_completed: `Great job! Assignment marked as completed`,
    assignment_reopened: `Reason: ${p.reason || 'Needs revision'}`,
    assignment_due_soon: `Due ${p.due_at ? new Date(p.due_at).toLocaleDateString() : 'soon'}`,
    assignment_overdue: `This assignment is overdue. Please submit as soon as possible`,
    homework_assigned: `Practice ${p.ayah_reference || 'assigned ayahs'}`,
    homework_completed: `${p.student_name || 'Student'} completed their homework`,
    target_created: p.class_name ? `For class: ${p.class_name}` : 'Individual target',
    target_milestone_completed: `Progress: ${p.progress_percentage || 0}%`,
    target_due_soon: `Due ${p.due_at ? new Date(p.due_at).toLocaleDateString() : 'soon'}`,
    grade_submitted: `Score: ${p.overall_score || 0}% (${p.letter_grade || 'N/A'})`,
    mastery_improved: `${p.old_level} → ${p.new_level}`,
    message_received: p.message_preview || 'Click to read message',
    system_announcement: p.message || 'Important announcement',
  };

  return bodies[type] || '';
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    assignment_created: '📝',
    assignment_submitted: '✅',
    assignment_reviewed: '👀',
    assignment_completed: '🎉',
    assignment_reopened: '🔄',
    assignment_due_soon: '⏰',
    assignment_overdue: '⚠️',
    homework_assigned: '📖',
    homework_completed: '✨',
    target_created: '🎯',
    target_milestone_completed: '🏆',
    target_due_soon: '⏳',
    grade_submitted: '📊',
    mastery_improved: '⬆️',
    message_received: '💬',
    system_announcement: '📢',
  };

  return icons[type] || '🔔';
}

/**
 * Check if notification should be sent based on user preferences
 */
export function shouldSendNotification(
  type: NotificationType,
  channel: NotificationChannel,
  preferences: NotificationPreferenceRow | null
): boolean {
  // No preferences = send all notifications (default)
  if (!preferences) {
    return true;
  }

  // Check channel is enabled
  if (channel === 'in_app' && !preferences.in_app_enabled) return false;
  if (channel === 'email' && !preferences.email_enabled) return false;
  if (channel === 'push' && !preferences.push_enabled) return false;

  // Check type category is enabled
  if (type.startsWith('assignment_') && !preferences.assignment_notifications)
    return false;
  if (type.startsWith('homework_') && !preferences.homework_notifications)
    return false;
  if (type.startsWith('target_') && !preferences.target_notifications)
    return false;
  if (type.startsWith('grade_') && !preferences.grade_notifications)
    return false;
  if (type.startsWith('mastery_') && !preferences.mastery_notifications)
    return false;
  if (type === 'message_received' && !preferences.message_notifications)
    return false;

  // System announcements always send
  if (type === 'system_announcement') return true;

  return true;
}

/**
 * Check if current time is within quiet hours
 */
export function isQuietHours(
  preferences: NotificationPreferenceRow | null
): boolean {
  if (
    !preferences ||
    !preferences.quiet_hours_start ||
    !preferences.quiet_hours_end
  ) {
    return false;
  }

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const start = preferences.quiet_hours_start;
  const end = preferences.quiet_hours_end;

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }

  // Normal quiet hours (e.g., 12:00 - 14:00)
  return currentTime >= start && currentTime <= end;
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
 * Get default notification preferences
 */
export function getDefaultPreferences(
  user_id: string
): NotificationPreferenceRow {
  return {
    user_id,
    in_app_enabled: true,
    email_enabled: true,
    push_enabled: false, // Require explicit opt-in
    assignment_notifications: true,
    homework_notifications: true,
    target_notifications: true,
    grade_notifications: true,
    mastery_notifications: true,
    message_notifications: true,
    quiet_hours_start: null,
    quiet_hours_end: null,
    updated_at: new Date().toISOString(),
  };
}

// ============================================================================
// Constants
// ============================================================================

export const NOTIFICATION_CONSTANTS = {
  DEFAULT_PAGINATION_LIMIT: 20,
  MAX_PAGINATION_LIMIT: 100,
  NOTIFICATION_EXPIRY_DAYS: 30, // Auto-delete after 30 days
  MAX_PAYLOAD_SIZE: 5000, // Max bytes for payload JSON
  BATCH_SEND_LIMIT: 100, // Max users per batch send
  QUIET_HOURS_DEFAULT_START: '22:00',
  QUIET_HOURS_DEFAULT_END: '08:00',
} as const;

export const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  'in_app',
  'email',
  'push',
];

export const NOTIFICATION_TYPES: NotificationType[] = [
  'assignment_created',
  'assignment_submitted',
  'assignment_reviewed',
  'assignment_completed',
  'assignment_reopened',
  'assignment_due_soon',
  'assignment_overdue',
  'homework_assigned',
  'homework_completed',
  'target_created',
  'target_milestone_completed',
  'target_due_soon',
  'grade_submitted',
  'mastery_improved',
  'message_received',
  'system_announcement',
];
