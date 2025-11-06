// Hook to fetch and manage student-specific or teacher-wide highlights from database
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UseHighlightsOptions {
  studentId?: string | null;
  teacherId?: string | null;
}

export function useHighlights(
  studentIdOrOptions?: string | null | UseHighlightsOptions
) {
  // Support both old signature (studentId) and new signature (options)
  let studentId: string | null = null;
  let teacherId: string | null = null;

  if (typeof studentIdOrOptions === 'string') {
    studentId = studentIdOrOptions;
  } else if (studentIdOrOptions && typeof studentIdOrOptions === 'object') {
    studentId = studentIdOrOptions.studentId ?? null;
    teacherId = studentIdOrOptions.teacherId ?? null;
  }

  const [highlights, setHighlights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch highlights from database
  const fetchHighlights = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching highlights - student:', studentId, 'teacher:', teacherId);

      // Get auth session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (studentId) {
        params.append('student_id', studentId);
      }
      if (teacherId) {
        params.append('teacher_id', teacherId);
      }

      // Call API with authorization header
      const response = await fetch(`/api/highlights?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch highlights');
      }

      const data = await response.json();
      console.log('✅ Highlights loaded:', data.highlights?.length || 0);

      setHighlights(data.highlights || []);

    } catch (err: any) {
      console.error('❌ Error fetching highlights:', err);
      setError(err.message || 'Failed to load highlights');
      setHighlights([]);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, teacherId]);

  // Create new highlight
  const createHighlight = useCallback(async (highlightData: {
    surah: number;
    ayah_start: number;
    ayah_end: number;
    word_start?: number;
    word_end?: number;
    color: string;
    type?: string;
    note?: string;
    page_number?: number;
  }) => {
    if (!studentId) {
      throw new Error('No student ID provided');
    }

    try {
      console.log('📝 Creating highlight:', highlightData);

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Call API to create highlight
      const response = await fetch('/api/highlights', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: studentId,
          ...highlightData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create highlight');
      }

      const data = await response.json();
      console.log('✅ Highlight created:', data.highlight?.id);

      // Add new highlight to local state (optimistic update)
      setHighlights(prev => [...prev, data.highlight]);

      return data.highlight;

    } catch (err: any) {
      console.error('❌ Error creating highlight:', err);
      throw err;
    }
  }, [studentId]);

  // Mark highlight as completed (turn gold)
  const completeHighlight = useCallback(async (highlightId: string) => {
    try {
      console.log('✅ Marking highlight as completed:', highlightId);

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Update highlight in database
      const response = await fetch(`/api/highlights/${highlightId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete highlight');
      }

      const data = await response.json();
      console.log('🎉 Highlight completed:', data.highlight?.id);

      // Update local state
      setHighlights(prev =>
        prev.map(h => h.id === highlightId ? data.highlight : h)
      );

      return data.highlight;

    } catch (err: any) {
      console.error('❌ Error completing highlight:', err);
      throw err;
    }
  }, []);

  // Delete highlight
  const deleteHighlight = useCallback(async (highlightId: string) => {
    try {
      console.log('🗑️ Deleting highlight:', highlightId);

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Delete from database
      const response = await fetch(`/api/highlights/${highlightId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete highlight');
      }

      console.log('✅ Highlight deleted');

      // Update local state
      setHighlights(prev => prev.filter(h => h.id !== highlightId));

    } catch (err: any) {
      console.error('❌ Error deleting highlight:', err);
      throw err;
    }
  }, []);

  // Link highlights to an assignment
  const linkHighlightsToAssignment = useCallback(async (
    assignmentId: string,
    highlightIds: string[]
  ) => {
    try {
      console.log('🔗 Linking highlights to assignment:', assignmentId, highlightIds);

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`/api/assignments/${assignmentId}/highlights`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ highlight_ids: highlightIds })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to link highlights');
      }

      const data = await response.json();
      console.log('✅ Highlights linked to assignment:', data.data.linked_highlights);

      return data.data;

    } catch (err: any) {
      console.error('❌ Error linking highlights:', err);
      throw err;
    }
  }, []);

  // Get highlights for a specific assignment
  const getAssignmentHighlights = useCallback(async (assignmentId: string) => {
    try {
      console.log('🔍 Fetching highlights for assignment:', assignmentId);

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`/api/assignments/${assignmentId}/highlights`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assignment highlights');
      }

      const data = await response.json();
      console.log('✅ Assignment highlights loaded:', data.count);

      return data.data;

    } catch (err: any) {
      console.error('❌ Error fetching assignment highlights:', err);
      throw err;
    }
  }, []);

  // Complete an assignment (turns all linked highlights gold)
  const completeAssignment = useCallback(async (assignmentId: string) => {
    try {
      console.log('🎉 Completing assignment:', assignmentId);

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`/api/assignments/${assignmentId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete assignment');
      }

      const data = await response.json();
      console.log('✅ Assignment completed:', data.data.highlights_completed, 'highlights turned gold');

      // Refresh highlights to show gold color
      await fetchHighlights();

      return data.data;

    } catch (err: any) {
      console.error('❌ Error completing assignment:', err);
      throw err;
    }
  }, [fetchHighlights]);

  // Load highlights when studentId/teacherId changes
  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  // Set up real-time subscription for live updates across all dashboards
  useEffect(() => {
    // Get current user's school_id for filtering
    const setupSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('user_id', session.user.id)
          .single();

        if (!profile) return;

        const schoolId = profile.school_id;

        console.log('🔔 Setting up real-time subscription - student:', studentId, 'teacher:', teacherId, 'school:', schoolId);

        // Create unique channel name based on subscription type
        const channelName = studentId
          ? `highlights:student:${studentId}`
          : teacherId
          ? `highlights:teacher:${teacherId}`
          : `highlights:school:${schoolId}`;

        // Build subscription filter - Supabase realtime supports limited filtering
        // For student/teacher specific: use filter
        // For school-wide: subscribe to all, filter in callback
        const subscriptionConfig = studentId
          ? {
              event: '*' as const,
              schema: 'public',
              table: 'highlights',
              filter: `student_id=eq.${studentId}`
            }
          : teacherId
          ? {
              event: '*' as const,
              schema: 'public',
              table: 'highlights',
              filter: `teacher_id=eq.${teacherId}`
            }
          : {
              event: '*' as const,
              schema: 'public',
              table: 'highlights',
              filter: `school_id=eq.${schoolId}` // School-wide subscription
            };

        // Subscribe to highlight changes
        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            subscriptionConfig,
            (payload) => {
              console.log('🔔 Real-time highlight event:', payload.eventType, payload);

              // For school-wide subscriptions, verify the highlight belongs to this school
              if (!studentId && !teacherId) {
                if ((payload.new as any)?.school_id !== schoolId && (payload.old as any)?.school_id !== schoolId) {
                  console.log('🔕 Ignoring highlight from different school');
                  return;
                }
              }

              if (payload.eventType === 'INSERT') {
                // Add new highlight to state
                setHighlights(prev => [payload.new as any, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                // Update existing highlight in state
                setHighlights(prev =>
                  prev.map(h => h.id === (payload.new as any).id ? payload.new as any : h)
                );
              } else if (payload.eventType === 'DELETE') {
                // Remove deleted highlight from state
                setHighlights(prev => prev.filter(h => h.id !== (payload.old as any).id));
              }
            }
          )
          .subscribe((status) => {
            console.log('🔔 Subscription status:', status);
          });

        // Cleanup subscription on unmount
        return () => {
          console.log('🔕 Removing real-time subscription');
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error('❌ Error setting up subscription:', err);
      }
    };

    setupSubscription();
  }, [studentId, teacherId]);

  return {
    highlights,
    isLoading,
    error,
    createHighlight,
    completeHighlight,
    deleteHighlight,
    refreshHighlights: fetchHighlights,
    // Assignment-related operations
    linkHighlightsToAssignment,
    getAssignmentHighlights,
    completeAssignment
  };
}
