/**
 * Attendance Session API - Bulk Operations
 * POST /api/attendance/session - Create attendance for entire class session
 *
 * Created: 2025-10-22
 * Purpose: Efficiently mark attendance for all students in a class at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface SessionAttendanceRecord {
  student_id: string;
  status: AttendanceStatus;
  notes?: string;
}

interface CreateSessionRequest {
  class_id: string;
  session_date: string;
  attendance: SessionAttendanceRecord[];
}

// ============================================================================
// POST /api/attendance/session - Create Full Class Session
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Only teachers and admins can create sessions
    if (!['teacher', 'admin', 'owner'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can create attendance sessions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreateSessionRequest = await request.json();
    const { class_id, session_date, attendance } = body;

    if (!class_id || !session_date || !attendance || !Array.isArray(attendance)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: class_id, session_date, attendance', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (attendance.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Attendance array cannot be empty', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Verify class belongs to same school
    const { data: classData, error: classError } = await supabaseAdmin
      .from('classes')
      .select('id, school_id, name')
      .eq('id', class_id)
      .single();

    if (classError || !classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (classData.school_id !== profile.school_id) {
      return NextResponse.json(
        { success: false, error: 'Cannot create session for class in different school', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Validate all attendance records
    for (const record of attendance) {
      if (!record.student_id || !record.status) {
        return NextResponse.json(
          { success: false, error: 'Each attendance record must have student_id and status', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }

      if (!['present', 'absent', 'late', 'excused'].includes(record.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status: ${record.status}`, code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
    }

    // Check for existing attendance records for this session
    const { data: existing } = await supabaseAdmin
      .from('attendance')
      .select('student_id')
      .eq('class_id', class_id)
      .eq('session_date', session_date);

    if (existing && existing.length > 0) {
      const existingStudentIds = existing.map((r: any) => r.student_id);
      const duplicates = attendance.filter(r => existingStudentIds.includes(r.student_id));

      if (duplicates.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Some students already have attendance marked for this session',
            code: 'DUPLICATE',
            details: { duplicate_count: duplicates.length },
          },
          { status: 409 }
        );
      }
    }

    // Prepare bulk insert data
    const attendanceRecords = attendance.map(record => ({
      class_id,
      session_date,
      student_id: record.student_id,
      status: record.status,
      notes: record.notes || null,
    }));

    // Bulk insert
    const { data: created, error: insertError } = await supabaseAdmin
      .from('attendance')
      .insert(attendanceRecords)
      .select();

    if (insertError || !created) {
      console.error('Bulk attendance creation error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create attendance records', code: 'DATABASE_ERROR', details: { insertError } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        session: {
          class_id,
          class_name: classData.name,
          session_date,
          records_created: created.length,
        },
        attendance: created,
        message: `Attendance recorded for ${created.length} students`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/attendance/session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
