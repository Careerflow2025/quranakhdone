import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Get the current user and verify they're a school admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check if user is a school admin or teacher
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single() as { data: { role: string; school_id: string } | null };

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    if (profile.role !== 'school' && profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only school administrators and teachers can update students' },
        { status: 403 }
      );
    }
    
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
