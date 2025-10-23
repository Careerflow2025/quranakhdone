/**
 * Attendance Record API Endpoint
 * 
 * Operations:
 * - PATCH /api/attendance/:id - Update individual attendance record
 * 
 * Authentication: Cookie-based (createClient)
 * Authorization: Teachers can update records for their classes
 * School Isolation: Enforced via class.school_id
 */

import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface AttendanceRecord {
  id: string;
  class_id: string;
  session_date: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string | null;
  created_at: string;
}

interface UpdateAttendanceRequest {
  status?: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

interface UpdateAttendanceResponse {
  success: true;
  data: {
    record: AttendanceRecord;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// PATCH /api/attendance/:id - Update Attendance Record
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attendanceId = params.id;
    const body: UpdateAttendanceRequest = await request.json();
    const { status, notes } = body;

    // Validation - at least one field must be provided
    if (!status && notes === undefined) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'At least one field (status or notes) must be provided', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !['present', 'absent', 'late', 'excused'].includes(status)) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: `Invalid status: ${status}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // ✅ CORRECT - Cookie-based authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Profile not found', code: 'PROFILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get the attendance record
    const { data: attendanceRecord, error: recordError } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', attendanceId)
      .single();

    if (recordError || !attendanceRecord) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Attendance record not found', code: 'RECORD_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify class belongs to user's school
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, school_id, name')
      .eq('id', attendanceRecord.class_id)
      .eq('school_id', profile.school_id)
      .single();

    if (classError || !classData) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Class not found or access denied', code: 'CLASS_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Authorization check - verify teacher teaches this class
    if (profile.role === 'teacher') {
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacherData) {
        return NextResponse.json<ErrorResponse>(
          { success: false, error: 'Teacher profile not found', code: 'TEACHER_NOT_FOUND' },
          { status: 404 }
        );
      }

      const { data: classTeacher } = await supabase
        .from('class_teachers')
        .select('teacher_id')
        .eq('class_id', attendanceRecord.class_id)
        .eq('teacher_id', teacherData.id)
        .single();

      if (!classTeacher) {
        return NextResponse.json<ErrorResponse>(
          { success: false, error: 'You do not teach this class', code: 'ACCESS_DENIED' },
          { status: 403 }
        );
      }
    } else if (profile.role !== 'owner' && profile.role !== 'admin') {
      // Only teachers, owners, and admins can update attendance
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Only teachers and administrators can update attendance', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Partial<AttendanceRecord> = {};
    if (status) {
      updateData.status = status;
    }
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    // Update the record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('attendance')
      .update(updateData)
      .eq('id', attendanceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating attendance record:', updateError);
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Failed to update attendance record', code: 'UPDATE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json<UpdateAttendanceResponse>({
      success: true,
      data: {
        record: updatedRecord,
      },
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/attendance/:id:', error);
    return NextResponse.json<ErrorResponse>(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
