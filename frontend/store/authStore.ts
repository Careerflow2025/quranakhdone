import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  full_name?: string;
  schoolId?: string;
  school_id?: string;
  profile?: {
    role: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          // Use Supabase authentication
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.session) {
            // Get user profile from database
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', data.user.id)
              .single() as { data: any };

            const userData = {
              id: data.user.id,
              email: data.user.email!,
              role: profile?.role || 'student',
              fullName: profile?.display_name || '',
              schoolId: profile?.school_id || ''
            };

            // Store token and user
            localStorage.setItem('token', data.session.access_token);
            localStorage.setItem('user', JSON.stringify(userData));

            set({
              user: userData,
              token: data.session.access_token,
              isAuthenticated: true,
              isLoading: false
            });

            return { success: true };
          } else {
            set({ isLoading: false });
            return { success: false, error: 'Login failed' };
          }
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message || 'Login failed' };
        }
      },

      logout: async () => {
        // Sign out from Supabase
        await supabase.auth.signOut();

        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
      },

      setUser: (user: User, token: string) => {
        set({ 
          user, 
          token,
          isAuthenticated: true 
        });
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },

      initializeAuth: async () => {
        // Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single() as { data: any };

          const userData = {
            id: session.user.id,
            email: session.user.email!,
            role: profile?.role || 'student',
            fullName: profile?.display_name || '',
            schoolId: profile?.school_id || ''
          };

          set({
            user: userData,
            token: session.access_token,
            isAuthenticated: true
          });
        } else {
          // Try localStorage fallback
          const token = localStorage.getItem('token');
          const userStr = localStorage.getItem('user');

          if (token && userStr) {
            try {
              const user = JSON.parse(userStr);
              set({
                user,
                token,
                isAuthenticated: true
              });
            } catch (error) {
              // Clear invalid auth data
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              set({
                user: null,
                token: null,
                isAuthenticated: false
              });
            }
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false
            });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);