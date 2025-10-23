import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(req: NextRequest) {
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
        { error: 'Unauthorized - please login' },
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
        { error: 'Only school administrators and teachers can update students' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      studentId,
      userId,
      name,
      dob,
      gender,
      grade,
      phone,
      address
    } = body;

    // 1. Update student record with ALL fields
    const { error: studentError } = await supabaseAdmin
      .from('students')
      .update({
        dob: dob || null,
        gender: gender || null,
        grade: grade || null,
        phone: phone || null,
        address: address || null
      })
      .eq('id', studentId);

    if (studentError) {
      console.error('Student update error:', studentError);
      return NextResponse.json({ error: studentError.message }, { status: 400 });
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
