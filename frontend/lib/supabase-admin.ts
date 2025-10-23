import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

let adminClientInstance: SupabaseClient<Database> | null = null

// WARNING: This should only be used in server-side code
// Never expose the service role key to the client
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!adminClientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    // Remove all whitespace characters including newlines
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Use custom fetch wrapper to handle large headers
    const customFetch: typeof fetch = async (input, init) => {
      // Use globalThis.fetch (native Node.js fetch) instead of Next.js patched fetch
      const nativeFetch = globalThis.fetch
      return nativeFetch(input, init)
    }

    adminClientInstance = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          fetch: customFetch
        }
      }
    )
  }
  return adminClientInstance
}

// Legacy export for backward compatibility
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get: (target, prop) => {
    const client = getSupabaseAdmin()
    return (client as any)[prop]
  }
})

// Admin-only functions
export const adminHelpers = {
  // Create new user with specific role
  createUser: async (email: string, password: string, role: 'owner' | 'admin' | 'teacher' | 'student' | 'parent', schoolId?: string) => {
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) throw authError

    // Create profile
    if (authData.user && schoolId) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email,
          role,
          school_id: schoolId,
          display_name: email.split('@')[0]
        } as any)

      if (profileError) throw profileError
    }

    return authData
  },

  // Reset user password
  resetUserPassword: async (email: string, newPassword: string) => {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      email,
      { password: newPassword }
    )

    if (error) throw error
    return data
  },

  // Delete user completely
  deleteUser: async (userId: string) => {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw error
  },

  // Get all users for a school
  getSchoolUsers: async (schoolId: string) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('school_id', schoolId)

    if (error) throw error
    return data
  },

  // Send email with credentials
  sendCredentialsEmail: async (email: string, password: string, loginUrl: string) => {
    // This would integrate with your email service (SendGrid, Resend, etc.)
    // For now, just log it
    console.log('Sending credentials to:', email)
    console.log('Password:', password)
    console.log('Login URL:', loginUrl)

    // In production, use Supabase Edge Functions or external email service
    return { success: true }
  }
}