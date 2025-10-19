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

    // Check if user is a school admin
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

    if (profile.role !== 'school') {
      return NextResponse.json(
        { error: 'Only school administrators can create teacher accounts' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { name, email, password, phone, classIds, subject, qualification, experience, address, bio } = body;
    
    // Use school_id from authenticated user's profile
    const schoolId = profile.school_id;

    // 1. Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    const userExists = existingUser?.users?.find((u: any) => u.email === email);

    let authData: any;

    if (userExists) {
      // Check if teacher record exists
      const { data: existingTeacher } = await supabaseAdmin
        .from('teachers')
        .select('*')
        .eq('user_id', userExists.id)
        .single();

      if (existingTeacher) {
        return NextResponse.json({
          error: 'A teacher with this email already exists'
        }, { status: 400 });
      }

      // User exists but not as teacher - we can convert them
      // Update user metadata
      await supabaseAdmin.auth.admin.updateUserById(userExists.id, {
        user_metadata: {
          ...userExists.user_metadata,
          role: 'teacher',
          display_name: name,
          school_id: schoolId
        }
      });

      authData = { user: userExists };
    } else {
      // Create new auth user
      const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'teacher',
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

    // 2. Create teacher record
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        user_id: authData.user.id,
        school_id: schoolId,
        subject: subject || null,
        qualification: qualification || null,
        experience: experience ? parseInt(experience) : null,
        address: address || null,
        bio: bio || null
      })
      .select()
      .single();

    if (teacherError) {
      console.error('Teacher error:', teacherError);
      // Cleanup: delete auth user if teacher creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: teacherError.message }, { status: 400 });
    }

    // 3. Ensure user profile exists (trigger should create it, but upsert to be sure)
    await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        email: email,
        display_name: name,
        phone: phone || null,
        role: 'teacher',
        school_id: schoolId
      });

    // 4. Assign classes if provided
    if (classIds && classIds.length > 0) {
      const classAssignments = classIds.map((classId: string) => ({
        teacher_id: teacher.id,
        class_id: classId
      }));

      await supabaseAdmin
        .from('teacher_classes')
        .insert(classAssignments);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: teacher.id,
        email,
        password, // Return password once for the school to share
        name
      }
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Failed to create teacher account' },
      { status: 500 }
    );
  }
}