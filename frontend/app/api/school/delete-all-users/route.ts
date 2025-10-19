import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const body = await req.json();
    const { schoolId } = body;

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID required' }, { status: 400 });
    }

    const results = {
      studentsDeleted: 0,
      teachersDeleted: 0,
      errors: [] as Array<{ userId: string; error: string }>
    };

    // 1. Get ALL students for this school
    const { data: allStudents, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('school_id', schoolId);

    if (studentsError) {
      return NextResponse.json({ error: studentsError.message }, { status: 400 });
    }

    // 2. Get ALL teachers for this school
    const { data: allTeachers, error: teachersError } = await supabaseAdmin
      .from('teachers')
      .select('id, user_id')
      .eq('school_id', schoolId);

    if (teachersError) {
      return NextResponse.json({ error: teachersError.message }, { status: 400 });
    }

    console.log(`Found ${allStudents?.length || 0} students and ${allTeachers?.length || 0} teachers to delete`);

    // 3. Delete ALL students
    for (const student of allStudents || []) {
      try {
        // Delete parent-student relationships
        await supabaseAdmin
          .from('parent_students')
          .delete()
          .eq('student_id', student.id);

        // Delete class enrollments
        await supabaseAdmin
          .from('class_enrollments')
          .delete()
          .eq('student_id', student.id);

        // Delete student record
        await supabaseAdmin
          .from('students')
          .delete()
          .eq('id', student.id);

        // Delete profile
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('user_id', student.user_id);

        // Delete credentials
        await supabaseAdmin
          .from('user_credentials')
          .delete()
          .eq('user_id', student.user_id);

        // Delete auth user (CRITICAL!)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(student.user_id);

        if (authError) {
          console.error(`Failed to delete auth user ${student.user_id}:`, authError);
          results.errors.push({ userId: student.user_id, error: `Student auth deletion failed: ${authError.message}` });
        } else {
          results.studentsDeleted++;
        }
      } catch (error: any) {
        console.error(`Error deleting student ${student.id}:`, error);
        results.errors.push({ userId: student.user_id, error: error.message });
      }
    }

    // 4. Delete ALL teachers
    for (const teacher of allTeachers || []) {
      try {
        // Delete class-teacher relationships
        await supabaseAdmin
          .from('class_teachers')
          .delete()
          .eq('teacher_id', teacher.id);

        // Delete teacher record
        await supabaseAdmin
          .from('teachers')
          .delete()
          .eq('id', teacher.id);

        // Delete profile
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('user_id', teacher.user_id);

        // Delete credentials
        await supabaseAdmin
          .from('user_credentials')
          .delete()
          .eq('user_id', teacher.user_id);

        // Delete auth user (CRITICAL!)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(teacher.user_id);

        if (authError) {
          console.error(`Failed to delete auth user ${teacher.user_id}:`, authError);
          results.errors.push({ userId: teacher.user_id, error: `Teacher auth deletion failed: ${authError.message}` });
        } else {
          results.teachersDeleted++;
        }
      } catch (error: any) {
        console.error(`Error deleting teacher ${teacher.id}:`, error);
        results.errors.push({ userId: teacher.user_id, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Complete cleanup: ${results.studentsDeleted} students and ${results.teachersDeleted} teachers deleted`,
      studentsDeleted: results.studentsDeleted,
      teachersDeleted: results.teachersDeleted,
      totalDeleted: results.studentsDeleted + results.teachersDeleted,
      errors: results.errors.length > 0 ? results.errors : undefined
    });

  } catch (error: any) {
    console.error('Complete cleanup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete all users' },
      { status: 500 }
    );
  }
}
