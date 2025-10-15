import { supabase } from './supabase';

export type UserRole = 'school_admin' | 'teacher' | 'parent' | 'student';

interface CreateUserParams {
  email: string;
  password: string;
  role: UserRole;
  schoolId?: string;
  metadata?: any;
}

// Create a new user with role
export async function createUserWithRole({ 
  email, 
  password, 
  role, 
  schoolId, 
  metadata 
}: CreateUserParams) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          school_id: schoolId,
          ...metadata
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Update the user's role in auth.users table
    const { error: updateError } = await supabase.rpc('update_user_role', {
      user_id: authData.user.id,
      user_role: role,
      user_school_id: schoolId
    });

    if (updateError) console.error('Error updating user role:', updateError);

    return { user: authData.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

// Create teacher account (called by school)
export async function createTeacherAccount(
  teacherData: {
    email: string;
    password: string;
    name: string;
    schoolId: string;
    phone?: string;
    assignedClasses?: string[];
  }
) {
  try {
    // 1. Create auth user
    const { user, error } = await createUserWithRole({
      email: teacherData.email,
      password: teacherData.password,
      role: 'teacher',
      schoolId: teacherData.schoolId,
      metadata: { name: teacherData.name }
    });

    if (error || !user) throw new Error(error || 'Failed to create user');

    // 2. Create teacher record
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .insert({
        user_id: user.id,
        school_id: teacherData.schoolId,
        name: teacherData.name,
        email: teacherData.email,
        phone: teacherData.phone,
        status: 'active'
      })
      .select()
      .single();

    if (teacherError) throw teacherError;

    // 3. Assign to classes
    if (teacherData.assignedClasses && teacherData.assignedClasses.length > 0) {
      const classAssignments = teacherData.assignedClasses.map(classId => ({
        teacher_id: teacher.id,
        class_id: classId
      }));

      await supabase.from('teacher_classes').insert(classAssignments);
    }

    return { teacher, error: null };
  } catch (error: any) {
    return { teacher: null, error: error.message };
  }
}

// Create parent account (called by school when adding student)
export async function createParentAccount(
  parentData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    studentId: string;
    relationship?: string;
  }
) {
  try {
    // 1. Create auth user
    const { user, error } = await createUserWithRole({
      email: parentData.email,
      password: parentData.password,
      role: 'parent',
      metadata: { name: parentData.name }
    });

    if (error || !user) throw new Error(error || 'Failed to create user');

    // 2. Create parent record
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .insert({
        user_id: user.id,
        name: parentData.name,
        email: parentData.email,
        phone: parentData.phone,
        relationship: parentData.relationship || 'parent'
      })
      .select()
      .single();

    if (parentError) throw parentError;

    // 3. Link to student
    await supabase.from('parent_students').insert({
      parent_id: parent.id,
      student_id: parentData.studentId
    });

    return { parent, error: null };
  } catch (error: any) {
    return { parent: null, error: error.message };
  }
}

// Enhanced sign in with role detection
export async function signInWithRole(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sign in failed');

    // Get user role from metadata or database
    const role = data.user.user_metadata?.role;
    const schoolId = data.user.user_metadata?.school_id;

    // Fetch additional data based on role
    let additionalData = null;
    
    switch (role) {
      case 'teacher':
        const { data: teacher } = await supabase
          .from('teachers')
          .select('*, classes:teacher_classes(class_id)')
          .eq('user_id', data.user.id)
          .single();
        additionalData = teacher;
        break;
        
      case 'parent':
        const { data: parent } = await supabase
          .from('parents')
          .select('*, children:parent_students(student_id)')
          .eq('user_id', data.user.id)
          .single();
        additionalData = parent;
        break;
        
      case 'school_admin':
        const { data: school } = await supabase
          .from('schools')
          .select('*')
          .eq('id', schoolId)
          .single();
        additionalData = school;
        break;
    }

    return {
      user: data.user,
      role,
      schoolId,
      additionalData,
      error: null
    };
  } catch (error: any) {
    return { user: null, role: null, error: error.message };
  }
}

// Get dashboard route based on role
export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'school_admin':
      return '/school/dashboard';
    case 'teacher':
      return '/teacher/dashboard';
    case 'parent':
      return '/parent/dashboard';
    case 'student':
      return '/student/dashboard';
    default:
      return '/auth/login';
  }
}

// Check if user has access to a specific route
export function hasAccess(userRole: UserRole | null, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  
  // School admins have access to everything in their school
  if (userRole === 'school_admin') return true;
  
  // Otherwise, role must match exactly
  return userRole === requiredRole;
}

// Fetch teacher data with all relationships
export async function getTeacherData(userId: string) {
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      school:schools(*),
      classes:teacher_classes(
        class:classes(
          *,
          students(*)
        )
      )
    `)
    .eq('user_id', userId)
    .single();

  return { data, error };
}

// Fetch parent data with all children
export async function getParentData(userId: string) {
  const { data, error } = await supabase
    .from('parents')
    .select(`
      *,
      children:parent_students(
        student:students(
          *,
          progress:student_progress(*),
          class:classes(*),
          assignments:student_assignments(
            *,
            assignment:assignments(*)
          )
        )
      )
    `)
    .eq('user_id', userId)
    .single();

  return { data, error };
}

// Fetch school data with statistics
export async function getSchoolData(schoolId: string) {
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single();

  if (schoolError) return { data: null, error: schoolError };

  // Get counts
  const { count: teacherCount } = await supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId);

  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId);

  const { count: classCount } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId);

  return {
    data: {
      ...school,
      stats: {
        teachers: teacherCount || 0,
        students: studentCount || 0,
        classes: classCount || 0
      }
    },
    error: null
  };
}