import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type PracticeSession = Database['public']['Tables']['practice_sessions']['Row']
type PageView = Database['public']['Tables']['page_views']['Row']

export const practiceApi = {
  // Start or update practice session
  async upsertPracticeSession(data: {
    student_id: string
    date: string
    duration_seconds?: number
  }): Promise<PracticeSession> {
    const { data: session, error } = await supabase
      .from('practice_sessions')
      .upsert(
        {
          student_id: data.student_id,
          date: data.date,
          duration_seconds: data.duration_seconds || 0
        },
        {
          onConflict: 'student_id,date',
          ignoreDuplicates: false
        }
      )
      .select()
      .single()

    if (error) throw error
    return session
  },

  // Track page view
  async trackPageView(data: {
    student_id: string
    page_number: number
    surah: number
    view_duration_seconds: number
  }): Promise<void> {
    const { error } = await supabase
      .from('page_views')
      .insert({
        student_id: data.student_id,
        page_number: data.page_number,
        surah: data.surah,
        view_duration_seconds: data.view_duration_seconds
      })

    if (error) throw error
  },

  // Get practice statistics
  async getPracticeStats(studentId: string, dateRange?: {
    start: string
    end: string
  }) {
    let query = supabase
      .from('practice_sessions')
      .select('date, duration_seconds')
      .eq('student_id', studentId)

    if (dateRange) {
      query = query
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
    }

    const { data: sessions, error } = await query
      .order('date', { ascending: false })

    if (error) throw error

    // Calculate statistics
    const totalSeconds = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0
    const avgSeconds = sessions?.length ? totalSeconds / sessions.length : 0
    const streak = calculateStreak(sessions || [])

    return {
      totalMinutes: Math.round(totalSeconds / 60),
      avgMinutesPerDay: Math.round(avgSeconds / 60),
      currentStreak: streak,
      sessions: sessions || []
    }
  },

  // Get most viewed pages
  async getMostViewedPages(studentId: string, limit = 10): Promise<{
    page_number: number
    surah: number
    view_count: number
    total_seconds: number
  }[]> {
    const { data, error } = await supabase
      .rpc('get_most_viewed_pages', {
        p_student_id: studentId,
        p_limit: limit
      })

    if (error) throw error
    return data || []
  },

  // Automatic idle detection and session update
  setupIdleDetection(studentId: string, idleTimeoutMs = 120000) {
    let lastActivity = Date.now()
    let sessionStart = Date.now()
    let currentDate = new Date().toISOString().split('T')[0]

    const updateSession = async () => {
      const duration = Math.floor((Date.now() - sessionStart) / 1000)
      await this.upsertPracticeSession({
        student_id: studentId,
        date: currentDate,
        duration_seconds: duration
      })
    }

    const resetActivity = () => {
      lastActivity = Date.now()
    }

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, resetActivity, true)
    })

    // Check for idle every 10 seconds
    const idleInterval = setInterval(() => {
      if (Date.now() - lastActivity > idleTimeoutMs) {
        // User is idle, pause session
        clearInterval(idleInterval)
        updateSession()
      }
    }, 10000)

    // Update session every minute while active
    const updateInterval = setInterval(updateSession, 60000)

    // Return cleanup function
    return () => {
      clearInterval(idleInterval)
      clearInterval(updateInterval)
      events.forEach(event => {
        document.removeEventListener(event, resetActivity, true)
      })
      updateSession() // Final update
    }
  }
}

// Helper function to calculate streak
function calculateStreak(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0

  const today = new Date().toISOString().split('T')[0]
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  let streak = 0
  let currentDate = new Date(today)

  for (const session of sortedSessions) {
    const sessionDate = new Date(session.date)
    const dayDiff = Math.floor(
      (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (dayDiff === streak) {
      streak++
      currentDate = sessionDate
    } else {
      break
    }
  }

  return streak
}