// PRODUCTION-READY Authentication Service for Quranakh
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabase-admin';

let supabaseInstance: SupabaseClient | null = null;

// Lazy-load regular client for normal operations
function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// ============ SCHOOL ADMIN FUNCTIONS ============

// Create a new school with admin account
export async function createSchoolWithAdmin(data: {
  schoolName: string;
  schoolEmail: string;
  schoolPhone?: string;
  schoolAddress?: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  schoolType?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  studentCapacity?: string;
  numberOfTeachers?: number;
  establishedYear?: number;
  schoolId?: string;
  timezone?: string;
  subscriptionPlan?: string;
}) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Parse admin name
    const nameParts = data.adminName.split(' ');
    const adminFirstName = nameParts[0];
    const adminLastName = nameParts.slice(1).join(' ');

    // 1. Create the school record (NEW schema: only name + timezone)
    // MUST use supabaseAdmin because RLS policy requires service_role for schools INSERT
    const { data: school, error: schoolError } = (await supabaseAdmin
      .from('schools')
      .insert({
        name: data.schoolName,
        timezone: data.timezone || 'Africa/Casablanca'
      } as any)
      .select()
      .single()) as { data: any; error: any };

    if (schoolError) throw schoolError;

    // 2. Create admin user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.adminEmail,
      password: data.adminPassword,
      email_confirm: true, // Auto-confirm for production
      user_metadata: {
        name: data.adminName,
        role: 'school',
        school_id: school.id
      }
    });

    if (authError) throw authError;

    // 3. Create user profile using admin client to bypass RLS
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authUser.user.id,
        email: data.adminEmail,
        display_name: data.adminName,
        role: 'school',
        school_id: school.id
      } as any);

    // If profile creation fails, don't throw - the trigger might have created it
    if (profileError) {
      console.log('Profile might already exist via trigger:', profileError);
    }

    return { 
      success: true, 
      school,
      admin: authUser.user,
      message: 'School and admin account created successfully'
    };
  } catch (error: any) {
    console.error('Error creating school:', error);
    return { success: false, error: error.message };
  }
}

// ============ TEACHER FUNCTIONS (Called by School Admin) ============

export async function createTeacherAccount(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  schoolId: string;
  assignedClasses: string[];
  qualifications?: string;
  experience?: string;
}) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // 1. Create teacher user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        name: data.name,
        role: 'teacher',
        school_id: data.schoolId
      }
    });

    if (authError) throw authError;

    // 2. Ensure user profile exists (trigger should create it, but update to be sure)
    const supabase = getSupabase();
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: authUser.user.id,
        email: data.email,
        display_name: data.name,
        role: 'teacher',
        school_id: data.schoolId
      } as any);

    if (profileError) throw profileError;

    // 3. Create teacher record
    const { data: teacher, error: teacherError} = (await supabase
      .from('teachers')
      .insert({
        user_id: authUser.user.id,
        school_id: data.schoolId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        qualifications: data.qualifications,
        experience: data.experience,
        status: 'active'
      } as any)
      .select()
      .single()) as { data: any; error: any };

    if (teacherError) throw teacherError;

    // 4. Assign to classes
    if (data.assignedClasses.length > 0) {
      const classAssignments = data.assignedClasses.map(classId => ({
        teacher_id: teacher.id,
        class_id: classId
      }));

      const { error: assignError } = await supabase
        .from('teacher_classes')
        .insert(classAssignments as any);

      if (assignError) throw assignError;

      // Update classes with teacher
      for (const classId of data.assignedClasses) {
        await supabase
          .from('classes')
          .update({ teacher_id: teacher.id } as any)
          .eq('id', classId)
          .is('teacher_id', null);
      }
    }

    return { 
      success: true, 
      teacher,
      credentials: {
        email: data.email,
        password: data.password,
        loginUrl: `${window.location.origin}/auth/login`
      },
      message: 'Teacher account created successfully'
    };
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    return { success: false, error: error.message };
  }
}

// ============ STUDENT & PARENT FUNCTIONS (Called by School Admin) ============

export async function createStudentWithParent(data: {
  // Student info
  studentName: string;
  dateOfBirth?: string;
  classId: string;
  schoolId: string;
  
  // Parent info
  parentName: string;
  parentEmail: string;
  parentPassword: string;
  parentPhone?: string;
  relationship: 'father' | 'mother' | 'guardian' | 'parent';
}) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const supabase = getSupabase();
    
    // 1. Create parent user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.parentEmail,
      password: data.parentPassword,
      email_confirm: true,
      user_metadata: {
        name: data.parentName,
        role: 'parent'
      }
    });

    if (authError) throw authError;

    // 2. Ensure parent user profile exists (trigger should create it, but update to be sure)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: authUser.user.id,
        email: data.parentEmail,
        display_name: data.parentName,
        role: 'parent',
        school_id: null // Parents don't belong to a specific school
      } as any);

    if (profileError) throw profileError;

    // 3. Create parent record
    const { data: parent, error: parentError } = (await supabase
      .from('parents')
      .insert({
        user_id: authUser.user.id,
        name: data.parentName,
        email: data.parentEmail,
        phone: data.parentPhone,
        relationship: data.relationship
      } as any)
      .select()
      .single()) as { data: any; error: any };

    if (parentError) throw parentError;

    // 4. Create student record
    const { data: student, error: studentError } = (await supabase
      .from('students')
      .insert({
        school_id: data.schoolId,
        class_id: data.classId,
        name: data.studentName,
        date_of_birth: data.dateOfBirth,
        status: 'active',
        parent_name: data.parentName,
        parent_email: data.parentEmail,
        parent_phone: data.parentPhone
      } as any)
      .select()
      .single()) as { data: any; error: any };

    if (studentError) throw studentError;

    // 5. Link parent to student
    const { error: linkError } = await supabase
      .from('parent_students')
      .insert({
        parent_id: parent.id,
        student_id: student.id
      } as any);

    if (linkError) throw linkError;

    // 6. Create student progress record
    const { error: progressError } = await supabase
      .from('student_progress')
      .insert({
        student_id: student.id,
        overall_progress: 0,
        current_surah: 'Al-Fatiha',
        current_page: 1,
        pages_memorized: 0
      } as any);

    if (progressError) throw progressError;

    // 7. Update class student count
    const { error: rpcError } = await supabase.rpc('increment', {
      table_name: 'classes',
      row_id: data.classId,
      column_name: 'student_count',
      increment_value: 1
    });

    if (rpcError) {
      // Fallback: fetch current count and increment
      const { data: currentClass } = await supabase
        .from('classes')
        .select('student_count')
        .eq('id', data.classId)
        .single();

      if (currentClass) {
        await supabase
          .from('classes')
          .update({
            student_count: (currentClass.student_count || 0) + 1
          } as any)
          .eq('id', data.classId);
      }
    }

    return { 
      success: true, 
      student,
      parent,
      credentials: {
        email: data.parentEmail,
        password: data.parentPassword,
        loginUrl: `${window.location.origin}/auth/login`,
        childName: data.studentName
      },
      message: 'Student and parent accounts created successfully'
    };
  } catch (error: any) {
    console.error('Error creating student/parent:', error);
    return { success: false, error: error.message };
  }
}

// ============ LOGIN FUNCTION WITH ROLE DETECTION ============

export async function loginWithRole(email: string, password: string) {
  try {
    const supabase = getSupabase();
    // 1. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Login failed');

    // 2. Get user role from profile
    const { data: profile, error: profileError} = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    // 3. Get additional data based on role
    let additionalData = null;
    let redirectPath = '/';

    switch (profile.role) {
      case 'school':
        const { data: school } = await supabase
          .from('schools')
          .select('id, name, logo_url, timezone, created_at, updated_at')
          .eq('id', profile.school_id)
          .single();
        additionalData = school;
        redirectPath = '/school-dashboard';  // Using actual route with -dashboard suffix
        break;

      case 'teacher':
        const { data: teacher } = await supabase
          .from('teachers')
          .select(`
            *,
            school:schools(name),
            assigned_classes:teacher_classes(
              class:classes(*)
            )
          `)
          .eq('user_id', authData.user.id)
          .single();
        additionalData = teacher;
        redirectPath = '/teacher-dashboard';  // Using actual route with -dashboard suffix
        break;

      case 'parent':
        const { data: parent } = await supabase
          .from('parents')
          .select(`
            *,
            children:parent_students(
              student:students(
                *,
                progress:student_progress(*),
                class:classes(
                  name,
                  teacher:teachers(name)
                )
              )
            )
          `)
          .eq('user_id', authData.user.id)
          .single();
        additionalData = parent;
        redirectPath = '/parent-dashboard';  // Using actual route with -dashboard suffix
        break;
    }

    // 4. Store session data
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', profile.role);
      localStorage.setItem('schoolId', profile.school_id || '');
      if (additionalData) {
        localStorage.setItem('userData', JSON.stringify(additionalData));
      }
    }

    return {
      success: true,
      user: authData.user,
      role: profile.role,
      schoolId: profile.school_id,
      additionalData,
      redirectPath
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.message || 'Invalid email or password'
    };
  }
}

// ============ HELPER FUNCTIONS ============

// Get current user with role
export async function getCurrentUser() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, school_id')
    .eq('user_id', user.id)
    .single();

  return {
    ...user,
    role: profile?.role,
    schoolId: profile?.school_id
  };
}

// Sign out
export async function signOut() {
  const supabase = getSupabase();
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    localStorage.clear();
    window.location.href = '/auth/login';
  }
}

// Check if email exists
export async function checkEmailExists(email: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  return data?.users?.some((user: any) => user.email === email) || false;
}

// Generate secure password
export function generateSecurePassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}