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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Compose form state
  const [composeForm, setComposeForm] = useState({
    recipient_user_id: '',
    subject: '',
    body: '',
    attachments: [] as Array<{ url: string; mime_type: string; file_name: string; file_size: number }>,
  });

  // Group messaging state
  const [messageType, setMessageType] = useState<'individual' | 'group'>('individual');
  const [groupMessageType, setGroupMessageType] = useState<'all_students' | 'all_parents' | 'specific_class'>('all_students');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [teacherClasses, setTeacherClasses] = useState<Array<{ id: string; name: string }>>([]);

  // Reply form state
  const [replyBody, setReplyBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Attachment upload state
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch allowed recipients when compose modal opens (role-based filtering)
  useEffect(() => {
    const fetchRecipients = async () => {
      if (!showComposeModal || !user?.id) return;

      try {
        // Fetch allowed recipients based on user role via API endpoint
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.error('No session found');
          return;
        }

        const response = await fetch('/api/messages/allowed-recipients', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch allowed recipients:', response.statusText);
          return;
        }

        const result = await response.json();

        if (result.success && result.recipients) {
          setAvailableRecipients(result.recipients);
          setFilteredRecipients(result.recipients);

          // If teacher classes are provided, store them for group messaging
          if (result.teacher_classes) {
            setTeacherClasses(result.teacher_classes);
          }
        }
      } catch (error) {
        console.error('Error fetching recipients:', error);
      }
    };

    fetchRecipients();
  }, [showComposeModal, user?.id]);

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

  // Programmatic download handler for attachments
  const handleDownloadAttachment = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
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

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/mpeg',
      'audio/wav',
      'audio/m4a',
      'audio/mp4',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('File type not allowed. Allowed: images, PDFs, Word documents, and audio files');
      return;
    }

    setUploadingAttachment(true);

    try {
      // Get auth session for Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please login to upload files');
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('message_id_temp', Date.now().toString());

      // Upload file with Authorization header
      const response = await fetch('/api/messages/upload-attachment', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Add attachment to form
      setComposeForm({
        ...composeForm,
        attachments: [...composeForm.attachments, {
          url: result.url,
          mime_type: result.mime_type,
          file_name: result.file_name,
          file_size: result.file_size,
        }],
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  // Handle remove attachment
  const handleRemoveAttachment = (index: number) => {
    setComposeForm({
      ...composeForm,
      attachments: composeForm.attachments.filter((_, i) => i !== index),
    });
  };

  // Handle compose submit
  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation based on message type
    if (messageType === 'individual') {
      if (!composeForm.recipient_user_id || !composeForm.subject || !composeForm.body) {
        alert('Please fill in all required fields');
        return;
      }
    } else {
      // Group message validation
      if (!composeForm.body) {
        alert('Please enter a message');
        return;
      }
      if (groupMessageType === 'specific_class' && !selectedClassId) {
        alert('Please select a class');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (messageType === 'individual') {
        // Send individual message
        const success = await sendMessage(composeForm);
        if (!success) throw new Error('Failed to send individual message');
      } else {
        // Send group message
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const response = await fetch('/api/messages/send-group', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            recipient_type: groupMessageType,
            ...(groupMessageType === 'specific_class' ? { class_id: selectedClassId } : {}),
            subject: composeForm.subject || undefined,
            body: composeForm.body,
          }),
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to send group message');

        console.log(`✅ Group message sent to ${result.recipient_count} recipients`);
      }

      handleCloseComposeModal();
      alert('Message sent successfully!');
      refreshMessages(); // Refresh to show sent message
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
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
    <div className="h-full bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-xl overflow-hidden flex">
      {/* LEFT PANE - Message List */}
      <div className="w-[380px] bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Messages</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  {totalUnread} unread
                </span>
                <span className="text-xs text-gray-500">{totalMessages} total</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowComposeModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl font-medium text-sm"
          >
            <Send className="w-4 h-4" />
            Compose New
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all placeholder-gray-400"
            />
          </div>
        </div>

        {/* Folder Tabs */}
        <div className="bg-white border-b border-gray-100 px-2">
          <div className="flex gap-1">
            {(['inbox', 'sent', 'unread', 'all'] as const).map((folder) => (
            <button
              key={folder}
              onClick={() => changeFolder(folder)}
              className={`
                flex-1 relative px-3 py-2.5 font-semibold text-xs capitalize transition-all border-b-2
                ${currentFolder === folder
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <span className="relative z-10">{folder}</span>
              {folder === 'unread' && totalUnread > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

        {/* Compact Messages List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 font-medium text-sm">Loading...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="font-medium text-sm">{error}</p>
              </div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 px-4">
              <div className="bg-gray-100 p-4 rounded-full mb-3">
                <Inbox className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-1">No messages</p>
              <p className="text-xs text-gray-500">Your {currentFolder} folder is empty</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => handleOpenThread(message)}
                className={`
                  px-4 py-3 cursor-pointer transition-all border-b border-gray-100 hover:bg-blue-50
                  ${selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
                  ${!message.is_read ? 'bg-blue-50/30' : 'bg-white'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0
                    ${!message.is_read
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'}
                  `}>
                    {(currentFolder === 'sent'
                      ? message.recipient?.display_name || 'All'
                      : message.sender?.display_name || 'System'
                    ).charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`font-bold truncate text-sm ${!message.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {currentFolder === 'sent'
                          ? message.recipient?.display_name || 'All Recipients'
                          : message.sender?.display_name || 'System'
                        }
                      </span>
                      <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap">
                        {formatDate(message.created_at)}
                      </span>
                    </div>

                    {message.subject && (
                      <div className={`text-xs mb-0.5 truncate ${!message.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                        {message.subject}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 line-clamp-1">
                      {getPreview(message.body)}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Paperclip className="w-3 h-3" />
                          <span className="text-[10px]">{message.attachments.length}</span>
                        </div>
                      )}
                      {message.reply_count !== undefined && message.reply_count > 0 && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <MessageSquare className="w-3 h-3" />
                          <span className="text-[10px] font-semibold">{message.reply_count}</span>
                        </div>
                      )}
                      {!message.is_read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white border-t border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">
                Page {currentPage}/{totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANE - Conversation View */}
      <div className="flex-1 flex flex-col bg-white">
        {!selectedMessage && !currentThread ? (
          /* Empty State - No message selected */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full">
                <Mail className="w-16 h-16 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">Select a message to view</h3>
                <p className="text-sm text-gray-500">
                  Choose a message from the list to read the full conversation and reply
                </p>
              </div>
            </div>
          </div>
        ) : isLoadingThread ? (
          /* Loading State */
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Loading conversation...</p>
            </div>
          </div>
        ) : currentThread ? (
          /* Thread View */
          <>
            {/* Thread Header */}
            <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 truncate">
                      {currentThread.root_message.subject || 'Message Thread'}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <span>{currentThread.participant_count} participants</span>
                        <span className="text-gray-400">•</span>
                        <span>{currentThread.replies.length} replies</span>
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    closeThread();
                  }}
                  className="p-2 hover:bg-white rounded-lg transition-all hover:shadow-md flex-shrink-0 ml-4"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-4">
              {/* Root Message */}
              <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-purple-100">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                    {(currentThread.root_message.sender?.display_name || 'System').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-900 text-base truncate">
                        {currentThread.root_message.sender?.display_name || 'System'}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-700 flex-shrink-0">
                        {currentThread.root_message.sender?.role || 'system'}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">•</span>
                      <span className="text-xs font-medium text-gray-500 flex-shrink-0">
                        {formatDate(currentThread.root_message.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 font-medium truncate">
                      To: <span className="text-gray-900">{currentThread.root_message.recipient?.display_name || 'All Recipients'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {currentThread.root_message.body}
                </div>
                {currentThread.root_message.attachments && currentThread.root_message.attachments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentThread.root_message.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 border-2 border-purple-200 rounded-xl text-sm hover:border-purple-300 transition-all cursor-pointer shadow-sm hover:shadow"
                        onClick={() => handleDownloadAttachment(att.url, att.file_name)}
                      >
                        <Paperclip className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-900 font-medium">{att.file_name}</span>
                        <span className="text-gray-500 font-medium">
                          ({(att.file_size / 1024).toFixed(1)} KB)
                        </span>
                        <span className="text-purple-600 text-xs font-bold ml-1">Download</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Replies */}
              {currentThread.replies.map((reply) => (
                <div key={reply.id} className="ml-12 bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                      {(reply.sender?.display_name || 'User').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 truncate">
                          {reply.sender?.display_name || 'User'}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-700 flex-shrink-0">
                          {reply.sender?.role || 'user'}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">•</span>
                        <span className="text-xs font-medium text-gray-500 flex-shrink-0">
                          {formatDate(reply.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
                    {reply.body}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="mb-3">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:border-gray-300 resize-none text-gray-900 font-medium text-sm"
                  maxLength={10000}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-gray-500">
                  {replyBody.length} / 10,000 characters
                </div>
                <button
                  onClick={handleReplySubmit}
                  disabled={!replyBody.trim() || isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold text-sm"
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
          /* Error State */
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">Failed to load conversation</p>
              <p className="text-sm text-gray-500">Please try again later</p>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Compose Message</h3>
              </div>
              <button
                onClick={handleCloseComposeModal}
                className="p-2.5 hover:bg-white rounded-xl transition-all hover:shadow-md"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleComposeSubmit} className="flex-1 overflow-y-auto">
              <div className="px-8 py-6 space-y-6">
                {/* Message Type Selector - Only show for teachers */}
                {userRole === 'teacher' && (
                  <div className="space-y-4 pb-6 border-b border-gray-100">
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Message Type *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border-2 transition-all hover:bg-blue-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 has-[:not(:checked)]:border-gray-200">
                        <input
                          type="radio"
                          name="messageType"
                          value="individual"
                          checked={messageType === 'individual'}
                          onChange={(e) => setMessageType(e.target.value as 'individual' | 'group')}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Individual Message</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border-2 transition-all hover:bg-blue-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 has-[:not(:checked)]:border-gray-200">
                        <input
                          type="radio"
                          name="messageType"
                          value="group"
                          checked={messageType === 'group'}
                          onChange={(e) => setMessageType(e.target.value as 'individual' | 'group')}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Group Message</span>
                      </label>
                    </div>

                    {/* Group Message Options */}
                    {messageType === 'group' && (
                      <div className="space-y-5 pt-5">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Send To *
                          </label>
                          <select
                            value={groupMessageType}
                            onChange={(e) => setGroupMessageType(e.target.value as 'all_students' | 'all_parents' | 'specific_class')}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 text-gray-900 font-medium"
                            required
                          >
                            <option value="all_students">All Students (in my classes)</option>
                            <option value="all_parents">All Parents (of my students)</option>
                            <option value="specific_class">Specific Class</option>
                          </select>
                        </div>

                        {/* Class Selector - Only show for specific_class */}
                        {groupMessageType === 'specific_class' && (
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              Select Class *
                            </label>
                            <select
                              value={selectedClassId}
                              onChange={(e) => setSelectedClassId(e.target.value)}
                              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 text-gray-900 font-medium"
                              required
                            >
                              <option value="">Choose a class...</option>
                              {teacherClasses.map((classItem) => (
                                <option key={classItem.id} value={classItem.id}>
                                  {classItem.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Recipient Field - Only show for individual messages */}
                {messageType === 'individual' && (
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
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
                        className="w-full px-4 py-3 pr-12 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 text-gray-900"
                        required={!composeForm.recipient_user_id}
                      />
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>

                    {/* Selected recipient badge */}
                    {selectedRecipient && (
                      <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-900 rounded-xl text-sm shadow-sm border border-blue-200">
                        <User className="w-4 h-4" />
                        <span className="font-bold">{selectedRecipient.display_name || selectedRecipient.email}</span>
                        <span className="text-blue-700 font-medium">({selectedRecipient.role})</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecipient(null);
                            setRecipientSearchQuery('');
                            setComposeForm({ ...composeForm, recipient_user_id: '' });
                          }}
                          className="hover:bg-blue-200 rounded-full p-1 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Dropdown results */}
                    {showRecipientDropdown && filteredRecipients.length > 0 && (
                      <div
                        ref={recipientDropdownRef}
                        className="absolute z-10 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto"
                      >
                        {filteredRecipients.map((recipient) => (
                          <button
                            key={recipient.user_id}
                            type="button"
                            onClick={() => handleRecipientSelect(recipient)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-all flex items-center gap-3 border-b border-gray-100 last:border-0 first:rounded-t-xl last:rounded-b-xl"
                          >
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                              {(recipient.display_name || recipient.email)?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-900 truncate">
                                {recipient.display_name || 'No name'}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {recipient.email}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
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
                      <div className="absolute z-10 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl p-5 text-center">
                        <p className="text-gray-500 font-medium">No recipients found matching "{recipientSearchQuery}"</p>
                  </div>
                )}
              </div>
              )}

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Subject {messageType === 'individual' && '*'}
                  </label>
                  <input
                    type="text"
                    value={composeForm.subject}
                    onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                    placeholder={messageType === 'group' ? 'Enter subject (optional)' : 'Enter subject...'}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 text-gray-900 font-medium"
                    maxLength={200}
                    required={messageType === 'individual'}
                  />
                </div>

                {/* Group Message Info */}
                {messageType === 'group' && (
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg shadow-md">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-sm text-blue-900 flex-1">
                        <p className="font-bold mb-1.5">Group Message</p>
                        <p className="font-medium">
                          {groupMessageType === 'all_students' && 'This message will be sent to all students in your classes.'}
                          {groupMessageType === 'all_parents' && 'This message will be sent to all parents of your students.'}
                          {groupMessageType === 'specific_class' && selectedClassId &&
                            `This message will be sent to all students and parents in ${teacherClasses.find(c => c.id === selectedClassId)?.name || 'the selected class'}.`}
                          {groupMessageType === 'specific_class' && !selectedClassId &&
                            'Please select a class to send this message to.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={composeForm.body}
                    onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                    placeholder="Type your message here..."
                    rows={8}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 resize-none text-gray-900 font-medium"
                    maxLength={10000}
                    required
                  />
                  <div className="text-xs font-medium text-gray-500 mt-2">
                    {composeForm.body.length} / 10,000 characters
                  </div>
                </div>

                {/* Attachments Section */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,audio/*"
                  />
                  <button
                    type="button"
                    onClick={handleFileSelect}
                    disabled={uploadingAttachment}
                    className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Paperclip className="w-4 h-4" />
                    {uploadingAttachment ? 'Uploading...' : 'Attach File'}
                  </button>

                  {/* Attachment Preview List */}
                  {composeForm.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {composeForm.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Paperclip className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {attachment.file_name}
                              </p>
                              <p className="text-xs font-medium text-gray-500">
                                {(attachment.file_size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(index)}
                            className="ml-3 p-2 text-red-600 hover:bg-red-100 rounded-xl transition-all flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 bg-gray-50 px-8 py-5 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseComposeModal}
                  className="px-6 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:border-gray-300 transition-all shadow-sm font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
