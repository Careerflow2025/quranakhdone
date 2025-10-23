import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = cookies();

    // Create server client for user authentication
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please login' },
        { status: 401 }
      );
    }

    // Get user profile and check role
    const { data: profile, error: profileError } = await supabase
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

    // Now we can use admin client for privileged operations
    const supabaseAdmin = getSupabaseAdmin();

    const body = await req.json();
    const {
      parentId,
      userId,
      name,
      studentIds
    } = body;

    // 1. Update profile record (parents table has minimal fields)
    // Profiles table schema: user_id, school_id, role, display_name, email, created_at, updated_at
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

    // 2. Update student linkages if provided
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
