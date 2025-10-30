/**
 * Attendance Summary API Endpoint
 * 
 * Operations:
 * - GET /api/attendance/summary - Get attendance summary/reports for class
 * 
 * Authentication: Cookie-based (createClient)
 * Authorization: Teachers can view summaries for their classes
 * School Isolation: Enforced via class.school_id
 */

import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface StudentAttendanceSummary {
  student_id: string;
  student_name: string;
  student_email: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total_sessions: number;
  attendance_rate: number; // percentage (0-100)
  trend: 'improving' | 'declining' | 'stable';
}

interface AttendanceSummary {
  class_id: string;
  class_name: string;
  period: string;
  start_date: string;
  end_date: string;
  total_sessions: number;
  total_students: number;
  students: StudentAttendanceSummary[];
  overall_stats: {
    total_records: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    average_attendance_rate: number;
  };
}

interface SummaryResponse {
  success: true;
  data: {
    summary: AttendanceSummary;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// GET /api/attendance/summary - Get Attendance Summary
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const class_id = searchParams.get('class_id');
    const student_id = searchParams.get('student_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const month = searchParams.get('month'); // YYYY-MM format

    // Validation - class_id is required
    if (!class_id) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'class_id is required', code: 'MISSING_CLASS_ID' },
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

    // Verify class exists and belongs to school
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, school_id, name')
      .eq('id', class_id)
      .eq('school_id', profile.school_id)
      .single();

    if (classError || !classData) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Class not found or access denied', code: 'CLASS_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify teacher has access to this class if they're a teacher
    if (profile.role === 'teacher') {
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherData) {
        const { data: classTeacher } = await supabase
          .from('class_teachers')
          .select('teacher_id')
          .eq('class_id', class_id)
          .eq('teacher_id', teacherData.id)
          .single();

        if (!classTeacher) {
          return NextResponse.json<ErrorResponse>(
            { success: false, error: 'You do not teach this class', code: 'ACCESS_DENIED' },
            { status: 403 }
          );
        }
      }
    }

    // Determine date range
    let queryStartDate: string;
    let queryEndDate: string;

    if (month) {
      // Month format: YYYY-MM
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        return NextResponse.json<ErrorResponse>(
          { success: false, error: 'Invalid month format. Use YYYY-MM', code: 'INVALID_MONTH_FORMAT' },
          { status: 400 }
        );
      }

      const [year, monthNum] = month.split('-');
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      queryStartDate = `${month}-01`;
      queryEndDate = `${month}-${lastDay.toString().padStart(2, '0')}`;
    } else {
      queryStartDate = start_date || '1970-01-01';
      queryEndDate = end_date || new Date().toISOString().split('T')[0];
    }

    // Build attendance query
    let attendanceQuery = supabase
      .from('attendance')
      .select('*')
      .eq('class_id', class_id)
      .gte('session_date', queryStartDate)
      .lte('session_date', queryEndDate);

    // If student_id provided, filter for individual student
    if (student_id) {
      attendanceQuery = attendanceQuery.eq('student_id', student_id);
    }

    const { data: attendanceRecords, error: attendanceError } = await attendanceQuery;

    if (attendanceError) {
      console.error('Error fetching attendance records:', attendanceError);
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Failed to fetch attendance records', code: 'FETCH_ERROR' },
        { status: 500 }
      );
    }

    // Get all students enrolled in the class
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('class_enrollments')
      .select('student_id')
      .eq('class_id', class_id);

    if (enrollmentError) {
      console.error('Error fetching class enrollments:', enrollmentError);
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Failed to fetch class enrollments', code: 'ENROLLMENT_ERROR' },
        { status: 500 }
      );
    }

    // Get unique session dates
    const uniqueSessions = new Set((attendanceRecords || []).map((r) => r.session_date));
    const total_sessions = uniqueSessions.size;

    // Calculate per-student summaries
    const studentSummaries: StudentAttendanceSummary[] = [];
    const studentIds = student_id ? [student_id] : (enrollments || []).map((e) => e.student_id);

    for (const sid of studentIds) {
      // Get student profile
      const { data: studentData } = await supabase
        .from('students')
        .select('id, user_id')
        .eq('id', sid)
        .single();

      if (!studentData) continue;

      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('user_id', studentData.user_id)
        .single();

      const student_name = studentProfile?.display_name || 'Unknown';
      const student_email = studentProfile?.email || '';

      // Filter records for this student
      const studentRecords = (attendanceRecords || []).filter((r) => r.student_id === sid);

      // Count by status
      const present = studentRecords.filter((r) => r.status === 'present').length;
      const absent = studentRecords.filter((r) => r.status === 'absent').length;
      const late = studentRecords.filter((r) => r.status === 'late').length;
      const excused = studentRecords.filter((r) => r.status === 'excused').length;

      // Calculate attendance rate (present + late as attended)
      const attended = present + late;
      const total_possible = total_sessions;
      const attendance_rate = total_possible > 0 ? (attended / total_possible) * 100 : 0;

      // Determine trend (simplified - comparing first half to second half)
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (studentRecords.length >= 4) {
        const midpoint = Math.floor(studentRecords.length / 2);
        const sortedRecords = studentRecords.sort((a, b) => 
          new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
        );
        
        const firstHalf = sortedRecords.slice(0, midpoint);
        const secondHalf = sortedRecords.slice(midpoint);

        const firstHalfAttended = firstHalf.filter((r) => 
          r.status === 'present' || r.status === 'late'
        ).length;
        const secondHalfAttended = secondHalf.filter((r) => 
          r.status === 'present' || r.status === 'late'
        ).length;

        const firstHalfRate = firstHalf.length > 0 ? firstHalfAttended / firstHalf.length : 0;
        const secondHalfRate = secondHalf.length > 0 ? secondHalfAttended / secondHalf.length : 0;

        if (secondHalfRate > firstHalfRate + 0.1) {
          trend = 'improving';
        } else if (secondHalfRate < firstHalfRate - 0.1) {
          trend = 'declining';
        }
      }

      studentSummaries.push({
        student_id: sid,
        student_name,
        student_email,
        present,
        absent,
        late,
        excused,
        total_sessions: total_possible,
        attendance_rate: Math.round(attendance_rate * 100) / 100, // round to 2 decimals
        trend,
      });
    }

    // Calculate overall stats
    const total_records = (attendanceRecords || []).length;
    const present_count = (attendanceRecords || []).filter((r) => r.status === 'present').length;
    const absent_count = (attendanceRecords || []).filter((r) => r.status === 'absent').length;
    const late_count = (attendanceRecords || []).filter((r) => r.status === 'late').length;
    const excused_count = (attendanceRecords || []).filter((r) => r.status === 'excused').length;

    const average_attendance_rate = studentSummaries.length > 0
      ? studentSummaries.reduce((sum, s) => sum + s.attendance_rate, 0) / studentSummaries.length
      : 0;

    const summary: AttendanceSummary = {
      class_id,
      class_name: classData.name,
      period: month || `${queryStartDate} to ${queryEndDate}`,
      start_date: queryStartDate,
      end_date: queryEndDate,
      total_sessions,
      total_students: studentSummaries.length,
      students: studentSummaries,
      overall_stats: {
        total_records,
        present_count,
        absent_count,
        late_count,
        excused_count,
        average_attendance_rate: Math.round(average_attendance_rate * 100) / 100,
      },
    };

    return NextResponse.json<SummaryResponse>({
      success: true,
      data: {
        summary,
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/attendance/summary:', error);
    return NextResponse.json<ErrorResponse>(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
