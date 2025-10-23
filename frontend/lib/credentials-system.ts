// PRODUCTION Credential System for QuranAkh
// IMPORTANT: Based on ACTUAL production schema (PRODUCTION_SCHEMA.sql)
// ALL users (school/teacher/student/parent) get Supabase Auth accounts
// Uses user_profiles table (NOT profiles table)

import { getSupabaseAdmin } from './supabase-admin';

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
    const supabaseAdmin = getSupabaseAdmin();
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
    // NOTE: profiles table schema only has: user_id, email, display_name, role, school_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        email: data.email,
        display_name: data.name,
        role: 'teacher',
        school_id: data.schoolId
      });

    if (profileError) throw profileError;

    // 3. Create teacher record in teachers table
    // NOTE: teachers table schema only has: id, user_id, school_id, bio, active, created_at
    // Fields like subject, qualification, experience, address don't exist in current schema
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        user_id: authData.user.id,
        school_id: data.schoolId,
        bio: data.bio || null,
        active: true
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
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\n/g, '')}`
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

// ============ CREATE STUDENT (WITH SUPABASE AUTH) ============
export async function createStudent(data: {
  name: string;
  email: string;
  schoolId: string;
  dob?: string;
  gender?: string;
  age?: number;
}) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const password = generatePassword();

    // 1. Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    const userExists = existingUsers?.users?.find((u: any) => u.email === data.email);

    let authData: any;

    if (userExists) {
      // Check if student record exists
      const { data: existingStudent } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('user_id', userExists.id)
        .single();

      if (existingStudent) {
        throw new Error('A student with this email already exists');
      }

      // User exists but not as student - update their metadata
      await supabaseAdmin.auth.admin.updateUserById(userExists.id, {
        user_metadata: {
          ...userExists.user_metadata,
          role: 'student',
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
          role: 'student',
          school_id: data.schoolId,
          display_name: data.name
        }
      });

      if (authError) throw authError;
      if (!newAuthData?.user) throw new Error('Failed to create auth user');

      authData = newAuthData;
    }

    // 2. Update profiles with full details (trigger might have created basic entry)
    // NOTE: profiles table schema only has: user_id, email, display_name, role, school_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        email: data.email,
        display_name: data.name,
        role: 'student',
        school_id: data.schoolId
      });

    if (profileError) throw profileError;

    // 3. Calculate date of birth from age if provided
    let dobValue = data.dob || null;
    if (!dobValue && data.age) {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - data.age;
      dobValue = `${birthYear}-01-01`;
    }

    // 4. Create student record in students table
    // NOTE: students table schema only has: id, user_id, school_id, dob, gender, active, created_at
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: authData.user.id,
        school_id: data.schoolId,
        dob: dobValue,
        gender: data.gender || null,
        active: true
      })
      .select()
      .single();

    if (studentError) throw studentError;

    // 5. Send credentials email (optional - can be disabled if using email confirmation)
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\n/g, '')}`
        },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          password: password,
          role: 'student',
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
      student,
      credentials: {
        email: data.email,
        password: password
      },
      message: 'Student created successfully. Login credentials sent via email.'
    };
  } catch (error: any) {
    console.error('Error creating student:', error);
    return { success: false, error: error.message };
  }
}

// ============ CREATE PARENT (WITH SUPABASE AUTH) ============
export async function createParent(data: {
  name: string;
  email: string;
  schoolId: string;
}) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const password = generatePassword();

    // 1. Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    const userExists = existingUsers?.users?.find((u: any) => u.email === data.email);

    let authData: any;

    if (userExists) {
      // Check if parent record exists
      const { data: existingParent } = await supabaseAdmin
        .from('parents')
        .select('*')
        .eq('user_id', userExists.id)
        .single();

      if (existingParent) {
        throw new Error('A parent with this email already exists');
      }

      // User exists but not as parent - update their metadata
      await supabaseAdmin.auth.admin.updateUserById(userExists.id, {
        user_metadata: {
          ...userExists.user_metadata,
          role: 'parent',
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
          role: 'parent',
          school_id: data.schoolId,
          display_name: data.name
        }
      });

      if (authError) throw authError;
      if (!newAuthData?.user) throw new Error('Failed to create auth user');

      authData = newAuthData;
    }

    // 2. Update profiles with full details (trigger might have created basic entry)
    // NOTE: profiles table schema only has: user_id, email, display_name, role, school_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        email: data.email,
        display_name: data.name,
        role: 'parent',
        school_id: data.schoolId
      });

    if (profileError) throw profileError;

    // 3. Create parent record in parents table
    // NOTE: parents table schema only has: id, user_id, school_id, created_at
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('parents')
      .insert({
        user_id: authData.user.id,
        school_id: data.schoolId
      })
      .select()
      .single();

    if (parentError) throw parentError;

    // 4. Send credentials email (optional - can be disabled if using email confirmation)
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\n/g, '')}`
        },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          password: password,
          role: 'parent',
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
      parent,
      credentials: {
        email: data.email,
        password: password
      },
      message: 'Parent created successfully. Login credentials sent via email.'
    };
  } catch (error: any) {
    console.error('Error creating parent:', error);
    return { success: false, error: error.message };
  }
}
