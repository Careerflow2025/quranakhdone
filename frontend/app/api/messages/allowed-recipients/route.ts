/**
 * Allowed Recipients API Endpoint
 * GET /api/messages/allowed-recipients
 *
 * Purpose: Return list of users that current user can send messages to
 * - Teachers: Their students + parents of their students + school admins
 * - Admins/Owners: All users in school
 * - Students: Their teachers + school admins
 * - Parents: Teachers of their children + school admins
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Recipient {
  user_id: string;
  display_name: string | null;
  email: string;
  role: string;
}

interface AllowedRecipientsResponse {
  success: true;
  recipients: Recipient[];
  teacher_classes?: Array<{
    id: string;
    name: string;
  }>;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Initialize Supabase client with auth
    const supabase = createClientWithAuth();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 3. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    let allowedRecipients: Recipient[] = [];

    // 4. Build allowed recipients based on role
    if (profile.role === 'owner' || profile.role === 'admin') {
      // Admins and owners can message anyone in their school
      const { data: allUsers, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, role')
        .eq('school_id', profile.school_id)
        .neq('user_id', user.id) // Exclude self
        .order('display_name');

      if (error) {
        console.error('Error fetching all users:', error);
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: 'Failed to fetch recipients',
            code: 'DATABASE_ERROR',
          },
          { status: 500 }
        );
      }

      allowedRecipients = allUsers || [];

    } else if (profile.role === 'teacher') {
      // Teachers can only message:
      // 1. Their own students
      // 2. Parents of their students
      // 3. School admins

      // Get teacher record
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError || !teacher) {
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: 'Teacher record not found',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      // Get classes taught by this teacher
      const { data: classTeachers, error: classError } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_id', teacher.id);

      if (classError) {
        console.error('Error fetching teacher classes:', classError);
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: 'Failed to fetch teacher classes',
            code: 'DATABASE_ERROR',
          },
          { status: 500 }
        );
      }

      const classIds = classTeachers?.map(ct => ct.class_id) || [];

      if (classIds.length > 0) {
        // Get students enrolled in these classes
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('class_enrollments')
          .select('student_id')
          .in('class_id', classIds);

        if (enrollmentError) {
          console.error('Error fetching enrollments:', enrollmentError);
          return NextResponse.json<ErrorResponse>(
            {
              success: false,
              error: 'Failed to fetch students',
              code: 'DATABASE_ERROR',
            },
            { status: 500 }
          );
        }

        const studentIds = [...new Set(enrollments?.map(e => e.student_id) || [])];

        if (studentIds.length > 0) {
          // Get student profiles
          const { data: students, error: studentError } = await supabase
            .from('students')
            .select('id, user_id')
            .in('id', studentIds);

          if (studentError) {
            console.error('Error fetching students:', studentError);
          } else if (students) {
            const studentUserIds = students.map(s => s.user_id);

            // Get student profiles
            const { data: studentProfiles, error: profilesError } = await supabase
              .from('profiles')
              .select('user_id, display_name, email, role')
              .in('user_id', studentUserIds);

            if (!profilesError && studentProfiles) {
              allowedRecipients.push(...studentProfiles);
            }

            // Get parents of these students
            const studentIdsArray = students.map(s => s.id);
            const { data: parentStudents, error: parentError } = await supabase
              .from('parent_students')
              .select('parent_id')
              .in('student_id', studentIdsArray);

            if (!parentError && parentStudents) {
              const parentIds = [...new Set(parentStudents.map(ps => ps.parent_id))];

              if (parentIds.length > 0) {
                // Get parent user IDs
                const { data: parents, error: parentsError } = await supabase
                  .from('parents')
                  .select('id, user_id')
                  .in('id', parentIds);

                if (!parentsError && parents) {
                  const parentUserIds = parents.map(p => p.user_id);

                  // Get parent profiles
                  const { data: parentProfiles, error: parentProfilesError } = await supabase
                    .from('profiles')
                    .select('user_id, display_name, email, role')
                    .in('user_id', parentUserIds);

                  if (!parentProfilesError && parentProfiles) {
                    allowedRecipients.push(...parentProfiles);
                  }
                }
              }
            }
          }
        }
      }

      // Add school admins
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, role')
        .eq('school_id', profile.school_id)
        .in('role', ['owner', 'admin']);

      if (!adminError && admins) {
        allowedRecipients.push(...admins);
      }

    } else if (profile.role === 'student') {
      // Students can message:
      // 1. Their teachers
      // 2. School admins

      // Get student record
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!studentError && student) {
        // Get student's classes
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('class_enrollments')
          .select('class_id')
          .eq('student_id', student.id);

        if (!enrollmentError && enrollments) {
          const classIds = enrollments.map(e => e.class_id);

          if (classIds.length > 0) {
            // Get teachers for these classes
            const { data: classTeachers, error: teacherError } = await supabase
              .from('class_teachers')
              .select('teacher_id')
              .in('class_id', classIds);

            if (!teacherError && classTeachers) {
              const teacherIds = [...new Set(classTeachers.map(ct => ct.teacher_id))];

              if (teacherIds.length > 0) {
                // Get teacher user IDs
                const { data: teachers, error: teachersError } = await supabase
                  .from('teachers')
                  .select('id, user_id')
                  .in('id', teacherIds);

                if (!teachersError && teachers) {
                  const teacherUserIds = teachers.map(t => t.user_id);

                  // Get teacher profiles
                  const { data: teacherProfiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('user_id, display_name, email, role')
                    .in('user_id', teacherUserIds);

                  if (!profilesError && teacherProfiles) {
                    allowedRecipients.push(...teacherProfiles);
                  }
                }
              }
            }
          }
        }
      }

      // Add school admins
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, role')
        .eq('school_id', profile.school_id)
        .in('role', ['owner', 'admin']);

      if (!adminError && admins) {
        allowedRecipients.push(...admins);
      }

    } else if (profile.role === 'parent') {
      // Parents can message:
      // 1. Teachers of their children
      // 2. School admins

      // Get parent record
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!parentError && parent) {
        // Get children
        const { data: parentStudents, error: childrenError } = await supabase
          .from('parent_students')
          .select('student_id')
          .eq('parent_id', parent.id);

        if (!childrenError && parentStudents) {
          const studentIds = parentStudents.map(ps => ps.student_id);

          if (studentIds.length > 0) {
            // Get children's classes
            const { data: enrollments, error: enrollmentError } = await supabase
              .from('class_enrollments')
              .select('class_id')
              .in('student_id', studentIds);

            if (!enrollmentError && enrollments) {
              const classIds = [...new Set(enrollments.map(e => e.class_id))];

              if (classIds.length > 0) {
                // Get teachers for these classes
                const { data: classTeachers, error: teacherError } = await supabase
                  .from('class_teachers')
                  .select('teacher_id')
                  .in('class_id', classIds);

                if (!teacherError && classTeachers) {
                  const teacherIds = [...new Set(classTeachers.map(ct => ct.teacher_id))];

                  if (teacherIds.length > 0) {
                    // Get teacher user IDs
                    const { data: teachers, error: teachersError } = await supabase
                      .from('teachers')
                      .select('id, user_id')
                      .in('id', teacherIds);

                    if (!teachersError && teachers) {
                      const teacherUserIds = teachers.map(t => t.user_id);

                      // Get teacher profiles
                      const { data: teacherProfiles, error: profilesError } = await supabase
                        .from('profiles')
                        .select('user_id, display_name, email, role')
                        .in('user_id', teacherUserIds);

                      if (!profilesError && teacherProfiles) {
                        allowedRecipients.push(...teacherProfiles);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Add school admins
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, role')
        .eq('school_id', profile.school_id)
        .in('role', ['owner', 'admin']);

      if (!adminError && admins) {
        allowedRecipients.push(...admins);
      }
    }

    // Remove duplicates based on user_id
    const uniqueRecipients = Array.from(
      new Map(allowedRecipients.map(r => [r.user_id, r])).values()
    );

    // Sort by display_name
    uniqueRecipients.sort((a, b) => {
      const nameA = a.display_name || a.email || '';
      const nameB = b.display_name || b.email || '';
      return nameA.localeCompare(nameB);
    });

    // If user is a teacher, include their classes for group messaging
    let teacherClasses: Array<{ id: string; name: string }> = [];
    if (profile.role === 'teacher') {
      // Get teacher record (already fetched above for teachers)
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacher) {
        // Get teacher's classes
        const { data: classTeachers } = await supabase
          .from('class_teachers')
          .select('class_id')
          .eq('teacher_id', teacher.id);

        const classIds = classTeachers?.map(ct => ct.class_id) || [];

        if (classIds.length > 0) {
          const { data: classes } = await supabase
            .from('classes')
            .select('id, name')
            .in('id', classIds)
            .order('name');

          teacherClasses = classes || [];
        }
      }
    }

    return NextResponse.json<AllowedRecipientsResponse>(
      {
        success: true,
        recipients: uniqueRecipients,
        ...(profile.role === 'teacher' ? { teacher_classes: teacherClasses } : {}),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in GET /api/messages/allowed-recipients:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
