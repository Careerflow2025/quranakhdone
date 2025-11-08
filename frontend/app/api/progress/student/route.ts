/**
 * Student Progress API Endpoint
 * GET /api/progress/student?student_id=... - Get comprehensive progress data for a student
 *
 * Created: 2025-11-08
 * Purpose: Fetch all progress metrics (targets, attendance, study time, achievements) for student dashboard
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// Type Definitions
// ============================================================================

interface TargetWithProgress {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  progress: number;
  due_date: string;
  start_date: string;
  milestones: {
    id: string;
    title: string;
    description: string;
    sequence_order: number;
    completed: boolean;
  }[];
}

interface AttendanceStats {
  total_sessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_percentage: number;
}

interface StudyTimeData {
  date: string;
  duration_minutes: number;
}

interface WeeklyStudyTime {
  week_start: string;
  total_minutes: number;
  daily_breakdown: StudyTimeData[];
}

interface ProgressResponse {
  success: boolean;
  data: {
    student_id: string;
    student_name: string;
    targets: TargetWithProgress[];
    attendance: AttendanceStats;
    study_time: {
      weekly: WeeklyStudyTime[];
      total_minutes_this_month: number;
      average_daily_minutes: number;
    };
    stats: {
      active_targets: number;
      completed_milestones: number;
      total_milestones: number;
      current_streak: number;
      total_study_hours: number;
    };
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function calculateStreak(practiceLogs: any[]): number {
  if (practiceLogs.length === 0) return 0;

  // Sort by date descending
  const sortedLogs = practiceLogs
    .map(log => new Date(log.start_time).toISOString().split('T')[0])
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Get unique dates
  const uniqueDates = [...new Set(sortedLogs)];

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let currentDate = new Date(today);

  for (const date of uniqueDates) {
    const logDate = currentDate.toISOString().split('T')[0];
    if (date === logDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// ============================================================================
// GET /api/progress/student - Get Student Progress Data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET /api/progress/student - Request received');

    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get authorization header and extract token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Missing authorization header',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 3. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Invalid token',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // 4. Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile error:', profileError);
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    console.log('✅ Profile found - role:', profile.role, 'school_id:', profile.school_id);

    // 5. Get student_id from query params
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    if (!studentId) {
      console.error('❌ No student_id provided');
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Missing required parameter: student_id',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching progress for student:', studentId);

    // 6. Get student info and verify school
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        user_id,
        profiles:user_id (
          school_id,
          display_name,
          email
        )
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      console.error('❌ Student not found:', studentError);
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Student not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 7. Check school isolation
    const studentSchoolId = (student as any).profiles?.school_id;
    if (studentSchoolId !== profile.school_id) {
      console.error('❌ School mismatch');
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Cannot access student from different school',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Fetch targets with milestones
    const { data: targetsData, error: targetsError } = await supabaseAdmin
      .from('target_students')
      .select(`
        target_id,
        progress,
        targets:target_id (
          id,
          title,
          description,
          category,
          status,
          due_date,
          start_date,
          target_milestones (
            id,
            title,
            description,
            sequence_order,
            completed
          )
        )
      `)
      .eq('student_id', studentId)
      .order('progress', { ascending: false });

    if (targetsError) {
      console.error('⚠️ Error fetching targets:', targetsError);
    }

    console.log('✅ Targets fetched:', targetsData?.length || 0);

    // 9. Fetch attendance records
    const { data: attendanceRecords, error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('session_date', { ascending: false });

    if (attendanceError) {
      console.error('⚠️ Error fetching attendance:', attendanceError);
    }

    console.log('✅ Attendance records fetched:', attendanceRecords?.length || 0);

    // 10. Fetch practice logs (study time)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: practiceLogs, error: practiceError } = await supabaseAdmin
      .from('practice_logs')
      .select('*')
      .eq('student_id', studentId)
      .gte('start_time', thirtyDaysAgo.toISOString())
      .order('start_time', { ascending: false });

    if (practiceError) {
      console.error('⚠️ Error fetching practice logs:', practiceError);
    }

    console.log('✅ Practice logs fetched:', practiceLogs?.length || 0);

    // 11. Process targets data
    const targets: TargetWithProgress[] = (targetsData || []).map((ts: any) => {
      const target = ts.targets;
      return {
        id: target.id,
        title: target.title,
        description: target.description || '',
        category: target.category || 'general',
        status: target.status || 'active',
        progress: ts.progress || 0,
        due_date: target.due_date || '',
        start_date: target.start_date || '',
        milestones: (target.target_milestones || [])
          .sort((a: any, b: any) => a.sequence_order - b.sequence_order)
          .map((m: any) => ({
            id: m.id,
            title: m.title,
            description: m.description || '',
            sequence_order: m.sequence_order,
            completed: m.completed || false,
          })),
      };
    });

    // 12. Calculate attendance stats
    const attendanceStats: AttendanceStats = {
      total_sessions: attendanceRecords?.length || 0,
      present: attendanceRecords?.filter((r: any) => r.status === 'present').length || 0,
      absent: attendanceRecords?.filter((r: any) => r.status === 'absent').length || 0,
      late: attendanceRecords?.filter((r: any) => r.status === 'late').length || 0,
      excused: attendanceRecords?.filter((r: any) => r.status === 'excused').length || 0,
      attendance_percentage: 0,
    };

    if (attendanceStats.total_sessions > 0) {
      attendanceStats.attendance_percentage = Math.round(
        ((attendanceStats.present + attendanceStats.late) / attendanceStats.total_sessions) * 100
      );
    }

    // 13. Process study time data
    const studyTimeByDate = new Map<string, number>();
    (practiceLogs || []).forEach((log: any) => {
      const date = new Date(log.start_time).toISOString().split('T')[0];
      const minutes = Math.round((log.duration_seconds || 0) / 60);
      studyTimeByDate.set(date, (studyTimeByDate.get(date) || 0) + minutes);
    });

    // Group by week
    const weeklyStudyMap = new Map<string, StudyTimeData[]>();
    studyTimeByDate.forEach((minutes, date) => {
      const weekStart = getWeekStart(new Date(date));
      if (!weeklyStudyMap.has(weekStart)) {
        weeklyStudyMap.set(weekStart, []);
      }
      weeklyStudyMap.get(weekStart)!.push({ date, duration_minutes: minutes });
    });

    const weeklyStudyTime: WeeklyStudyTime[] = Array.from(weeklyStudyMap.entries())
      .map(([week_start, daily_breakdown]) => ({
        week_start,
        total_minutes: daily_breakdown.reduce((sum, d) => sum + d.duration_minutes, 0),
        daily_breakdown: daily_breakdown.sort((a, b) => a.date.localeCompare(b.date)),
      }))
      .sort((a, b) => b.week_start.localeCompare(a.week_start))
      .slice(0, 4); // Last 4 weeks

    // Calculate monthly total
    const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const totalMinutesThisMonth = (practiceLogs || [])
      .filter((log: any) => log.start_time.startsWith(thisMonth))
      .reduce((sum: number, log: any) => sum + Math.round((log.duration_seconds || 0) / 60), 0);

    const daysInMonth = new Date().getDate();
    const averageDailyMinutes = daysInMonth > 0 ? Math.round(totalMinutesThisMonth / daysInMonth) : 0;

    // 14. Calculate statistics
    const totalMilestones = targets.reduce((sum, t) => sum + t.milestones.length, 0);
    const completedMilestones = targets.reduce(
      (sum, t) => sum + t.milestones.filter(m => m.completed).length,
      0
    );

    const currentStreak = calculateStreak(practiceLogs || []);
    const totalStudyMinutes = (practiceLogs || []).reduce(
      (sum: number, log: any) => sum + Math.round((log.duration_seconds || 0) / 60),
      0
    );

    // 15. Build response
    const responseData = {
      student_id: studentId,
      student_name: (student as any).profiles?.display_name || 'Unknown',
      targets,
      attendance: attendanceStats,
      study_time: {
        weekly: weeklyStudyTime,
        total_minutes_this_month: totalMinutesThisMonth,
        average_daily_minutes: averageDailyMinutes,
      },
      stats: {
        active_targets: targets.filter(t => t.status === 'active').length,
        completed_milestones: completedMilestones,
        total_milestones: totalMilestones,
        current_streak: currentStreak,
        total_study_hours: Math.round(totalStudyMinutes / 60),
      },
    };

    console.log('✅ Response data prepared:', {
      student: responseData.student_name,
      targets: responseData.targets.length,
      attendance_percentage: responseData.attendance.attendance_percentage,
      total_study_hours: responseData.stats.total_study_hours,
    });

    // 16. Return success response
    return NextResponse.json<ProgressResponse>(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/progress/student:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: { error: String(error) },
      },
      { status: 500 }
    );
  }
}
