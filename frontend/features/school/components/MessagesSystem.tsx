'use client';

import { useState, useEffect } from 'react';
import { 
  Inbox,
  Send,
  Trash2,
  Star,
  Search,
  Filter,
  Plus,
  Paperclip,
  Reply,
  Forward,
  Archive,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Users,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchoolStore } from '../state/useSchoolStore';

interface Message {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  toEmail: string;
  recipientType: 'teacher' | 'parent' | 'student' | 'all';
  recipientId?: string;
  subject: string;
  body: string;
  timestamp: Date;
  read: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'draft' | 'trash';
  attachments?: string[];
  priority: 'high' | 'normal' | 'low';
}

export default function MessagesSystem() {
  const { teachers, students } = useSchoolStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'sent' | 'draft' | 'trash'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [recipientType, setRecipientType] = useState<'teacher' | 'parent' | 'student' | 'all'>('teacher');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: '',
    priority: 'normal' as 'high' | 'normal' | 'low'
  });
  
  // Load saved messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('schoolMessages');
    if (saved) {
      const parsed = JSON.parse(saved);
      setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    }
  }, []);
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('schoolMessages', JSON.stringify(messages));
    }
  }, [messages]);
  
  const filteredMessages = messages.filter(msg => {
    const matchesFolder = msg.folder === selectedFolder;
    const matchesSearch = searchTerm === '' || 
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.body.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFolder && matchesSearch;
  });
  
  const unreadCount = messages.filter(m => m.folder === 'inbox' && !m.read).length;
  
  // Get available recipients based on type
  const getRecipients = () => {
    if (recipientType === 'teacher') {
      return teachers.map(t => ({ id: t.id, name: t.name, email: t.email, type: 'Teacher' }));
    } else if (recipientType === 'student') {
      return students.map(s => ({ id: s.id, name: s.name, email: s.email || `${s.name.toLowerCase().replace(' ', '.')}@student.com`, type: 'Student' }));
    } else if (recipientType === 'parent') {
      return students.filter(s => s.parentEmail).map(s => ({ 
        id: s.id, 
        name: `Parent of ${s.name}`, 
        email: s.parentEmail!, 
        type: 'Parent' 
      }));
    } else {
      return [{ id: 'all', name: 'All Users', email: 'all@school.com', type: 'Everyone' }];
    }
  };
  
  const addRecipient = (recipient: any) => {
    if (!selectedRecipients.includes(recipient.email)) {
      setSelectedRecipients([...selectedRecipients, recipient.email]);
      setComposeData({ ...composeData, to: [...selectedRecipients, recipient.email].join(', ') });
    }
    setShowRecipientDropdown(false);
  };
  
  const removeRecipient = (email: string) => {
    const updated = selectedRecipients.filter(r => r !== email);
    setSelectedRecipients(updated);
    setComposeData({ ...composeData, to: updated.join(', ') });
  };
  
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const sendMessage = () => {
    if (!selectedRecipients.length || !composeData.subject || !composeData.body) {
      alert('Please select recipients and fill in all fields');
      return;
    }
    
    // Convert files to base64 for storage (in real app, would upload to server)
    const attachmentNames = attachedFiles.map(file => `${file.name} (${formatFileSize(file.size)})`);
    
    // Create a message for each recipient
    selectedRecipients.forEach(recipientEmail => {
      const recipientName = recipientEmail.split('@')[0].replace('.', ' ');
      const newMessage: Message = {
        id: crypto.randomUUID(),
        from: 'Admin User',
        fromEmail: 'admin@school.com',
        to: recipientName,
        toEmail: recipientEmail,
        recipientType: recipientType,
        subject: composeData.subject,
        body: composeData.body,
        timestamp: new Date(),
        read: true,
        starred: false,
        folder: 'sent',
        priority: composeData.priority,
        attachments: attachmentNames.length > 0 ? attachmentNames : undefined
      };
      
      setMessages(prev => [...prev, newMessage]);
    });
    
    // Simulate receiving a reply
    const replyMessage: Message = {
      id: crypto.randomUUID(),
      from: composeData.to,
      fromEmail: composeData.to.toLowerCase().replace(' ', '.') + '@school.com',
      to: 'Admin User',
      toEmail: 'admin@school.com',
      recipientType: recipientType,
      subject: 'Re: ' + composeData.subject,
      body: `Thank you for your message. I have received it and will respond soon.\n\n---Original Message---\n${composeData.body}`,
      timestamp: new Date(Date.now() + 60000), // 1 minute later
      read: false,
      starred: false,
      folder: 'inbox',
      priority: 'normal'
    };
    
    setShowCompose(false);
    setComposeData({ to: '', subject: '', body: '', priority: 'normal' });
    setSelectedRecipients([]);
    setRecipientType('teacher');
    setAttachedFiles([]);
  };
  
  const markAsRead = (id: string) => {
    setMessages(messages.map(m => 
      m.id === id ? { ...m, read: true } : m
    ));
  };
  
  const toggleStar = (id: string) => {
    setMessages(messages.map(m => 
      m.id === id ? { ...m, starred: !m.starred } : m
    ));
  };
  
  const moveToTrash = (id: string) => {
    setMessages(messages.map(m => 
      m.id === id ? { ...m, folder: 'trash' } : m
    ));
    setSelectedMessage(null);
  };
  
  const permanentDelete = (id: string) => {
    setMessages(messages.filter(m => m.id !== id));
    setSelectedMessage(null);
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
          <p className="text-sm text-gray-600 mt-1">School communication center</p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Compose
        </button>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3 bg-white rounded-lg border p-4">
          <div className="space-y-2">
            {[
              { id: 'inbox', label: 'Inbox', icon: Inbox, count: unreadCount },
              { id: 'sent', label: 'Sent', icon: Send, count: messages.filter(m => m.folder === 'sent').length },
              { id: 'draft', label: 'Drafts', icon: Clock, count: messages.filter(m => m.folder === 'draft').length },
              { id: 'trash', label: 'Trash', icon: Trash2, count: messages.filter(m => m.folder === 'trash').length }
            ].map(folder => {
              const Icon = folder.icon;
              return (
                <button
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolder(folder.id as any);
                    setSelectedMessage(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    selectedFolder === folder.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{folder.label}</span>
                  </div>
                  {folder.count > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      folder.id === 'inbox' && unreadCount > 0
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {folder.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Messages</span>
                <span className="font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Starred</span>
                <span className="font-medium">{messages.filter(m => m.starred).length}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Message List */}
        <div className="col-span-5 bg-white rounded-lg border">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No messages in {selectedFolder}</p>
              </div>
            ) : (
              filteredMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map(message => (
                <div
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.read) markAsRead(message.id);
                  }}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                  } ${!message.read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(message.id);
                        }}
                        className="hover:scale-110 transition-transform"
                      >
                        <Star className={`w-4 h-4 ${
                          message.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                        }`} />
                      </button>
                      <span className={`text-sm ${
                        !message.read ? 'font-semibold text-gray-900' : 'text-gray-700'
                      }`}>
                        {selectedFolder === 'sent' ? `To: ${message.to}` : message.from}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <div className="ml-6">
                    <p className={`text-sm mb-1 ${
                      !message.read ? 'font-medium text-gray-900' : 'text-gray-800'
                    }`}>
                      {message.subject}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {message.body.substring(0, 100)}...
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1">
                      {message.priority === 'high' && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          High Priority
                        </span>
                      )}
                      {message.attachments && message.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Paperclip className="w-3 h-3" />
                          {message.attachments.length} attachment{message.attachments.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Message Detail */}
        <div className="col-span-4 bg-white rounded-lg border">
          {selectedMessage ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{selectedMessage.subject}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStar(selectedMessage.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Star className={`w-4 h-4 ${
                        selectedMessage.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                      }`} />
                    </button>
                    <button
                      onClick={() => {
                        if (selectedMessage.folder === 'trash') {
                          permanentDelete(selectedMessage.id);
                        } else {
                          moveToTrash(selectedMessage.id);
                        }
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>From: {selectedMessage.from} ({selectedMessage.fromEmail})</span>
                  <span>To: {selectedMessage.to}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedMessage.timestamp.toLocaleString()}
                </p>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto">
                <p className="text-gray-800 whitespace-pre-wrap">{selectedMessage.body}</p>
                
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Attachments ({selectedMessage.attachments.length})</h4>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{attachment}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t flex items-center gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Forward className="w-4 h-4" />
                  Forward
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Inbox className="w-12 h-12 mx-auto mb-3" />
                <p>Select a message to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowCompose(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Compose Message</h3>
                <button
                  onClick={() => setShowCompose(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Type</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setRecipientType('teacher')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        recipientType === 'teacher' 
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' 
                          : 'bg-gray-100 text-gray-700 border-2 border-gray-200'
                      }`}
                    >
                      Teachers
                    </button>
                    <button
                      onClick={() => setRecipientType('parent')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        recipientType === 'parent' 
                          ? 'bg-green-100 text-green-700 border-2 border-green-500' 
                          : 'bg-gray-100 text-gray-700 border-2 border-gray-200'
                      }`}
                    >
                      Parents
                    </button>
                    <button
                      onClick={() => setRecipientType('student')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        recipientType === 'student' 
                          ? 'bg-purple-100 text-purple-700 border-2 border-purple-500' 
                          : 'bg-gray-100 text-gray-700 border-2 border-gray-200'
                      }`}
                    >
                      Students
                    </button>
                    <button
                      onClick={() => setRecipientType('all')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        recipientType === 'all' 
                          ? 'bg-orange-100 text-orange-700 border-2 border-orange-500' 
                          : 'bg-gray-100 text-gray-700 border-2 border-gray-200'
                      }`}
                    >
                      All
                    </button>
                  </div>
                  
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Recipients</label>
                  
                  {/* Selected Recipients */}
                  {selectedRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedRecipients.map(email => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {email.split('@')[0].replace('.', ' ')}
                          <button
                            onClick={() => removeRecipient(email)}
                            className="hover:text-blue-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
                    >
                      <span className="text-gray-500">
                        {selectedRecipients.length > 0 
                          ? `${selectedRecipients.length} recipient(s) selected` 
                          : `Select ${recipientType === 'all' ? 'all users' : recipientType + 's'}`}
                      </span>
                      <Users className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {showRecipientDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {getRecipients().length === 0 ? (
                          <div className="p-3 text-sm text-gray-500 text-center">
                            No {recipientType}s available
                          </div>
                        ) : (
                          getRecipients().map(recipient => (
                            <button
                              key={recipient.id}
                              onClick={() => addRecipient(recipient)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
                              disabled={selectedRecipients.includes(recipient.email)}
                            >
                              <div>
                                <div className="font-medium text-sm">{recipient.name}</div>
                                <div className="text-xs text-gray-500">{recipient.email}</div>
                              </div>
                              <span className="text-xs text-gray-400">{recipient.type}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={composeData.subject}
                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Message subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={composeData.priority}
                    onChange={(e) => setComposeData({ ...composeData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={composeData.body}
                    onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={8}
                    placeholder="Type your message here..."
                  />
                </div>
                
                {/* File Attachments */}
                {attachedFiles.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                    <div className="space-y-2">
                      {attachedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                          </div>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileAttachment}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                    />
                    <Paperclip className="w-4 h-4" />
                    Attach File
                  </label>
                  {attachedFiles.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {attachedFiles.length} file(s) attached
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCompose(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}