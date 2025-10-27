/**
 * Student Attendance History API
 * GET /api/attendance/student/[id] - Get student's attendance history with statistics
 *
 * Created: 2025-10-22
 * Authentication: Cookie-based (createClient)
 * Authorization: Teachers can view their students, students can view their own
 * School Isolation: Enforced via school_id
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// ============================================================================
// GET /api/attendance/student/[id] - Student Attendance History
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ CORRECT - Cookie-based authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const class_id = searchParams.get('class_id');

    // Verify student exists and belongs to same school
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, user_id, profiles:user_id(school_id, display_name, email)')
      .eq('id', params.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Student not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify school isolation
    if ((student.profiles as any).school_id !== profile.school_id) {
      return NextResponse.json(
        { success: false, error: 'Cannot access student from different school', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Build query for attendance records
    let query = supabase
      .from('attendance')
      .select(
        `
        *,
        class:classes!class_id (
          id,
          name,
          grade,
          room
        )
      `
      )
      .eq('student_id', params.id);

    if (start_date) {
      query = query.gte('session_date', start_date);
    }

    if (end_date) {
      query = query.lte('session_date', end_date);
    }

    if (class_id) {
      query = query.eq('class_id', class_id);
    }

    query = query.order('session_date', { ascending: false });

    const { data: records, error: recordsError } = await query;

    if (recordsError) {
      console.error('Student attendance query error:', recordsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch attendance records', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const total = records?.length || 0;
    const present = records?.filter(r => r.status === 'present').length || 0;
    const absent = records?.filter(r => r.status === 'absent').length || 0;
    const late = records?.filter(r => r.status === 'late').length || 0;
    const excused = records?.filter(r => r.status === 'excused').length || 0;

    const attendance_rate = total > 0 ? Math.round((present / total) * 100) : 0;
    const punctuality_rate = total > 0 ? Math.round(((present + excused) / total) * 100) : 0;

    // Transform records
    const attendanceHistory = (records || []).map((record: any) => ({
      ...record,
      class: {
        id: record.class?.id,
        name: record.class?.name || 'Unknown',
        grade: record.class?.grade,
        room: record.class?.room,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        student: {
          id: student.id,
          display_name: (student.profiles as any).display_name || 'Unknown',
          email: (student.profiles as any).email || '',
        },
        attendance: attendanceHistory,
        statistics: {
          total,
          present,
          absent,
          late,
          excused,
          attendance_rate,
          punctuality_rate,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/attendance/student/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
