import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    // ALL ROLES: Use Supabase Auth (PRODUCTION schema - all users have auth accounts)
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get profile from user_profiles table (PRODUCTION schema)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, display_name')
      .eq('user_id', data.user.id)
      .single() as { data: { role: string; school_id: string; display_name: string } | null; error: any };

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please contact support or complete registration.' },
        { status: 404 }
      );
    }

    // Verify role matches requested role
    const roleMapping: Record<string, string[]> = {
      'school': ['school_admin', 'school'],
      'teacher': ['teacher'],
      'student': ['student'],
      'parent': ['parent']
    };

    const validRoles = roleMapping[role] || [];
    if (!validRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: 'Invalid credentials for this role' },
        { status: 403 }
      );
    }

    // Build user data
    let userData: any = {
      id: data.user.id,
      email: data.user.email,
      role: profile.role,
      schoolId: profile.school_id,
      fullName: profile.display_name
    };

    // Get role-specific data
    if (profile.role === 'teacher') {
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('*')
        .eq('user_id', data.user.id)
        .single() as { data: any };

      userData.teacherData = teacher;
    } else if (profile.role === 'student') {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('user_id', data.user.id)
        .single() as { data: any };

      userData.studentData = student;
    } else if (profile.role === 'parent') {
      const { data: parent } = await supabaseAdmin
        .from('parents')
        .select('*')
        .eq('user_id', data.user.id)
        .single() as { data: any };

      // Get linked students
      if (parent) {
        const { data: studentLinks } = await supabaseAdmin
          .from('parent_students')
          .select('student_id, students(*)')
          .eq('parent_id', parent.id) as { data: any };

        userData.parentData = parent;
        userData.children = studentLinks?.map((link: any) => link.students) || [];
      }
    }

    return NextResponse.json({
      success: true,
      user: userData,
      session: data.session
    });

  } catch (error: any) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sign in' },
      { status: 500 }
    );
  }
}
