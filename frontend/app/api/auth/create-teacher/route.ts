import { NextRequest, NextResponse } from 'next/server';
import { createTeacher } from '@/lib/credentials-system';
import { createClient } from '@supabase/supabase-js';

// Create admin client for verification
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
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

    // Check if user is a school admin (using PRODUCTION schema: user_profiles table)
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'school_admin') {
      return NextResponse.json(
        { error: 'Only school administrators can create teacher accounts' },
        { status: 403 }
      );
    }

    // Get the request data
    const body = await req.json();

    // Create teacher using the correct credential system (NO Supabase Auth)
    const result = await createTeacher({
      name: body.name,
      email: body.email,
      phone: body.phone,
      schoolId: profile.school_id,
      subject: body.subject,
      qualification: body.qualification,
      experience: body.experience,
      assignedClasses: body.assignedClasses || []
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create teacher account' },
      { status: 500 }
    );
  }
}