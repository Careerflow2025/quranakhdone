import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// POST - Link a parent to a student
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

    // Only owner, admin, and teacher can link parents to students
    if (profile.role !== 'owner' && profile.role !== 'admin' && profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only school administrators and teachers can link parents to students' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { parent_id, student_id } = body;

    if (!parent_id || !student_id) {
      return NextResponse.json(
        { error: 'Both parent_id and student_id are required' },
        { status: 400 }
      );
    }

    console.log('🔗 Linking parent to student...');
    console.log('Parent ID:', parent_id);
    console.log('Student ID:', student_id);

    // Verify parent exists and belongs to same school
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('parents')
      .select('id, school_id')
      .eq('id', parent_id)
      .eq('school_id', profile.school_id)
      .single();

    if (parentError || !parent) {
      console.error('❌ Parent not found or wrong school:', parentError);
      return NextResponse.json(
        { error: 'Parent not found or does not belong to your school' },
        { status: 404 }
      );
    }

    // Verify student exists and belongs to same school
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, school_id')
      .eq('id', student_id)
      .eq('school_id', profile.school_id)
      .single();

    if (studentError || !student) {
      console.error('❌ Student not found or wrong school:', studentError);
      return NextResponse.json(
        { error: 'Student not found or does not belong to your school' },
        { status: 404 }
      );
    }

    // Check if link already exists
    const { data: existingLink, error: checkError } = await supabaseAdmin
      .from('parent_students')
      .select('*')
      .eq('parent_id', parent_id)
      .eq('student_id', student_id)
      .single();

    if (existingLink) {
      console.log('⚠️  Link already exists');
      return NextResponse.json(
        { error: 'This parent is already linked to this student' },
        { status: 400 }
      );
    }

    // Create the link
    const { data: link, error: linkError } = await supabaseAdmin
      .from('parent_students')
      .insert({
        parent_id,
        student_id
      })
      .select()
      .single();

    if (linkError) {
      console.error('❌ Link creation error:', linkError);
      return NextResponse.json(
        { error: `Failed to link parent to student: ${linkError.message}` },
        { status: 400 }
      );
    }

    console.log('✅ Parent-student link created successfully');

    // Get count of all children for this parent
    const { count, error: countError } = await supabaseAdmin
      .from('parent_students')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', parent_id);

    return NextResponse.json({
      success: true,
      link,
      total_children: count || 1
    });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Failed to link parent to student' },
      { status: 500 }
    );
  }
}

// DELETE - Unlink a parent from a student
export async function DELETE(req: NextRequest) {
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

    // Only owner, admin, and teacher can unlink parents from students
    if (profile.role !== 'owner' && profile.role !== 'admin' && profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only school administrators and teachers can unlink parents from students' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parent_id = searchParams.get('parent_id');
    const student_id = searchParams.get('student_id');

    if (!parent_id || !student_id) {
      return NextResponse.json(
        { error: 'Both parent_id and student_id are required' },
        { status: 400 }
      );
    }

    console.log('🔓 Unlinking parent from student...');
    console.log('Parent ID:', parent_id);
    console.log('Student ID:', student_id);

    // Verify ownership (parent and student belong to same school as requester)
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('parents')
      .select('school_id')
      .eq('id', parent_id)
      .single();

    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('school_id')
      .eq('id', student_id)
      .single();

    if (parentError || studentError || parent?.school_id !== profile.school_id || student?.school_id !== profile.school_id) {
      return NextResponse.json(
        { error: 'Parent or student not found or does not belong to your school' },
        { status: 404 }
      );
    }

    // Delete the link
    const { error: deleteError } = await supabaseAdmin
      .from('parent_students')
      .delete()
      .eq('parent_id', parent_id)
      .eq('student_id', student_id);

    if (deleteError) {
      console.error('❌ Unlink error:', deleteError);
      return NextResponse.json(
        { error: `Failed to unlink parent from student: ${deleteError.message}` },
        { status: 400 }
      );
    }

    console.log('✅ Parent-student link removed successfully');

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Failed to unlink parent from student' },
      { status: 500 }
    );
  }
}

// GET - Get all students for a parent
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

    // Get user profile
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

    const { searchParams } = new URL(req.url);
    const parent_id = searchParams.get('parent_id');

    if (!parent_id) {
      return NextResponse.json(
        { error: 'parent_id is required' },
        { status: 400 }
      );
    }

    console.log('👨‍👩‍👧‍👦 Fetching children for parent:', parent_id);

    // Verify parent belongs to same school
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('parents')
      .select('school_id')
      .eq('id', parent_id)
      .single();

    if (parentError || !parent || parent.school_id !== profile.school_id) {
      return NextResponse.json(
        { error: 'Parent not found or does not belong to your school' },
        { status: 404 }
      );
    }

    // Get all students linked to this parent
    const { data: links, error: linksError } = await supabaseAdmin
      .from('parent_students')
      .select(`
        student_id,
        students (
          id,
          user_id,
          school_id,
          dob,
          gender,
          active,
          profiles!students_user_id_fkey (
            display_name,
            email
          )
        )
      `)
      .eq('parent_id', parent_id);

    if (linksError) {
      console.error('❌ Error fetching children:', linksError);
      return NextResponse.json(
        { error: `Failed to fetch children: ${linksError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${links?.length || 0} children for parent`);

    return NextResponse.json({
      success: true,
      children: links || []
    });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    );
  }
}
