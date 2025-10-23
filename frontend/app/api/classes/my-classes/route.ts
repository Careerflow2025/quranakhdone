import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch all classes where the authenticated user is the teacher
export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get user profile to find school_id and teacher_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('school_id, role, user_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    // Only teachers can access this endpoint
    if (profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can access this endpoint' },
        { status: 403 }
      );
    }

    // Get teacher_id
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Fetch classes where this teacher is assigned via class_teachers table
    const { data: classTeachers, error: ctError } = await supabaseAdmin
      .from('class_teachers')
      .select('class_id')
      .eq('teacher_id', teacher.id);

    if (ctError) {
      console.error('Error fetching class_teachers:', ctError);
      return NextResponse.json(
        { error: `Failed to fetch teacher classes: ${ctError.message}` },
        { status: 500 }
      );
    }

    const classIds = classTeachers?.map(ct => ct.class_id) || [];

    if (classIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Fetch full class details with enrollments
    const { data: classes, error: classesError } = await supabaseAdmin
      .from('classes')
      .select(`
        *,
        students:class_enrollments(
          student_id,
          student:students(
            id,
            user_id,
            profiles!students_user_id_fkey(
              display_name,
              email
            )
          )
        )
      `)
      .in('id', classIds)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false });

    if (classesError) {
      console.error('Error fetching classes:', classesError);
      return NextResponse.json(
        { error: `Failed to fetch classes: ${classesError.message}` },
        { status: 500 }
      );
    }

    // Transform the data to flatten student information
    const transformedClasses = classes?.map(cls => ({
      ...cls,
      students: cls.students?.map((enrollment: any) => ({
        id: enrollment.student?.id,
        user_id: enrollment.student?.user_id,
        name: enrollment.student?.profiles?.display_name,
        email: enrollment.student?.profiles?.email
      })) || []
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedClasses
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
