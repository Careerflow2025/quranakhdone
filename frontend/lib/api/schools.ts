import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type School = Database['public']['Tables']['schools']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Teacher = Database['public']['Tables']['teachers']['Row']
type Student = Database['public']['Tables']['students']['Row']
type Parent = Database['public']['Tables']['parents']['Row']

export const schoolApi = {
  // Get current school details
  async getCurrentSchool(): Promise<School | null> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .single()
    
    if (!profile?.school_id) return null
    
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', profile.school_id)
      .single()
    
    if (error) throw error
    return data
  },

  // Create a new user (school admin only)
  async createUser(userData: {
    email: string
    password: string
    role: 'teacher' | 'student' | 'parent'
    display_name: string
    phone?: string
  }) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id, role')
      .single()
    
    if (!profile || profile.role !== 'school') {
      throw new Error('Only school admins can create users')
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    })

    if (authError) throw authError

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        school_id: profile.school_id,
        role: userData.role,
        display_name: userData.display_name,
        email: userData.email,
        phone: userData.phone
      })

    if (profileError) throw profileError

    // Create role-specific record
    switch (userData.role) {
      case 'teacher':
        await supabase.from('teachers').insert({
          user_id: authData.user.id,
          school_id: profile.school_id
        })
        break
      case 'student':
        await supabase.from('students').insert({
          user_id: authData.user.id,
          school_id: profile.school_id
        })
        break
      case 'parent':
        await supabase.from('parents').insert({
          user_id: authData.user.id,
          school_id: profile.school_id
        })
        break
    }

    return authData.user
  },

  // Update user password (school admin only)
  async updateUserPassword(userId: string, newPassword: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .single()
    
    if (!profile || profile.role !== 'school') {
      throw new Error('Only school admins can update passwords')
    }

    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (error) throw error
  },

  // Get all school users
  async getSchoolUsers() {
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .single()
    
    if (!profile?.school_id) return []

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        teachers!inner(*),
        students!inner(*),
        parents!inner(*)
      `)
      .eq('school_id', profile.school_id)

    if (error) throw error
    return data || []
  },

  // Get school statistics
  async getSchoolStats() {
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .single()
    
    if (!profile?.school_id) return null

    const [teachers, students, classes, highlights] = await Promise.all([
      supabase.from('teachers').select('id', { count: 'exact' }).eq('school_id', profile.school_id),
      supabase.from('students').select('id', { count: 'exact' }).eq('school_id', profile.school_id),
      supabase.from('classes').select('id', { count: 'exact' }).eq('school_id', profile.school_id),
      supabase.from('highlights').select('id', { count: 'exact' }).eq('school_id', profile.school_id)
    ])

    return {
      teacherCount: teachers.count || 0,
      studentCount: students.count || 0,
      classCount: classes.count || 0,
      highlightCount: highlights.count || 0
    }
  }
}