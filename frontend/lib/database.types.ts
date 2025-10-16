// Database types generated from Supabase schema
export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          logo_url: string | null
          timezone: string
          subscription_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          timezone?: string
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          timezone?: string
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          school_id: string | null
          role: 'school' | 'teacher' | 'student' | 'parent'
          display_name: string | null
          email: string
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          school_id?: string | null
          role: 'school' | 'teacher' | 'student' | 'parent'
          display_name?: string | null
          email: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          school_id?: string | null
          role?: 'school' | 'teacher' | 'student' | 'parent'
          display_name?: string | null
          email?: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      teachers: {
        Row: {
          id: string
          user_id: string
          school_id: string
          subject: string | null
          qualification: string | null
          experience: string | null
          bio: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          school_id: string
          subject?: string | null
          qualification?: string | null
          experience?: string | null
          bio?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          school_id?: string
          subject?: string | null
          qualification?: string | null
          experience?: string | null
          bio?: string | null
          active?: boolean
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          user_id: string
          school_id: string
          age: number | null
          grade: string | null
          gender: string | null
          date_of_birth: string | null
          enrollment_date: string
          active: boolean
          memorized_juz: number
          revision_juz: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          school_id: string
          age?: number | null
          grade?: string | null
          gender?: string | null
          date_of_birth?: string | null
          enrollment_date?: string
          active?: boolean
          memorized_juz?: number
          revision_juz?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          school_id?: string
          age?: number | null
          grade?: string | null
          gender?: string | null
          date_of_birth?: string | null
          enrollment_date?: string
          active?: boolean
          memorized_juz?: number
          revision_juz?: number
          created_at?: string
        }
      }
      parents: {
        Row: {
          id: string
          user_id: string
          school_id: string
          address: string | null
          occupation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          school_id: string
          address?: string | null
          occupation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          school_id?: string
          address?: string | null
          occupation?: string | null
          created_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          school_id: string
          name: string
          grade: string | null
          room: string | null
          capacity: number
          schedule: any | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          grade?: string | null
          room?: string | null
          capacity?: number
          schedule?: any | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          grade?: string | null
          room?: string | null
          capacity?: number
          schedule?: any | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      highlights: {
        Row: {
          id: string
          school_id: string
          teacher_id: string | null
          student_id: string
          surah: number
          ayah_start: number
          ayah_end: number
          page_number: number | null
          color: 'green' | 'purple' | 'orange' | 'red' | 'brown' | 'gold'
          previous_color: 'green' | 'purple' | 'orange' | 'red' | 'brown' | 'gold' | null
          type: string | null
          note: string | null
          created_at: string
          completed_at: string | null
          completed_by: string | null
        }
        Insert: {
          id?: string
          school_id: string
          teacher_id?: string | null
          student_id: string
          surah: number
          ayah_start: number
          ayah_end: number
          page_number?: number | null
          color: 'green' | 'purple' | 'orange' | 'red' | 'brown' | 'gold'
          previous_color?: 'green' | 'purple' | 'orange' | 'red' | 'brown' | 'gold' | null
          type?: string | null
          note?: string | null
          created_at?: string
          completed_at?: string | null
          completed_by?: string | null
        }
        Update: {
          id?: string
          school_id?: string
          teacher_id?: string | null
          student_id?: string
          surah?: number
          ayah_start?: number
          ayah_end?: number
          page_number?: number | null
          color?: 'green' | 'purple' | 'orange' | 'red' | 'brown' | 'gold'
          previous_color?: 'green' | 'purple' | 'orange' | 'red' | 'brown' | 'gold' | null
          type?: string | null
          note?: string | null
          created_at?: string
          completed_at?: string | null
          completed_by?: string | null
        }
      }
      highlight_notes: {
        Row: {
          id: string
          highlight_id: string
          author_id: string
          author_role: 'school' | 'teacher' | 'student' | 'parent'
          content: string | null
          voice_url: string | null
          voice_duration: number | null
          created_at: string
          can_delete_until: string | null
        }
        Insert: {
          id?: string
          highlight_id: string
          author_id: string
          author_role: 'school' | 'teacher' | 'student' | 'parent'
          content?: string | null
          voice_url?: string | null
          voice_duration?: number | null
          created_at?: string
          can_delete_until?: string | null
        }
        Update: {
          id?: string
          highlight_id?: string
          author_id?: string
          author_role?: 'school' | 'teacher' | 'student' | 'parent'
          content?: string | null
          voice_url?: string | null
          voice_duration?: number | null
          created_at?: string
          can_delete_until?: string | null
        }
      }
      targets: {
        Row: {
          id: string
          school_id: string
          teacher_id: string | null
          title: string
          description: string | null
          type: 'individual' | 'class' | 'school'
          category: string | null
          status: 'active' | 'completed' | 'cancelled'
          start_date: string | null
          due_date: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          school_id: string
          teacher_id?: string | null
          title: string
          description?: string | null
          type: 'individual' | 'class' | 'school'
          category?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          start_date?: string | null
          due_date?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          school_id?: string
          teacher_id?: string | null
          title?: string
          description?: string | null
          type?: 'individual' | 'class' | 'school'
          category?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          start_date?: string | null
          due_date?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'homework' | 'assignment' | 'target' | 'message' | 'milestone' | 'completion'
          title: string
          message: string | null
          data: any | null
          is_read: boolean
          read_at: string | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'homework' | 'assignment' | 'target' | 'message' | 'milestone' | 'completion'
          title: string
          message?: string | null
          data?: any | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'homework' | 'assignment' | 'target' | 'message' | 'milestone' | 'completion'
          title?: string
          message?: string | null
          data?: any | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
          expires_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          school_id: string
          created_by_teacher_id: string
          student_id: string
          title: string
          description: string | null
          status: 'assigned' | 'viewed' | 'submitted' | 'reviewed' | 'completed' | 'reopened'
          due_at: string
          late: boolean
          reopen_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          created_by_teacher_id: string
          student_id: string
          title: string
          description?: string | null
          status?: 'assigned' | 'viewed' | 'submitted' | 'reviewed' | 'completed' | 'reopened'
          due_at: string
          late?: boolean
          reopen_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          created_by_teacher_id?: string
          student_id?: string
          title?: string
          description?: string | null
          status?: 'assigned' | 'viewed' | 'submitted' | 'reviewed' | 'completed' | 'reopened'
          due_at?: string
          late?: boolean
          reopen_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_credentials: {
        Row: {
          id: string
          user_id: string
          school_id: string
          email: string
          password: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          school_id: string
          email: string
          password: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          school_id?: string
          email?: string
          password?: string
          role?: string
          created_at?: string
        }
      }
      parent_students: {
        Row: {
          parent_id: string
          student_id: string
          created_at: string
        }
        Insert: {
          parent_id: string
          student_id: string
          created_at?: string
        }
        Update: {
          parent_id?: string
          student_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_school_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: 'school' | 'teacher' | 'student' | 'parent'
      }
      mark_highlight_complete: {
        Args: {
          highlight_id: string
        }
        Returns: void
      }
      calculate_page_progress: {
        Args: {
          p_student_id: string
          p_target_id: string
        }
        Returns: {
          completed_pages: number
          total_pages: number
          percentage: number
        }[]
      }
    }
    Enums: {
      user_role: 'school' | 'teacher' | 'student' | 'parent'
      highlight_color: 'green' | 'purple' | 'orange' | 'red' | 'brown' | 'gold'
      assignment_status: 'pending' | 'in-progress' | 'submitted' | 'reviewed' | 'completed'
      target_status: 'active' | 'completed' | 'cancelled'
      target_type: 'individual' | 'class' | 'school'
      attendance_status: 'present' | 'absent' | 'late' | 'excused'
      notification_type: 'homework' | 'assignment' | 'target' | 'message' | 'milestone' | 'completion'
    }
  }
}