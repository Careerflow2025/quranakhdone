import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/**
 * GET /api/parents - List all parents for a school
 * Query params: school_id (required)
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get('school_id');

    if (!school_id) {
      return NextResponse.json(
        { error: 'school_id is required' },
        { status: 400 }
      );
    }

    console.log('📋 Fetching parents for school:', school_id);

    // Get all parents for the school with their profile information
    const { data: parents, error } = await supabaseAdmin
      .from('parents')
      .select(`
        id,
        user_id,
        school_id,
        created_at,
        profiles!parents_user_id_fkey (
          display_name,
          email
        )
      `)
      .eq('school_id', school_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching parents:', error);
      return NextResponse.json(
        { error: `Failed to fetch parents: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${parents?.length || 0} parents`);

    // Transform data to flatten profile info
    const transformedParents = parents?.map(parent => ({
      id: parent.id,
      user_id: parent.user_id,
      school_id: parent.school_id,
      name: parent.profiles?.display_name || '',
      email: parent.profiles?.email || '',
      created_at: parent.created_at,
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedParents
    });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parents' },
      { status: 500 }
    );
  }
}
