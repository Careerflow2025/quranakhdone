import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// WARNING: This should only be used in server-side code
// Never expose the service role key to the client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client with service role key for server-side operations
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Admin-only functions
export const adminHelpers = {
  // Create new user with specific role
  createUser: async (email: string, password: string, role: 'school' | 'teacher' | 'student' | 'parent', schoolId?: string) => {
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
        })

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