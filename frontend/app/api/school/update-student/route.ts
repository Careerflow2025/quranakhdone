import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize admin client with service role key
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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentId,
      userId,
      name,
      age,
      grade,
      gender,
      phone
    } = body;

    // Calculate DOB from age if provided
    let dobValue = null;
    if (age) {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - parseInt(age);
      dobValue = `${birthYear}-01-01`;
    }

    // 1. Update student record (students table has: user_id, school_id, dob, gender, grade, active)
    const { error: studentError } = await supabaseAdmin
      .from('students')
      .update({
        dob: dobValue,
        grade: grade || null,
        gender: gender || null
      })
      .eq('id', studentId);

    if (studentError) {
      console.error('Student update error:', studentError);
      throw studentError;
    }

    // 2. Update profile record (profiles table has: display_name, email, phone)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        display_name: name,
        phone: phone || null
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw profileError;
    }

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully'
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update student' },
      { status: 500 }
    );
  }
}
