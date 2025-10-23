/**
 * useNotifications Hook
 * Manages notification fetching and state for in-app notifications
 *
 * Created: October 23, 2025
 * Purpose: Connect notification bell UI to notifications API
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  school_id: string;
  user_id: string;
  channel: 'in_app' | 'email' | 'push';
  type: string;
  payload: any;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
  is_read: boolean;
  time_ago: string;
  recipient?: {
    id: string;
    display_name: string;
    email: string;
  };
}

export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
}

export function useNotifications(autoFetch: boolean = true) {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    totalCount: 0,
    isLoading: false,
    error: null,
    hasMore: false,
  });

  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (reset: boolean = false) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Please login to access notifications',
        }));
        return;
      }

      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
        // Only fetch in_app notifications for the bell dropdown
        channel: 'in_app',
      });

      const response = await fetch(`/api/notifications?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch notifications');
      }

      setState((prev) => ({
        notifications: reset
          ? result.data.notifications
          : [...prev.notifications, ...result.data.notifications],
        unreadCount: result.data.summary.unread_count,
        totalCount: result.data.pagination.total,
        isLoading: false,
        error: null,
        hasMore: result.data.pagination.has_more,
      }));

      if (reset) {
        setOffset(0);
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch notifications',
      }));
    }
  }, [offset]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Please login to mark notifications as read');
        return;
      }

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state optimistically
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Optionally show error to user
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Please login to mark all notifications as read');
        return;
      }

      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state optimistically
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Optionally show error to user
    }
  }, []);

  // Load more notifications
  const loadMore = useCallback(() => {
    if (!state.isLoading && state.hasMore) {
      setOffset((prev) => prev + limit);
    }
  }, [state.isLoading, state.hasMore]);

  // Refresh notifications (from the beginning)
  const refresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications(true);
    }
  }, [autoFetch, fetchNotifications]);

  // Fetch more when offset changes
  useEffect(() => {
    if (offset > 0) {
      fetchNotifications(false);
    }
  }, [offset, fetchNotifications]);

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    totalCount: state.totalCount,
    isLoading: state.isLoading,
    error: state.error,
    hasMore: state.hasMore,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh,
  };
}
