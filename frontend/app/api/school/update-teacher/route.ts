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

    if (profile.role !== 'owner' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only school administrators can update teachers' },
        { status: 403 }
      );
    }

    // Now we can use admin client for privileged operations
    const supabaseAdmin = getSupabaseAdmin();

    const body = await req.json();
    const {
      teacherId,
      userId,
      name,
      bio,
      active
    } = body;

    // 1. Update teacher record
    // Teachers table schema: id, user_id, school_id, bio, active, created_at
    const { error: teacherError } = await supabaseAdmin
      .from('teachers')
      .update({
        bio: bio || null,
        active: active !== undefined ? active : true
      })
      .eq('id', teacherId);

    if (teacherError) {
      console.error('Teacher update error:', teacherError);
      return NextResponse.json({ error: teacherError.message }, { status: 400 });
    }

    // 2. Update profile record
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

    return NextResponse.json({
      success: true,
      message: 'Teacher updated successfully'
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update teacher' },
      { status: 500 }
    );
  }
}
