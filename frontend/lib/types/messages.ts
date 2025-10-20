/**
 * Enhanced Messages Type Definitions and Utilities
 * Created: 2025-10-20
 * Purpose: Threaded messaging system for teacher-student-parent communication
 * Features: Threading, attachments, read status, school-level isolation
 */

import { Database } from '../database.types';

// ============================================================================
// BASE TYPES FROM DATABASE (if messages table exists, otherwise define)
// ============================================================================

/**
 * Message row structure
 * Note: Assuming messages table exists in database with these columns
 */
export interface MessageRow {
  id: string;
  school_id: string;
  thread_id: string | null; // For threading - null if root message
  sender_user_id: string;
  recipient_user_id: string;
  subject: string | null; // Only for root messages
  body: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Message attachment structure
 */
export interface MessageAttachmentRow {
  id: string;
  message_id: string;
  url: string;
  mime_type: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

// ============================================================================
// EXTENDED MESSAGE TYPES
// ============================================================================

/**
 * Message with sender/recipient details
 */
export interface MessageWithDetails extends MessageRow {
  sender: {
    id: string;
    display_name: string;
    email: string;
    role: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
  };
  recipient: {
    id: string;
    display_name: string;
    email: string;
    role: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
  };
  attachments?: MessageAttachmentRow[];
  reply_count?: number; // Number of replies in thread
  is_read: boolean; // Computed from read_at
}

/**
 * Message thread with all replies
 */
export interface MessageThread {
  root_message: MessageWithDetails;
  replies: MessageWithDetails[];
  participant_count: number;
  last_message_at: string;
  unread_count: number; // For current user
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

/**
 * POST /api/messages/send - Send new message
 */
export interface SendMessageRequest {
  recipient_user_id: string;
  subject?: string; // Required for new thread, optional for reply
  body: string;
  thread_id?: string; // For replies
  attachments?: Array<{
    url: string;
    mime_type: string;
    file_name: string;
    file_size: number;
  }>;
}

export interface SendMessageResponse {
  success: true;
  message: MessageWithDetails;
  thread_id: string;
  notification_sent: boolean;
}

/**
 * POST /api/messages/:id/reply - Reply to message
 */
export interface ReplyToMessageRequest {
  body: string;
  attachments?: Array<{
    url: string;
    mime_type: string;
    file_name: string;
    file_size: number;
  }>;
}

export interface ReplyToMessageResponse {
  success: true;
  message: MessageWithDetails;
  thread_id: string;
}

/**
 * GET /api/messages/thread/:id - Get full thread
 */
export interface GetThreadResponse {
  success: true;
  thread: MessageThread;
}

/**
 * POST /api/messages/:id/attachments - Add attachments
 */
export interface AddAttachmentsRequest {
  attachments: Array<{
    url: string;
    mime_type: string;
    file_name: string;
    file_size: number;
  }>;
}

export interface AddAttachmentsResponse {
  success: true;
  message_id: string;
  attachments: MessageAttachmentRow[];
  message: 'Attachments added successfully';
}

/**
 * GET /api/messages - List messages
 */
export interface ListMessagesQuery {
  folder?: 'inbox' | 'sent' | 'unread' | 'all';
  thread_id?: string;
  sender_user_id?: string;
  recipient_user_id?: string;
  read_status?: 'read' | 'unread' | 'all';
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface ListMessagesResponse {
  success: true;
  messages: MessageWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  stats: {
    total_unread: number;
    total_threads: number;
  };
}

/**
 * PATCH /api/messages/:id/read - Mark as read
 */
export interface MarkReadResponse {
  success: true;
  message_id: string;
  read_at: string;
  message: 'Message marked as read';
}

/**
 * PATCH /api/messages/thread/:id/read - Mark thread as read
 */
export interface MarkThreadReadResponse {
  success: true;
  thread_id: string;
  marked_count: number;
  message: string;
}

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

export interface MessageErrorResponse {
  success: false;
  error: string;
  code: MessageErrorCode;
  details?: Record<string, unknown>;
}

export type MessageErrorCode =
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RECIPIENT_NOT_FOUND'
  | 'THREAD_NOT_FOUND'
  | 'MESSAGE_NOT_FOUND'
  | 'INVALID_ATTACHMENT'
  | 'ATTACHMENT_TOO_LARGE'
  | 'TOO_MANY_ATTACHMENTS'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Checks if message is read
 */
export function isMessageRead(message: MessageRow): boolean {
  return message.read_at !== null;
}

/**
 * Checks if message is part of a thread
 */
export function isThreadedMessage(message: MessageRow): boolean {
  return message.thread_id !== null;
}

/**
 * Checks if message is root message
 */
export function isRootMessage(message: MessageRow): boolean {
  return message.thread_id === null && message.subject !== null;
}

/**
 * Gets thread ID for message (returns own ID if root)
 */
export function getThreadId(message: MessageRow): string {
  return message.thread_id || message.id;
}

/**
 * Validates attachment MIME type
 */
export function isValidAttachmentType(mime_type: string): boolean {
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'text/plain',
    'audio/mp4', // .m4a
    'audio/mpeg', // .mp3
  ];
  return allowed.includes(mime_type);
}

/**
 * Validates attachment size
 */
export function isValidAttachmentSize(size_bytes: number): boolean {
  return size_bytes <= MESSAGE_CONSTANTS.MAX_ATTACHMENT_SIZE;
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Gets message preview (first N characters of body)
 */
export function getMessagePreview(body: string, maxLength: number = 100): string {
  if (body.length <= maxLength) return body;
  return body.substring(0, maxLength).trim() + '...';
}

/**
 * Groups messages by thread
 */
export function groupMessagesByThread(
  messages: MessageWithDetails[]
): Record<string, MessageWithDetails[]> {
  return messages.reduce((groups, message) => {
    const threadId = getThreadId(message);
    if (!groups[threadId]) {
      groups[threadId] = [];
    }
    groups[threadId].push(message);
    return groups;
  }, {} as Record<string, MessageWithDetails[]>);
}

/**
 * Counts unread messages for user
 */
export function countUnreadMessages(
  messages: MessageWithDetails[],
  userId: string
): number {
  return messages.filter(
    (msg) => msg.recipient.id === userId && !msg.is_read
  ).length;
}

/**
 * Gets latest message from thread
 */
export function getLatestMessageFromThread(
  messages: MessageWithDetails[]
): MessageWithDetails | null {
  if (messages.length === 0) return null;
  return messages.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const MESSAGE_CONSTANTS = {
  MAX_SUBJECT_LENGTH: 200,
  MAX_BODY_LENGTH: 10000,
  MAX_ATTACHMENTS: 5,
  MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024, // 10MB
  DEFAULT_PAGINATION_LIMIT: 20,
  MAX_PAGINATION_LIMIT: 100,
  MESSAGE_PREVIEW_LENGTH: 100,
} as const;

/**
 * Allowed attachment MIME types
 */
export const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'audio/mp4',
  'audio/mpeg',
] as const;

/**
 * Message folder types
 */
export const MESSAGE_FOLDERS = {
  inbox: {
    label: 'Inbox',
    icon: '📥',
    description: 'Messages received',
  },
  sent: {
    label: 'Sent',
    icon: '📤',
    description: 'Messages you sent',
  },
  unread: {
    label: 'Unread',
    icon: '🔔',
    description: 'Unread messages',
  },
  all: {
    label: 'All Messages',
    icon: '📬',
    description: 'All your messages',
  },
} as const;

/**
 * Communication allowed between roles
 */
export const COMMUNICATION_MATRIX: Record<
  string,
  Array<'owner' | 'admin' | 'teacher' | 'student' | 'parent'>
> = {
  teacher: ['owner', 'admin', 'student', 'parent'], // Teachers can message all
  student: ['owner', 'admin', 'teacher'], // Students can message staff
  parent: ['owner', 'admin', 'teacher'], // Parents can message staff
  admin: ['owner', 'teacher', 'student', 'parent'], // Admins can message all
  owner: ['admin', 'teacher', 'student', 'parent'], // Owner can message all
};
