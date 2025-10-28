/**
 * Teacher Students API Endpoint
 * GET /api/teacher/students - Fetch teacher's students
 *
 * Created: 2025-10-28
 * Purpose: Get list of students enrolled in the authenticated teacher's classes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get authorization header and extract token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 3. Get authenticated user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // 4. Get user profile with school_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 5. Check if user is a teacher
    if (profile.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Only teachers can access this endpoint' },
        { status: 403 }
      );
    }

    // 6. Get teacher record
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // 7. Get teacher's classes via class_teachers junction table
    const { data: classTeachers, error: classTeachersError } = await supabaseAdmin
      .from('class_teachers')
      .select('class_id')
      .eq('teacher_id', teacher.id);

    if (classTeachersError) {
      console.error('Error fetching teacher classes:', classTeachersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch classes' },
        { status: 500 }
      );
    }

    if (!classTeachers || classTeachers.length === 0) {
      return NextResponse.json(
        {
          success: true,
          students: [],
        },
        { status: 200 }
      );
    }

    const classIds = classTeachers.map((ct: any) => ct.class_id);

    // 8. Get students enrolled in these classes via class_enrollments
    const { data: classEnrollments, error: enrollmentsError } = await supabaseAdmin
      .from('class_enrollments')
      .select('student_id')
      .in('class_id', classIds);

    if (enrollmentsError) {
      console.error('Error fetching class enrollments:', enrollmentsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch student enrollments' },
        { status: 500 }
      );
    }

    if (!classEnrollments || classEnrollments.length === 0) {
      return NextResponse.json(
        {
          success: true,
          students: [],
        },
        { status: 200 }
      );
    }

    // Get unique student IDs
    const studentIds = [...new Set(classEnrollments.map((ce: any) => ce.student_id))];

    // 9. Get student details with their profiles
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        user_id,
        profiles:user_id (
          display_name,
          email
        )
      `)
      .in('id', studentIds);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    // 10. Transform data - extract student info with profiles
    const transformedStudents = (students || [])
      .filter((student: any) => student.profiles !== null)
      .map((student: any) => ({
        id: student.id,
        user_id: student.user_id,
        display_name: student.profiles?.display_name || 'Unknown Student',
        email: student.profiles?.email || '',
      }))
      .sort((a: any, b: any) => a.display_name.localeCompare(b.display_name));

    // 11. Return success response
    return NextResponse.json(
      {
        success: true,
        students: transformedStudents,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/teacher/students:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
