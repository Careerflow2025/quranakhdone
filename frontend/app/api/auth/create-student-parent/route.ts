import { NextRequest, NextResponse } from 'next/server';
import { createStudentWithParent } from '@/lib/supabase-auth-service';
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

    // Check if user is a school admin
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'owner' && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only school administrators can create student accounts' },
        { status: 403 }
      );
    }

    // Get the request data
    const body = await req.json();
    
    // Create student with parent account with the school_id from the admin's profile
    const result = await createStudentWithParent({
      ...body,
      schoolId: profile.school_id
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating student/parent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create student and parent accounts' },
      { status: 500 }
    );
  }
}