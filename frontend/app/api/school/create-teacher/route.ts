import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    // Get Bearer token from Authorization header
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

    if (profile.role !== 'owner' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only school administrators can create teacher accounts' },
        { status: 403 }
      );
    }

    // Admin client already initialized above
    const body = await req.json();
    const { name, email, password, phone, classIds, subject, qualification, experience, address, bio } = body;
    
    // Use school_id from authenticated user's profile
    const schoolId = profile.school_id;

    // 1. Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    const userExists = existingUser?.users?.find((u: any) => u.email === email);

    let authData: any;

    if (userExists) {
      // Check if teacher record exists
      const { data: existingTeacher } = await supabaseAdmin
        .from('teachers')
        .select('*')
        .eq('user_id', userExists.id)
        .single();

      if (existingTeacher) {
        return NextResponse.json({
          error: 'A teacher with this email already exists'
        }, { status: 400 });
      }

      // User exists but not as teacher - we can convert them
      // Update user metadata
      await supabaseAdmin.auth.admin.updateUserById(userExists.id, {
        user_metadata: {
          ...userExists.user_metadata,
          role: 'teacher',
          display_name: name,
          school_id: schoolId
        }
      });

      authData = { user: userExists };
    } else {
      // Create new auth user
      const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'teacher',
          display_name: name,
          school_id: schoolId
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      authData = newAuthData;
    }

    // 2. Create user profile FIRST (required for foreign key constraint)
    const { error: profileError2 } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        email: email,
        display_name: name,
        role: 'teacher',
        school_id: schoolId
      });

    if (profileError2) {
      console.error('Profile creation error:', profileError2);
      // Cleanup: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError2.message }, { status: 400 });
    }

    // 3. Create teacher record (after profile exists)
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        user_id: authData.user.id,
        school_id: schoolId,
        bio: bio || null,
        active: true
      })
      .select()
      .single();

    if (teacherError) {
      console.error('Teacher error:', teacherError);
      // Cleanup: delete auth user and profile if teacher creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: teacherError.message }, { status: 400 });
    }

    // 4. Assign classes if provided
    if (classIds && classIds.length > 0) {
      const classAssignments = classIds.map((classId: string) => ({
        teacher_id: teacher.id,
        class_id: classId
      }));

      await supabaseAdmin
        .from('teacher_classes')
        .insert(classAssignments);
    }

    // 5. Save credentials to user_credentials table for school admin access
    const { error: credentialsError } = await supabaseAdmin
      .from('user_credentials')
      .insert({
        user_id: authData.user.id,
        school_id: schoolId,
        email: email,
        password: password,
        role: 'teacher'
      });

    if (credentialsError) {
      console.error('⚠️ Failed to save credentials:', credentialsError);
      // Don't fail the entire operation if credentials save fails
    }

    return NextResponse.json({
      success: true,
      data: {
        id: teacher.id,
        email,
        password, // Return password once for the school to share
        name
      }
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Failed to create teacher account' },
      { status: 500 }
    );
  }
}