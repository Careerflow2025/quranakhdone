import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
// Define Role type locally to avoid import issues
type Role = 'owner' | 'admin' | 'teacher' | 'student' | 'parent' | 'school';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useAuth(requiredRole?: Role) {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();

    // Initialize Supabase auth
    const initSupabase = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSupabaseUser(session.user);
        await loadProfile(session.user.id);
      }
      setLoading(false);
    };

    initSupabase();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setSupabaseUser(session.user);
          await loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setSupabaseUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeAuth]);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    // Skip check while auth is initializing
    if (loading) return;

    const activeUser = supabaseUser || user;
    const userRole = profile?.role || user?.role || user?.profile?.role;

    if (!activeUser && !isAuthenticated) {
      router.push('/');
      return;
    }

    if (requiredRole && userRole !== requiredRole) {
      // Redirect to appropriate dashboard based on user role
      switch (userRole) {
        case 'school':
        case 'admin':
        case 'owner':
          router.push('/school-dashboard');
          break;
        case 'teacher':
          router.push('/teacher');
          break;
        case 'student':
          router.push('/student');
          break;
        case 'parent':
          router.push('/parent');
          break;
        default:
          router.push('/');
      }
    }
  }, [isAuthenticated, user, supabaseUser, profile, requiredRole, router, loading]);

  return {
    user: supabaseUser || user,
    profile,
    isAuthenticated: !!supabaseUser || isAuthenticated,
    isLoading: loading,
    role: profile?.role || user?.role,
  };
}

export function useRequireAuth() {
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    initializeAuth();

    // Check Supabase session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSupabaseUser(session?.user || null);
      setLoading(false);
    };

    checkSession();
  }, [initializeAuth]);

  useEffect(() => {
    if (!loading && !supabaseUser && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, supabaseUser, router, loading]);

  return {
    user: supabaseUser || user,
    isAuthenticated: !!supabaseUser || isAuthenticated,
    loading,
  };
}

// Get current user's school
export function useSchool() {
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.school_id) {
      loadSchool(profile.school_id);
    } else {
      setLoading(false);
    }
  }, [profile]);

  const loadSchool = async (schoolId: string) => {
    const { data } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single();

    if (data) {
      setSchool(data);
    }
    setLoading(false);
  };

  return { school, loading };
}