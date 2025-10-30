import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function PUT(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // FIXED: Get the authorization header (Bearer token authentication)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid token' },
        { status: 401 }
      );
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      );
    }

    // Get user profile and check role
    const { data: profile, error: profileError } = await supabaseAdmin
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

    if (profile.role !== 'owner' && profile.role !== 'admin' && profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only school administrators and teachers can update parents' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      parentId,
      userId,
      name,
      phone,      // ✅ ADDED: Extract phone from request
      address,    // ✅ ADDED: Extract address from request
      studentIds
    } = body;

    // 1. Update profile record (display_name only)
    const { error: profileError2 } = await supabaseAdmin
      .from('profiles')
      .update({
        display_name: name
      })
      .eq('user_id', userId);

    if (profileError2) {
      console.error('Profile update error:', profileError2);
      return NextResponse.json({ error: profileError2.message }, { status: 400 });
    }

    // 2. ✅ ADDED: Update parents table with phone and address
    const { error: parentError } = await supabaseAdmin
      .from('parents')
      .update({
        phone: phone || null,
        address: address || null
      })
      .eq('id', parentId);

    if (parentError) {
      console.error('Parent update error:', parentError);
      return NextResponse.json({ error: parentError.message }, { status: 400 });
    }

    // 3. Update student linkages if provided
    if (studentIds && Array.isArray(studentIds)) {
      // Delete existing links
      const { error: deleteLinkError } = await supabaseAdmin
        .from('parent_students')
        .delete()
        .eq('parent_id', parentId);

      if (deleteLinkError) {
        console.error('Delete link error:', deleteLinkError);
        return NextResponse.json({ error: deleteLinkError.message }, { status: 400 });
      }

      // Create new links
      if (studentIds.length > 0) {
        const parentStudentLinks = studentIds.map((studentId: string) => ({
          parent_id: parentId,
          student_id: studentId
        }));

        const { error: linkError } = await supabaseAdmin
          .from('parent_students')
          .insert(parentStudentLinks);

        if (linkError) {
          console.error('Link error:', linkError);
          return NextResponse.json({ error: linkError.message }, { status: 400 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Parent updated successfully'
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update parent' },
      { status: 500 }
    );
  }
}
