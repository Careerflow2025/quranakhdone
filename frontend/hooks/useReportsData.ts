// Hook to fetch comprehensive reports data with date filtering
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export interface ReportData {
  // Overview metrics
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;

  // Assignment metrics
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  overdueAssignments: number;

  // Homework metrics
  totalHomework: number;
  submittedHomework: number;

  // Performance metrics
  averageCompletionRate: number;
  averageGrade: number;

  // Attendance metrics
  totalAttendanceRecords: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;

  // Activity metrics
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;

  // Time-based data for charts
  assignmentsTrend: any[];
  attendanceTrend: any[];
  performanceTrend: any[];

  // Detailed breakdowns
  classwiseData: any[];
  teacherPerformance: any[];
  studentProgress: any[];
}

export function useReportsData(startDate?: Date, endDate?: Date) {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchInProgress = useRef(false);
  const lastFetchParams = useRef<string | null>(null);
  const [reportData, setReportData] = useState<ReportData>({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalClasses: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    overdueAssignments: 0,
    totalHomework: 0,
    submittedHomework: 0,
    averageCompletionRate: 0,
    averageGrade: 0,
    totalAttendanceRecords: 0,
    presentCount: 0,
    absentCount: 0,
    attendanceRate: 0,
    dailyActiveUsers: 0,
    weeklyActiveUsers: 0,
    monthlyActiveUsers: 0,
    assignmentsTrend: [],
    attendanceTrend: [],
    performanceTrend: [],
    classwiseData: [],
    teacherPerformance: [],
    studentProgress: []
  });

  // Convert dates to timestamps for stable comparison
  const startTimestamp = startDate?.getTime() || null;
  const endTimestamp = endDate?.getTime() || null;

  const fetchReportData = useCallback(async () => {
    console.log('🚀 [REPORTS] fetchReportData CALLED');
    console.log('👤 [REPORTS] user.schoolId:', user?.schoolId);
    console.log('📅 [REPORTS] Date range:', { startTimestamp, endTimestamp });
    console.log('🔄 [REPORTS] fetchInProgress:', fetchInProgress.current);
    console.log('💾 [REPORTS] lastFetchParams:', lastFetchParams.current);

    if (!user?.schoolId) {
      console.log('❌ [REPORTS] EARLY RETURN: No schoolId');
      return;
    }

    // Create cache key from school ID and timestamps
    const cacheKey = `${user.schoolId}_${startTimestamp}_${endTimestamp}`;
    console.log('🔑 [REPORTS] Cache key:', cacheKey);

    // Prevent concurrent fetches and re-fetching same data
    if (fetchInProgress.current || lastFetchParams.current === cacheKey) {
      console.log('❌ [REPORTS] EARLY RETURN: Already fetched or in progress');
      console.log('   - fetchInProgress:', fetchInProgress.current);
      console.log('   - Cache match:', lastFetchParams.current === cacheKey);
      return;
    }

    console.log('✅ [REPORTS] Proceeding with data fetch...');

    fetchInProgress.current = true;
    lastFetchParams.current = cacheKey;

    try {
      setIsLoading(true);
      setError(null);

      // Build date filter
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };
      }

      // Fetch basic counts
      const [
        { count: studentsCount },
        { count: teachersCount },
        { count: parentsCount },
        { count: classesCount }
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', user.schoolId!),
        supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('school_id', user.schoolId!),
        supabase.from('parents').select('*', { count: 'exact', head: true }).eq('school_id', user.schoolId!),
        supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', user.schoolId!)
      ]);

      // Fetch assignments data with date filter
      let assignmentsQuery = supabase
        .from('assignments')
        .select('*')
        .eq('school_id', user.schoolId!);

      if (startDate && endDate) {
        assignmentsQuery = assignmentsQuery
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { data: assignments } = await assignmentsQuery;

      // Calculate assignment metrics
      const totalAssignments = assignments?.length || 0;
      const completedAssignments = assignments?.filter((a: any) => a.status === 'completed').length || 0;
      const pendingAssignments = assignments?.filter((a: any) => ['assigned', 'viewed', 'submitted'].includes(a.status)).length || 0;
      const overdueAssignments = assignments?.filter((a: any) => a.late === true).length || 0;

      // FIX #4: Fetch attendance data - attendance table doesn't have school_id column
      // Filter through class relationship via RLS policies
      let attendanceQuery = supabase
        .from('attendance')
        .select('*');
        // RLS policies will automatically scope to user's school

      if (startDate && endDate) {
        attendanceQuery = attendanceQuery
          .gte('session_date', startDate.toISOString().split('T')[0])
          .lte('session_date', endDate.toISOString().split('T')[0]);
      }

      const { data: attendance } = await attendanceQuery;

      const totalAttendanceRecords = attendance?.length || 0;
      const presentCount = attendance?.filter((a: any) => a.status === 'present').length || 0;
      const absentCount = attendance?.filter((a: any) => a.status === 'absent').length || 0;
      const attendanceRate = totalAttendanceRecords > 0
        ? Math.round((presentCount / totalAttendanceRecords) * 100)
        : 0;

      // Calculate completion rate
      const averageCompletionRate = totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0;

      // FIX #5: Fetch grades data - grades table doesn't have school_id column
      // It inherits school scope through assignment_id relationship
      // RLS policies handle the filtering
      const { data: grades } = await supabase
        .from('grades')
        .select('score, max_score');
        // RLS policies will automatically scope to user's school through assignments

      const averageGrade = grades && grades.length > 0
        ? Math.round(
            grades.reduce((acc: number, g: any) => acc + (g.score / g.max_score) * 100, 0) / grades.length
          )
        : 0;

      // Fetch trend data for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      // Assignments trend
      console.log('📊 Fetching assignment trends for last 7 days:', last7Days);
      console.log('🏫 School ID:', user.schoolId);
      const assignmentsTrend = await Promise.all(
        last7Days.map(async (date) => {
          const { count, error } = await supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', user.schoolId!)
            .gte('created_at', `${date}T00:00:00`)
            .lte('created_at', `${date}T23:59:59`);

          if (error) {
            console.error(`❌ Error fetching assignments for ${date}:`, error);
          } else {
            console.log(`✅ ${date}: ${count} assignments`);
          }

          return { date, count: count || 0 };
        })
      );
      console.log('📈 Assignment trend data:', assignmentsTrend);

      // Attendance trend - RLS scoped, no school_id filter
      console.log('📊 Fetching attendance trends for last 7 days:', last7Days);
      const attendanceTrend = await Promise.all(
        last7Days.map(async (date) => {
          const { data, error } = await supabase
            .from('attendance')
            .select('status')
            .eq('session_date', date);
            // RLS policies filter by school automatically

          if (error) {
            console.error(`❌ Error fetching attendance for ${date}:`, error);
          } else {
            console.log(`✅ ${date}: ${data?.length || 0} attendance records`);
          }

          const present = data?.filter((a: any) => a.status === 'present').length || 0;
          const total = data?.length || 0;
          const rate = total > 0 ? Math.round((present / total) * 100) : 0;

          console.log(`  Present: ${present}/${total} = ${rate}%`);
          return { date, rate };
        })
      );
      console.log('📈 Attendance trend data:', attendanceTrend);

      // Class-wise breakdown
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', user.schoolId!);

      const classwiseData = await Promise.all(
        (classes || []).map(async (cls: any) => {
          // Get student count for this class
          const { count: studentCount } = await supabase
            .from('class_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);

          // Get student IDs enrolled in this class
          const { data: enrollments } = await supabase
            .from('class_enrollments')
            .select('student_id')
            .eq('class_id', cls.id);

          const studentIds = enrollments?.map((e: any) => e.student_id) || [];

          // Count assignments for students in this class
          let assignmentCount = 0;
          if (studentIds.length > 0) {
            const { count } = await supabase
              .from('assignments')
              .select('*', { count: 'exact', head: true })
              .in('student_id', studentIds);
            assignmentCount = count || 0;
          }

          return {
            className: cls.name,
            students: studentCount || 0,
            assignments: assignmentCount
          };
        })
      );

      // Teacher performance
      const { data: teachers } = await supabase
        .from('teachers')
        .select('id, profiles(display_name)')
        .eq('school_id', user.schoolId!);

      const teacherPerformance = await Promise.all(
        (teachers || []).map(async (teacher: any) => {
          // Get actual class count for this teacher
          const { count: classCount } = await supabase
            .from('class_teachers')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', teacher.id);

          // Get assignment count
          const { count: assignmentCount } = await supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .eq('created_by_teacher_id', teacher.id);

          // Get assignment completion data
          const { data: assignments } = await supabase
            .from('assignments')
            .select('status')
            .eq('created_by_teacher_id', teacher.id);

          const completed = assignments?.filter((a: any) => a.status === 'completed').length || 0;
          const total = assignments?.length || 0;
          const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            id: teacher.id,
            name: teacher.profiles?.display_name || 'Unknown',
            class_count: classCount || 0,  // REAL class count
            assignmentsCreated: assignmentCount || 0,
            completionRate,
            // NO FAKE DATA - only real metrics
            response_time: null,  // Will be calculated when we have real response data
            rating: null  // NO FAKE STARS - will add when we have real ratings
          };
        })
      );

      setReportData({
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        totalParents: parentsCount || 0,
        totalClasses: classesCount || 0,
        totalAssignments,
        completedAssignments,
        pendingAssignments,
        overdueAssignments,
        totalHomework: 0, // Will be populated when homework system is ready
        submittedHomework: 0,
        averageCompletionRate,
        averageGrade,
        totalAttendanceRecords,
        presentCount,
        absentCount,
        attendanceRate,
        dailyActiveUsers: 0, // Will need activity tracking
        weeklyActiveUsers: 0,
        monthlyActiveUsers: 0,
        assignmentsTrend,
        attendanceTrend,
        performanceTrend: [], // Will be populated with grade trends
        classwiseData,
        teacherPerformance,
        studentProgress: [] // Will be populated with student-wise progress
      });

    } catch (err: any) {
      console.error('Error fetching report data:', err);
      setError(err.message || 'Failed to load report data');
      lastFetchParams.current = null; // Reset on error to allow retry
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [user?.schoolId, startTimestamp, endTimestamp]); // Use timestamps for stable comparison

  useEffect(() => {
    if (user?.schoolId) {
      fetchReportData();
    }
  }, [user?.schoolId, fetchReportData]);

  const refreshData = useCallback(async () => {
    lastFetchParams.current = null; // Reset cache to force re-fetch
    await fetchReportData();
  }, [fetchReportData]);

  return {
    isLoading,
    error,
    reportData,
    refreshData
  };
}
