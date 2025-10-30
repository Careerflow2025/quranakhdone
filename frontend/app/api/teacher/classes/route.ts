/**
 * Teacher Classes API Endpoint
 * GET /api/teacher/classes - Fetch teacher's classes
 *
 * Created: 2025-10-28
 * Purpose: Get list of classes assigned to the authenticated teacher
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
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
      .select(`
        class_id,
        classes (
          id,
          name,
          room
        )
      `)
      .eq('teacher_id', teacher.id);

    if (classTeachersError) {
      console.error('Error fetching teacher classes:', classTeachersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch classes' },
        { status: 500 }
      );
    }

    // 8. Transform data - extract classes from junction table
    const classes = (classTeachers || [])
      .map((ct: any) => ct.classes)
      .filter((cls: any) => cls !== null)
      .map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        room: cls.room,
      }));

    // 9. Return success response
    return NextResponse.json(
      {
        success: true,
        classes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/teacher/classes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
