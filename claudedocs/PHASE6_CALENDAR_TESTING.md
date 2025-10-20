# Phase 6: Calendar & Events API - Comprehensive Testing Guide

**Created**: 2025-10-20
**Phase**: 6 - Calendar & Events APIs
**Status**: Complete - Ready for Testing
**Files**: 5 files, ~2,300 lines of code

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [API Endpoints](#api-endpoints)
4. [Testing Prerequisites](#testing-prerequisites)
5. [Test Scenarios](#test-scenarios)
6. [Database Verification](#database-verification)
7. [Integration Testing](#integration-testing)
8. [Edge Cases & Error Handling](#edge-cases--error-handling)

---

## Overview

### What Was Built

Phase 6 implements a complete calendar and events management system with:

- **10 Event Types**: assignment_due, homework_due, target_due, class_session, school_event, holiday, exam, meeting, reminder, other
- **Recurring Events**: Daily, weekly, monthly, yearly patterns with complex filters
- **Linked Resources**: Events can connect to assignments, homework, targets, or classes
- **Participant Management**: Event invitations and attendance tracking
- **iCalendar Export**: RFC 5545 compliant .ics file generation for external calendar integration
- **Permission-Based Access**: Role-based event creation and management
- **School-Level Isolation**: Multi-tenancy with RLS enforcement

### Files Created

```
frontend/lib/types/events.ts              (~600 lines) - Type system
frontend/lib/validators/events.ts         (~500 lines) - Validators
frontend/app/api/events/route.ts          (~500 lines) - POST, GET
frontend/app/api/events/[id]/route.ts     (~500 lines) - GET, PATCH, DELETE
frontend/app/api/events/ical/route.ts     (~200 lines) - iCal export
```

---

## System Architecture

### Event Structure

```typescript
interface EventRow {
  id: string;
  school_id: string;
  created_by_user_id: string;
  title: string;
  description: string | null;
  event_type: EventType; // 10 types
  start_date: string; // ISO datetime
  end_date: string; // ISO datetime
  all_day: boolean;
  location: string | null;
  color: string | null; // Hex color
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  recurrence_parent_id: string | null;
  class_id: string | null;
  assignment_id: string | null;
  homework_id: string | null;
  target_id: string | null;
  created_at: string;
  updated_at: string;
}
```

### Recurrence Rules

```typescript
interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N days/weeks/months/years
  count?: number; // End after N occurrences
  until?: string; // End date (ISO format)
  by_weekday?: number[]; // For weekly: 0=Sun, 1=Mon, ..., 6=Sat
  by_month_day?: number; // For monthly: 1-31
  by_month?: number; // For yearly: 1-12
}
```

### Permission Model

| Role | Create | View | Update Own | Update Any | Delete Own | Delete Any |
|------|--------|------|------------|------------|------------|------------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Teacher | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Student | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Parent | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## API Endpoints

### 1. POST /api/events - Create Event

**Purpose**: Create a new event with optional recurrence

**Authentication**: Required (Teacher, Admin, Owner only)

**Request Body**:
```json
{
  "title": "Weekly Quran Class",
  "description": "Monday morning Quran recitation class",
  "event_type": "class_session",
  "start_date": "2025-10-21T09:00:00.000Z",
  "end_date": "2025-10-21T10:00:00.000Z",
  "all_day": false,
  "location": "Room 101",
  "color": "#3B82F6",
  "is_recurring": true,
  "recurrence_rule": {
    "frequency": "weekly",
    "interval": 1,
    "count": 10,
    "by_weekday": [1]
  },
  "class_id": "123e4567-e89b-12d3-a456-426614174000",
  "participant_user_ids": ["user1", "user2"]
}
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event-id",
      "school_id": "school-id",
      "created_by_user_id": "user-id",
      "title": "Weekly Quran Class",
      "event_type": "class_session",
      "is_recurring": true,
      "recurrence_rule": { ... },
      "creator": {
        "id": "user-id",
        "display_name": "Ahmed Khan",
        "email": "ahmed@example.com",
        "role": "teacher"
      },
      "class": {
        "id": "class-id",
        "name": "Quran 101",
        "room": "Room 101"
      }
    },
    "recurrence_count": 10
  },
  "message": "Created recurring event with 10 occurrences"
}
```

**Error Responses**:
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a teacher/admin/owner
- `404 Not Found` - Linked resource (class/assignment) not found
- `400 Validation Error` - Invalid request data
- `500 Database Error` - Failed to create event

---

### 2. GET /api/events - List Events

**Purpose**: Retrieve events with filtering and pagination

**Authentication**: Required (All roles can view school events)

**Query Parameters**:
```
start_date (optional): ISO datetime - Filter events ending after this date
end_date (optional): ISO datetime - Filter events starting before this date
event_type (optional): EventType - Filter by event type
class_id (optional): UUID - Filter by class
created_by_user_id (optional): UUID - Filter by creator
include_recurring (optional): boolean - Include recurring instances (default: true)
limit (optional): number - Max results (default: 50, max: 500)
offset (optional): number - Pagination offset (default: 0)
```

**Example Request**:
```
GET /api/events?start_date=2025-10-01T00:00:00.000Z&end_date=2025-10-31T23:59:59.999Z&event_type=class_session&limit=20&offset=0
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event-id",
        "title": "Weekly Quran Class",
        "event_type": "class_session",
        "start_date": "2025-10-21T09:00:00.000Z",
        "end_date": "2025-10-21T10:00:00.000Z",
        "all_day": false,
        "creator": { ... },
        "class": { ... }
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "has_more": true
    },
    "summary": {
      "total_events": 45,
      "by_type": {
        "class_session": 20,
        "assignment_due": 15,
        "exam": 10
      }
    }
  }
}
```

---

### 3. GET /api/events/:id - Get Event Details

**Purpose**: Retrieve full details of a single event with related recurring events

**Authentication**: Required (All roles can view school events)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event-id",
      "title": "Weekly Quran Class",
      "description": "Monday morning Quran recitation class",
      "event_type": "class_session",
      "start_date": "2025-10-21T09:00:00.000Z",
      "end_date": "2025-10-21T10:00:00.000Z",
      "all_day": false,
      "location": "Room 101",
      "color": "#3B82F6",
      "is_recurring": true,
      "recurrence_rule": {
        "frequency": "weekly",
        "interval": 1,
        "count": 10,
        "by_weekday": [1]
      },
      "recurrence_parent_id": null,
      "creator": {
        "id": "user-id",
        "display_name": "Ahmed Khan",
        "email": "ahmed@example.com",
        "role": "teacher"
      },
      "class": {
        "id": "class-id",
        "name": "Quran 101",
        "room": "Room 101"
      },
      "participants": [
        {
          "id": "participant-id",
          "user_id": "student-id",
          "status": "accepted",
          "user": {
            "user_id": "student-id",
            "display_name": "Fatima Ali",
            "email": "fatima@example.com"
          }
        }
      ],
      "participant_count": 15
    },
    "related_events": [
      {
        "id": "instance-1",
        "start_date": "2025-10-28T09:00:00.000Z",
        "end_date": "2025-10-28T10:00:00.000Z"
      },
      {
        "id": "instance-2",
        "start_date": "2025-11-04T09:00:00.000Z",
        "end_date": "2025-11-04T10:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses**:
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Event not found or not in user's school
- `500 Database Error` - Failed to fetch event

---

### 4. PATCH /api/events/:id - Update Event

**Purpose**: Update an existing event (single instance or entire series)

**Authentication**: Required (Creator, Admin, Owner only)

**Request Body**:
```json
{
  "title": "Updated Class Title",
  "description": "Updated description",
  "start_date": "2025-10-21T10:00:00.000Z",
  "end_date": "2025-10-21T11:00:00.000Z",
  "location": "Room 202",
  "color": "#10B981",
  "update_series": true
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event-id",
      "title": "Updated Class Title",
      "start_date": "2025-10-21T10:00:00.000Z",
      "end_date": "2025-10-21T11:00:00.000Z",
      "updated_at": "2025-10-20T15:30:00.000Z"
    },
    "updated_count": 10
  },
  "message": "Updated 10 events in the series"
}
```

**Error Responses**:
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not the creator/admin/owner
- `404 Not Found` - Event not found
- `400 Validation Error` - Invalid update data
- `500 Database Error` - Failed to update event

---

### 5. DELETE /api/events/:id - Delete Event

**Purpose**: Delete an event (single instance or entire series)

**Authentication**: Required (Creator, Admin, Owner only)

**Query Parameters**:
```
delete_series (optional): boolean - If true, delete all recurring instances (default: false)
```

**Example Request**:
```
DELETE /api/events/event-id?delete_series=true
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "deleted_count": 10
  },
  "message": "Deleted 10 events in the series"
}
```

**Error Responses**:
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not the creator/admin/owner
- `404 Not Found` - Event not found
- `500 Database Error` - Failed to delete event

---

### 6. GET /api/events/ical - Export iCalendar

**Purpose**: Generate RFC 5545 compliant .ics file for external calendar integration

**Authentication**: Required (All roles can export school calendar)

**Query Parameters**:
```
start_date (optional): ISO datetime - Filter events from this date
end_date (optional): ISO datetime - Filter events until this date
event_type (optional): EventType - Filter by event type
class_id (optional): UUID - Filter by class
```

**Example Request**:
```
GET /api/events/ical?start_date=2025-10-01T00:00:00.000Z&end_date=2025-12-31T23:59:59.999Z&event_type=class_session
```

**Success Response** (200):
- Content-Type: `text/calendar; charset=utf-8`
- Content-Disposition: `attachment; filename="SchoolName_Calendar_2025-10-20.ics"`

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//QuranAkh//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:My School - QuranAkh Calendar
X-WR-TIMEZONE:UTC
X-WR-CALDESC:Calendar events from My School on QuranAkh
BEGIN:VEVENT
UID:event-id@quranakh.com
DTSTAMP:20251020T153000Z
DTSTART:20251021T090000Z
DTEND:20251021T100000Z
SUMMARY:Weekly Quran Class
DESCRIPTION:Monday morning Quran recitation class
LOCATION:Room 101
ORGANIZER;CN=Ahmed Khan:mailto:ahmed@example.com
COLOR:#3B82F6
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

**Error Responses**:
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - No permission to export calendar
- `400 Validation Error` - Invalid filter parameters
- `500 Database Error` - Failed to fetch events

---

## Testing Prerequisites

### 1. Environment Setup

Ensure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Database Setup

Verify the `events` table exists:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;
```

### 3. Test Users

Create test users with different roles:
- Teacher: `teacher@test.com`
- Admin: `admin@test.com`
- Student: `student@test.com`

### 4. Test Data

Create test classes and linked resources:
```sql
-- Insert test class
INSERT INTO classes (id, school_id, name, room, created_by)
VALUES ('test-class-id', 'your-school-id', 'Test Class', 'Room 101', 'teacher-user-id');
```

---

## Test Scenarios

### Scenario 1: Create Single Event

**Test**: Teacher creates a one-time class session event

**Steps**:
1. Login as teacher
2. POST `/api/events` with:
```json
{
  "title": "Quran Recitation Test",
  "description": "Testing event creation",
  "event_type": "class_session",
  "start_date": "2025-10-25T10:00:00.000Z",
  "end_date": "2025-10-25T11:00:00.000Z",
  "all_day": false,
  "location": "Room 101",
  "color": "#3B82F6",
  "is_recurring": false,
  "class_id": "test-class-id"
}
```

**Expected Result**:
- Status: 201 Created
- Response contains `event` object with all fields
- `creator` object populated with teacher details
- `class` object populated with class details
- `is_recurring` is `false`
- `recurrence_count` not present

**Database Verification**:
```sql
SELECT * FROM events
WHERE title = 'Quran Recitation Test'
AND school_id = 'your-school-id';
```

---

### Scenario 2: Create Daily Recurring Event

**Test**: Teacher creates a daily recurring event for 5 days

**Steps**:
1. Login as teacher
2. POST `/api/events` with:
```json
{
  "title": "Daily Quran Review",
  "event_type": "class_session",
  "start_date": "2025-10-21T09:00:00.000Z",
  "end_date": "2025-10-21T09:30:00.000Z",
  "is_recurring": true,
  "recurrence_rule": {
    "frequency": "daily",
    "interval": 1,
    "count": 5
  }
}
```

**Expected Result**:
- Status: 201 Created
- `recurrence_count`: 5
- Message: "Created recurring event with 5 occurrences"

**Database Verification**:
```sql
-- Check parent event
SELECT id, title, is_recurring, recurrence_parent_id
FROM events
WHERE title = 'Daily Quran Review'
AND recurrence_parent_id IS NULL;

-- Check instances (should be 4, as parent is the first)
SELECT id, start_date, recurrence_parent_id
FROM events
WHERE recurrence_parent_id = (
  SELECT id FROM events
  WHERE title = 'Daily Quran Review'
  AND recurrence_parent_id IS NULL
)
ORDER BY start_date;
```

**Verify Dates**:
- Instance 1: 2025-10-22 09:00
- Instance 2: 2025-10-23 09:00
- Instance 3: 2025-10-24 09:00
- Instance 4: 2025-10-25 09:00

---

### Scenario 3: Create Weekly Recurring Event (Specific Weekdays)

**Test**: Teacher creates a weekly event on Mondays and Wednesdays for 4 weeks

**Steps**:
1. Login as teacher
2. POST `/api/events` with:
```json
{
  "title": "Weekly Quran Class",
  "event_type": "class_session",
  "start_date": "2025-10-21T10:00:00.000Z",
  "end_date": "2025-10-21T11:00:00.000Z",
  "is_recurring": true,
  "recurrence_rule": {
    "frequency": "weekly",
    "interval": 1,
    "by_weekday": [1, 3],
    "count": 8
  }
}
```

**Expected Result**:
- Status: 201 Created
- `recurrence_count`: 8
- Instances created on Mondays (1) and Wednesdays (3) only

**Database Verification**:
```sql
SELECT id, start_date, EXTRACT(DOW FROM start_date::timestamp) as day_of_week
FROM events
WHERE recurrence_parent_id = (
  SELECT id FROM events
  WHERE title = 'Weekly Quran Class'
  AND recurrence_parent_id IS NULL
)
ORDER BY start_date;
```

**Verify Weekdays**:
- All instances should have `day_of_week` = 1 (Monday) or 3 (Wednesday)

---

### Scenario 4: Create Monthly Recurring Event

**Test**: Teacher creates a monthly event on the 15th of each month

**Steps**:
1. Login as teacher
2. POST `/api/events` with:
```json
{
  "title": "Monthly Assessment",
  "event_type": "exam",
  "start_date": "2025-10-15T14:00:00.000Z",
  "end_date": "2025-10-15T15:00:00.000Z",
  "is_recurring": true,
  "recurrence_rule": {
    "frequency": "monthly",
    "interval": 1,
    "by_month_day": 15,
    "count": 6
  }
}
```

**Expected Result**:
- Status: 201 Created
- `recurrence_count`: 6
- Instances created on the 15th of each month

**Database Verification**:
```sql
SELECT id, start_date, EXTRACT(DAY FROM start_date::timestamp) as day_of_month
FROM events
WHERE recurrence_parent_id = (
  SELECT id FROM events
  WHERE title = 'Monthly Assessment'
  AND recurrence_parent_id IS NULL
)
ORDER BY start_date;
```

**Verify Dates**:
- All instances should have `day_of_month` = 15

---

### Scenario 5: List Events with Date Range Filter

**Test**: Retrieve events within October 2025

**Steps**:
1. Login as any user
2. GET `/api/events?start_date=2025-10-01T00:00:00.000Z&end_date=2025-10-31T23:59:59.999Z&limit=50`

**Expected Result**:
- Status: 200 OK
- Response contains all events that overlap with October 2025
- Pagination metadata included
- Summary by type included

**Verification**:
```sql
SELECT COUNT(*)
FROM events
WHERE school_id = 'your-school-id'
AND end_date >= '2025-10-01T00:00:00.000Z'
AND start_date <= '2025-10-31T23:59:59.999Z';
```

---

### Scenario 6: Update Single Event Instance

**Test**: Update only one instance of a recurring event

**Steps**:
1. Create a recurring event (Scenario 2)
2. Get the ID of the second instance
3. PATCH `/api/events/:id` with:
```json
{
  "start_date": "2025-10-22T10:00:00.000Z",
  "end_date": "2025-10-22T10:30:00.000Z",
  "update_series": false
}
```

**Expected Result**:
- Status: 200 OK
- Only the targeted instance is updated
- Other instances remain unchanged
- `updated_count` not present (single update)

**Database Verification**:
```sql
SELECT id, start_date
FROM events
WHERE recurrence_parent_id = 'parent-id'
ORDER BY start_date;
```

**Verify**:
- Second instance has new time (10:00-10:30)
- Other instances have original time (09:00-09:30)

---

### Scenario 7: Update Entire Recurring Series

**Test**: Update all instances of a recurring event

**Steps**:
1. Create a recurring event (Scenario 2)
2. Get the parent event ID
3. PATCH `/api/events/:parent-id` with:
```json
{
  "title": "Updated Daily Review",
  "location": "Room 202",
  "update_series": true
}
```

**Expected Result**:
- Status: 200 OK
- All instances updated (parent + children)
- `updated_count`: 5

**Database Verification**:
```sql
SELECT id, title, location
FROM events
WHERE id = 'parent-id'
OR recurrence_parent_id = 'parent-id'
ORDER BY start_date;
```

**Verify**:
- All events have `title = 'Updated Daily Review'`
- All events have `location = 'Room 202'`

---

### Scenario 8: Delete Single Event Instance

**Test**: Delete one instance of a recurring event

**Steps**:
1. Create a recurring event (Scenario 2)
2. Get the ID of the third instance
3. DELETE `/api/events/:id?delete_series=false`

**Expected Result**:
- Status: 200 OK
- `deleted_count`: 1
- Message: "Event deleted successfully"

**Database Verification**:
```sql
SELECT COUNT(*)
FROM events
WHERE id = 'parent-id'
OR recurrence_parent_id = 'parent-id';
```

**Verify**:
- Count should be 4 (5 - 1 deleted)
- Third instance is missing from the series

---

### Scenario 9: Delete Entire Recurring Series

**Test**: Delete all instances of a recurring event

**Steps**:
1. Create a recurring event (Scenario 2)
2. Get the parent event ID
3. DELETE `/api/events/:parent-id?delete_series=true`

**Expected Result**:
- Status: 200 OK
- `deleted_count`: 5
- Message: "Deleted 5 events in the series"

**Database Verification**:
```sql
SELECT COUNT(*)
FROM events
WHERE id = 'parent-id'
OR recurrence_parent_id = 'parent-id';
```

**Verify**:
- Count should be 0 (all events deleted)

---

### Scenario 10: Export iCalendar File

**Test**: Export events as .ics file for external calendar integration

**Steps**:
1. Create several events (mix of single and recurring)
2. GET `/api/events/ical?start_date=2025-10-01T00:00:00.000Z&end_date=2025-12-31T23:59:59.999Z`

**Expected Result**:
- Status: 200 OK
- Content-Type: `text/calendar; charset=utf-8`
- Content-Disposition header with filename
- Response body is valid iCalendar format

**Verification**:
1. Save response to `calendar.ics` file
2. Import into Google Calendar / Apple Calendar / Outlook
3. Verify events appear correctly
4. Check event details (title, time, location, description)

**iCalendar Format Validation**:
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//QuranAkh//Calendar//EN
...
BEGIN:VEVENT
UID:event-id@quranakh.com
DTSTART:20251021T100000Z
DTEND:20251021T110000Z
SUMMARY:Event Title
...
END:VEVENT
...
END:VCALENDAR
```

---

### Scenario 11: Permission Testing - Student Attempts to Create Event

**Test**: Verify students cannot create events

**Steps**:
1. Login as student
2. POST `/api/events` with valid event data

**Expected Result**:
- Status: 403 Forbidden
- Error code: `FORBIDDEN`
- Error message: "Insufficient permissions to create events"

---

### Scenario 12: Permission Testing - Teacher Updates Another Teacher's Event

**Test**: Verify teachers cannot update other teachers' events

**Steps**:
1. Login as teacher A, create an event
2. Login as teacher B
3. PATCH `/api/events/:event-id` with update data

**Expected Result**:
- Status: 403 Forbidden
- Error code: `FORBIDDEN`
- Error message: "Insufficient permissions to update this event"

---

### Scenario 13: Permission Testing - Admin Updates Any Event

**Test**: Verify admins can update any event in their school

**Steps**:
1. Login as teacher, create an event
2. Login as admin
3. PATCH `/api/events/:event-id` with update data

**Expected Result**:
- Status: 200 OK
- Event updated successfully

---

## Database Verification

### Check All Events

```sql
SELECT
  e.id,
  e.title,
  e.event_type,
  e.start_date,
  e.end_date,
  e.is_recurring,
  e.recurrence_parent_id,
  p.display_name as creator_name,
  c.name as class_name
FROM events e
LEFT JOIN profiles p ON e.created_by_user_id = p.user_id
LEFT JOIN classes c ON e.class_id = c.id
WHERE e.school_id = 'your-school-id'
ORDER BY e.start_date;
```

### Check Recurring Event Chains

```sql
WITH RECURSIVE event_chain AS (
  -- Parent events
  SELECT
    id,
    title,
    start_date,
    is_recurring,
    recurrence_parent_id,
    0 as depth,
    id as root_id
  FROM events
  WHERE recurrence_parent_id IS NULL
  AND is_recurring = true

  UNION ALL

  -- Child events
  SELECT
    e.id,
    e.title,
    e.start_date,
    e.is_recurring,
    e.recurrence_parent_id,
    ec.depth + 1,
    ec.root_id
  FROM events e
  JOIN event_chain ec ON e.recurrence_parent_id = ec.id
)
SELECT
  root_id,
  COUNT(*) as total_instances,
  MIN(start_date) as first_occurrence,
  MAX(start_date) as last_occurrence
FROM event_chain
GROUP BY root_id;
```

### Check Event Participants

```sql
SELECT
  e.id,
  e.title,
  ep.user_id,
  p.display_name,
  ep.status
FROM events e
JOIN event_participants ep ON e.id = ep.event_id
JOIN profiles p ON ep.user_id = p.user_id
WHERE e.school_id = 'your-school-id'
ORDER BY e.start_date, p.display_name;
```

### Check Event Statistics

```sql
SELECT
  event_type,
  COUNT(*) as total,
  COUNT(CASE WHEN is_recurring THEN 1 END) as recurring,
  COUNT(CASE WHEN recurrence_parent_id IS NOT NULL THEN 1 END) as instances
FROM events
WHERE school_id = 'your-school-id'
GROUP BY event_type
ORDER BY total DESC;
```

---

## Integration Testing

### Test Flow 1: Complete Event Lifecycle

```bash
# 1. Create event
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Integration Test Event",
    "event_type": "class_session",
    "start_date": "2025-10-25T10:00:00.000Z",
    "end_date": "2025-10-25T11:00:00.000Z"
  }'

# 2. List events
curl -X GET "http://localhost:3000/api/events?limit=10" \
  -H "Cookie: your-auth-cookie"

# 3. Get specific event
curl -X GET "http://localhost:3000/api/events/:event-id" \
  -H "Cookie: your-auth-cookie"

# 4. Update event
curl -X PATCH "http://localhost:3000/api/events/:event-id" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Updated Test Event",
    "location": "New Location"
  }'

# 5. Export calendar
curl -X GET "http://localhost:3000/api/events/ical" \
  -H "Cookie: your-auth-cookie" \
  -o calendar.ics

# 6. Delete event
curl -X DELETE "http://localhost:3000/api/events/:event-id" \
  -H "Cookie: your-auth-cookie"
```

### Test Flow 2: Recurring Event Management

```bash
# 1. Create recurring event
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Weekly Meeting",
    "event_type": "meeting",
    "start_date": "2025-10-21T14:00:00.000Z",
    "end_date": "2025-10-21T15:00:00.000Z",
    "is_recurring": true,
    "recurrence_rule": {
      "frequency": "weekly",
      "interval": 1,
      "count": 5
    }
  }'

# 2. Update single instance
curl -X PATCH "http://localhost:3000/api/events/:instance-id" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "start_date": "2025-10-28T15:00:00.000Z",
    "end_date": "2025-10-28T16:00:00.000Z",
    "update_series": false
  }'

# 3. Update entire series
curl -X PATCH "http://localhost:3000/api/events/:parent-id" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Updated Weekly Meeting",
    "update_series": true
  }'

# 4. Delete single instance
curl -X DELETE "http://localhost:3000/api/events/:instance-id?delete_series=false" \
  -H "Cookie: your-auth-cookie"

# 5. Delete entire series
curl -X DELETE "http://localhost:3000/api/events/:parent-id?delete_series=true" \
  -H "Cookie: your-auth-cookie"
```

---

## Edge Cases & Error Handling

### Edge Case 1: Invalid Date Range

**Test**: Start date after end date

**Request**:
```json
{
  "title": "Invalid Event",
  "event_type": "meeting",
  "start_date": "2025-10-25T11:00:00.000Z",
  "end_date": "2025-10-25T10:00:00.000Z"
}
```

**Expected**:
- Status: 400 Bad Request
- Error: "Start date must be before or equal to end date"

---

### Edge Case 2: Event Duration Too Long

**Test**: Event spanning more than 30 days

**Request**:
```json
{
  "title": "Long Event",
  "event_type": "holiday",
  "start_date": "2025-10-01T00:00:00.000Z",
  "end_date": "2025-11-15T00:00:00.000Z"
}
```

**Expected**:
- Status: 400 Bad Request
- Error: "Event duration cannot exceed 30 days"

---

### Edge Case 3: Invalid Recurrence Rule

**Test**: Both count and until specified

**Request**:
```json
{
  "title": "Invalid Recurrence",
  "event_type": "meeting",
  "start_date": "2025-10-21T10:00:00.000Z",
  "end_date": "2025-10-21T11:00:00.000Z",
  "is_recurring": true,
  "recurrence_rule": {
    "frequency": "weekly",
    "interval": 1,
    "count": 10,
    "until": "2025-12-31T00:00:00.000Z"
  }
}
```

**Expected**:
- Status: 400 Bad Request
- Error: "Recurrence rule cannot have both count and until specified"

---

### Edge Case 4: Multiple Linked Resources

**Test**: Event linked to both assignment and homework

**Request**:
```json
{
  "title": "Invalid Linked Event",
  "event_type": "assignment_due",
  "start_date": "2025-10-21T10:00:00.000Z",
  "end_date": "2025-10-21T11:00:00.000Z",
  "assignment_id": "assignment-id",
  "homework_id": "homework-id"
}
```

**Expected**:
- Status: 400 Bad Request
- Error: "Event can only be linked to one resource (assignment, homework, or target)"

---

### Edge Case 5: Linked Resource Not Found

**Test**: Event linked to non-existent class

**Request**:
```json
{
  "title": "Event with Invalid Class",
  "event_type": "class_session",
  "start_date": "2025-10-21T10:00:00.000Z",
  "end_date": "2025-10-21T11:00:00.000Z",
  "class_id": "non-existent-class-id"
}
```

**Expected**:
- Status: 404 Not Found
- Error: "Class not found in your school"

---

### Edge Case 6: Recurrence Count Exceeds Limit

**Test**: Recurrence count > 365

**Request**:
```json
{
  "title": "Too Many Occurrences",
  "event_type": "reminder",
  "start_date": "2025-10-21T10:00:00.000Z",
  "end_date": "2025-10-21T10:30:00.000Z",
  "is_recurring": true,
  "recurrence_rule": {
    "frequency": "daily",
    "interval": 1,
    "count": 500
  }
}
```

**Expected**:
- Status: 400 Bad Request
- Error: "Recurrence count cannot exceed 365"

---

### Edge Case 7: Query Date Range Too Large

**Test**: Query events spanning more than 2 years

**Request**:
```
GET /api/events?start_date=2025-01-01T00:00:00.000Z&end_date=2027-12-31T23:59:59.999Z
```

**Expected**:
- Status: 400 Bad Request
- Error: "Date range cannot exceed 730 days"

---

### Edge Case 8: Invalid Hex Color

**Test**: Color not in hex format

**Request**:
```json
{
  "title": "Invalid Color Event",
  "event_type": "meeting",
  "start_date": "2025-10-21T10:00:00.000Z",
  "end_date": "2025-10-21T11:00:00.000Z",
  "color": "blue"
}
```

**Expected**:
- Status: 400 Bad Request
- Error: "Color must be a valid hex color"

---

### Edge Case 9: Pagination Limit Exceeds Maximum

**Test**: Request limit > 500

**Request**:
```
GET /api/events?limit=1000
```

**Expected**:
- Status: 400 Bad Request
- Error: "Limit must be between 1 and 500"

---

### Edge Case 10: Update Event from Different School

**Test**: User tries to update event from another school

**Setup**:
1. Create event in School A
2. Login as user from School B
3. Attempt to update event

**Expected**:
- Status: 404 Not Found
- Error: "Event not found"
- (RLS prevents cross-school access)

---

## Success Criteria

Phase 6 is considered complete and ready for production when:

✅ **All Endpoints Functional**
- POST /api/events creates single and recurring events
- GET /api/events lists events with all filters
- GET /api/events/:id retrieves event details
- PATCH /api/events/:id updates events (single and series)
- DELETE /api/events/:id deletes events (single and series)
- GET /api/events/ical exports valid iCalendar files

✅ **Recurring Events Work Correctly**
- Daily recurrence generates correct dates
- Weekly recurrence respects weekday filters
- Monthly recurrence uses correct day of month
- Yearly recurrence uses correct month
- Count and until limits work properly
- Series updates propagate correctly
- Series deletions cascade properly

✅ **Permissions Enforced**
- Only teachers/admins/owners can create events
- All users can view school events
- Only creator/admin/owner can update events
- Only creator/admin/owner can delete events
- All users can export school calendar

✅ **Validation Works**
- Date ranges validated
- Recurrence rules validated
- Linked resources verified
- Permissions checked
- Edge cases handled

✅ **Database Integrity**
- All events have school_id
- Recurring events have parent-child relationships
- Participants linked correctly
- Cascading deletes work properly

✅ **iCalendar Export**
- RFC 5545 compliant format
- Imports into Google Calendar
- Imports into Apple Calendar
- Imports into Outlook
- All event details preserved

---

## Next Steps

After Phase 6 completion:

1. **Phase 7**: Missing UI Components
   - Calendar view component
   - Event list component
   - Event creation form
   - Event detail modal
   - Recurring event UI

2. **Frontend Integration**
   - Connect calendar UI to APIs
   - Implement event CRUD operations
   - Add participant management
   - Integrate iCal export button

3. **Performance Optimization**
   - Index optimization for date range queries
   - Caching for frequently accessed events
   - Pagination performance tuning

4. **Future Enhancements**
   - Email reminders for upcoming events
   - Push notifications for event changes
   - Event comments/discussions
   - Calendar sharing between schools
   - Drag-and-drop calendar interface
   - Event templates

---

**Phase 6 Complete** ✅
All Calendar & Events APIs implemented and ready for testing.
