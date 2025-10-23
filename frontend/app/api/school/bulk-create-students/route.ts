import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
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

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    if (profile.role !== 'owner' && profile.role !== 'admin' && profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only school administrators and teachers can create students' },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();
    const { students } = body;

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: 'Students array is required' },
        { status: 400 }
      );
    }

    const schoolId = profile.school_id;
    const results: Array<{ email: string; success: boolean; error?: string; data?: any }> = [];

    // Check for existing users ONCE before loop (performance optimization)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    for (const studentData of students) {
      try {
        const { name, email, age, gender } = studentData;

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

        // Check against cached user list
        const userExists = existingUsers?.users?.find((u: any) => u.email === email);

        if (userExists) {
          results.push({ email, success: false, error: 'User already exists' });
          continue;
        }

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            role: 'student',
            display_name: name,
            school_id: schoolId
          }
        });

        if (authError) {
          results.push({ email, success: false, error: authError.message });
          continue;
        }

        // Create profile FIRST
        const { error: profileError2 } = await supabaseAdmin
          .from('profiles')
          .upsert({
            user_id: authData.user.id,
            email: email,
            display_name: name,
            role: 'student',
            school_id: schoolId
          });

        if (profileError2) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          results.push({ email, success: false, error: profileError2.message });
          continue;
        }

        // Calculate DOB from age if provided
        let dobValue = null;
        if (age) {
          const currentYear = new Date().getFullYear();
          const birthYear = currentYear - parseInt(age);
          dobValue = `${birthYear}-01-01`;
        }

        // Create student record
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .insert({
            user_id: authData.user.id,
            school_id: schoolId,
            dob: dobValue,
            gender: gender || null,
            active: true
          })
          .select()
          .single();

        if (studentError) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          results.push({ email, success: false, error: studentError.message });
          continue;
        }

        // Store credentials
        await supabaseAdmin
          .from('user_credentials')
          .insert({
            user_id: authData.user.id,
            school_id: schoolId,
            email: email,
            password: tempPassword,
            role: 'student'
          });

        results.push({
          email,
          success: true,
          data: { id: student.id, email, password: tempPassword, name }
        });

      } catch (error: any) {
        results.push({ email: studentData.email, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: students.length,
        succeeded: successCount,
        failed: failureCount
      },
      results
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Failed to bulk create students' },
      { status: 500 }
    );
  }
}
