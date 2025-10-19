import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
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
        { error: 'Only school administrators can create parent accounts' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { name, email, password, phone, studentIds, address } = body;
    
    // Use school_id from authenticated user's profile
    const schoolId = profile.school_id;

    console.log('🚀 Starting parent creation with Service Role Key...');

    // Step 1: Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    const userExists = existingUsers?.users?.find((u: any) => u.email === email);

    let authData: any;

    if (userExists) {
      console.log('📧 User exists, checking for existing parent record...');

      // Check if parent record already exists
      const { data: existingParent } = await supabaseAdmin
        .from('parents')
        .select('*')
        .eq('user_id', userExists.id)
        .single();

      if (existingParent) {
        console.error('❌ Parent already exists');
        return NextResponse.json({
          error: 'A parent with this email already exists'
        }, { status: 400 });
      }

      // Update user metadata to include parent role
      console.log('🔄 Updating existing user metadata...');
      await supabaseAdmin.auth.admin.updateUserById(userExists.id, {
        user_metadata: {
          ...userExists.user_metadata,
          role: 'parent',
          display_name: name,
          school_id: schoolId
        }
      });

      authData = { user: userExists };
    } else {
      // Create new auth user using ADMIN API
      console.log('👤 Creating new auth user...');
      const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'parent',
          display_name: name,
          school_id: schoolId
        }
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      console.log('✅ Auth user created:', newAuthData.user.id);
      authData = newAuthData;
    }

    // Step 2: Create parent record (BYPASSES RLS with Service Role Key)
    console.log('👨‍👩‍👧‍👦 Creating parent record...');
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('parents')
      .insert({
        user_id: authData.user.id,
        school_id: schoolId,
        phone: phone || null,
        address: address || null
      })
      .select()
      .single();

    if (parentError) {
      console.error('❌ Parent error:', parentError);
      // Cleanup: delete auth user if parent creation fails
      if (!userExists) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      }
      return NextResponse.json({ error: parentError.message }, { status: 400 });
    }

    console.log('✅ Parent record created:', parent.id);

    // Step 3: Ensure profile exists (BYPASSES RLS)
    console.log('📝 Creating/updating profile...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        email: email,
        display_name: name,
        phone: phone || null,
        role: 'parent',
        school_id: schoolId
      });

    if (profileError) {
      console.error('⚠️ Profile error (non-critical):', profileError);
    } else {
      console.log('✅ Profile created/updated');
    }

    // Step 4: Link parent to students (CRITICAL - can link to multiple children)
    if (studentIds && studentIds.length > 0) {
      console.log(`🔗 Linking parent to ${studentIds.length} student(s)...`);

      const parentStudentLinks = studentIds.map((studentId: string) => ({
        parent_id: parent.id,
        student_id: studentId
      }));

      const { error: linkError } = await supabaseAdmin
        .from('parent_students')
        .insert(parentStudentLinks);

      if (linkError) {
        console.error('❌ Parent-student link error:', linkError);
        // Cleanup: delete parent and auth user
        await supabaseAdmin.from('parents').delete().eq('id', parent.id);
        if (!userExists) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        }
        return NextResponse.json({
          error: `Failed to link parent to students: ${linkError.message}`
        }, { status: 400 });
      }

      console.log('✅ Parent linked to students successfully');
    } else {
      console.log('⚠️ No students to link (this is unusual but allowed)');
    }

    console.log('🎉 Parent creation complete!');

    return NextResponse.json({
      success: true,
      data: {
        id: parent.id,
        email,
        password,
        name,
        linkedStudents: studentIds?.length || 0
      }
    });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Failed to create parent account' },
      { status: 500 }
    );
  }
}
