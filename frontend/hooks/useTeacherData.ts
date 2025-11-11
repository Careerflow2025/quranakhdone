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
    totalAssignments: 0,
    totalHomework: 0,
    totalTargets: 0,
    unreadMessages: 0,
    avgProgress: 0
  });

  // Data arrays
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  // homework removed - now fetched via useHomework hook in TeacherDashboard
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
    if (!user?.id) {
      setError('No user ID found');
      setIsLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (fetchInProgress.current || currentTeacherId.current === user.id) {
      return;
    }

    fetchInProgress.current = true;
    currentTeacherId.current = user.id;

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching teacher data for user:', user.id);

      // Fetch teacher record
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw teacherError;

      if (!teacher) {
        throw new Error('Teacher record not found');
      }

      console.log('✅ Teacher record found:', teacher.id);

      // Fetch school information including logo
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id, name, logo_url')
        .eq('id', user.schoolId)
        .single();

      if (schoolError) console.warn('Could not fetch school info:', schoolError);

      setTeacherInfo({
        id: teacher.id,
        userId: teacher.user_id,
        name: user.fullName || 'Teacher',
        bio: teacher.bio || '',
        active: teacher.active,
        schoolId: user.schoolId,
        school: school || null
      });

      // Fetch teacher's classes through class_teachers junction table with complete details
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

        // Enhance each class with teacher and student details
        if (fetchedClasses) {
          classesData = await Promise.all(fetchedClasses.map(async (cls: any) => {
            console.log(`🔍 Enhancing class: ${cls.name} (${cls.id})`);

            // Get all teachers for this class
            const { data: classTeacherRelations, error: teacherError } = await supabase
              .from('class_teachers')
              .select(`
                teacher_id,
                teachers!inner(
                  id,
                  user_id,
                  bio,
                  subject,
                  qualification,
                  experience,
                  phone
                )
              `)
              .eq('class_id', cls.id);

            if (teacherError) {
              console.error('❌ Error fetching teachers for class:', teacherError);
            } else {
              console.log(`  👨‍🏫 Found ${classTeacherRelations?.length || 0} teacher relations`);
            }

            // Get profiles for teachers separately
            const teachers = [];
            if (classTeacherRelations && classTeacherRelations.length > 0) {
              for (const rel of classTeacherRelations) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('display_name, email')
                  .eq('user_id', rel.teachers.user_id)
                  .single();

                teachers.push({
                  id: rel.teachers.id,
                  name: profile?.display_name || profile?.email?.split('@')[0] || 'Unknown',
                  email: profile?.email || '',
                  bio: rel.teachers.bio,
                  subject: rel.teachers.subject,
                  qualification: rel.teachers.qualification,
                  experience: rel.teachers.experience,
                  phone: rel.teachers.phone
                });
              }
            }

            // Get all students enrolled in this class - STEP 1: Get enrollment records
            const { data: enrollments, error: enrollmentError } = await supabase
              .from('class_enrollments')
              .select('student_id')
              .eq('class_id', cls.id);

            if (enrollmentError) {
              console.error('❌ Error fetching enrollments for class:', enrollmentError);
            } else {
              console.log(`  👥 Found ${enrollments?.length || 0} student enrollments`);
            }

            // STEP 2: Get student details separately
            const enrolledStudents = [];
            if (enrollments && enrollments.length > 0) {
              const studentIds = enrollments.map((e: any) => e.student_id);

              const { data: studentsData, error: studentsError } = await supabase
                .from('students')
                .select('id, user_id, dob, gender, age, active, phone, grade, address')
                .in('id', studentIds);

              if (studentsError) {
                console.error('❌ Error fetching students:', studentsError);
              } else {
                console.log(`  📚 Fetched ${studentsData?.length || 0} student records`);

                // STEP 3: Get profiles for each student separately
                for (const student of studentsData || []) {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('display_name, email')
                    .eq('user_id', student.user_id)
                    .single();

                  // Calculate age if not present
                  let calculatedAge = student.age;
                  if (!calculatedAge && student.dob) {
                    const today = new Date();
                    const birthDate = new Date(student.dob);
                    calculatedAge = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                      calculatedAge--;
                    }
                  }

                  enrolledStudents.push({
                    id: student.id,
                    name: profile?.display_name || profile?.email?.split('@')[0] || 'Unknown',
                    email: profile?.email || '',
                    age: calculatedAge,
                    gender: student.gender,
                    phone: student.phone,
                    grade: student.grade,
                    address: student.address,
                    status: student.active ? 'active' : 'inactive'
                  });
                }
              }
            }

            console.log(`  ✅ Class enhanced: ${teachers.length} teachers, ${enrolledStudents.length} students`);

            return {
              ...cls,
              teachers,
              students: enrolledStudents,
              studentCount: enrolledStudents.length,
              teacherCount: teachers.length
            };
          }));
        }
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

      // Fetch assignments created by this teacher with student info
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          student:students!assignments_student_id_fkey(
            id,
            user_id,
            profiles!students_user_id_fkey(display_name, email)
          )
        `)
        .eq('created_by_teacher_id', teacher.id)
        .eq('school_id', user.schoolId);

      if (!assignmentsError && assignmentsData) {
        setAssignments(assignmentsData);
        setStats(prev => ({ ...prev, totalAssignments: assignmentsData.length }));
      }

      // Fetch homework count directly from highlights table (green or gold)
      if (studentsData.length > 0) {
        const studentIds = studentsData.map((s: any) => s.id);
        const { count: homeworkCount } = await supabase
          .from('highlights')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', teacher.id)
          .eq('school_id', user.schoolId)
          .in('color', ['green', 'gold']);

        if (homeworkCount !== null) {
          setStats(prev => ({ ...prev, totalHomework: homeworkCount }));
        }
      }

      // Fetch targets for teacher's students (all targets, not just active)
      if (studentsData.length > 0) {
        const studentIds = studentsData.map((s: any) => s.id);
        const { data: targetsData } = await supabase
          .from('targets')
          .select('*')
          .in('student_id', studentIds);

        if (targetsData) {
          setTargets(targetsData);
          setStats(prev => ({ ...prev, totalTargets: targetsData.length }));
        }
      }

      // Fetch messages (unread from parents)
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('read', false);

      if (messagesData) {
        // Fetch attachments for all messages
        const messageIds = messagesData.map((m: any) => m.id);
        let messagesWithAttachments = messagesData;

        if (messageIds.length > 0) {
          const { data: attachments } = await supabase
            .from('message_attachments')
            .select('*')
            .in('message_id', messageIds);

          if (attachments) {
            // Attach to messages
            messagesWithAttachments = messagesData.map((msg: any) => ({
              ...msg,
              attachments: attachments.filter((att: any) => att.message_id === msg.id)
            }));
          }
        }

        setMessages(messagesWithAttachments);
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
  }, [user?.id, user?.schoolId, user?.fullName]);

  // Fetch teacher data when auth is initialized
  useEffect(() => {
    if (authInitialized && user?.id) {
      fetchTeacherData();
    } else if (authInitialized && !user?.id) {
      setError('No user ID found. Please login again.');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authInitialized, user?.id]);

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
    targets,
    messages,
    refreshData,
    setStudents,
    setClasses,
    setAssignments,
    setTargets,
    setMessages
  };
}
