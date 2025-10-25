// Hook to fetch real student data for Student Management Dashboard
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useStudentManagement(studentId: string | null) {
  const { user, initializeAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Student data
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [teacherInfo, setTeacherInfo] = useState<any>(null);

  // Initialize auth on mount
  useEffect(() => {
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

  // Fetch student data
  const fetchStudentData = useCallback(async () => {
    if (!user?.id || !studentId) {
      setError(!user?.id ? 'No user ID found' : 'No student ID provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching student data for:', studentId);
      console.log('👤 Current user:', user.id, 'Role:', user.role);

      // STEP 1: Fetch student record (including preferred_script_id for Quran version locking)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*, preferred_script_id')
        .eq('id', studentId)
        .eq('school_id', user.schoolId) // Ensure same school
        .single();

      if (studentError) throw studentError;
      if (!student) throw new Error('Student not found');

      console.log('✅ Student record found:', student.id);

      // STEP 2: Get student profile
      const { data: studentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('user_id', student.user_id)
        .single();

      if (profileError) throw profileError;

      // Calculate age from dob if needed
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

      // Set student info (including preferred_script_id for Quran version locking)
      setStudentInfo({
        id: student.id,
        userId: student.user_id,
        name: studentProfile?.display_name || studentProfile?.email?.split('@')[0] || 'Student',
        email: studentProfile?.email || '',
        age: calculatedAge,
        gender: student.gender,
        phone: student.phone,
        grade: student.grade,
        address: student.address,
        active: student.active,
        schoolId: student.school_id,
        preferredScriptId: student.preferred_script_id // Quran version lock
      });

      // STEP 3: Get class enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('class_enrollments')
        .select('class_id, classes(id, name, room)')
        .eq('student_id', studentId)
        .single();

      if (!enrollmentError && enrollment) {
        setClassInfo({
          id: enrollment.classes?.id,
          name: enrollment.classes?.name,
          room: enrollment.classes?.room
        });

        // STEP 4: Verify teacher access
        // If user is a teacher, verify they teach this class
        if (user.role === 'teacher') {
          const { data: teacherRecord } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (teacherRecord) {
            const { data: classTeacher } = await supabase
              .from('class_teachers')
              .select('teacher_id')
              .eq('class_id', enrollment.classes?.id)
              .eq('teacher_id', teacherRecord.id)
              .single();

            if (classTeacher) {
              console.log('✅ Teacher has access to this student');
              setHasAccess(true);

              // Get teacher info
              setTeacherInfo({
                id: teacherRecord.id,
                userId: user.id,
                name: user.fullName || 'Teacher'
              });
            } else {
              console.warn('⚠️ Teacher does not have access to this student');
              setHasAccess(false);
              setError('You do not have access to this student');
            }
          }
        } else if (user.role === 'owner' || user.role === 'admin') {
          // Owners and admins have access to all students in their school
          console.log('✅ Owner/Admin has access to this student');
          setHasAccess(true);
        } else if (user.role === 'student' && student.user_id === user.id) {
          // Students can only access their own dashboard
          console.log('✅ Student accessing own dashboard');
          setHasAccess(true);
        } else {
          setHasAccess(false);
          setError('You do not have access to this student');
        }
      } else {
        console.log('ℹ️ Student not enrolled in any class yet');
      }

      console.log('✅ Student data loaded successfully');

    } catch (err: any) {
      console.error('❌ Error fetching student data:', err);
      setError(err.message || 'Failed to load student data');
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.schoolId, user?.role, user?.fullName, studentId]);

  // Fetch student data when auth is initialized
  useEffect(() => {
    if (authInitialized && user?.id && studentId) {
      fetchStudentData();
    } else if (authInitialized && !user?.id) {
      setError('No user ID found. Please login again.');
      setIsLoading(false);
    } else if (authInitialized && !studentId) {
      setError('No student ID provided in URL.');
      setIsLoading(false);
    }
  }, [authInitialized, user?.id, studentId, fetchStudentData]);

  return {
    isLoading,
    error,
    hasAccess,
    studentInfo,
    classInfo,
    teacherInfo,
    userRole: user?.role || null,
    refreshData: fetchStudentData
  };
}
