import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    // SCHOOL OWNER: Use Supabase Auth
    if (role === 'owner' || role === 'admin' || role === 'school') {
      // Use Supabase Auth for school owners
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

      // Verify role in profiles table
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, school_id, display_name')
        .eq('user_id', data.user.id)
        .single();

      if (!profile || (profile.role !== 'owner' && profile.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Invalid credentials or insufficient permissions' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: profile.role,
          schoolId: profile.school_id,
          fullName: profile.display_name
        },
        session: data.session
      });
    }

    // TEACHER/STUDENT/PARENT: Use user_credentials table
    if (role === 'teacher' || role === 'student' || role === 'parent') {
      // Check credentials in user_credentials table
      const { data: credentials, error: credError } = await supabaseAdmin
        .from('user_credentials')
        .select('*')
        .eq('email', email)
        .eq('password', password)  // Plaintext password comparison
        .eq('role', role)
        .single();

      if (credError || !credentials) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Get profile information
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, school_id, display_name')
        .eq('user_id', credentials.user_id)
        .single();

      if (!profile) {
        return NextResponse.json(
          { error: 'Profile not found. Please contact support.' },
          { status: 404 }
        );
      }

      // Get role-specific data
      let userData: any = {
        id: credentials.user_id,
        email: credentials.email,
        role: credentials.role,
        schoolId: profile.school_id,
        fullName: profile.display_name
      };

      if (role === 'teacher') {
        const { data: teacher } = await supabaseAdmin
          .from('teachers')
          .select('*')
          .eq('user_id', credentials.user_id)
          .single();

        userData.teacherData = teacher;
      } else if (role === 'student') {
        const { data: student } = await supabaseAdmin
          .from('students')
          .select('*')
          .eq('user_id', credentials.user_id)
          .single();

        userData.studentData = student;
      } else if (role === 'parent') {
        const { data: parent } = await supabaseAdmin
          .from('parents')
          .select('*')
          .eq('user_id', credentials.user_id)
          .single();

        // Get linked students
        if (parent) {
          const { data: studentLinks } = await supabaseAdmin
            .from('parent_students')
            .select('student_id, students(*)')
            .eq('parent_id', parent.id);

          userData.parentData = parent;
          userData.children = studentLinks?.map((link: any) => link.students) || [];
        }
      }

      return NextResponse.json({
        success: true,
        user: userData,
        // No Supabase session for teachers/students/parents
        session: null
      });
    }

    return NextResponse.json(
      { error: 'Invalid role specified' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sign in' },
      { status: 500 }
    );
  }
}
