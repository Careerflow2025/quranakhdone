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

    if (profile.role !== 'owner' && profile.role !== 'admin' && profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only school administrators can create student accounts' },
        { status: 403 }
      );
    }

    // Admin client already initialized above
    const body = await req.json();
    const {
      name,
      email,
      dob,
      age,
      gender,
      grade,
      address,
      phone,
      parent
    } = body;

    // Use school_id from authenticated user's profile
    const schoolId = profile.school_id;

    // Calculate age from DOB if provided, or use age directly
    let ageValue = age ? parseInt(age) : null;
    if (!ageValue && dob) {
      const today = new Date();
      const birthDate = new Date(dob);
      ageValue = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        ageValue--;
      }
    }

    // Generate temporary password for student
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

    // 1. Check if user already exists with this email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    const userExists = existingUsers?.users?.find((u: any) => u.email === email);

    let authData: any;

    if (userExists) {
      // Check if student record already exists
      const { data: existingStudent } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('user_id', userExists.id)
        .single();

      if (existingStudent) {
        return NextResponse.json({
          error: 'A student with this email already exists'
        }, { status: 400 });
      }

      // User exists but not as student - update metadata
      await supabaseAdmin.auth.admin.updateUserById(userExists.id, {
        user_metadata: {
          ...userExists.user_metadata,
          role: 'student',
          display_name: name,
          school_id: schoolId
        }
      });

      authData = { user: userExists };
    } else {
      // Create new auth user (using admin API - no rate limiting)
      const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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
        console.error('Auth error:', authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      authData = newAuthData;
    }

    // 2. Create/update profile FIRST (required for foreign key constraint)
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
      console.error('Profile error:', profileError2);
      // Cleanup: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError2.message }, { status: 400 });
    }

    // 3. Create student record (after profile exists - foreign key constraint)
    // FIXED: Save ALL student fields including age, grade, phone, address
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: authData.user.id,
        school_id: schoolId,
        dob: dob || null,
        age: ageValue,
        gender: gender || null,
        grade: grade || null,
        phone: phone || null,
        address: address || null,
        active: true
      })
      .select()
      .single();

    if (studentError) {
      console.error('Student error:', studentError);
      // Cleanup: delete auth user if student creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: studentError.message }, { status: 400 });
    }

    // 4. Save credentials to user_credentials table for school admin access
    const { error: credentialsError } = await supabaseAdmin
      .from('user_credentials')
      .insert({
        user_id: authData.user.id,
        school_id: schoolId,
        email: email,
        password: tempPassword,
        role: 'student'
      });

    if (credentialsError) {
      console.error('⚠️ Failed to save credentials:', credentialsError);
      // Don't fail the entire operation if credentials save fails
    }

    return NextResponse.json({
      success: true,
      data: {
        id: student.id,
        email,
        password: tempPassword, // Return password for school to share
        name
      }
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Failed to create student and parent accounts' },
      { status: 500 }
    );
  }
}