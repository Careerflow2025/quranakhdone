import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startTime = Date.now();

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

    const authStart = Date.now();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    console.log(`[API LOAD] Auth check: ${Date.now() - authStart}ms`);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // FAST: Get user's profile to get school_id (1 query)
    const profileStart = Date.now();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('school_id')
      .eq('user_id', user.id)
      .single();

    console.log(`[API LOAD] Profile query: ${Date.now() - profileStart}ms`);

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // FAST: Query pen annotations with school_id filter (1 query)
    // pen_annotations table has school_id column, so we can filter directly
    const queryStart = Date.now();
    const { data, error } = await supabaseAdmin
      .from('pen_annotations')
      .select('*')
      .eq('school_id', profile.school_id)
      .eq('student_id', studentId)
      .eq('page_number', parseInt(pageNumber))
      .eq('script_id', scriptId)
      .order('created_at', { ascending: false });

    console.log(`[API LOAD] Annotations query: ${Date.now() - queryStart}ms`);

    if (error) {
      console.error('[API LOAD] Query error:', error);
      throw error;
    }

    // No annotations found, return empty
    if (!data || data.length === 0) {
      console.log(`[API LOAD] Total time: ${Date.now() - startTime}ms`);
      return NextResponse.json({
        success: true,
        data: {
          annotations: [],
          combinedPaths: [],
          count: 0
        }
      });
    }

    // Combine all annotations for the page
    const combinedPaths: any[] = [];
    data?.forEach((annotation: any) => {
      if (annotation.drawing_data?.paths) {
        combinedPaths.push(...annotation.drawing_data.paths);
      }
    });

    console.log(`[API LOAD] Total time: ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        annotations: data,
        combinedPaths,
        count: data?.length || 0
      }
    });
  } catch (error: any) {
    console.error('[API LOAD] Error:', error);
    console.log(`[API LOAD] Failed after: ${Date.now() - startTime}ms`);
    return NextResponse.json(
      { error: error.message || 'Failed to load annotations' },
      { status: 500 }
    );
  }
}