// CORRECT Credential System for QuranAkh
// Teachers/Students/Parents do NOT get Supabase Auth accounts
// They get credentials stored in user_credentials table

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

// ============ CREATE TEACHER (NO SUPABASE AUTH) ============
export async function createTeacher(data: {
  name: string;
  email: string;
  phone?: string;
  schoolId: string;
  subject?: string;
  qualification?: string;
  experience?: string;
  assignedClasses?: string[];
}) {
  try {
    // Generate password and unique ID for teacher
    const password = generatePassword();
    const teacherId = crypto.randomUUID();

    // 1. Create profile first (this holds name and email)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: teacherId,
        school_id: data.schoolId,
        role: 'teacher',
        display_name: data.name,
        email: data.email
      });

    if (profileError) throw profileError;

    // 2. Create teacher record in database (linked to profile via user_id)
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        user_id: teacherId,
        school_id: data.schoolId,
        full_name: data.name,
        email: data.email,
        phone: data.phone,
        qualifications: data.qualification || '',
        experience: data.experience || ''
      })
      .select()
      .single();

    if (teacherError) throw teacherError;

    // 3. Store credentials in user_credentials table
    const { error: credError } = await supabaseAdmin
      .from('user_credentials')
      .insert({
        school_id: data.schoolId,
        email: data.email,
        password: password, // Store plaintext (as per your system)
        role: 'teacher',
        user_type: 'teacher',
        user_id: teacherId
      });

    if (credError) throw credError;

    // 3. Assign to classes if provided
    if (data.assignedClasses && data.assignedClasses.length > 0) {
      const classAssignments = data.assignedClasses.map(classId => ({
        teacher_id: teacher.id,
        class_id: classId
      }));

      await supabaseAdmin
        .from('teacher_classes')
        .insert(classAssignments);

      // Update classes with teacher
      for (const classId of data.assignedClasses) {
        await supabaseAdmin
          .from('classes')
          .update({ teacher_id: teacher.id })
          .eq('id', classId)
          .is('teacher_id', null);
      }
    }

    // 4. Trigger email edge function to send credentials
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

    return {
      success: true,
      teacher,
      credentials: {
        email: data.email,
        password: password
      },
      message: 'Teacher created successfully. Credentials email sent.'
    };
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    return { success: false, error: error.message };
  }
}

// ============ CREATE STUDENT (NO SUPABASE AUTH) ============
export async function createStudent(data: {
  name: string;
  email?: string;
  classId: string;
  schoolId: string;
  dateOfBirth?: string;
  parentEmail?: string;
}) {
  try {
    const studentId = crypto.randomUUID();

    // 1. Create profile first (if student has email)
    if (data.email) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: studentId,
          school_id: data.schoolId,
          role: 'student',
          display_name: data.name,
          email: data.email
        });

      if (profileError) throw profileError;
    }

    // 2. Create student record in database (NO auth account, NO user_id in students table)
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        school_id: data.schoolId,
        class_id: data.classId,
        full_name: data.name,
        date_of_birth: data.dateOfBirth,
        parent_email: data.parentEmail
      })
      .select()
      .single();

    if (studentError) throw studentError;

    // 3. If student has email, create credentials
    if (data.email) {
      const password = generatePassword();

      const { error: credError } = await supabaseAdmin
        .from('user_credentials')
        .insert({
          school_id: data.schoolId,
          email: data.email,
          password: password,
          role: 'student',
          user_type: 'student',
          user_id: studentId
        });

      if (credError) throw credError;

      // Send credentials email
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          password: password,
          role: 'student',
          schoolId: data.schoolId
        })
      });
    }

    // 3. Create student progress record
    await supabaseAdmin
      .from('student_progress')
      .insert({
        student_id: student.id,
        overall_progress: 0,
        current_surah: 'Al-Fatiha',
        current_page: 1,
        pages_memorized: 0
      });

    // 4. Update class student count
    const { data: currentClass } = await supabaseAdmin
      .from('classes')
      .select('student_count')
      .eq('id', data.classId)
      .single();

    if (currentClass) {
      await supabaseAdmin
        .from('classes')
        .update({ student_count: (currentClass.student_count || 0) + 1 })
        .eq('id', data.classId);
    }

    return {
      success: true,
      student,
      message: 'Student created successfully'
    };
  } catch (error: any) {
    console.error('Error creating student:', error);
    return { success: false, error: error.message };
  }
}

// ============ CREATE PARENT (NO SUPABASE AUTH) ============
export async function createParent(data: {
  name: string;
  email: string;
  phone?: string;
  relationship?: 'father' | 'mother' | 'guardian' | 'parent';
  studentIds: string[]; // IDs of children to link
  schoolId: string;
}) {
  try {
    const password = generatePassword();
    const parentId = crypto.randomUUID();

    // 1. Create profile first
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: parentId,
        school_id: data.schoolId,
        role: 'parent',
        display_name: data.name,
        email: data.email
      });

    if (profileError) throw profileError;

    // 2. Create parent record (full_name and email required in parents table)
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('parents')
      .insert({
        user_id: parentId,
        full_name: data.name,
        email: data.email,
        phone: data.phone
      })
      .select()
      .single();

    if (parentError) throw parentError;

    // 3. Link parent to students (relationship goes in junction table)
    const links = data.studentIds.map(studentId => ({
      parent_id: parent.id,
      student_id: studentId,
      relationship: data.relationship || 'parent'
    }));

    const { error: linkError } = await supabaseAdmin
      .from('parent_students')
      .insert(links);

    if (linkError) throw linkError;

    // 4. Store credentials
    const { error: credError } = await supabaseAdmin
      .from('user_credentials')
      .insert({
        school_id: data.schoolId,
        email: data.email,
        password: password,
        role: 'parent',
        user_type: 'parent',
        user_id: parentId
      });

    if (credError) throw credError;

    // 4. Send credentials email
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        email: data.email,
        name: data.name,
        password: password,
        role: 'parent',
        schoolId: data.schoolId
      })
    });

    return {
      success: true,
      parent,
      credentials: {
        email: data.email,
        password: password
      },
      message: 'Parent created successfully. Credentials email sent.'
    };
  } catch (error: any) {
    console.error('Error creating parent:', error);
    return { success: false, error: error.message };
  }
}
