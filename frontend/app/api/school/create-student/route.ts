import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      age,
      gender,
      grade,
      address,
      phone,
      parent,
      schoolId
    } = body;

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

    // 2. Create/update profile (profiles table has: display_name, email, phone, address)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        email: email,
        display_name: name,
        phone: phone || null,
        address: address || null,
        role: 'student',
        school_id: schoolId
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // Cleanup: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 3. Calculate date of birth from age if provided
    let dobValue = null;
    if (age) {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - parseInt(age);
      dobValue = `${birthYear}-01-01`;
    }

    // 4. Create student record (students table has: user_id, school_id, dob, gender, active)
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
      console.error('Student error:', studentError);
      // Cleanup: delete auth user if student creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: studentError.message }, { status: 400 });
    }

    // 5. Store credentials for school admin
    await supabaseAdmin
      .from('user_credentials')
      .insert({
        user_id: authData.user.id,
        school_id: schoolId,
        email: email,
        password: tempPassword,
        role: 'student'
      });

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