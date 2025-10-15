// MOCK SUPABASE - DO NOT USE THIS FILE
// This is the old mock implementation
// Use lib/supabase.ts for the real Supabase client

// Re-export all functions from api.js for compatibility
export * from './api';

// Create a mock supabase object for components that directly use it
export const supabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
  auth: {
    signInWithPassword: async ({ email, password }) => {
      try {
        const { login } = await import('./api');
        const data = await login(email, password);
        return { data: { user: data.user, session: { access_token: data.token } }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    signUp: async ({ email, password, options }) => {
      try {
        const { register } = await import('./api');
        const data = await register({
          email,
          password,
          ...options?.data
        });
        return { data: { user: data.user, session: { access_token: data.token } }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    signOut: async () => {
      try {
        const { logout } = await import('./api');
        await logout();
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    getSession: async () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      if (token && user) {
        return {
          data: {
            session: {
              access_token: token,
              user: JSON.parse(user)
            }
          },
          error: null
        };
      }
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback) => {
      // Mock implementation - check auth state on mount
      const checkAuth = async () => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
          callback('SIGNED_IN', {
            access_token: token,
            user: JSON.parse(user)
          });
        } else {
          callback('SIGNED_OUT', null);
        }
      };

      checkAuth();

      // Return unsubscribe function
      return {
        data: { subscription: { unsubscribe: () => {} } },
        error: null
      };
    }
  }
};

export default supabase;