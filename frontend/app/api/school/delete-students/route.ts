import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function DELETE(req: NextRequest) {
  try {
    // Get Bearer token from Authorization header
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
        { error: 'Unauthorized - please login' },
        { status: 401 }
      );
    }

    // Get user profile and check role
    const { data: profile, error: profileError} = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
      return NextResponse.json(
        { error: `Profile query failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    if (profile.role !== 'owner' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only school administrators can delete students' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Student IDs required' }, { status: 400 });
    }

    let deletedCount = 0;
    const errors: Array<{ studentId: string; error: string }> = [];

    for (const studentId of studentIds) {
      try {
        // 1. Get student's user_id
        const { data: studentData, error: fetchError } = await supabaseAdmin
          .from('students')
          .select('user_id')
          .eq('id', studentId)
          .single();

        if (fetchError || !studentData) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        const userId = studentData.user_id;

        // 2. Delete from parent_students table (relationships)
        console.log(`🔗 Deleting parent-student links for student ${studentId}...`);
        const { error: parentStudentsError } = await supabaseAdmin
          .from('parent_students')
          .delete()
          .eq('student_id', studentId);

        if (parentStudentsError) {
          console.error(`❌ Error deleting parent-student links:`, parentStudentsError);
          // Continue anyway, links might not exist
        }

        // 3. Delete from class_enrollments table
        console.log(`📚 Deleting class enrollments for student ${studentId}...`);
        const { error: enrollmentsError } = await supabaseAdmin
          .from('class_enrollments')
          .delete()
          .eq('student_id', studentId);

        if (enrollmentsError) {
          console.error(`❌ Error deleting class enrollments:`, enrollmentsError);
          errors.push({ studentId, error: `Failed to delete enrollments: ${enrollmentsError.message}` });
          continue;
        }

        // 4. Delete from students table - CRITICAL STEP
        console.log(`👨‍🎓 Deleting student record ${studentId} from students table...`);
        const { error: studentDeleteError } = await supabaseAdmin
          .from('students')
          .delete()
          .eq('id', studentId);

        if (studentDeleteError) {
          console.error(`❌ CRITICAL: Failed to delete student record:`, studentDeleteError);
          errors.push({ studentId, error: `Failed to delete student: ${studentDeleteError.message}` });
          continue;
        }
        console.log(`✅ Student record deleted from students table`);

        // 5. Delete from profiles table
        console.log(`📝 Deleting profile for user ${userId}...`);
        const { error: profileDeleteError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('user_id', userId);

        if (profileDeleteError) {
          console.error(`❌ Error deleting profile:`, profileDeleteError);
          // Continue anyway, profile might not exist
        }

        // 6. Delete from user_credentials table
        console.log(`🔑 Deleting credentials for user ${userId}...`);
        const { error: credentialsError } = await supabaseAdmin
          .from('user_credentials')
          .delete()
          .eq('user_id', userId);

        if (credentialsError) {
          console.error(`⚠️ Error deleting credentials:`, credentialsError);
          // Continue anyway, credentials might not exist
        }

        // 7. Delete Supabase Auth user (THIS IS THE CRITICAL STEP!)
        console.log(`🔐 Deleting auth user ${userId}...`);
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authDeleteError) {
          console.error(`❌ Failed to delete auth user ${userId}:`, authDeleteError);
          errors.push({ studentId, error: `Auth deletion failed: ${authDeleteError.message}` });
          continue;
        }
        console.log(`✅ Auth user deleted successfully`);

        console.log(`🎉 Student ${studentId} completely deleted from all systems`);
        deletedCount++;
      } catch (error: any) {
        console.error(`Error deleting student ${studentId}:`, error);
        errors.push({ studentId, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete students' },
      { status: 500 }
    );
  }
}
