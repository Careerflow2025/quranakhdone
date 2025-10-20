/**
 * useMessages Hook - Messages Data Fetching and Management
 * Created: 2025-10-20
 * Purpose: Custom hook for Enhanced Messages system following established patterns
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

// Types matching our Messages API
export interface MessageUser {
  id: string;
  display_name: string;
  email: string;
  role: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  url: string;
  mime_type: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

export interface Message {
  id: string;
  school_id: string;
  thread_id: string | null;
  sender_user_id: string;
  recipient_user_id: string;
  subject: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  sender: MessageUser;
  recipient: MessageUser;
  attachments: MessageAttachment[];
  reply_count?: number;
  is_read: boolean;
}

export interface MessageThread {
  root_message: Message;
  replies: Message[];
  participant_count: number;
  last_message_at: string;
  unread_count: number;
}

export interface SendMessageData {
  recipient_user_id: string;
  subject?: string;
  body: string;
  thread_id?: string;
  attachments?: Array<{
    url: string;
    mime_type: string;
    file_name: string;
    file_size: number;
  }>;
}

export type MessageFolder = 'inbox' | 'sent' | 'unread' | 'all';

export function useMessages(initialFolder: MessageFolder = 'inbox') {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentFolder, setCurrentFolder] = useState<MessageFolder>(initialFolder);
  const [totalUnread, setTotalUnread] = useState(0);
  const [totalThreads, setTotalThreads] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);

  // Thread state
  const [currentThread, setCurrentThread] = useState<MessageThread | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  // Fetch messages for current folder
  const fetchMessages = useCallback(async (folder?: MessageFolder, page: number = 1) => {
    if (!user) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const folderToFetch = folder || currentFolder;
      const url = `/api/messages?folder=${folderToFetch}&page=${page}&limit=20`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch messages');
      }

      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
        setTotalUnread(data.stats?.total_unread || 0);
        setTotalThreads(data.stats?.total_threads || 0);
        setCurrentPage(data.pagination?.page || 1);
        setTotalPages(data.pagination?.total_pages || 1);
        setTotalMessages(data.pagination?.total || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch messages');
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentFolder]);

  // Fetch single thread
  const fetchThread = useCallback(async (threadId: string) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setIsLoadingThread(true);
      setError(null);

      const response = await fetch(`/api/messages/thread/${threadId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch thread');
      }

      const data = await response.json();

      if (data.success) {
        setCurrentThread(data.thread);
      } else {
        throw new Error(data.error || 'Failed to fetch thread');
      }
    } catch (err: any) {
      console.error('Error fetching thread:', err);
      setError(err.message || 'Failed to load thread');
      setCurrentThread(null);
    } finally {
      setIsLoadingThread(false);
    }
  }, [user]);

  // Send new message
  const sendMessage = useCallback(async (messageData: SendMessageData): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();

      if (data.success) {
        // Refresh messages after sending
        await fetchMessages(currentFolder, currentPage);
        return true;
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      return false;
    }
  }, [user, currentFolder, currentPage, fetchMessages]);

  // Reply to message
  const replyToMessage = useCallback(async (messageId: string, body: string, attachments?: SendMessageData['attachments']): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);

      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body, attachments }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reply');
      }

      const data = await response.json();

      if (data.success) {
        // Refresh current thread if viewing
        if (currentThread) {
          const threadId = currentThread.root_message.thread_id || currentThread.root_message.id;
          await fetchThread(threadId);
        }
        // Also refresh messages list
        await fetchMessages(currentFolder, currentPage);
        return true;
      } else {
        throw new Error(data.error || 'Failed to send reply');
      }
    } catch (err: any) {
      console.error('Error sending reply:', err);
      setError(err.message || 'Failed to send reply');
      return false;
    }
  }, [user, currentThread, currentFolder, currentPage, fetchMessages, fetchThread]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);

      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark as read');
      }

      const data = await response.json();

      if (data.success) {
        // Update local state optimistically
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg
        ));
        setTotalUnread(prev => Math.max(0, prev - 1));

        // Update thread if viewing
        if (currentThread) {
          setCurrentThread(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              root_message: prev.root_message.id === messageId
                ? { ...prev.root_message, is_read: true, read_at: new Date().toISOString() }
                : prev.root_message,
              replies: prev.replies.map(r =>
                r.id === messageId ? { ...r, is_read: true, read_at: new Date().toISOString() } : r
              ),
              unread_count: Math.max(0, prev.unread_count - 1),
            };
          });
        }

        return true;
      } else {
        throw new Error(data.error || 'Failed to mark as read');
      }
    } catch (err: any) {
      console.error('Error marking as read:', err);
      setError(err.message || 'Failed to mark as read');
      return false;
    }
  }, [user, currentThread]);

  // Change folder
  const changeFolder = useCallback(async (folder: MessageFolder) => {
    setCurrentFolder(folder);
    setCurrentPage(1);
    await fetchMessages(folder, 1);
  }, [fetchMessages]);

  // Change page
  const changePage = useCallback(async (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    await fetchMessages(currentFolder, page);
  }, [currentFolder, totalPages, fetchMessages]);

  // Initial fetch on mount and when folder changes
  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]); // Only depend on user, not fetchMessages to avoid infinite loop

  // Refresh function
  const refreshMessages = useCallback(async () => {
    await fetchMessages(currentFolder, currentPage);
  }, [currentFolder, currentPage, fetchMessages]);

  return {
    // State
    isLoading,
    error,
    messages,
    currentFolder,
    totalUnread,
    totalThreads,
    currentPage,
    totalPages,
    totalMessages,
    currentThread,
    isLoadingThread,

    // Actions
    sendMessage,
    replyToMessage,
    markAsRead,
    changeFolder,
    changePage,
    fetchThread,
    refreshMessages,
    closeThread: () => setCurrentThread(null),
  };
}
