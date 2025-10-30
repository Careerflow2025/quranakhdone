import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    const pageNumber = url.searchParams.get('pageNumber');
    const scriptId = url.searchParams.get('scriptId');

    if (!studentId || !pageNumber || !scriptId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get Bearer token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Get the user's profile to check role and school
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Build query based on role
    let query = supabaseAdmin
      .from('pen_annotations')
      .select('*')
      .eq('student_id', studentId)
      .eq('page_number', parseInt(pageNumber))
      .eq('script_id', scriptId);

    // Apply school isolation
    if (profile.role === 'teacher' || profile.role === 'admin' || profile.role === 'owner') {
      // Teachers, admins, and owners can see all annotations for students in their school
      query = query.eq('school_id', profile.school_id);
    } else if (profile.role === 'student') {
      // Students can only see their own annotations
      const { data: studentData } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!studentData || studentData.id !== studentId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else if (profile.role === 'parent') {
      // Parents can see their children's annotations
      const { data: linkedStudent } = await supabaseAdmin
        .from('parent_students')
        .select('student_id')
        .eq('student_id', studentId)
        .single();

      if (!linkedStudent) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Combine all annotations for the page
    const combinedPaths: any[] = [];
    data?.forEach((annotation: any) => {
      if (annotation.drawing_data?.paths) {
        combinedPaths.push(...annotation.drawing_data.paths);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        annotations: data,
        combinedPaths,
        count: data?.length || 0
      }
    });
  } catch (error: any) {
    console.error('Error loading pen annotations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load annotations' },
      { status: 500 }
    );
  }
}