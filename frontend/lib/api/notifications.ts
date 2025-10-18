import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Notification = Database['public']['Tables']['notifications']['Row']

export const notificationApi = {
  // Get user notifications
  async getUserNotifications(filters?: {
    unreadOnly?: boolean
    type?: string
    limit?: number
  }): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.unreadOnly) {
      query = query.eq('is_read', false)
    }

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await (supabase
      .from('notifications') as any)
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    if (error) throw error
  },

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    const { error } = await (supabase
      .from('notifications') as any)
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', user.user.id)
      .eq('is_read', false)

    if (error) throw error
  },

  // Create notification (server-side)
  async createNotification(data: {
    user_id: string
    type: 'homework' | 'assignment' | 'target' | 'message' | 'milestone' | 'completion'
    title: string
    message?: string
    data?: any
  }): Promise<Notification> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('user_id', data.user_id)
      .single()

    if (!profile) throw new Error('User profile not found')

    // Set expiration (30 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        expires_at: expiresAt.toISOString()
      } as any)
      .select()
      .single()

    if (error) throw error
    return notification
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return 0

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.user.id)
      .eq('is_read', false)

    if (error) throw error
    return count || 0
  },

  // Subscribe to notifications
  async subscribeToNotifications(callback: (payload: any) => void) {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return null

    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.user.id}`
        },
        callback
      )
      .subscribe()
  },

  // Clean expired notifications (run periodically)
  async cleanExpiredNotifications(): Promise<void> {
    const { error } = await (supabase
      .from('notifications') as any)
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) throw error
  }
}