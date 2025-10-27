/**
 * Class Attendance Report API
 * GET /api/attendance/class/[id] - Get class attendance report and statistics
 *
 * Created: 2025-10-22
 * Authentication: Cookie-based (createClient)
 * Authorization: Teachers can view their classes
 * School Isolation: Enforced via class.school_id
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// ============================================================================
// GET /api/attendance/class/[id] - Class Attendance Report
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
    const session_date = searchParams.get('session_date'); // For single session

    // Verify class belongs to same school
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, school_id, name, grade, room, capacity')
      .eq('id', params.id)
      .single();

    if (classError || !classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (classData.school_id !== profile.school_id) {
      return NextResponse.json(
        { success: false, error: 'Cannot access class from different school', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get class enrollment count
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('class_enrollments')
      .select('student_id')
      .eq('class_id', params.id);

    const total_students = enrollments?.length || 0;

    // Build query for attendance records
    let query = supabase
      .from('attendance')
      .select(
        `
        *,
        student:students!student_id (
          id,
          user_id,
          profiles:user_id (
            display_name,
            email
          )
        )
      `
      )
      .eq('class_id', params.id);

    if (session_date) {
      query = query.eq('session_date', session_date);
    } else {
      if (start_date) {
        query = query.gte('session_date', start_date);
      }
      if (end_date) {
        query = query.lte('session_date', end_date);
      }
    }

    query = query.order('session_date', { ascending: false });
    query = query.order('created_at', { ascending: false });

    const { data: records, error: recordsError } = await query;

    if (recordsError) {
      console.error('Class attendance query error:', recordsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch attendance records', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Calculate overall statistics
    const total_records = records?.length || 0;
    const present = records?.filter(r => r.status === 'present').length || 0;
    const absent = records?.filter(r => r.status === 'absent').length || 0;
    const late = records?.filter(r => r.status === 'late').length || 0;
    const excused = records?.filter(r => r.status === 'excused').length || 0;

    const attendance_rate = total_records > 0 ? Math.round((present / total_records) * 100) : 0;
    const punctuality_rate = total_records > 0 ? Math.round(((present + excused) / total_records) * 100) : 0;

    // Group by session date
    const sessionMap = new Map<string, any>();
    (records || []).forEach((record: any) => {
      const date = record.session_date;
      if (!sessionMap.has(date)) {
        sessionMap.set(date, {
          session_date: date,
          students: [],
          summary: {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
          },
        });
      }

      const session = sessionMap.get(date);
      session.students.push({
        student_id: record.student_id,
        student_name: record.student?.profiles?.display_name || 'Unknown',
        status: record.status,
        notes: record.notes,
        created_at: record.created_at,
      });

      session.summary.total++;
      session.summary[record.status]++;
    });

    const sessions = Array.from(sessionMap.values()).sort(
      (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    );

    // Transform all records
    const attendanceRecords = (records || []).map((record: any) => ({
      ...record,
      student: {
        id: record.student?.id,
        display_name: record.student?.profiles?.display_name || 'Unknown',
        email: record.student?.profiles?.email || '',
      },
    }));

    return NextResponse.json(
      {
        success: true,
        class: {
          id: classData.id,
          name: classData.name,
          grade: classData.grade,
          room: classData.room,
          capacity: classData.capacity,
          total_students,
        },
        overall_statistics: {
          total_records,
          present,
          absent,
          late,
          excused,
          attendance_rate,
          punctuality_rate,
        },
        sessions,
        all_records: attendanceRecords,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/attendance/class/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
