import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Highlight = Database['public']['Tables']['highlights']['Row']
type HighlightNote = Database['public']['Tables']['highlight_notes']['Row']

export const highlightApi = {
  // Create a new highlight
  async createHighlight(data: {
    student_id: string
    surah: number
    ayah_start: number
    ayah_end: number
    page_number: number
    color: 'green' | 'purple' | 'orange' | 'red' | 'brown'
    type?: string
    note?: string
  }): Promise<Highlight> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id, user_id')
      .single()

    if (!profile) throw new Error('User not found')

    // Get teacher_id if user is a teacher
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', (profile as any).user_id)
      .single()

    const { data: highlight, error } = await supabase
      .from('highlights')
      .insert({
        school_id: (profile as any).school_id,
        teacher_id: (teacher as any)?.id,
        student_id: data.student_id,
        surah: data.surah,
        ayah_start: data.ayah_start,
        ayah_end: data.ayah_end,
        page_number: data.page_number,
        color: data.color,
        type: data.type,
        note: data.note
      } as any)
      .select()
      .single()

    if (error) throw error
    return highlight
  },

  // Mark highlight as complete (turn to gold)
  async markHighlightComplete(highlightId: string): Promise<void> {
    const { data: highlight } = await supabase
      .from('highlights')
      .select('color')
      .eq('id', highlightId)
      .single()

    if (!highlight) throw new Error('Highlight not found')

    const user = await supabase.auth.getUser()
    const { error } = await (supabase
      .from('highlights') as any)
      .update({
        previous_color: (highlight as any).color,
        color: 'gold',
        completed_at: new Date().toISOString(),
        completed_by: user.data.user?.id
      })
      .eq('id', highlightId)

    if (error) throw error
  },

  // Get highlights for a student
  async getStudentHighlights(studentId: string, filters?: {
    surah?: number
    page?: number
    color?: string
  }): Promise<Highlight[]> {
    let query = supabase
      .from('highlights')
      .select('*')
      .eq('student_id', studentId)

    if (filters?.surah) query = query.eq('surah', filters.surah)
    if (filters?.page) query = query.eq('page_number', filters.page)
    if (filters?.color) query = query.eq('color', filters.color)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Add a note to a highlight
  async addHighlightNote(data: {
    highlight_id: string
    content?: string
    voice_url?: string
    voice_duration?: number
  }): Promise<HighlightNote> {
    const { data: user } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.user?.id!)
      .single()

    if (!profile) throw new Error('User profile not found')

    const canDeleteUntil = new Date()
    canDeleteUntil.setMinutes(canDeleteUntil.getMinutes() + 5)

    const { data: note, error } = await supabase
      .from('highlight_notes')
      .insert({
        highlight_id: data.highlight_id,
        author_id: user.user?.id!,
        author_role: (profile as any).role,
        content: data.content,
        voice_url: data.voice_url,
        voice_duration: data.voice_duration,
        can_delete_until: data.voice_url ? canDeleteUntil.toISOString() : null
      } as any)
      .select()
      .single()

    if (error) throw error
    return note
  },

  // Get notes for a highlight
  async getHighlightNotes(highlightId: string): Promise<HighlightNote[]> {
    const { data, error } = await supabase
      .from('highlight_notes')
      .select(`
        *,
        profiles!author_id(
          display_name,
          avatar_url
        )
      `)
      .eq('highlight_id', highlightId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Delete a voice note (within 5 minutes)
  async deleteVoiceNote(noteId: string): Promise<void> {
    const { data: note } = await supabase
      .from('highlight_notes')
      .select('author_id, can_delete_until, voice_url')
      .eq('id', noteId)
      .single()

    if (!note) throw new Error('Note not found')

    const { data: user } = await supabase.auth.getUser()
    if ((note as any).author_id !== user.user?.id) {
      throw new Error('You can only delete your own notes')
    }

    if (!(note as any).voice_url) {
      throw new Error('This is not a voice note')
    }

    if ((note as any).can_delete_until && new Date() > new Date((note as any).can_delete_until)) {
      throw new Error('Deletion time expired (5 minutes)')
    }

    // Delete from storage
    if ((note as any).voice_url) {
      const path = (note as any).voice_url.split('/').pop()
      if (path) {
        await supabase.storage.from('voice-notes').remove([path])
      }
    }

    // Delete the note
    const { error } = await (supabase
      .from('highlight_notes') as any)
      .delete()
      .eq('id', noteId)

    if (error) throw error
  },

  // Calculate page progress
  async calculatePageProgress(studentId: string, pageNumber: number): Promise<{
    isComplete: boolean
    totalHighlights: number
    completedHighlights: number
  }> {
    const { data: highlights } = await supabase
      .from('highlights')
      .select('color')
      .eq('student_id', studentId)
      .eq('page_number', pageNumber)

    if (!highlights || highlights.length === 0) {
      return { isComplete: false, totalHighlights: 0, completedHighlights: 0 }
    }

    const completedHighlights = highlights.filter((h: any) => h.color === 'gold').length
    const isComplete = completedHighlights === highlights.length

    return {
      isComplete,
      totalHighlights: highlights.length,
      completedHighlights
    }
  },

  // Subscribe to highlight changes
  subscribeToHighlights(studentId: string, callback: (payload: any) => void) {
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

  // Subscribe to note changes
  subscribeToNotes(highlightId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notes:${highlightId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'highlight_notes',
          filter: `highlight_id=eq.${highlightId}`
        },
        callback
      )
      .subscribe()
  }
}