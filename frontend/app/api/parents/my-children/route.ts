import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch children for authenticated parent
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

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    // Verify user is a parent
    if (profile.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can access this endpoint' },
        { status: 403 }
      );
    }

    // Get parent record
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('parents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (parentError || !parent) {
      return NextResponse.json(
        { error: 'Parent profile not found' },
        { status: 404 }
      );
    }

    // Get children through parent_students junction table
    const { data: parentStudents, error: psError } = await supabaseAdmin
      .from('parent_students')
      .select('student_id')
      .eq('parent_id', parent.id);

    if (psError) {
      console.error('Error fetching parent students:', psError);
      return NextResponse.json(
        { error: `Failed to fetch children: ${psError.message}` },
        { status: 500 }
      );
    }

    if (!parentStudents || parentStudents.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        children: []
      });
    }

    // Get student IDs
    const studentIds = parentStudents.map(ps => ps.student_id);

    // Fetch full student details
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        profiles:user_id (
          display_name,
          email
        )
      `)
      .in('id', studentIds);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { error: `Failed to fetch student details: ${studentsError.message}` },
        { status: 500 }
      );
    }

    // Transform student data
    const transformedStudents = (students || []).map((student: any) => ({
      ...student,
      name: student.profiles?.display_name || 'Unknown',
      email: student.profiles?.email || ''
    }));

    return NextResponse.json({
      success: true,
      data: transformedStudents,
      children: transformedStudents
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
