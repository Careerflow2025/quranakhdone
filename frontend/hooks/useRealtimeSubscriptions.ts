import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { highlightApi } from '@/lib/api/highlights'
import { notificationApi } from '@/lib/api/notifications'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Subscribe to highlight changes for a student
export function useHighlightSubscription(studentId: string | null) {
  const [highlights, setHighlights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) return

    let channel: RealtimeChannel | null = null

    const setupSubscription = async () => {
      // Load initial data
      try {
        const data = await highlightApi.getStudentHighlights(studentId)
        setHighlights(data)
      } catch (error) {
        console.error('Error loading highlights:', error)
      } finally {
        setLoading(false)
      }

      // Subscribe to changes
      channel = highlightApi.subscribeToHighlights(studentId, (payload) => {
        if (payload.eventType === 'INSERT') {
          setHighlights(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setHighlights(prev => 
            prev.map(h => h.id === payload.new.id ? payload.new : h)
          )
        } else if (payload.eventType === 'DELETE') {
          setHighlights(prev => prev.filter(h => h.id !== payload.old.id))
        }
      })
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [studentId])

  return { highlights, loading }
}

// Subscribe to notes for a highlight
export function useNotesSubscription(highlightId: string | null) {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!highlightId) return

    let channel: RealtimeChannel | null = null

    const setupSubscription = async () => {
      // Load initial data
      try {
        const data = await highlightApi.getHighlightNotes(highlightId)
        setNotes(data)
      } catch (error) {
        console.error('Error loading notes:', error)
      } finally {
        setLoading(false)
      }

      // Subscribe to changes
      channel = highlightApi.subscribeToNotes(highlightId, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotes(prev => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setNotes(prev => 
            prev.map(n => n.id === payload.new.id ? payload.new : n)
          )
        } else if (payload.eventType === 'DELETE') {
          setNotes(prev => prev.filter(n => n.id !== payload.old.id))
        }
      })
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [highlightId])

  return { notes, loading }
}

// Subscribe to notifications
export function useNotificationSubscription() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const setupSubscription = async () => {
      // Load initial data
      try {
        const [notifs, count] = await Promise.all([
          notificationApi.getUserNotifications({ limit: 50 }),
          notificationApi.getUnreadCount()
        ])
        setNotifications(notifs)
        setUnreadCount(count)
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setLoading(false)
      }

      // Subscribe to new notifications
      channel = await notificationApi.subscribeToNotifications((payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => [payload.new, ...prev])
          setUnreadCount(prev => prev + 1)
          
          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(payload.new.title, {
              body: payload.new.message || '',
              icon: '/icon-192x192.png'
            })
          }
        }
      })
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const markAsRead = async (id: string) => {
    await notificationApi.markAsRead(id)
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await notificationApi.markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  }
}

// Subscribe to practice session updates
export function usePracticeSubscription(studentId: string | null) {
  const [session, setSession] = useState<any>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!studentId) return

    let channel: RealtimeChannel | null = null
    const today = new Date().toISOString().split('T')[0]

    const setupSubscription = async () => {
      // Subscribe to practice session updates
      channel = supabase
        .channel(`practice:${studentId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'practice_sessions',
            filter: `student_id=eq.${studentId},date=eq.${today}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              setSession(payload.new)
              setIsActive(true)
            }
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [studentId])

  return { session, isActive }
}

// Subscribe to class updates
export function useClassSubscription(classId: string | null) {
  const [classData, setClassData] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])

  useEffect(() => {
    if (!classId) return

    let channel: RealtimeChannel | null = null

    const setupSubscription = async () => {
      // Subscribe to class and enrollment changes
      channel = supabase
        .channel(`class:${classId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'classes',
            filter: `id=eq.${classId}`
          },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              setClassData(payload.new)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'class_enrollments',
            filter: `class_id=eq.${classId}`
          },
          async (payload) => {
            // Reload student list when enrollments change
            const { data } = await supabase
              .from('class_enrollments')
              .select(`
                student_id,
                students!inner(
                  *,
                  profiles!inner(
                    display_name,
                    avatar_url
                  )
                )
              `)
              .eq('class_id', classId)
            
            setStudents(data || [])
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [classId])

  return { classData, students }
}