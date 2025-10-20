# Enhanced Messages API Testing Guide

**Created**: October 20, 2025
**Purpose**: Comprehensive testing documentation for the threaded messaging system
**Status**: Production-Ready APIs - 6 endpoints complete

---

## 📋 Table of Contents

1. [API Endpoints Overview](#api-endpoints-overview)
2. [Testing Prerequisites](#testing-prerequisites)
3. [Endpoint Testing Specifications](#endpoint-testing-specifications)
4. [Permission Test Matrix](#permission-test-matrix)
5. [Integration Testing](#integration-testing)
6. [Performance Testing](#performance-testing)
7. [Error Scenarios](#error-scenarios)

---

## API Endpoints Overview

### Complete Endpoint List

| Method | Endpoint | Purpose | File Location |
|--------|----------|---------|---------------|
| POST | `/api/messages` | Send new message or reply | `frontend/app/api/messages/route.ts` |
| GET | `/api/messages` | List messages with filters | `frontend/app/api/messages/route.ts` |
| POST | `/api/messages/:id` | Reply to message (convenience) | `frontend/app/api/messages/[id]/route.ts` |
| PATCH | `/api/messages/:id` | Mark message as read | `frontend/app/api/messages/[id]/route.ts` |
| GET | `/api/messages/thread/:id` | Get full thread | `frontend/app/api/messages/thread/[id]/route.ts` |
| POST | `/api/messages/:id/attachments` | Add attachments | `frontend/app/api/messages/[id]/attachments/route.ts` |

### Type Definitions

**Location**: `frontend/lib/types/messages.ts` (442 lines)
**Validators**: `frontend/lib/validators/messages.ts` (573 lines)

---

## Testing Prerequisites

### Required Data Setup

```typescript
// Test users needed (per school):
const testUsers = {
  owner: { email: 'owner@school.com', role: 'owner' },
  admin: { email: 'admin@school.com', role: 'admin' },
  teacher: { email: 'teacher@school.com', role: 'teacher' },
  student: { email: 'student@school.com', role: 'student' },
  parent: { email: 'parent@school.com', role: 'parent' },
};

// Different school for cross-school isolation testing
const otherSchool = {
  teacher: { email: 'teacher@other.com', school_id: 'different' },
};
```

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rlfvubgyogkkqbjjmjwd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

### Communication Matrix Reference

```typescript
const COMMUNICATION_MATRIX = {
  teacher: ['owner', 'admin', 'student', 'parent'], // Teachers can message all
  student: ['owner', 'admin', 'teacher'],           // Students can message staff
  parent: ['owner', 'admin', 'teacher'],            // Parents can message staff
  admin: ['owner', 'teacher', 'student', 'parent'], // Admins can message all
  owner: ['admin', 'teacher', 'student', 'parent'], // Owner can message all
};
```

---

## Endpoint Testing Specifications

### 1. POST /api/messages - Send Message

**Purpose**: Send new message (start thread) or reply to existing thread

#### Test Case 1.1: Send New Message (Start Thread)
```http
POST /api/messages
Content-Type: application/json
Authorization: Bearer <teacher_token>

{
  "recipient_user_id": "uuid-of-student",
  "subject": "Homework Assignment Feedback",
  "body": "Great work on today's recitation. Please review Surah Al-Fatiha again before next class.",
  "attachments": [
    {
      "url": "https://storage.supabase.co/...",
      "mime_type": "application/pdf",
      "file_name": "feedback.pdf",
      "file_size": 245678
    }
  ]
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": {
    "id": "uuid-message",
    "school_id": "uuid-school",
    "thread_id": null,
    "sender_user_id": "uuid-teacher",
    "recipient_user_id": "uuid-student",
    "subject": "Homework Assignment Feedback",
    "body": "Great work on today's recitation...",
    "read_at": null,
    "created_at": "2025-10-20T10:30:00Z",
    "updated_at": "2025-10-20T10:30:00Z",
    "sender": {
      "id": "uuid-teacher",
      "display_name": "Teacher Name",
      "email": "teacher@school.com",
      "role": "teacher"
    },
    "recipient": {
      "id": "uuid-student",
      "display_name": "Student Name",
      "email": "student@school.com",
      "role": "student"
    },
    "attachments": [
      {
        "id": "uuid-attachment",
        "message_id": "uuid-message",
        "url": "https://storage.supabase.co/...",
        "mime_type": "application/pdf",
        "file_name": "feedback.pdf",
        "file_size": 245678,
        "created_at": "2025-10-20T10:30:00Z"
      }
    ],
    "is_read": false
  },
  "thread_id": "uuid-message",
  "notification_sent": true
}
```

**Validations**:
- ✅ Subject is required for new threads (no thread_id)
- ✅ Body is required (min 1 char, max 10000 chars)
- ✅ Recipient must exist in same school
- ✅ Sender can message recipient per COMMUNICATION_MATRIX
- ✅ Notification created for recipient
- ✅ thread_id equals message.id for root messages

#### Test Case 1.2: Reply to Thread
```http
POST /api/messages
Content-Type: application/json
Authorization: Bearer <student_token>

{
  "recipient_user_id": "uuid-of-teacher",
  "thread_id": "uuid-original-message",
  "body": "Thank you for the feedback! I will review it tonight."
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": {
    "id": "uuid-reply",
    "thread_id": "uuid-original-message",
    "subject": null,
    "body": "Thank you for the feedback!...",
    "sender": {...},
    "recipient": {...},
    "is_read": false
  },
  "thread_id": "uuid-original-message",
  "notification_sent": true
}
```

**Validations**:
- ✅ Subject is null for replies (thread_id provided)
- ✅ thread_id must reference existing message
- ✅ User must be part of thread (sender or recipient of original)
- ✅ Notification sent with type: 'new_message'

#### Test Case 1.3: Validation Errors

**Missing Subject on New Thread**:
```http
POST /api/messages
{
  "recipient_user_id": "uuid",
  "body": "Message without subject"
}
```
**Expected**: 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": ["subject: Subject is required for new message threads"]
  }
}
```

**Body Too Long**:
```http
POST /api/messages
{
  "recipient_user_id": "uuid",
  "subject": "Test",
  "body": "x".repeat(10001)
}
```
**Expected**: 400 Bad Request - Body exceeds MAX_BODY_LENGTH (10000)

**Invalid Recipient Role**:
```http
POST /api/messages (student → another student)
```
**Expected**: 403 Forbidden - "You cannot message this recipient"

**Cross-School Messaging**:
```http
POST /api/messages (teacher from school A → teacher from school B)
```
**Expected**: 403 Forbidden - School mismatch

---

### 2. GET /api/messages - List Messages

**Purpose**: List messages with folder-based filtering and pagination

#### Test Case 2.1: Get Inbox
```http
GET /api/messages?folder=inbox&page=1&limit=20
Authorization: Bearer <student_token>
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid-1",
      "sender": {...},
      "recipient": {...},
      "subject": "Homework Assignment Feedback",
      "body": "Great work...",
      "is_read": false,
      "created_at": "2025-10-20T10:30:00Z"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  },
  "stats": {
    "total_unread": 12,
    "total_threads": 8
  }
}
```

**Validations**:
- ✅ Only shows messages where recipient_user_id = current user
- ✅ Messages from same school only (school_id match)
- ✅ Default sort: created_at DESC
- ✅ Pagination works correctly

#### Test Case 2.2: Get Sent Messages
```http
GET /api/messages?folder=sent&page=1&limit=20
Authorization: Bearer <teacher_token>
```

**Validations**:
- ✅ Only shows messages where sender_user_id = current user
- ✅ Includes messages the teacher sent to multiple students

#### Test Case 2.3: Get Unread Messages
```http
GET /api/messages?folder=unread
Authorization: Bearer <parent_token>
```

**Validations**:
- ✅ Only shows messages where recipient_user_id = current user AND read_at IS NULL
- ✅ Unread count in stats matches message count

#### Test Case 2.4: Get All Messages
```http
GET /api/messages?folder=all
Authorization: Bearer <admin_token>
```

**Validations**:
- ✅ Shows messages where user is sender OR recipient
- ✅ School-level RLS still applies

#### Test Case 2.5: Filter by Thread
```http
GET /api/messages?thread_id=uuid-thread&folder=all
Authorization: Bearer <teacher_token>
```

**Validations**:
- ✅ Returns root message (id = thread_id, thread_id IS NULL)
- ✅ Returns all replies (thread_id = uuid-thread)
- ✅ Chronological order

#### Test Case 2.6: Pagination
```http
GET /api/messages?folder=inbox&page=2&limit=10
```

**Validations**:
- ✅ Returns messages 11-20
- ✅ total_pages calculated correctly (total / limit)
- ✅ Page exceeding total returns empty array, not error

#### Test Case 2.7: Sorting
```http
GET /api/messages?folder=inbox&sort_by=created_at&sort_order=asc
```

**Validations**:
- ✅ Oldest messages first
- ✅ sort_by accepts: 'created_at', 'updated_at'
- ✅ sort_order accepts: 'asc', 'desc'

---

### 3. POST /api/messages/:id - Reply to Message

**Purpose**: Convenience endpoint for replying (alternative to POST /api/messages with thread_id)

#### Test Case 3.1: Reply to Received Message
```http
POST /api/messages/uuid-original-message
Content-Type: application/json
Authorization: Bearer <student_token>

{
  "body": "Thank you for your feedback!",
  "attachments": []
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": {
    "id": "uuid-reply",
    "thread_id": "uuid-original-message",
    "sender_user_id": "uuid-student",
    "recipient_user_id": "uuid-teacher",
    "subject": null,
    "body": "Thank you for your feedback!",
    "sender": {...},
    "recipient": {...},
    "is_read": false
  },
  "thread_id": "uuid-original-message"
}
```

**Validations**:
- ✅ Automatically determines recipient (reply to sender of original)
- ✅ Creates notification with type: 'message_reply'
- ✅ thread_id set to getThreadId(originalMessage)
- ✅ Subject is null (replies don't have subjects)

#### Test Case 3.2: Reply with Attachments
```http
POST /api/messages/uuid
{
  "body": "Here's my homework",
  "attachments": [
    {
      "url": "https://storage.supabase.co/homework.pdf",
      "mime_type": "application/pdf",
      "file_name": "homework.pdf",
      "file_size": 123456
    }
  ]
}
```

**Validations**:
- ✅ Attachments created and linked to reply message
- ✅ Max 5 attachments enforced
- ✅ Max 10MB per attachment enforced

#### Test Case 3.3: Permission Errors

**User Not Part of Thread**:
```http
POST /api/messages/uuid (from user not sender or recipient)
```
**Expected**: 403 Forbidden - "Insufficient permissions to reply to this message"

**Message Not Found**:
```http
POST /api/messages/non-existent-uuid
```
**Expected**: 404 Not Found - "Message not found"

---

### 4. PATCH /api/messages/:id - Mark as Read

**Purpose**: Update read_at timestamp for message recipient

#### Test Case 4.1: Mark Unread Message as Read
```http
PATCH /api/messages/uuid-message
Authorization: Bearer <student_token>
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message_id": "uuid-message",
  "read_at": "2025-10-20T14:25:00Z",
  "message": "Message marked as read"
}
```

**Validations**:
- ✅ Only recipient can mark as read (or admin/owner)
- ✅ read_at timestamp updated in database
- ✅ updated_at timestamp also updated
- ✅ Idempotent: Marking already-read message returns success with existing timestamp

#### Test Case 4.2: Already Read Message
```http
PATCH /api/messages/uuid-already-read
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message_id": "uuid-already-read",
  "read_at": "2025-10-19T10:00:00Z",
  "message": "Message was already marked as read"
}
```

#### Test Case 4.3: Permission Errors

**Sender Trying to Mark as Read**:
```http
PATCH /api/messages/uuid (from sender, not recipient)
```
**Expected**: 403 Forbidden - "Insufficient permissions to mark this message as read"

**Cross-School Access**:
```http
PATCH /api/messages/uuid (message from different school)
```
**Expected**: 404 Not Found - RLS prevents access

---

### 5. GET /api/messages/thread/:id - Get Thread

**Purpose**: Retrieve complete conversation thread with all replies

#### Test Case 5.1: Get Thread by Root Message ID
```http
GET /api/messages/thread/uuid-root-message
Authorization: Bearer <teacher_token>
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "thread": {
    "root_message": {
      "id": "uuid-root",
      "subject": "Homework Assignment Feedback",
      "body": "Great work...",
      "sender": {...},
      "recipient": {...},
      "attachments": [...],
      "is_read": true,
      "reply_count": 3
    },
    "replies": [
      {
        "id": "uuid-reply-1",
        "thread_id": "uuid-root",
        "subject": null,
        "body": "Thank you!",
        "sender": {...},
        "recipient": {...},
        "created_at": "2025-10-20T11:00:00Z",
        "is_read": true
      },
      {
        "id": "uuid-reply-2",
        "thread_id": "uuid-root",
        "body": "I have a question...",
        "created_at": "2025-10-20T12:00:00Z",
        "is_read": false
      },
      {
        "id": "uuid-reply-3",
        "thread_id": "uuid-root",
        "body": "Here's the answer...",
        "created_at": "2025-10-20T13:00:00Z",
        "is_read": false
      }
    ],
    "participant_count": 2,
    "last_message_at": "2025-10-20T13:00:00Z",
    "unread_count": 2
  }
}
```

**Validations**:
- ✅ Returns root message with reply_count
- ✅ Replies sorted chronologically (created_at ASC)
- ✅ participant_count = unique sender/recipient count
- ✅ last_message_at = latest message timestamp
- ✅ unread_count = messages where current user is recipient AND read_at IS NULL

#### Test Case 5.2: Get Thread by Reply ID
```http
GET /api/messages/thread/uuid-reply (not root message)
Authorization: Bearer <student_token>
```

**Expected**:
- ✅ Automatically finds root message via getThreadId()
- ✅ Returns complete thread starting from root

#### Test Case 5.3: Permission Errors

**User Not Part of Thread**:
```http
GET /api/messages/thread/uuid (user not sender or recipient)
```
**Expected**: 403 Forbidden - "You do not have access to this thread"

**Thread Not Found**:
```http
GET /api/messages/thread/non-existent-uuid
```
**Expected**: 404 Not Found - "Thread not found"

---

### 6. POST /api/messages/:id/attachments - Add Attachments

**Purpose**: Add files to existing message (post-send)

#### Test Case 6.1: Add Single Attachment
```http
POST /api/messages/uuid-message/attachments
Content-Type: application/json
Authorization: Bearer <teacher_token>

{
  "attachments": [
    {
      "url": "https://storage.supabase.co/additional-file.pdf",
      "mime_type": "application/pdf",
      "file_name": "additional-file.pdf",
      "file_size": 345678
    }
  ]
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message_id": "uuid-message",
  "attachments": [
    {
      "id": "uuid-attachment",
      "message_id": "uuid-message",
      "url": "https://storage.supabase.co/additional-file.pdf",
      "mime_type": "application/pdf",
      "file_name": "additional-file.pdf",
      "file_size": 345678,
      "created_at": "2025-10-20T15:00:00Z"
    }
  ],
  "message": "Attachments added successfully"
}
```

**Validations**:
- ✅ Attachments created and linked to message
- ✅ message.updated_at timestamp updated
- ✅ Notification sent to recipient (type: 'message_attachment_added')
- ✅ Only sender or admin/owner can add attachments

#### Test Case 6.2: Add Multiple Attachments
```http
POST /api/messages/uuid/attachments
{
  "attachments": [
    { "url": "...", "mime_type": "image/jpeg", "file_name": "photo1.jpg", "file_size": 123456 },
    { "url": "...", "mime_type": "image/jpeg", "file_name": "photo2.jpg", "file_size": 234567 }
  ]
}
```

**Validations**:
- ✅ Both attachments created
- ✅ Batch insert operation

#### Test Case 6.3: Exceed Attachment Limit
```http
POST /api/messages/uuid-with-4-attachments/attachments
{
  "attachments": [
    {...},
    {...}
  ]
}
```

**Expected**: 400 Bad Request
```json
{
  "success": false,
  "error": "Cannot exceed 5 attachments per message. Current: 4, Attempting to add: 2",
  "code": "TOO_MANY_ATTACHMENTS",
  "details": {
    "current_count": 4,
    "attempting_to_add": 2,
    "max_allowed": 5
  }
}
```

#### Test Case 6.4: Invalid Attachment Type
```http
POST /api/messages/uuid/attachments
{
  "attachments": [
    {
      "url": "https://...",
      "mime_type": "application/exe",
      "file_name": "virus.exe",
      "file_size": 12345
    }
  ]
}
```

**Expected**: 400 Bad Request - "Invalid attachment type"

**Allowed MIME Types**:
- `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)
- `text/plain`
- `audio/mp4` (.m4a), `audio/mpeg` (.mp3)

#### Test Case 6.5: Attachment Too Large
```http
POST /api/messages/uuid/attachments
{
  "attachments": [
    {
      "url": "...",
      "mime_type": "application/pdf",
      "file_name": "huge-file.pdf",
      "file_size": 11000000
    }
  ]
}
```

**Expected**: 400 Bad Request - File size exceeds MAX_ATTACHMENT_SIZE (10MB)

#### Test Case 6.6: Permission Errors

**Non-Sender Adding Attachments**:
```http
POST /api/messages/uuid/attachments (from recipient, not sender)
```
**Expected**: 403 Forbidden - "Insufficient permissions to add attachments to this message"

---

## Permission Test Matrix

### Communication Matrix Tests

| Sender Role | Recipient Role | Expected Result |
|-------------|---------------|-----------------|
| teacher | owner | ✅ Allowed |
| teacher | admin | ✅ Allowed |
| teacher | student | ✅ Allowed |
| teacher | parent | ✅ Allowed |
| student | teacher | ✅ Allowed |
| student | admin | ✅ Allowed |
| student | owner | ✅ Allowed |
| student | student | ❌ Forbidden |
| student | parent | ❌ Forbidden |
| parent | teacher | ✅ Allowed |
| parent | admin | ✅ Allowed |
| parent | owner | ✅ Allowed |
| parent | student | ❌ Forbidden |
| parent | parent | ❌ Forbidden |
| admin | all roles | ✅ Allowed |
| owner | all roles | ✅ Allowed |

### Cross-School Isolation Tests

```typescript
// Test: Teacher from School A cannot message teacher from School B
POST /api/messages
From: teacher@schoolA.com
To: teacher@schoolB.com
Expected: 403 Forbidden - "You cannot message this recipient"

// Test: Student cannot see messages from different school
GET /api/messages?folder=inbox
From: student@schoolA.com
Expected: Only messages from schoolA, never schoolB (RLS enforcement)

// Test: Admin cannot view threads from other schools
GET /api/messages/thread/uuid-schoolB-thread
From: admin@schoolA.com
Expected: 404 Not Found (RLS prevents access)
```

### Role-Based Operations Tests

| Operation | Owner | Admin | Teacher | Student | Parent | Expected |
|-----------|-------|-------|---------|---------|--------|----------|
| Send message | ✅ | ✅ | ✅ | ✅ | ✅ | All can send (COMMUNICATION_MATRIX applies) |
| Reply to message | ✅ | ✅ | ✅ | ✅ | ✅ | If part of thread |
| Mark as read | ✅ | ✅ | Recipient only | Recipient only | Recipient only | Admins can mark any read |
| View thread | ✅ | ✅ | If participant | If participant | If participant | Admins can view all |
| Add attachments | ✅ | ✅ | Sender only | Sender only | Sender only | Admins can add to any |

---

## Integration Testing

### End-to-End Conversation Flow

**Scenario**: Teacher sends homework feedback, student replies with question, teacher answers

```typescript
// Step 1: Teacher sends initial message
const step1 = await POST('/api/messages', {
  sender: teacher,
  recipient: student,
  subject: 'Homework Feedback',
  body: 'Great work on Surah Al-Fatiha!',
});
// Verify: Message created, notification sent to student

// Step 2: Student views inbox
const step2 = await GET('/api/messages?folder=inbox', { auth: student });
// Verify: Message appears in inbox, is_read = false, total_unread = 1

// Step 3: Student marks as read
const step3 = await PATCH(`/api/messages/${step1.message.id}`, { auth: student });
// Verify: read_at timestamp set

// Step 4: Student replies with question
const step4 = await POST(`/api/messages/${step1.message.id}`, {
  sender: student,
  body: 'Thank you! Should I also review the tajweed rules?',
});
// Verify: Reply created, thread_id set, notification sent to teacher

// Step 5: Teacher views thread
const step5 = await GET(`/api/messages/thread/${step1.message.id}`, { auth: teacher });
// Verify: root_message + 1 reply, participant_count = 2, unread_count = 1 (for teacher)

// Step 6: Teacher replies with answer
const step6 = await POST('/api/messages', {
  sender: teacher,
  recipient: student,
  thread_id: step1.message.id,
  body: 'Yes, please review the makharij rules.',
});
// Verify: Second reply added to thread

// Step 7: Student views updated thread
const step7 = await GET(`/api/messages/thread/${step1.message.id}`, { auth: student });
// Verify: 2 replies, chronological order, unread_count = 1 (for student)

// Step 8: Teacher adds attachment to original message
const step8 = await POST(`/api/messages/${step1.message.id}/attachments`, {
  sender: teacher,
  attachments: [{ url: '...', mime_type: 'application/pdf', file_name: 'tajweed-guide.pdf', file_size: 456789 }],
});
// Verify: Attachment added, notification sent to student

// Step 9: Student views updated thread
const step9 = await GET(`/api/messages/thread/${step1.message.id}`, { auth: student });
// Verify: root_message has 1 attachment, updated_at timestamp reflects addition
```

### Notification Integration Tests

```typescript
// Verify notifications created for each event:
const notifications = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', student.user_id)
  .order('sent_at', { ascending: false });

// Expected notification types:
// 1. 'new_message' - When teacher sent initial message
// 2. 'message_reply' - When teacher replied to student's question
// 3. 'message_attachment_added' - When teacher added PDF attachment

// Verify payload structure:
notifications[0].payload = {
  message_id: 'uuid',
  thread_id: 'uuid',
  sender_name: 'Teacher Name',
  attachment_count: 1,
  file_names: ['tajweed-guide.pdf'],
};
```

---

## Performance Testing

### Load Testing Scenarios

#### Scenario 1: High Message Volume
```typescript
// Test: 1000 messages sent simultaneously
const promises = [];
for (let i = 0; i < 1000; i++) {
  promises.push(
    POST('/api/messages', {
      sender: teacher,
      recipient: students[i % students.length],
      subject: `Message ${i}`,
      body: `Test message ${i}`,
    })
  );
}
await Promise.all(promises);

// Verify:
// - All messages created successfully
// - No deadlocks or timeouts
// - Notifications sent for all messages
// - Response time < 2 seconds per request
```

#### Scenario 2: Large Thread Retrieval
```typescript
// Test: Thread with 100+ replies
const rootMessage = await POST('/api/messages', {...});
for (let i = 0; i < 100; i++) {
  await POST(`/api/messages/${rootMessage.message.id}`, {
    body: `Reply ${i}`,
  });
}

const thread = await GET(`/api/messages/thread/${rootMessage.message.id}`);

// Verify:
// - All 100 replies returned
// - Chronological order maintained
// - Statistics calculated correctly
// - Response time < 1 second
```

#### Scenario 3: Pagination Performance
```typescript
// Test: 10,000 messages in inbox, paginate through all
const totalMessages = 10000;
const pageSize = 100;

for (let page = 1; page <= totalMessages / pageSize; page++) {
  const response = await GET(`/api/messages?folder=inbox&page=${page}&limit=${pageSize}`);
  // Verify: Response time < 500ms per page
}
```

### Expected Performance Metrics

| Operation | Expected Response Time | Notes |
|-----------|----------------------|-------|
| Send message | < 500ms | Including notification |
| List messages (page) | < 300ms | 20-100 items per page |
| Get thread | < 500ms | Up to 50 replies |
| Mark as read | < 200ms | Simple UPDATE operation |
| Add attachments | < 400ms | 1-5 attachments |
| Reply to message | < 500ms | Including notification |

### Database Query Optimization

```sql
-- Verify indexes exist for performance:
CREATE INDEX IF NOT EXISTS idx_messages_recipient_school ON messages(recipient_user_id, school_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_school ON messages(sender_user_id, school_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_school_created ON messages(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);
```

---

## Error Scenarios

### Authentication Errors

```http
GET /api/messages
Authorization: (missing or invalid)

Expected: 401 Unauthorized
{
  "success": false,
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

### Validation Errors

| Scenario | Error Code | HTTP Status | Message |
|----------|-----------|-------------|---------|
| Subject missing on new thread | VALIDATION_ERROR | 400 | "Subject is required for new message threads" |
| Body empty | VALIDATION_ERROR | 400 | "Message body is required" |
| Body > 10000 chars | VALIDATION_ERROR | 400 | "Message must be 10000 characters or less" |
| Invalid recipient UUID | VALIDATION_ERROR | 400 | "Invalid UUID format" |
| Attachment type invalid | VALIDATION_ERROR | 400 | "Invalid attachment type" |
| Attachment > 10MB | VALIDATION_ERROR | 400 | "File too large. Maximum size: 10MB" |
| > 5 attachments | VALIDATION_ERROR | 400 | "Maximum 5 attachments allowed" |

### Permission Errors

| Scenario | Error Code | HTTP Status | Message |
|----------|-----------|-------------|---------|
| Student → Student message | FORBIDDEN | 403 | "You cannot message this recipient" |
| Cross-school message | FORBIDDEN | 403 | "You cannot message this recipient" |
| Non-participant viewing thread | FORBIDDEN | 403 | "You do not have access to this thread" |
| Non-sender marking as read | FORBIDDEN | 403 | "Insufficient permissions to mark this message as read" |
| Non-sender adding attachments | FORBIDDEN | 403 | "Insufficient permissions to add attachments to this message" |
| Non-participant replying | FORBIDDEN | 403 | "Insufficient permissions to reply to this message" |

### Not Found Errors

| Scenario | Error Code | HTTP Status | Message |
|----------|-----------|-------------|---------|
| Message doesn't exist | MESSAGE_NOT_FOUND | 404 | "Message not found" |
| Thread doesn't exist | THREAD_NOT_FOUND | 404 | "Thread not found" |
| Recipient doesn't exist | RECIPIENT_NOT_FOUND | 404 | "Recipient not found" |
| User profile missing | NOT_FOUND | 404 | "User profile not found" |
| Cross-school access (RLS) | NOT_FOUND | 404 | "Message not found" (hides existence) |

### Database Errors

```http
POST /api/messages (during database outage)

Expected: 500 Internal Server Error
{
  "success": false,
  "error": "Failed to send message",
  "code": "DATABASE_ERROR",
  "details": {
    "createError": {...}
  }
}
```

---

## Testing Checklist

### Pre-Deployment Testing

- [ ] **Type Safety**: All endpoints use typed Request/Response interfaces
- [ ] **Validation**: Zod schemas validate all inputs
- [ ] **Permissions**: COMMUNICATION_MATRIX enforced for all send operations
- [ ] **RLS**: School-level isolation verified for all endpoints
- [ ] **Notifications**: Created for send, reply, attachment events
- [ ] **Threading**: thread_id properly set and maintained
- [ ] **Attachments**: MIME type, size limits enforced
- [ ] **Pagination**: Works correctly with various page sizes
- [ ] **Sorting**: Chronological order maintained for threads
- [ ] **Statistics**: Unread count, participant count, last_message_at accurate
- [ ] **Idempotency**: Mark as read works multiple times safely
- [ ] **Error Handling**: All error codes implemented and tested
- [ ] **Cross-School**: Isolation verified (cannot access other schools)
- [ ] **Performance**: Response times within acceptable limits
- [ ] **Edge Cases**: Empty results, non-existent IDs handled gracefully

### Integration Testing

- [ ] **Complete conversation flow**: Send → Reply → Read → Thread view
- [ ] **Multi-participant threads**: 3+ users in conversation
- [ ] **Attachment workflow**: Send message → Add attachments later → View thread
- [ ] **Notification delivery**: Verify all notification types created
- [ ] **Folder filtering**: Inbox, sent, unread, all work correctly
- [ ] **Permission cascades**: Admin override permissions work
- [ ] **Concurrent operations**: Multiple users sending messages simultaneously
- [ ] **Large data sets**: Pagination with 1000+ messages
- [ ] **Long threads**: 50+ replies in single thread

### User Acceptance Testing

- [ ] **Teacher workflow**: Send feedback, receive questions, answer
- [ ] **Student workflow**: View homework feedback, ask questions, submit work via attachments
- [ ] **Parent workflow**: View child's messages (read-only through student account)
- [ ] **Admin workflow**: Monitor all communications, intervene if needed
- [ ] **Notification experience**: Users receive timely alerts
- [ ] **Mobile responsiveness**: API works on mobile devices
- [ ] **Offline handling**: Graceful error messages when offline
- [ ] **Search functionality**: (Future: Add search by subject/body)

---

## Appendix: Constants Reference

```typescript
export const MESSAGE_CONSTANTS = {
  MAX_SUBJECT_LENGTH: 200,           // Maximum characters in subject
  MAX_BODY_LENGTH: 10000,            // Maximum characters in body
  MAX_ATTACHMENTS: 5,                // Maximum attachments per message
  MAX_ATTACHMENT_SIZE: 10485760,     // 10MB in bytes
  DEFAULT_PAGINATION_LIMIT: 20,      // Default messages per page
  MAX_PAGINATION_LIMIT: 100,         // Maximum messages per page
  MESSAGE_PREVIEW_LENGTH: 100,       // Preview length in notifications
} as const;

export const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
  'audio/mp4',    // .m4a
  'audio/mpeg',   // .mp3
] as const;

export const MESSAGE_FOLDERS = {
  inbox: 'Messages received',
  sent: 'Messages you sent',
  unread: 'Unread messages',
  all: 'All your messages',
} as const;
```

---

**Testing Guide Complete**
**Total Endpoints**: 6
**Total Test Cases**: 50+
**Coverage**: Types, Validators, Endpoints, Permissions, Integration, Performance, Errors
**Status**: Ready for Production Testing
**Next Steps**: Execute test suite, validate RLS policies, load testing

---

**Document Version**: 1.0
**Last Updated**: October 20, 2025
**Maintained By**: QuranAkh Development Team
