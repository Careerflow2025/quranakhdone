/**
 * MessagesPanel Component - Enhanced Messages System UI
 * Created: 2025-10-20
 * Purpose: Complete messages interface for teacher-student-parent communication
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mail, Send, X, Paperclip, Search, Filter, User,
  ChevronLeft, ChevronRight, MessageSquare, Eye,
  Trash2, Archive, MoreVertical, Clock, Check,
  AlertCircle, Inbox, SendHorizontal, Bell, Users
} from 'lucide-react';
import { useMessages, Message, MessageThread, SendMessageData } from '@/hooks/useMessages';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

interface MessagesPanelProps {
  userRole?: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
}

export default function MessagesPanel({ userRole = 'teacher' }: MessagesPanelProps) {
  const { user } = useAuthStore();
  const {
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
    sendMessage,
    replyToMessage,
    markAsRead,
    changeFolder,
    changePage,
    fetchThread,
    refreshMessages,
    closeThread,
  } = useMessages('inbox');

  // UI State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Compose form state
  const [composeForm, setComposeForm] = useState({
    recipient_user_id: '',
    subject: '',
    body: '',
    attachments: [] as Array<{ url: string; mime_type: string; file_name: string; file_size: number }>,
  });

  // Reply form state
  const [replyBody, setReplyBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recipient search state
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');
  const [availableRecipients, setAvailableRecipients] = useState<Array<{
    user_id: string;
    display_name: string;
    email: string;
    role: string;
  }>>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Array<{
    user_id: string;
    display_name: string;
    email: string;
    role: string;
  }>>([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    user_id: string;
    display_name: string;
    email: string;
    role: string;
  } | null>(null);
  const recipientInputRef = useRef<HTMLInputElement>(null);
  const recipientDropdownRef = useRef<HTMLDivElement>(null);

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get message preview
  const getPreview = (body: string, maxLength: number = 100): string => {
    if (body.length <= maxLength) return body;
    return body.substring(0, maxLength) + '...';
  };

  // Fetch available recipients when compose modal opens
  useEffect(() => {
    const fetchRecipients = async () => {
      if (!showComposeModal || !user?.schoolId) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, role')
          .eq('school_id', user.schoolId)
          .neq('user_id', user.id) // Exclude current user
          .order('display_name');

        if (error) {
          console.error('Error fetching recipients:', error);
          return;
        }

        setAvailableRecipients(data || []);
        setFilteredRecipients(data || []);
      } catch (error) {
        console.error('Error fetching recipients:', error);
      }
    };

    fetchRecipients();
  }, [showComposeModal, user?.schoolId, user?.id]);

  // Filter recipients based on search query
  useEffect(() => {
    if (!recipientSearchQuery.trim()) {
      setFilteredRecipients(availableRecipients);
      return;
    }

    const query = recipientSearchQuery.toLowerCase();
    const filtered = availableRecipients.filter(recipient =>
      recipient.display_name?.toLowerCase().includes(query) ||
      recipient.email?.toLowerCase().includes(query) ||
      recipient.role?.toLowerCase().includes(query)
    );
    setFilteredRecipients(filtered);
  }, [recipientSearchQuery, availableRecipients]);

  // Handle clicking outside recipient dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        recipientDropdownRef.current &&
        !recipientDropdownRef.current.contains(event.target as Node) &&
        recipientInputRef.current &&
        !recipientInputRef.current.contains(event.target as Node)
      ) {
        setShowRecipientDropdown(false);
      }
    };

    if (showRecipientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showRecipientDropdown]);

  // Handle recipient selection
  const handleRecipientSelect = (recipient: {
    user_id: string;
    display_name: string;
    email: string;
    role: string;
  }) => {
    setSelectedRecipient(recipient);
    setRecipientSearchQuery(recipient.display_name || recipient.email);
    setComposeForm({ ...composeForm, recipient_user_id: recipient.user_id });
    setShowRecipientDropdown(false);
  };

  // Handle recipient input change
  const handleRecipientInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipientSearchQuery(e.target.value);
    setShowRecipientDropdown(true);
    // Clear selected recipient if user types
    if (selectedRecipient) {
      setSelectedRecipient(null);
      setComposeForm({ ...composeForm, recipient_user_id: '' });
    }
  };

  // Reset compose modal state when closing
  const handleCloseComposeModal = () => {
    setShowComposeModal(false);
    setComposeForm({
      recipient_user_id: '',
      subject: '',
      body: '',
      attachments: [],
    });
    setRecipientSearchQuery('');
    setSelectedRecipient(null);
    setShowRecipientDropdown(false);
  };

  // Handle compose submit
  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeForm.recipient_user_id || !composeForm.subject || !composeForm.body) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    const success = await sendMessage(composeForm);
    setIsSubmitting(false);

    if (success) {
      handleCloseComposeModal();
      alert('Message sent successfully!');
    } else {
      alert('Failed to send message. Please try again.');
    }
  };

  // Handle reply submit
  const handleReplySubmit = async () => {
    if (!replyBody.trim() || !currentThread) return;

    setIsSubmitting(true);
    const success = await replyToMessage(currentThread.root_message.id, replyBody);
    setIsSubmitting(false);

    if (success) {
      setReplyBody('');
    } else {
      alert('Failed to send reply. Please try again.');
    }
  };

  // Handle open thread
  const handleOpenThread = async (message: Message) => {
    setSelectedMessage(message);
    const threadId = message.thread_id || message.id;
    await fetchThread(threadId);
    setShowThreadModal(true);
  };

  // Handle mark as read
  const handleMarkAsRead = async (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markAsRead(messageId);
  };

  // Filter messages by search
  const filteredMessages = messages.filter(msg => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      msg.subject?.toLowerCase().includes(search) ||
      msg.body.toLowerCase().includes(search) ||
      msg.sender.display_name.toLowerCase().includes(search) ||
      msg.recipient.display_name.toLowerCase().includes(search)
    );
  });

  return (
    <div className="h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
              <p className="text-sm text-gray-500">
                {totalUnread} unread • {totalMessages} total
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowComposeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Send className="w-4 h-4" />
            Compose
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Folder Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {(['inbox', 'sent', 'unread', 'all'] as const).map((folder) => (
            <button
              key={folder}
              onClick={() => changeFolder(folder)}
              className={`
                px-4 py-3 font-medium text-sm capitalize transition border-b-2
                ${currentFolder === folder
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              {folder}
              {folder === 'unread' && totalUnread > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                  {totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Inbox className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No messages</p>
            <p className="text-sm">Your {currentFolder} is empty</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => handleOpenThread(message)}
                className={`
                  p-4 cursor-pointer transition hover:bg-gray-50
                  ${!message.is_read ? 'bg-blue-50' : ''}
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold
                        ${!message.is_read ? 'bg-blue-600' : 'bg-gray-400'}
                      `}>
                        {(currentFolder === 'sent'
                          ? message.recipient?.display_name || 'All'
                          : message.sender?.display_name || 'System'
                        ).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold truncate ${!message.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {currentFolder === 'sent'
                              ? message.recipient?.display_name || 'All Recipients'
                              : message.sender?.display_name || 'System'
                            }
                          </span>
                          <span className="text-xs text-gray-500">
                            ({currentFolder === 'sent' ? message.recipient?.role || 'group' : message.sender?.role || 'system'})
                          </span>
                        </div>
                        {message.subject && (
                          <div className={`text-sm truncate ${!message.is_read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                            {message.subject}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 truncate">
                          {getPreview(message.body)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(message.created_at)}
                    </div>
                    {!message.is_read && currentFolder !== 'sent' && (
                      <button
                        onClick={(e) => handleMarkAsRead(message.id, e)}
                        className="p-1 hover:bg-blue-100 rounded transition"
                        title="Mark as read"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                    {message.attachments && message.attachments.length > 0 && (
                      <Paperclip className="w-4 h-4 text-gray-400" />
                    )}
                    {message.reply_count !== undefined && message.reply_count > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MessageSquare className="w-4 h-4" />
                        {message.reply_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} • {totalMessages} total messages
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Compose Message</h3>
              <button
                onClick={handleCloseComposeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleComposeSubmit} className="p-6 space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient *
                </label>
                <div className="relative">
                  <input
                    ref={recipientInputRef}
                    type="text"
                    value={recipientSearchQuery}
                    onChange={handleRecipientInputChange}
                    onFocus={() => setShowRecipientDropdown(true)}
                    placeholder="Type name, email, or role to search..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    required={!composeForm.recipient_user_id}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>

                {/* Selected recipient badge */}
                {selectedRecipient && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{selectedRecipient.display_name || selectedRecipient.email}</span>
                    <span className="text-blue-600">({selectedRecipient.role})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipient(null);
                        setRecipientSearchQuery('');
                        setComposeForm({ ...composeForm, recipient_user_id: '' });
                      }}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Dropdown results */}
                {showRecipientDropdown && filteredRecipients.length > 0 && (
                  <div
                    ref={recipientDropdownRef}
                    className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredRecipients.map((recipient) => (
                      <button
                        key={recipient.user_id}
                        type="button"
                        onClick={() => handleRecipientSelect(recipient)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {(recipient.display_name || recipient.email)?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {recipient.display_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {recipient.email}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            recipient.role === 'student' ? 'bg-green-100 text-green-800' :
                            recipient.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                            recipient.role === 'parent' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {recipient.role}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results message */}
                {showRecipientDropdown && filteredRecipients.length === 0 && recipientSearchQuery.trim() && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No recipients found matching "{recipientSearchQuery}"
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  placeholder="Enter subject..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={200}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={composeForm.body}
                  onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                  placeholder="Type your message here..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={10000}
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {composeForm.body.length} / 10,000 characters
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseComposeModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thread Modal */}
      {showThreadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {currentThread?.root_message.subject || 'Message Thread'}
                </h3>
                {currentThread && (
                  <p className="text-sm text-gray-500 mt-1">
                    {currentThread.participant_count} participants • {currentThread.replies.length} replies
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowThreadModal(false);
                  closeThread();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingThread ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500">Loading conversation...</div>
              </div>
            ) : currentThread ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Root Message */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {(currentThread.root_message.sender?.display_name || 'System').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {currentThread.root_message.sender?.display_name || 'System'}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({currentThread.root_message.sender?.role || 'system'})
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(currentThread.root_message.created_at)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          To: {currentThread.root_message.recipient?.display_name || 'All Recipients'}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {currentThread.root_message.body}
                    </div>
                    {currentThread.root_message.attachments && currentThread.root_message.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {currentThread.root_message.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                          >
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{att.file_name}</span>
                            <span className="text-gray-400">
                              ({(att.file_size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Replies */}
                  {currentThread.replies.map((reply) => (
                    <div key={reply.id} className="ml-12 bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {(reply.sender?.display_name || 'User').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">
                              {reply.sender?.display_name || 'User'}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({reply.sender?.role || 'user'})
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(reply.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-800 text-sm whitespace-pre-wrap">
                        {reply.body}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="border-t border-gray-200 p-6">
                  <div className="mb-3">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      maxLength={10000}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {replyBody.length} / 10,000 characters
                    </div>
                    <button
                      onClick={handleReplySubmit}
                      disabled={!replyBody.trim() || isSubmitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Reply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Failed to load conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
