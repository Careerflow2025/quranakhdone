import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// POST - Create a new class with teacher and student assignments
export async function POST(req: NextRequest) {
  try {
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

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    // Only owner, admin, and teacher can create classes
    if (profile.role !== 'owner' && profile.role !== 'admin' && profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only school administrators and teachers can create classes' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, room, schedule, created_by, teacher_id, student_ids } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Class name is required' },
        { status: 400 }
      );
    }

    console.log('🏫 Creating class...');
    console.log('Name:', name);
    console.log('Description:', description);
    console.log('Room:', room);
    console.log('Schedule:', schedule);
    console.log('School ID:', profile.school_id);
    console.log('Teacher ID:', teacher_id);
    console.log('Student IDs:', student_ids);

    // Create class in database
    const { data: newClass, error: classError } = await supabaseAdmin
      .from('classes')
      .insert({
        school_id: profile.school_id,
        name,
        room: room || null,
        schedule_json: schedule ? { schedule } : {},
        created_by: created_by || null
      })
      .select()
      .single();

    if (classError) {
      console.error('❌ Class creation error:', classError);
      return NextResponse.json(
        { error: `Failed to create class: ${classError.message}` },
        { status: 400 }
      );
    }

    console.log('✅ Class created successfully:', newClass.id);

    // If teacher_id provided, create class_teachers record
    if (teacher_id) {
      const { error: teacherError } = await supabaseAdmin
        .from('class_teachers')
        .insert({
          class_id: newClass.id,
          teacher_id: teacher_id
        });

      if (teacherError) {
        console.error('⚠️ Error assigning teacher to class:', teacherError);
        // Don't fail the request, class is already created
      } else {
        console.log('✅ Teacher assigned to class');
      }
    }

    // If student_ids provided, create class_enrollments records
    if (student_ids && Array.isArray(student_ids) && student_ids.length > 0) {
      const enrollments = student_ids.map(student_id => ({
        class_id: newClass.id,
        student_id: student_id
      }));

      const { error: enrollmentError } = await supabaseAdmin
        .from('class_enrollments')
        .insert(enrollments);

      if (enrollmentError) {
        console.error('⚠️ Error enrolling students in class:', enrollmentError);
        // Don't fail the request, class is already created
      } else {
        console.log(`✅ Enrolled ${student_ids.length} students in class`);
      }
    }

    return NextResponse.json({
      success: true,
      data: newClass,  // Add .data field for test compatibility
      class: newClass
    }, { status: 201 });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
}

// GET - Fetch all classes for the school
export async function GET(req: NextRequest) {
  try {
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

    // Get user profile to find school_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    // Fetch all classes for the school
    const { data: classes, error: classesError } = await supabaseAdmin
      .from('classes')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false });

    if (classesError) {
      console.error('Error fetching classes:', classesError);
      return NextResponse.json(
        { error: `Failed to fetch classes: ${classesError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: classes || [],
      classes: classes || []
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
