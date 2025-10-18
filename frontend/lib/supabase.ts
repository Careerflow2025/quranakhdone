import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
    }
    }
  }
)

// Helper functions for common operations
export const supabaseHelpers = {
  // Get current user
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Get user profile with role
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  },

  // Get user's school
  getUserSchool: async (schoolId: string) => {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single()

    if (error) throw error
    return data
  },

  // Sign in user
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Subscribe to real-time changes
  subscribeToHighlights: (studentId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`highlights:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'highlights',
          filter: `student_id=eq.${studentId}`
        },
        callback
      )
      .subscribe()
  },

  // Subscribe to notifications
  subscribeToNotifications: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}