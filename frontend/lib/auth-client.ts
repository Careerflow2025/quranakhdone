// Client-side Authentication Service for Quranakh
// This file contains only functions safe for client-side use
import { createClient } from '@supabase/supabase-js';

// Regular client for normal operations (client-side safe)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============ LOGIN FUNCTION WITH ROLE DETECTION ============

export async function loginWithRole(email: string, password: string) {
  try {
    // 1. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Login failed');

    // 2. Get user role from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, school_id')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    // 3. Get additional data based on role
    let additionalData = null;
    let redirectPath = '/';

    switch (profile.role) {
      case 'owner':  // Fixed: use 'owner' not 'school_admin'
      case 'admin':
        const { data: school } = await supabase
          .from('schools')
          .select('*')
          .eq('id', profile.school_id)
          .single();
        additionalData = school;
        redirectPath = '/school-dashboard';  // Fixed: use actual route with -dashboard suffix
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
        redirectPath = '/teacher-dashboard';  // Fixed: use actual route with -dashboard suffix
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
        redirectPath = '/parent-dashboard';  // Fixed: use actual route with -dashboard suffix
        break;
    }

    // 4. Store session data
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', profile.role);
      localStorage.setItem('schoolId', profile.school_id || '');
      localStorage.setItem('userName', authData.user.user_metadata?.name || authData.user.email || '');
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
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  return {
    ...user,
    role: profile?.role,
    schoolId: profile?.school_id
  };
}

// Sign out (client-side safe)
export async function signOut() {
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    localStorage.clear();
    window.location.href = '/auth/login';
  }
}

// Generate secure password (client-side safe)
export function generateSecurePassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Get user session (client-side safe)
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Listen to auth state changes (client-side safe)
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}