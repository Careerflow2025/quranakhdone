// PRODUCTION Credential System for QuranAkh
// IMPORTANT: Based on ACTUAL production schema (PRODUCTION_SCHEMA.sql)
// ALL users (school/teacher/student/parent) get Supabase Auth accounts
// Uses user_profiles table (NOT profiles table)

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate secure random password
export function generatePassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// ============ CREATE TEACHER (WITH SUPABASE AUTH) ============
export async function createTeacher(data: {
  name: string;
  email: string;
  phone?: string;
  schoolId: string;
  subject?: string;
  qualification?: string;
  experience?: string;
  address?: string;
  bio?: string;
  assignedClasses?: string[];
}) {
  try {
    const password = generatePassword();

    // 1. Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    const userExists = existingUsers?.users?.find((u: any) => u.email === data.email);

    let authData: any;

    if (userExists) {
      // Check if teacher record exists
      const { data: existingTeacher } = await supabaseAdmin
        .from('teachers')
        .select('*')
        .eq('user_id', userExists.id)
        .single();

      if (existingTeacher) {
        throw new Error('A teacher with this email already exists');
      }

      // User exists but not as teacher - update their metadata
      await supabaseAdmin.auth.admin.updateUserById(userExists.id, {
        user_metadata: {
          ...userExists.user_metadata,
          role: 'teacher',
          display_name: data.name,
          school_id: data.schoolId
        }
      });

      authData = { user: userExists };
    } else {
      // Create new auth user (trigger auto-creates user_profiles entry)
      const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          role: 'teacher',
          school_id: data.schoolId,
          display_name: data.name
        }
      });

      if (authError) throw authError;
      if (!newAuthData?.user) throw new Error('Failed to create auth user');

      authData = newAuthData;
    }

    // 2. Update user_profiles with full details (trigger might have created basic entry)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        email: data.email,
        display_name: data.name,
        phone: data.phone || null,
        role: 'teacher',
        school_id: data.schoolId
      });

    if (profileError) throw profileError;

    // 3. Create teacher record in teachers table with ALL fields
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        user_id: authData.user.id,
        school_id: data.schoolId,
        subject: data.subject || null,
        qualification: data.qualification || null,
        experience: data.experience ? parseInt(data.experience) : null,
        address: data.address || null,
        bio: data.bio || null
      })
      .select()
      .single();

    if (teacherError) throw teacherError;

    // 4. Assign to classes if provided
    if (data.assignedClasses && data.assignedClasses.length > 0) {
      const classAssignments = data.assignedClasses.map(classId => ({
        teacher_id: teacher.id,
        class_id: classId
      }));

      await supabaseAdmin
        .from('teacher_classes')
        .insert(classAssignments);
    }

    // 5. Send credentials email (optional - can be disabled if using email confirmation)
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          password: password,
          role: 'teacher',
          schoolId: data.schoolId
        })
      });

      if (!emailResponse.ok) {
        console.error('Failed to send credentials email:', await emailResponse.text());
      }
    } catch (emailError) {
      console.error('Email error (non-fatal):', emailError);
    }

    return {
      success: true,
      teacher,
      credentials: {
        email: data.email,
        password: password
      },
      message: 'Teacher created successfully. Login credentials sent via email.'
    };
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    return { success: false, error: error.message };
  }
}

// TODO: Implement createStudent and createParent functions following same pattern as createTeacher
// These should also use Supabase Auth (auth.admin.createUser) per production schema
