// Production hook to fetch real school data from Supabase
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useSchoolData() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // School info
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalClasses: 0,
    activeAssignments: 0,
    completionRate: 0,
    attendanceToday: 0,
    upcomingEvents: 0
  });

  // Data arrays
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [allCalendarEvents, setAllCalendarEvents] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);

  useEffect(() => {
    if (user?.schoolId) {
      fetchSchoolData();
    }
  }, [user?.schoolId]);

  const fetchSchoolData = async () => {
    if (!user?.schoolId) {
      setError('No school ID found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch school info
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', user.schoolId)
        .single();

      if (schoolError) throw schoolError;

      setSchoolInfo({
        name: (school as any)?.name || 'My School',
        id: (school as any)?.id || '',
        location: 'Not specified',  // address column doesn't exist in NEW schema
        established: (school as any)?.created_at ? new Date((school as any).created_at).getFullYear().toString() : new Date().getFullYear().toString(),
        principal: user?.fullName || 'School Administrator',
        subscription: 'active',  // subscription_status column doesn't exist in NEW schema
        validUntil: '2025-12-31',  // subscription_end column doesn't exist in NEW schema
        email: '',  // email column doesn't exist in NEW schema
        phone: ''   // phone column doesn't exist in NEW schema
      });

      // Fetch students (without join for now to avoid errors)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', user.schoolId);

      // Fetch profiles for students separately
      let studentsWithProfiles: any[] = [];
      if (!studentsError && studentsData) {
        const studentUserIds = studentsData.map((s: any) => s.user_id);
        const { data: studentProfiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, email')
          .in('user_id', studentUserIds);

        studentsWithProfiles = studentsData.map((student: any) => {
          const profile = studentProfiles?.find((p: any) => p.user_id === student.user_id);
          return {
            ...student,
            profiles: profile || { display_name: 'Unknown', email: '' }
          };
        });
      }

      if (!studentsError) {
        // Transform data to include name and email at top level
        const transformedStudents = studentsWithProfiles.map((student: any) => ({
          ...student,
          name: student.profiles?.display_name || 'Unknown',
          email: student.profiles?.email || '',
          status: student.active ? 'active' : 'inactive',
          progress: 0, // Default value
          attendance: 0 // Default value
        }));
        setStudents(transformedStudents);
        setStats(prev => ({ ...prev, totalStudents: transformedStudents.length }));
      }

      // Fetch teachers (without join for now)
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', user.schoolId);

      // Fetch profiles for teachers separately (include phone from profiles table)
      let teachersWithProfiles: any[] = [];
      if (!teachersError && teachersData) {
        const teacherUserIds = teachersData.map((t: any) => t.user_id);
        const { data: teacherProfiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, phone')
          .in('user_id', teacherUserIds);

        teachersWithProfiles = teachersData.map((teacher: any) => {
          const profile = teacherProfiles?.find((p: any) => p.user_id === teacher.user_id);
          return {
            ...teacher,
            profiles: profile || { display_name: 'Unknown', email: '', phone: '' }
          };
        });
      }

      if (!teachersError) {
        // Transform data to include name, email, phone, and all teacher fields at top level
        const transformedTeachers = teachersWithProfiles.map((teacher: any) => ({
          ...teacher,
          name: teacher.profiles?.display_name || 'Unknown',
          email: teacher.profiles?.email || '',
          phone: teacher.profiles?.phone || '',
          subject: teacher.subject || '',
          qualification: teacher.qualification || '',
          experience: teacher.experience || 0,
          address: teacher.address || '',
          bio: teacher.bio || '',
          status: teacher.active ? 'active' : 'inactive'
        }));
        setTeachers(transformedTeachers);
        setStats(prev => ({ ...prev, totalTeachers: transformedTeachers.length }));
      }

      // Fetch parents (parents table doesn't have school_id - get via parent_students -> students -> school_id)
      // First get all students for this school
      const { data: schoolStudents } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', user.schoolId);

      // Then get parent IDs for these students
      const studentIds = schoolStudents?.map((s: any) => s.id) || [];
      const { data: parentStudentLinks } = await supabase
        .from('parent_students')
        .select('parent_id')
        .in('student_id', studentIds);

      // Get unique parent IDs
      const parentIds = [...new Set(parentStudentLinks?.map((ps: any) => ps.parent_id) || [])];

      // Finally fetch the parents
      const { data: parentsData, error: parentsError } = parentIds.length > 0
        ? await supabase
            .from('parents')
            .select('*')
            .in('user_id', parentIds)
        : { data: null, error: null };

      // Fetch profiles for parents separately
      let parentsWithProfiles: any[] = [];
      if (!parentsError && parentsData) {
        const parentUserIds = parentsData.map((p: any) => p.user_id);
        const { data: parentProfiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, email')
          .in('user_id', parentUserIds);

        parentsWithProfiles = parentsData.map((parent: any) => {
          const profile = parentProfiles?.find((p: any) => p.user_id === parent.user_id);
          return {
            ...parent,
            profiles: profile || { display_name: 'Unknown', email: '' }
          };
        });
      }

      if (!parentsError) {
        // Get children count for each parent
        const { data: parentStudentCounts } = await supabase
          .from('parent_students')
          .select('parent_id')
          .in('parent_id', parentsWithProfiles.map((p: any) => p.id));

        // Count children per parent
        const childrenCounts: any = {};
        parentStudentCounts?.forEach((ps: any) => {
          childrenCounts[ps.parent_id] = (childrenCounts[ps.parent_id] || 0) + 1;
        });

        // Transform data to include name, email, and children count at top level
        const transformedParents = parentsWithProfiles.map((parent: any) => ({
          ...parent,
          name: parent.profiles?.display_name || 'Unknown',
          email: parent.profiles?.email || '',
          children_count: childrenCounts[parent.id] || 0
        }));
        setParents(transformedParents);
        setStats(prev => ({ ...prev, totalParents: transformedParents.length }));
      }

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', user.schoolId);

      if (!classesError && classesData) {
        // Fetch teacher and student counts for each class
        const classesWithCounts = await Promise.all(
          classesData.map(async (cls: any) => {
            // Get teacher details (not just count)
            const { data: teacherData } = await supabase
              .from('class_teachers')
              .select('teacher_id, teachers(id, name, email, subject)')
              .eq('class_id', cls.id);

            // Get student count
            const { count: studentCount } = await supabase
              .from('class_enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('class_id', cls.id);

            return {
              ...cls,
              teacher_count: teacherData?.length || 0,
              teachers: teacherData?.map((t: any) => t.teachers) || [],
              student_count: studentCount || 0
            };
          })
        );

        setClasses(classesWithCounts);
        setStats(prev => ({ ...prev, totalClasses: classesWithCounts.length }));
      } else {
        setClasses([]);
        setStats(prev => ({ ...prev, totalClasses: 0 }));
      }

      // Fetch calendar events for upcoming events
      const today = new Date().toISOString().split('T')[0];

      // Get upcoming events
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('school_id', user.schoolId)
        .gte('date', today)  // Use date format YYYY-MM-DD
        .order('date', { ascending: true });

      if (!upcomingError) {
        setUpcomingEvents(upcomingData || []);
        setStats(prev => ({ ...prev, upcomingEvents: upcomingData?.length || 0 }));
      } else {
        console.error('Error loading upcoming events:', upcomingError);
      }

      // Get ALL calendar events for the calendar grid
      const { data: allEventsData, error: allEventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('school_id', user.schoolId)
        .order('date', { ascending: true });

      if (!allEventsError) {
        setAllCalendarEvents(allEventsData || []);
      } else {
        console.error('Error loading all calendar events:', allEventsError);
      }

      // Fetch user credentials - join with profiles via user_id
      const { data: credsData, error: credsError } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('school_id', user.schoolId);

      // Fetch profiles separately for credentials
      if (!credsError && credsData) {
        const userIds = credsData.map((c: any) => c.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, role')
          .in('user_id', userIds);

        // Merge profiles with credentials
        const mergedCreds = credsData.map((cred: any) => {
          const profile = profilesData?.find((p: any) => p.user_id === cred.user_id);
          return {
            ...cred,
            profiles: profile || null
          };
        });

        setCredentials(mergedCreds);
      } else {
        setCredentials([]);
      }

      // For now, set empty recent activities (will be populated with real data later)
      setRecentActivities([]);

    } catch (err: any) {
      console.error('Error fetching school data:', err);
      setError(err.message || 'Failed to load school data');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh data
  const refreshData = () => {
    fetchSchoolData();
  };

  return {
    isLoading,
    error,
    schoolInfo,
    stats,
    students,
    teachers,
    parents,
    classes,
    recentActivities,
    upcomingEvents,
    allCalendarEvents,
    credentials,
    refreshData,
    setStudents,
    setTeachers,
    setParents,
    setClasses,
    setCredentials
  };
}