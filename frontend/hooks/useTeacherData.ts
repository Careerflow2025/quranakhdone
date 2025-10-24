// Production hook to fetch real teacher data from Supabase
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useTeacherData() {
  const { user, initializeAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const initStarted = useRef(false);
  const fetchInProgress = useRef(false);
  const currentTeacherId = useRef<string | null>(null);

  // Teacher info
  const [teacherInfo, setTeacherInfo] = useState<any>(null);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    activeAssignments: 0,
    activeHomework: 0,
    activeTargets: 0,
    unreadMessages: 0,
    avgProgress: 0
  });

  // Data arrays
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Initialize auth on mount
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    const initAuth = async () => {
      try {
        await initializeAuth();
        setAuthInitialized(true);
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Fetch teacher data
  const fetchTeacherData = useCallback(async () => {
    if (!user?.userId) {
      setError('No user ID found');
      setIsLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (fetchInProgress.current || currentTeacherId.current === user.userId) {
      return;
    }

    fetchInProgress.current = true;
    currentTeacherId.current = user.userId;

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching teacher data for user:', user.userId);

      // Fetch teacher record
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user.userId)
        .single();

      if (teacherError) throw teacherError;

      if (!teacher) {
        throw new Error('Teacher record not found');
      }

      console.log('✅ Teacher record found:', teacher.id);

      setTeacherInfo({
        id: teacher.id,
        userId: teacher.user_id,
        name: user.fullName || 'Teacher',
        bio: teacher.bio || '',
        active: teacher.active,
        schoolId: user.schoolId
      });

      // Fetch teacher's classes through class_teachers junction table
      const { data: classTeachers, error: classTeachersError } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_id', teacher.id);

      if (classTeachersError) throw classTeachersError;

      const classIds = classTeachers?.map((ct: any) => ct.class_id) || [];
      console.log('📚 Teacher has', classIds.length, 'classes');

      let classesData: any[] = [];
      if (classIds.length > 0) {
        const { data: fetchedClasses, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .in('id', classIds);

        if (classesError) throw classesError;
        classesData = fetchedClasses || [];
      }

      setClasses(classesData);
      setStats(prev => ({ ...prev, totalClasses: classesData.length }));

      // Fetch students enrolled in teacher's classes
      let studentsData: any[] = [];
      if (classIds.length > 0) {
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('class_enrollments')
          .select('student_id')
          .in('class_id', classIds);

        if (enrollmentsError) throw enrollmentsError;

        const studentIds = [...new Set(enrollments?.map((e: any) => e.student_id) || [])];
        console.log('👥 Teacher has', studentIds.length, 'students');

        if (studentIds.length > 0) {
          const { data: studentsRaw, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .in('id', studentIds);

          if (studentsError) throw studentsError;

          // Get profiles for students
          const studentUserIds = studentsRaw?.map((s: any) => s.user_id) || [];
          const { data: studentProfiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, email')
            .in('user_id', studentUserIds);

          // Get class enrollment for each student
          const { data: studentEnrollments } = await supabase
            .from('class_enrollments')
            .select('student_id, class_id, classes(name)')
            .in('student_id', studentIds)
            .in('class_id', classIds);

          // Create enrollment lookup map
          const enrollmentMap: any = {};
          studentEnrollments?.forEach((enrollment: any) => {
            enrollmentMap[enrollment.student_id] = enrollment.classes?.name || null;
          });

          // Transform students data
          studentsData = studentsRaw?.map((student: any) => {
            const profile = studentProfiles?.find((p: any) => p.user_id === student.user_id);

            // Calculate age from date of birth if available
            let calculatedAge = null;
            if (student.dob && !student.age) {
              const today = new Date();
              const birthDate = new Date(student.dob);
              calculatedAge = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
              }
            }

            return {
              ...student,
              name: profile?.display_name || 'Unknown',
              email: profile?.email || '',
              age: student.age || calculatedAge,
              class: enrollmentMap[student.id] || null,
              status: student.active ? 'active' : 'inactive',
              progress: 0, // Will be calculated from assignments/homework
              attendance: 0 // Will be calculated from attendance records
            };
          }) || [];
        }
      }

      setStudents(studentsData);
      setStats(prev => ({ ...prev, totalStudents: studentsData.length }));

      // Fetch assignments created by this teacher
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('created_by_teacher_id', teacher.id)
        .eq('school_id', user.schoolId);

      if (!assignmentsError && assignmentsData) {
        setAssignments(assignmentsData);
        const activeAssignments = assignmentsData.filter((a: any) =>
          a.status !== 'completed' && a.status !== 'cancelled'
        );
        setStats(prev => ({ ...prev, activeAssignments: activeAssignments.length }));
      }

      // Fetch homework (we'll use assignments table for now as homework system)
      const { data: homeworkData } = await supabase
        .from('assignments')
        .select('*')
        .eq('created_by_teacher_id', teacher.id)
        .eq('school_id', user.schoolId)
        .eq('status', 'assigned');

      if (homeworkData) {
        setHomework(homeworkData);
        setStats(prev => ({ ...prev, activeHomework: homeworkData.length }));
      }

      // Fetch targets for teacher's students
      if (studentsData.length > 0) {
        const studentIds = studentsData.map((s: any) => s.id);
        const { data: targetsData } = await supabase
          .from('targets')
          .select('*')
          .in('student_id', studentIds)
          .eq('active', true);

        if (targetsData) {
          setTargets(targetsData);
          setStats(prev => ({ ...prev, activeTargets: targetsData.length }));
        }
      }

      // Fetch messages (unread from parents)
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', user.userId)
        .eq('read', false);

      if (messagesData) {
        setMessages(messagesData);
        setStats(prev => ({ ...prev, unreadMessages: messagesData.length }));
      }

      // Calculate average progress (placeholder for now)
      setStats(prev => ({ ...prev, avgProgress: 78 }));

      console.log('✅ Teacher data loaded successfully');

    } catch (err: any) {
      console.error('❌ Error fetching teacher data:', err);
      setError(err.message || 'Failed to load teacher data');
      currentTeacherId.current = null;
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [user?.userId, user?.schoolId, user?.fullName]);

  // Fetch teacher data when auth is initialized
  useEffect(() => {
    if (authInitialized && user?.userId) {
      fetchTeacherData();
    } else if (authInitialized && !user?.userId) {
      setError('No user ID found. Please login again.');
      setIsLoading(false);
    }
  }, [authInitialized, user?.userId, fetchTeacherData]);

  // Refresh data function
  const refreshData = async () => {
    currentTeacherId.current = null;
    await fetchTeacherData();
  };

  return {
    isLoading,
    error,
    teacherInfo,
    stats,
    students,
    classes,
    assignments,
    homework,
    targets,
    messages,
    refreshData,
    setStudents,
    setClasses,
    setAssignments,
    setHomework,
    setTargets,
    setMessages
  };
}
