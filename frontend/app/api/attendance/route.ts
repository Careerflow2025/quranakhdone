/**
 * Attendance API Endpoint
 * 
 * Operations:
 * - GET /api/attendance - List attendance records with filters
 * - POST /api/attendance - Mark attendance (bulk)
 * 
 * Authentication: Cookie-based (createClient)
 * Authorization: Teachers can mark for their classes, all users can view their relevant data
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

interface AttendanceWithDetails extends AttendanceRecord {
  class_name: string;
  student_name: string;
  student_email: string;
}

interface AttendanceStats {
  total_records: number;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
}

interface ListAttendanceResponse {
  success: true;
  data: {
    records: AttendanceWithDetails[];
    stats: AttendanceStats;
    pagination: {
      page: number;
      total_pages: number;
      total: number;
      limit: number;
    };
  };
}

interface MarkAttendanceRequest {
  class_id: string;
  session_date: string; // YYYY-MM-DD format
  records: Array<{
    student_id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }>;
}

interface MarkAttendanceResponse {
  success: true;
  data: {
    marked_count: number;
    records: AttendanceRecord[];
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// GET /api/attendance - List Attendance Records with Filters
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const class_id = searchParams.get('class_id');
    const student_id = searchParams.get('student_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Validation
    if (!class_id && !student_id) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Either class_id or student_id is required', code: 'MISSING_FILTER' },
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

    // Get user profile with school_id and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, school_id, role, display_name, email')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Profile not found', code: 'PROFILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build query with school isolation
    let query = supabase
      .from('attendance')
      .select('*', { count: 'exact' });

    // Apply filters based on user role
    if (class_id) {
      // Verify class belongs to user's school
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

      query = query.eq('class_id', class_id);
    }

    if (student_id) {
      // Verify student belongs to user's school
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, user_id')
        .eq('id', student_id)
        .single();

      if (studentError || !studentData) {
        return NextResponse.json<ErrorResponse>(
          { success: false, error: 'Student not found', code: 'STUDENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Verify student's profile is in same school
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('user_id', studentData.user_id)
        .single();

      if (studentProfile?.school_id !== profile.school_id) {
        return NextResponse.json<ErrorResponse>(
          { success: false, error: 'Cannot access student from different school', code: 'SCHOOL_MISMATCH' },
          { status: 403 }
        );
      }

      query = query.eq('student_id', student_id);
    }

    // Date range filters
    if (start_date) {
      query = query.gte('session_date', start_date);
    }
    if (end_date) {
      query = query.lte('session_date', end_date);
    }

    // Status filter
    if (status && ['present', 'absent', 'late', 'excused'].includes(status)) {
      query = query.eq('status', status);
    }

    // Execute query with pagination
    const { data: records, error: recordsError, count } = await query
      .order('session_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (recordsError) {
      console.error('Error fetching attendance records:', recordsError);
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Failed to fetch attendance records', code: 'FETCH_ERROR' },
        { status: 500 }
      );
    }

    // Populate class and student names
    const populatedRecords = await Promise.all(
      (records || []).map(async (record) => {
        // Get class name
        const { data: classData } = await supabase
          .from('classes')
          .select('name')
          .eq('id', record.class_id)
          .single();

        // Get student name and email
        const { data: studentData } = await supabase
          .from('students')
          .select('user_id')
          .eq('id', record.student_id)
          .single();

        let student_name = 'Unknown';
        let student_email = '';

        if (studentData) {
          const { data: studentProfile } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('user_id', studentData.user_id)
            .single();

          if (studentProfile) {
            student_name = studentProfile.display_name || 'Unknown';
            student_email = studentProfile.email || '';
          }
        }

        return {
          ...record,
          class_name: classData?.name || 'Unknown',
          student_name,
          student_email,
        };
      })
    );

    // Calculate statistics
    let stats: AttendanceStats;
    if (records && records.length > 0) {
      const totalRecords = count || 0;
      
      // Count unique session dates
      const uniqueSessions = new Set(records.map((r) => r.session_date));
      const total_sessions = uniqueSessions.size;

      // Count by status
      const present_count = records.filter((r) => r.status === 'present').length;
      const absent_count = records.filter((r) => r.status === 'absent').length;
      const late_count = records.filter((r) => r.status === 'late').length;
      const excused_count = records.filter((r) => r.status === 'excused').length;

      stats = {
        total_records: totalRecords,
        total_sessions,
        present_count,
        absent_count,
        late_count,
        excused_count,
      };
    } else {
      stats = {
        total_records: 0,
        total_sessions: 0,
        present_count: 0,
        absent_count: 0,
        late_count: 0,
        excused_count: 0,
      };
    }

    // Calculate pagination
    const total_pages = Math.ceil((count || 0) / limit);

    return NextResponse.json<ListAttendanceResponse>({
      success: true,
      data: {
        records: populatedRecords,
        stats,
        pagination: {
          page,
          total_pages,
          total: count || 0,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/attendance:', error);
    return NextResponse.json<ErrorResponse>(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/attendance - Mark Attendance (Bulk)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: MarkAttendanceRequest = await request.json();
    const { class_id, session_date, records } = body;

    // Validation
    if (!class_id || !session_date || !records || records.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'class_id, session_date, and records are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(session_date)) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD', code: 'INVALID_DATE_FORMAT' },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    for (const record of records) {
      if (!validStatuses.includes(record.status)) {
        return NextResponse.json<ErrorResponse>(
          { success: false, error: `Invalid status: ${record.status}`, code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
    }

    // ✅ CORRECT - Cookie-based authentication
    const supabase = createClient();

    // DEBUG: Log authentication attempt
    console.log('[POST /api/attendance] Attempting auth.getUser()...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[POST /api/attendance] Auth result:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    });

    if (authError || !user) {
      console.error('[POST /api/attendance] UNAUTHORIZED:', authError?.message);
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

    // Verify teacher teaches this class (teachers only)
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
        .eq('class_id', class_id)
        .eq('teacher_id', teacherData.id)
        .single();

      if (!classTeacher) {
        return NextResponse.json<ErrorResponse>(
          { success: false, error: 'You do not teach this class', code: 'ACCESS_DENIED' },
          { status: 403 }
        );
      }
    } else if (profile.role !== 'owner' && profile.role !== 'admin') {
      // Only teachers, owners, and admins can mark attendance
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Only teachers and administrators can mark attendance', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      );
    }

    // Verify all students are enrolled in the class
    for (const record of records) {
      const { data: enrollment } = await supabase
        .from('class_enrollments')
        .select('student_id')
        .eq('class_id', class_id)
        .eq('student_id', record.student_id)
        .single();

      if (!enrollment) {
        return NextResponse.json<ErrorResponse>(
          { success: false, error: `Student ${record.student_id} is not enrolled in this class`, code: 'STUDENT_NOT_ENROLLED' },
          { status: 400 }
        );
      }
    }

    // Upsert attendance records (update if exists for same date, insert if new)
    const attendanceData = records.map((record) => ({
      class_id,
      session_date,
      student_id: record.student_id,
      status: record.status,
      notes: record.notes || null,
    }));

    // Check if records already exist and delete them (for upsert behavior)
    for (const record of records) {
      await supabase
        .from('attendance')
        .delete()
        .eq('class_id', class_id)
        .eq('session_date', session_date)
        .eq('student_id', record.student_id);
    }

    // Insert new records
    const { data: newRecords, error: insertError } = await supabase
      .from('attendance')
      .insert(attendanceData)
      .select();

    if (insertError) {
      console.error('Error marking attendance:', insertError);
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Failed to mark attendance', code: 'INSERT_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json<MarkAttendanceResponse>({
      success: true,
      data: {
        marked_count: newRecords?.length || 0,
        records: newRecords || [],
      },
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/attendance:', error);
    return NextResponse.json<ErrorResponse>(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
