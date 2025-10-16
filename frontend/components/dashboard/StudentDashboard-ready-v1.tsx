'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getQuranByScriptId, 
  getSurahByNumber, 
  getAllQuranScripts, 
  getScriptStyling
} from '@/data/quran/cleanQuranLoader';
import { surahList } from '@/data/quran/surahData';
import {
  Book,
  Mic,
  MicOff,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Save,
  X,
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  AlertCircle,
  Check,
  Clock,
  Calendar,
  FileText,
  Upload,
  Eye,
  EyeOff,
  Highlighter,
  StickyNote,
  User,
  Award,
  TrendingUp,
  BarChart,
  Target,
  BookOpen,
  PenTool,
  Type,
  Palette,
  Brain,
  Volume2,
  Mail,
  Send,
  Archive,
  Bell,
  LogOut,
  UserCircle,
  Inbox,
  Reply
} from 'lucide-react';

export default function StudentDashboard() {
  // Student Info
  const [studentInfo] = useState({
    id: 'STU001',
    name: 'Ahmed Hassan',
    age: 12,
    class: 'Class 6A',
    teacherId: 'TCH001',
    currentSurah: 1,
    currentAyah: 1,
    memorized: '5 Juz',
    revision: '3 Juz',
    lastSession: '2 hours ago'
  });

  // Core States
  const [selectedScript] = useState('uthmani-hafs'); // Teacher-controlled
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [quranText, setQuranText] = useState({ surah: '', ayahs: [] });
  const [showSurahDropdown, setShowSurahDropdown] = useState(false);
  
  // Message & UI States
  const [messageTab, setMessageTab] = useState('inbox');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [showNoteReply, setShowNoteReply] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isRecordingReply, setIsRecordingReply] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<any>(null);
  const [audioProgress, setAudioProgress] = useState({});
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [studentProfile] = useState({
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@school.edu',
    phone: '+212 6XX-XXX-XXX',
    studentId: 'STU001',
    class: 'Class 6A',
    section: 'Section B',
    enrollmentDate: '15 Sept 2023',
    dateOfBirth: '12 March 2012',
    gender: 'Male',
    guardian: 'Mr. Hassan Ahmed',
    guardianPhone: '+212 6XX-XXX-XXX',
    address: '123 Main Street, Casablanca',
    bloodGroup: 'O+',
    emergencyContact: '+212 6XX-XXX-XXX'
  });
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'message', title: 'New message from teacher', text: 'Please review your homework', time: '5 minutes ago', unread: true },
    { id: 2, type: 'assignment', title: 'New assignment', text: 'Memorize Surah Al-Mulk verses 1-5', time: '2 hours ago', unread: true },
    { id: 3, type: 'achievement', title: 'Achievement unlocked!', text: 'Completed 5 Juz memorization', time: '1 day ago', unread: true },
    { id: 4, type: 'reminder', title: 'Class tomorrow', text: 'Quran class at 9:00 AM', time: '2 days ago', unread: false },
    { id: 5, type: 'feedback', title: 'Teacher feedback', text: 'Excellent recitation today!', time: '3 days ago', unread: false }
  ]);
  
  // Teacher Highlights (Read-only for students)
  const [highlights, setHighlights] = useState([
    { 
      id: 'h1', 
      ayahIndex: 0, 
      wordIndices: [0, 1], 
      mistakeType: 'tajweed',
      color: 'bg-orange-200',
      teacherNote: 'Remember to apply Idghaam rule here',
      timestamp: '2 days ago',
      teacherName: 'Ustadh Ahmed',
      replies: []
    },
    { 
      id: 'h2', 
      ayahIndex: 1, 
      wordIndices: [2, 3], 
      mistakeType: 'recap',
      color: 'bg-purple-200',
      teacherNote: 'Focus on proper pronunciation of these words',
      timestamp: '1 week ago',
      teacherName: 'Ustadh Ahmed',
      replies: [
        { id: 'r1', text: 'I practiced this 5 times', timestamp: '6 days ago', type: 'text', isStudent: true },
        { id: 'r2', text: 'Good job! Keep practicing the Idghaam rules', timestamp: '5 days ago', type: 'text', isStudent: false },
        { id: 'r3', text: 'Voice message', timestamp: '4 days ago', type: 'voice', isStudent: true }
      ]
    },
    { 
      id: 'h3', 
      ayahIndex: 2, 
      wordIndices: [1], 
      mistakeType: 'haraka',
      color: 'bg-red-200',
      teacherNote: 'This letter requires emphasis (tafkheem)',
      timestamp: '3 days ago',
      teacherName: 'Ustadh Ahmed',
      replies: []
    }
  ]);

  // Mock messages
  const [messages, setMessages] = useState({
    inbox: [
      { id: 1, from: 'Ustadh Ahmed', subject: 'Great progress today!', time: '2 hours ago', unread: true },
      { id: 2, from: 'School Admin', subject: 'Quran Competition Next Week', time: '1 day ago', unread: true },
      { id: 3, from: 'Ustadh Ahmed', subject: 'Homework for tomorrow', time: '2 days ago', unread: false }
    ],
    sent: [
      { id: 4, to: 'Ustadh Ahmed', subject: 'Question about Surah Mulk', time: '3 days ago' },
      { id: 5, to: 'Ustadh Ahmed', subject: 'Completed my revision', time: '1 week ago' }
    ],
    archive: [
      { id: 6, from: 'Ustadh Ahmed', subject: 'Previous assignment feedback', time: '2 weeks ago' }
    ]
  });

  const AYAHS_PER_PAGE = 7;

  // Load Quran text
  useEffect(() => {
    const scriptId = selectedScript || 'uthmani-hafs';
    const surahData = getSurahByNumber(scriptId, currentSurah);
    const surahInfo = surahList.find((s: any) => s.number === currentSurah);
    
    if (surahData && surahData.ayahs && surahData.ayahs.length > 0) {
      setQuranText({
        surah: surahData.name || surahInfo?.nameArabic || 'الفاتحة',
        ayahs: surahData.ayahs.map((ayah: any) => ({
          number: ayah.numberInSurah,
          text: ayah.text,
          words: ayah.text.split(' ')
        }))
      });
      setCurrentPage(1);
    }
  }, [currentSurah, selectedScript]);

  const allSurahs = surahList.map((s: any) => ({
    number: s.number,
    nameArabic: s.nameArabic,
    nameEnglish: s.nameEnglish,
    meaning: s.meaning,
    verses: s.verses,
    type: s.type
  }));

  const handleHighlightClick = (highlightId: any) => {
    const highlight = highlights.find((h: any) => h.id === highlightId);
    if (highlight) {
      setShowNoteReply(highlight);
    }
  };

  const handleSendReply = (type: any = 'text') => {
    if ((type === 'text' && replyText.trim()) || (type === 'voice')) {
      const newReply = {
        id: `r${Date.now()}`,
        text: type === 'text' ? replyText : 'Voice message',
        timestamp: 'Just now',
        type: type,
        isStudent: true
      };
      
      // Update the highlights with the new reply
      setHighlights((prevHighlights: any) => 
        prevHighlights.map((h: any) => 
          h.id === showNoteReply.id 
            ? { ...h, replies: [...h.replies, newReply] }
            : h
        )
      );
      
      // Update the current modal state
      setShowNoteReply((prev: any) => ({
        ...prev,
        replies: [...prev.replies, newReply]
      }));
      
      setReplyText('');
      setIsRecordingReply(false);
    }
  };
  
  const handleVoiceRecording = () => {
    if (!isRecordingReply) {
      // Start recording
      setIsRecordingReply(true);
      // In real app, start MediaRecorder here
    } else {
      // Stop recording and save
      handleSendReply('voice');
    }
  };
  
  const handleSendMessage = () => {
    if (composeSubject.trim() && composeMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        to: 'Ustadh Ahmed',
        subject: composeSubject,
        message: composeMessage,
        time: 'Just now'
      };
      
      // Add to sent messages
      setMessages((prev: any) => ({
        ...prev,
        sent: [newMessage, ...prev.sent]
      }));
      
      // Reset and close modal
      setComposeSubject('');
      setComposeMessage('');
      setShowComposeModal(false);
      setMessageTab('sent'); // Switch to sent tab to show the new message
    }
  };
  
  const handlePlayAudio = (replyId: any) => {
    if (playingAudioId === replyId) {
      // Stop playing
      setPlayingAudioId(null);
      setAudioProgress((prev: any) => ({ ...prev, [replyId]: 0 }));
    } else {
      // Start playing
      setPlayingAudioId(replyId);
      
      // Simulate audio playback progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress >= 100) {
          clearInterval(interval);
          setPlayingAudioId(null);
          setAudioProgress((prev: any) => ({ ...prev, [replyId]: 0 }));
        } else {
          setAudioProgress((prev: any) => ({ ...prev, [replyId]: progress }));
        }
      }, 150); // 15 seconds total (150ms * 100 = 15s)
    }
  };

  const totalPages = Math.ceil((quranText.ayahs?.length || 0) / AYAHS_PER_PAGE);
  const startIdx = (currentPage - 1) * AYAHS_PER_PAGE;
  const endIdx = startIdx + AYAHS_PER_PAGE;
  const currentAyahs = quranText.ayahs?.slice(startIdx, endIdx) || [];

  const currentSurahInfo = allSurahs.find((s: any) => s.number === currentSurah) || allSurahs[0];
  const scriptStyling = getScriptStyling(selectedScript);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Surah Name */}
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h1 className="text-3xl font-arabic text-green-800">
                  سُورَةُ {currentSurahInfo.nameArabic}
                </h1>
                <p className="text-sm text-gray-600">
                  {currentSurahInfo.nameEnglish} • {currentSurahInfo.type} • {currentSurahInfo.verses} Verses
                </p>
              </div>
            </div>

            {/* Center - Student Info */}
            <div className="text-center">
              <p className="text-sm text-gray-500">{studentInfo.name} • {studentInfo.class}</p>
              <p className="text-xs text-gray-400">Student Dashboard</p>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.filter((n: any) => n.unread).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter((n: any) => n.unread).length}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
                    <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <button 
                        onClick={() => {
                          setNotifications((prev: any) => prev.map((n: any) => ({ ...n, unread: false })));
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Mark all as read
                      </button>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => {
                              setNotifications((prev: any) => 
                                prev.map((n: any) => n.id === notif.id ? { ...n, unread: false } : n)
                              );
                            }}
                            className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition ${
                              notif.unread ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-full ${
                                notif.type === 'message' ? 'bg-blue-100' :
                                notif.type === 'assignment' ? 'bg-green-100' :
                                notif.type === 'achievement' ? 'bg-yellow-100' :
                                notif.type === 'reminder' ? 'bg-purple-100' :
                                'bg-gray-100'
                              }`}>
                                {notif.type === 'message' && <Mail className="w-4 h-4 text-blue-600" />}
                                {notif.type === 'assignment' && <FileText className="w-4 h-4 text-green-600" />}
                                {notif.type === 'achievement' && <Award className="w-4 h-4 text-yellow-600" />}
                                {notif.type === 'reminder' && <Clock className="w-4 h-4 text-purple-600" />}
                                {notif.type === 'feedback' && <MessageSquare className="w-4 h-4 text-gray-600" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                  {notif.unread && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5">{notif.text}</p>
                                <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2 border-t bg-gray-50">
                      <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 py-1">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <UserCircle className="w-5 h-5" />
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                    <button 
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowProfileDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600">
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Surah Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowSurahDropdown(!showSurahDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition"
                >
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-700">Change Surah</span>
                  <ChevronDown className={`w-4 h-4 text-green-600 transition-transform ${showSurahDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showSurahDropdown && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border z-50">
                    <div className="p-2">
                      {allSurahs.map((surah) => (
                        <button
                          key={surah.number}
                          onClick={() => {
                            setCurrentSurah(surah.number);
                            setShowSurahDropdown(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg hover:bg-gray-50 ${
                            currentSurah === surah.number ? 'bg-green-50 border-green-200 border' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{surah.number}. </span>
                              <span className="font-arabic text-lg">{surah.nameArabic}</span>
                              <p className="text-xs text-gray-500">{surah.nameEnglish} • {surah.verses} verses</p>
                            </div>
                            {currentSurah === surah.number && <Check className="w-4 h-4 text-green-600" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-12 py-6">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Sidebar - Teacher Messages */}
          <div className="col-span-2 space-y-3">
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="font-semibold mb-2 text-sm flex items-center">
                <Mail className="w-3 h-3 mr-1" />
                Teacher Messages
              </h3>
              
              {/* Tabs */}
              <div className="flex space-x-1 mb-3">
                {['inbox', 'sent', 'archive'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMessageTab(tab)}
                    className={`flex-1 px-2 py-1 text-xs rounded ${
                      messageTab === tab 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {tab === 'inbox' && <Inbox className="w-3 h-3 inline mr-1" />}
                    {tab === 'sent' && <Send className="w-3 h-3 inline mr-1" />}
                    {tab === 'archive' && <Archive className="w-3 h-3 inline mr-1" />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Messages List */}
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {messages[messageTab as keyof typeof messages].map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-2 rounded cursor-pointer hover:bg-gray-50 ${
                      msg.unread ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {('from' in msg ? msg.from : 'to' in msg ? msg.to : '')}
                        </p>
                        <p className="text-xs text-gray-600 truncate">{msg.subject}</p>
                      </div>
                      {msg.unread && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowComposeModal(true)}
                className="w-full mt-2 p-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Compose New Message
              </button>
            </div>

            {/* Student Stats */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="font-semibold mb-2 text-sm">My Progress</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Memorized:</span>
                  <span className="font-medium">{studentInfo.memorized}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revision:</span>
                  <span className="font-medium">{studentInfo.revision}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Session:</span>
                  <span className="font-medium">{studentInfo.lastSession}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center - Quran Viewer */}
          <div className="col-span-8">
            <div className="bg-white rounded-xl shadow-lg relative">
              <div className="p-8" style={{ minHeight: '800px' }}>
                <div className="text-center leading-loose px-16 py-8" style={scriptStyling}>
                  <div className="text-gray-900">
                    {currentAyahs.map((ayah, displayIndex) => {
                      const ayahIndex = (currentPage - 1) * AYAHS_PER_PAGE + displayIndex;
                      const ayahHighlights = highlights.filter((h: any) => h.ayahIndex === ayahIndex);
                      
                      return (
                        <div key={ayah.number} className="inline-block relative group">
                          {ayah.words.map((word, wordIndex) => {
                            const wordHighlights = ayahHighlights.filter((h: any) => 
                              h.wordIndices.includes(wordIndex)
                            );
                            
                            return (
                              <span
                                key={`${ayahIndex}-${wordIndex}`}
                                onClick={() => {
                                  if (wordHighlights.length > 0) {
                                    handleHighlightClick(wordHighlights[0].id);
                                  }
                                }}
                                className={`inline-block mx-1 px-1 cursor-pointer rounded transition-colors select-none 
                                  ${wordHighlights.length > 0 
                                    ? `${wordHighlights[0].color} border-2 border-blue-400 shadow-sm` 
                                    : ''
                                  }`}
                                style={{ position: 'relative' }}
                              >
                                {word}
                                {wordHighlights.length > 0 && (
                                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    !
                                  </span>
                                )}
                              </span>
                            );
                          })}
                          <span className="inline-flex items-center justify-center mx-2 align-middle"
                            style={{
                              width: '35px',
                              height: '35px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              verticalAlign: 'middle',
                              display: 'inline-flex'
                            }}
                          >
                            {ayah.number}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pagination */}
                <div className="mt-8 flex items-center justify-between border-t pt-6">
                  <button
                    onClick={() => setCurrentPage((p: any) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-6 py-3 ${
                      currentPage === 1 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white rounded-lg flex items-center space-x-2 shadow-md transition`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Previous Page</span>
                  </button>

                  <div className="text-center">
                    <span className="text-lg font-semibold text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>

                  <button
                    onClick={() => setCurrentPage((p: any) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-6 py-3 ${
                      currentPage === totalPages 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white rounded-lg flex items-center space-x-2 shadow-md transition`}
                  >
                    <span>Next Page</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Notes History */}
          <div className="col-span-2 space-y-3">
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="font-semibold mb-2 text-sm flex items-center">
                <StickyNote className="w-3 h-3 mr-1" />
                Notes History
              </h3>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {highlights.map((highlight) => (
                  <div 
                    key={highlight.id} 
                    className="p-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                    onClick={() => handleHighlightClick(highlight.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-700">
                          {highlight.teacherName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {highlight.teacherNote}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {highlight.timestamp}
                        </p>
                        {highlight.replies.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            {highlight.replies.length} replies
                          </p>
                        )}
                      </div>
                      <div className={`w-3 h-3 rounded ${highlight.color}`}></div>
                    </div>
                  </div>
                ))}
                
                {highlights.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No notes from teacher yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp-style Note Reply Modal */}
      {showNoteReply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full h-[600px] flex flex-col overflow-hidden">
            {/* WhatsApp Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">{showNoteReply.teacherName}</p>
                  <p className="text-xs text-green-100">Online</p>
                </div>
              </div>
              <button
                onClick={() => setShowNoteReply(null)}
                className="p-2 hover:bg-green-700 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzlIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSIjZTVlN2ViIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]">
              <div className="space-y-3">
                {/* Teacher's Initial Note */}
                <div className="flex justify-start">
                  <div className="max-w-[70%]">
                    <div className="bg-white rounded-lg rounded-tl-none p-3 shadow">
                      <p className="text-sm text-gray-800">{showNoteReply.teacherNote}</p>
                      <p className="text-xs text-gray-400 mt-1 text-right">{showNoteReply.timestamp}</p>
                    </div>
                  </div>
                </div>

                {/* Conversation Messages */}
                {showNoteReply.replies.map((reply) => (
                  <div 
                    key={reply.id} 
                    className={`flex ${reply.isStudent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[70%]">
                      <div className={`rounded-lg p-3 shadow ${
                        reply.isStudent 
                          ? 'bg-green-100 rounded-tr-none' 
                          : 'bg-white rounded-tl-none'
                      }`}>
                        {reply.type === 'voice' ? (
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handlePlayAudio(reply.id)}
                              className={`p-2 rounded-full transition ${
                                playingAudioId === reply.id
                                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                  : 'bg-green-500 hover:bg-green-600'
                              } text-white`}
                            >
                              {playingAudioId === reply.id ? (
                                <Pause className="w-3 h-3" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="h-6 bg-gray-200 rounded-full relative overflow-hidden">
                                {/* Progress bar */}
                                {playingAudioId === reply.id && (
                                  <div 
                                    className="absolute left-0 top-0 h-full bg-green-400 transition-all duration-150"
                                    style={{ width: `${audioProgress[reply.id] || 0}%` }}
                                  />
                                )}
                                {/* Waveform */}
                                <div className="absolute inset-0 flex items-center px-1">
                                  {[...Array(20)].map((_, i) => {
                                    const isPlaying = playingAudioId === reply.id;
                                    const isPassed = isPlaying && i < (20 * (audioProgress[reply.id] || 0) / 100);
                                    return (
                                      <div 
                                        key={i} 
                                        className={`w-0.5 mx-px transition-all ${
                                          isPassed 
                                            ? 'bg-white' 
                                            : isPlaying 
                                              ? 'bg-gray-500 animate-pulse' 
                                              : 'bg-gray-400'
                                        }`}
                                        style={{ 
                                          height: `${Math.sin(i * 0.5) * 50 + 50}%`,
                                          animationDelay: `${i * 50}ms`
                                        }}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <span className={`text-xs ${
                              playingAudioId === reply.id ? 'text-green-600 font-medium' : 'text-gray-500'
                            }`}>
                              {playingAudioId === reply.id 
                                ? `0:${Math.floor((100 - (audioProgress[reply.id] || 0)) * 0.15).toString().padStart(2, '0')}`
                                : '0:15'
                              }
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-800">{reply.text}</p>
                        )}
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <p className="text-xs text-gray-400">{reply.timestamp}</p>
                          {reply.isStudent && (
                            <div className="flex">
                              <Check className="w-3 h-3 text-blue-500" />
                              <Check className="w-3 h-3 text-blue-500 -ml-1" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp-style Input Bar */}
            <div className="bg-gray-100 p-3 border-t">
              <div className="flex items-end space-x-2">
                {/* Voice/Text Toggle */}
                {!replyText.trim() ? (
                  <button
                    onClick={handleVoiceRecording}
                    className={`p-3 rounded-full transition ${
                      isRecordingReply 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {isRecordingReply ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendReply('text')}
                    className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                )}
                
                {/* Message Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && replyText.trim() && handleSendReply('text')}
                    placeholder="Type a message"
                    className="w-full px-4 py-3 bg-white rounded-full border focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              
              {/* Recording Indicator */}
              {isRecordingReply && (
                <div className="mt-2 flex items-center justify-center space-x-2 text-red-500">
                  <div className="animate-pulse">●</div>
                  <span className="text-sm">Recording...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Message Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">New Message to Teacher</h3>
              <button
                onClick={() => setShowComposeModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* To Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To:
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded border text-sm">
                  Ustadh Ahmed (Your Teacher)
                </div>
              </div>

              {/* Subject Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject:
                </label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message:
                </label>
                <textarea
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  rows="6"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!composeSubject.trim() || !composeMessage.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 ${
                    composeSubject.trim() && composeMessage.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile View Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {studentProfile.name.split(' ').map((n: any) => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{studentProfile.name}</h2>
                  <p className="text-gray-500">{studentProfile.studentId} • {studentProfile.class}</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  This profile is managed by your school. Contact the administration for any changes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 border-b pb-2">Personal Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Full Name</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Student ID</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.studentId}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Date of Birth</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.dateOfBirth}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Gender</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.gender}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Blood Group</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.bloodGroup}</p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 border-b pb-2">Academic Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Class</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.class}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Section</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.section}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Enrollment Date</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.enrollmentDate}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Memorization Progress</label>
                    <p className="text-sm font-medium text-gray-800">{studentInfo.memorized}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Revision Progress</label>
                    <p className="text-sm font-medium text-gray-800">{studentInfo.revision}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 border-b pb-2">Contact Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.email}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Phone Number</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.phone}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Address</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.address}</p>
                  </div>
                </div>
              </div>

              {/* Guardian Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 border-b pb-2">Guardian Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Guardian Name</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.guardian}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Guardian Phone</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.guardianPhone}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Emergency Contact</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.emergencyContact}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}