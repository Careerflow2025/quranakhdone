import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Get the current user and verify they're a school admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check if user is a school admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single() as { data: { role: string; school_id: string } | null };

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    if (profile.role !== 'school') {
      return NextResponse.json(
        { error: 'Only school administrators can delete teachers' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { teacherIds } = body;

    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
      return NextResponse.json({ error: 'Teacher IDs required' }, { status: 400 });
    }

    let deletedCount = 0;
    const errors: Array<{ teacherId: string; error: string }> = [];

    for (const teacherId of teacherIds) {
      try {
        // 1. Get teacher's user_id
        const { data: teacherData, error: fetchError } = await supabaseAdmin
          .from('teachers')
          .select('user_id')
          .eq('id', teacherId)
          .single();

        if (fetchError || !teacherData) {
          errors.push({ teacherId, error: 'Teacher not found' });
          continue;
        }

        const userId = teacherData.user_id;

        // 2. Delete from class_teachers table (teaching assignments)
        await supabaseAdmin
          .from('class_teachers')
          .delete()
          .eq('teacher_id', teacherId);

        // 3. Delete from teachers table
        await supabaseAdmin
          .from('teachers')
          .delete()
          .eq('id', teacherId);

        // 4. Delete from profiles table
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('user_id', userId);

        // 5. Delete from user_credentials table
        await supabaseAdmin
          .from('user_credentials')
          .delete()
          .eq('user_id', userId);

        // 6. Delete Supabase Auth user (CRITICAL STEP!)
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authDeleteError) {
          console.error(`Failed to delete auth user ${userId}:`, authDeleteError);
          errors.push({ teacherId, error: `Auth deletion failed: ${authDeleteError.message}` });
          continue;
        }

        deletedCount++;
      } catch (error: any) {
        console.error(`Error deleting teacher ${teacherId}:`, error);
        errors.push({ teacherId, error: error.message });
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
      { error: error.message || 'Failed to delete teachers' },
      { status: 500 }
    );
  }
}
