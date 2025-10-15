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
      studentName, 
      dateOfBirth, 
      classId, 
      schoolId,
      parentEmail, 
      parentName, 
      parentPhone,
      parentPassword 
    } = body;

    // 1. Check if parent already exists
    const { data: existingParent } = await supabaseAdmin
      .from('parents')
      .select('id, user_id')
      .eq('email', parentEmail)
      .single();

    let parentId;
    let parentUserId;

    if (existingParent) {
      // Parent exists, use existing
      parentId = existingParent.id;
      parentUserId = existingParent.user_id;
    } else {
      // Check if user exists but not as parent
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });

      const existingUser = existingUsers?.users?.find((u: any) => u.email === parentEmail);
      
      if (existingUser) {
        // User exists but not as parent - convert them
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            ...existingUser.user_metadata,
            role: 'parent',
            full_name: parentName
          }
        });
        parentUserId = existingUser.id;
      } else {
        // Create new parent account
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: parentEmail,
          password: parentPassword,
          email_confirm: true,
          user_metadata: {
            role: 'parent',
            full_name: parentName,
            school_id: schoolId
          }
        });

        if (authError) {
          return NextResponse.json({ error: authError.message }, { status: 400 });
        }
        parentUserId = authData.user.id;
      }

      // Create parent record
      const { data: parent, error: parentError } = await supabaseAdmin
        .from('parents')
        .insert({
          user_id: parentUserId,
          full_name: parentName,
          email: parentEmail,
          phone: parentPhone
        })
        .select()
        .single();

      if (parentError) {
        // Cleanup auth user if parent creation fails
        await supabaseAdmin.auth.admin.deleteUser(parentUserId);
        return NextResponse.json({ error: parentError.message }, { status: 400 });
      }

      parentId = parent.id;

      // Update user profile
      await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: parentUserId,
          email: parentEmail,
          display_name: parentName,
          role: 'parent',
          school_id: schoolId
        });
    }

    // 2. Create student record
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        school_id: schoolId,
        class_id: classId,
        full_name: studentName,
        date_of_birth: dateOfBirth,
        parent_email: parentEmail
      })
      .select()
      .single();

    if (studentError) {
      return NextResponse.json({ error: studentError.message }, { status: 400 });
    }

    // 3. Link parent to student
    await supabaseAdmin
      .from('parent_students')
      .insert({
        parent_id: parentId,
        student_id: student.id,
        relationship: 'parent'
      });

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: studentName
        },
        parent: {
          id: parentId,
          email: parentEmail,
          password: existingParent ? null : parentPassword, // Only return password for new parents
          isNew: !existingParent
        }
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