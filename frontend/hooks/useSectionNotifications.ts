/**
 * useSectionNotifications Hook
 *
 * Purpose: Real-time notification badge system for sidebar/navigation sections
 * Features:
 * - Real-time updates via Supabase subscriptions
 * - Unread counts per section
 * - Mark section notifications as read
 * - Automatic refresh on data changes
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { NotificationSection } from '@/lib/types/notifications';
import { useAuthStore } from '@/store/authStore';

interface NotificationCounts {
  [key: string]: number;
}

interface UseSectionNotificationsReturn {
  counts: NotificationCounts;
  totalUnread: number;
  isLoading: boolean;
  error: string | null;
  markSectionRead: (section: NotificationSection) => Promise<void>;
  refreshCounts: () => Promise<void>;
  getSectionCount: (section: NotificationSection) => number;
}

export function useSectionNotifications(): UseSectionNotificationsReturn {
  const { user } = useAuthStore();
  const [counts, setCounts] = useState<NotificationCounts>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch notification counts from API
   */
  const fetchCounts = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const response = await fetch('/api/notifications/counts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification counts');
      }

      const data = await response.json();

      if (data.success) {
        setCounts(data.data.counts);
        setTotalUnread(data.data.total);
      }
    } catch (err) {
      console.error('Error fetching notification counts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Mark all notifications in a section as read
   */
  const markSectionRead = useCallback(async (section: NotificationSection) => {
    if (!user) return;

    try {
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const response = await fetch('/api/notifications/mark-section-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ section }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Optimistically update local state
      setCounts((prev) => {
        const newCounts = { ...prev };
        const removedCount = newCounts[section] || 0;
        delete newCounts[section];
        return newCounts;
      });

      setTotalUnread((prev) => Math.max(0, prev - (counts[section] || 0)));

      // Refresh to get accurate counts from server
      await fetchCounts();
    } catch (err) {
      console.error('Error marking section as read:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [user, counts, fetchCounts]);

  /**
   * Get count for a specific section
   */
  const getSectionCount = useCallback((section: NotificationSection): number => {
    return counts[section] || 0;
  }, [counts]);

  /**
   * Subscribe to real-time notification changes
   */
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchCounts();

    // Subscribe to notification changes for this user
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Notification change detected:', payload);
          // Refresh counts when notifications change
          fetchCounts();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [user, fetchCounts]);

  return {
    counts,
    totalUnread,
    isLoading,
    error,
    markSectionRead,
    refreshCounts: fetchCounts,
    getSectionCount,
  };
}
