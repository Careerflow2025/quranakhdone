'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send, Mic, MicOff, Play, Pause, User, Clock, Volume2, CheckCircle } from 'lucide-react';
import VoiceNoteRecorder from '@/components/quran/VoiceNoteRecorder';

interface Note {
  id: string;
  parent_note_id: string | null;
  author_user_id: string;
  author_name: string;
  author_role: string;
  type: 'text' | 'audio';
  text: string | null;
  audio_url: string | null;
  visible_to_parent: boolean;
  created_at: string;
  reply_count: number;
  depth: number;
}

interface NotesPanelProps {
  highlightId: string; // REQUIRED: conversation is attached to a highlight
  mode?: 'sidebar' | 'modal'; // Display mode
  onClose?: () => void; // For modal mode
}

export default function NotesPanel({
  highlightId,
  mode = 'sidebar',
  onClose
}: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // For threading
  const [isCompleting, setIsCompleting] = useState(false); // For completion button
  const [isCompleted, setIsCompleted] = useState(false); // Track if highlight is completed
  const [highlightData, setHighlightData] = useState<any>(null); // Full highlight details with previous_color
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get current user on mount
  useEffect(() => {
    async function getCurrentUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, schools(id, name)')
        .eq('user_id', session.user.id)
        .single();

      if (profile) {
        setCurrentUser(profile);
      }
    }
    getCurrentUser();
  }, []);

  // Load conversation thread
  async function load() {
    console.log('🔄 NotesPanel: load() called');
    console.log('🔖 highlightId:', highlightId);

    if (!highlightId) {
      console.log('❌ Early return - no highlightId');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('❌ No session for load');
      return;
    }

    console.log('✅ Session exists, fetching thread...');
    setIsLoading(true);
    try {
      const endpoint = `/api/highlights/${highlightId}/notes/thread`;
      console.log('📡 GET:', endpoint);

      const res = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('📥 Thread response status:', res.status);
      const j = await res.json();
      console.log('📥 Thread response body:', j);

      if (j.success) {
        console.log('✅ Thread loaded successfully');
        console.log('📊 Number of notes:', (j.thread || []).length);
        console.log('📋 Notes data:', j.thread);

        setNotes(j.thread || []);
        // Scroll to bottom on new messages
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        console.error('❌ Thread API returned success=false:', j);
      }
    } catch (error) {
      console.error('❌ Failed to load conversation thread:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Load highlight details (including previous_color for completed context)
  async function loadHighlightDetails() {
    if (!highlightId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Fetch highlight details directly from Supabase
      const { data, error } = await supabase
        .from('highlights')
        .select('id, type, color, previous_color, completed_at, completed_by')
        .eq('id', highlightId)
        .single();

      if (error) {
        console.error('❌ Failed to fetch highlight details:', error);
        return;
      }

      console.log('✅ Highlight details loaded:', data);
      setHighlightData(data);
      setIsCompleted(!!data.completed_at); // Update completion status
    } catch (error) {
      console.error('❌ Error loading highlight details:', error);
    }
  }

  useEffect(() => {
    load();
    loadHighlightDetails();
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      load();
      loadHighlightDetails();
    }, 10000);
    return () => clearInterval(interval);
  }, [highlightId]);

  // Add note or reply
  async function add() {
    console.log('🎯 NotesPanel: add() called');
    console.log('📝 text:', text);
    console.log('👤 currentUser:', currentUser);
    console.log('🔖 highlightId:', highlightId);
    console.log('💬 replyingTo:', replyingTo);

    if (!text.trim() || !currentUser || !highlightId) {
      console.log('❌ Early return - validation failed:', {
        hasText: !!text.trim(),
        hasUser: !!currentUser,
        hasHighlightId: !!highlightId
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('❌ No session for add');
      return;
    }

    console.log('✅ Session exists, making API call...');
    setIsLoading(true);
    try {
      const requestBody = {
        type: 'text',
        text: text.trim(),
        parent_note_id: replyingTo,
        visible_to_parent: true  // Always visible to parents
      };
      const endpoint = `/api/highlights/${highlightId}/notes/add`;

      console.log('📡 POST:', endpoint);
      console.log('📤 Request body:', requestBody);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Add response status:', res.status);
      const j = await res.json();
      console.log('📥 Add response body:', j);

      if (j.success) {
        console.log('✅ Note added successfully, reloading thread...');
        await load();
        setText('');
        setReplyingTo(null);
        console.log('✅ Thread reloaded and state cleared');
      } else {
        console.error('❌ API returned success=false:', j);
        alert(`Failed to add note: ${j.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Failed to add note:', error);
      alert('Network error: Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Handle voice note upload
  const handleVoiceNoteReady = async (audioBlob: Blob) => {
    console.log('🎤 NotesPanel: handleVoiceNoteReady() called');
    console.log('🎵 audioBlob size:', audioBlob.size, 'bytes');
    console.log('👤 currentUser:', currentUser);
    console.log('🔖 highlightId:', highlightId);

    if (!currentUser || !highlightId) {
      console.log('❌ Early return - missing user or highlightId');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('❌ No session for voice note');
      return;
    }

    console.log('✅ Session exists, uploading voice note...');
    setIsLoading(true);
    try {
      // Create form data with audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-note.m4a');
      formData.append('highlightId', highlightId);

      console.log('📡 POST: /api/voice-notes/upload');
      console.log('📤 FormData: audio blob + highlightId');

      // Upload to storage
      const uploadRes = await fetch('/api/voice-notes/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      console.log('📥 Upload response status:', uploadRes.status);
      const uploadData = await uploadRes.json();
      console.log('📥 Upload response body:', uploadData);

      if (!uploadData.success) {
        console.error('❌ Upload failed:', uploadData.error);
        alert('Failed to upload voice note. Please try again.');
        return;
      }

      console.log('✅ Voice note uploaded, creating note record...');

      // Create note with audio URL
      const requestBody = {
        type: 'audio',
        audio_url: uploadData.audioUrl,
        parent_note_id: replyingTo,
        visible_to_parent: true  // Always visible to parents
      };
      const endpoint = `/api/highlights/${highlightId}/notes/add`;

      console.log('📡 POST:', endpoint);
      console.log('📤 Request body:', requestBody);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Add voice note response status:', res.status);
      const j = await res.json();
      console.log('📥 Add voice note response body:', j);

      if (j.success) {
        console.log('✅ Voice note record created, reloading thread...');
        // Reload full thread to show new note in correct position
        await load();
        setReplyingTo(null);
        setShowVoiceRecorder(false);
        console.log('✅ Voice note added successfully');
      } else {
        console.error('❌ Voice note API returned success=false:', j);
        alert(`Failed to save voice note: ${j.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Failed to add voice note:', error);
      alert('Network error: Failed to save voice note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mark highlight as completed (turns it gold)
  const markAsCompleted = async () => {
    if (!currentUser || isCompleted) return;

    // Only teachers can mark as completed
    if (currentUser.role !== 'teacher' && currentUser.role !== 'admin' && currentUser.role !== 'owner') {
      alert('Only teachers can mark highlights as completed');
      return;
    }

    const confirmComplete = confirm(
      'Mark this highlight as completed? This will turn it gold and track progress.'
    );

    if (!confirmComplete) return;

    try {
      setIsCompleting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('No active session');
        return;
      }

      console.log('🎉 Marking highlight as completed:', highlightId);

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
      console.log('✅ Highlight marked as completed:', data);

      setIsCompleted(true);

      // Reload highlight details to get updated previous_color and completed_at
      await loadHighlightDetails();

      alert('Highlight marked as completed! It will now appear in gold.');

      // Notify parent component to refresh highlights if needed
      window.dispatchEvent(new CustomEvent('highlight-completed', {
        detail: { highlightId }
      }));

    } catch (error: any) {
      console.error('❌ Failed to mark highlight as completed:', error);
      alert(`Failed to mark as completed: ${error.message}`);
    } finally {
      setIsCompleting(false);
    }
  };

  const isSidebarMode = mode === 'sidebar';

  return (
    <div className={`flex flex-col h-full ${isSidebarMode ? 'bg-white' : 'bg-white rounded-lg shadow-xl'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">Teacher-Student Notes</h3>
            <p className="text-xs opacity-90">Conversation thread</p>
          </div>
        </div>
        {!isSidebarMode && onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition"
          >
            ✕
          </button>
        )}
      </div>

      {/* Conversation Thread (WhatsApp-like) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading && notes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Loading conversation...</p>
            </div>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation below</p>
            </div>
          </div>
        ) : (
          <>
            {notes.map((note) => {
              const isCurrentUser = currentUser && note.author_user_id === currentUser.user_id;
              const isReply = note.parent_note_id !== null;

              return (
                <div
                  key={note.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  style={{ marginLeft: isReply ? `${note.depth * 16}px` : '0' }}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      isCurrentUser
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    {/* Author name */}
                    <div className="flex items-center gap-1 mb-1">
                      <User className={`w-3 h-3 ${isCurrentUser ? 'text-emerald-100' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium ${isCurrentUser ? 'text-emerald-100' : 'text-gray-600'}`}>
                        {isCurrentUser ? 'You' : note.author_name}
                      </span>
                      <span className={`text-xs ${isCurrentUser ? 'text-emerald-100' : 'text-gray-500'}`}>
                        ({note.author_role})
                      </span>
                    </div>

                    {/* Message content (text or audio) */}
                    {note.type === 'text' && note.text && (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {note.text}
                      </p>
                    )}

                    {note.type === 'audio' && note.audio_url && (
                      <div className={`flex items-center gap-2 rounded-lg p-3 min-w-[280px] ${
                        isCurrentUser ? 'bg-white/20' : 'bg-gray-50'
                      }`}>
                        <Volume2 className={`w-5 h-5 flex-shrink-0 ${
                          isCurrentUser ? 'text-white' : 'text-emerald-600'
                        }`} />
                        <audio
                          controls
                          className="flex-1"
                          style={{
                            height: '40px',
                            filter: isCurrentUser ? 'invert(1) brightness(2)' : 'none'
                          }}
                        >
                          <source src={note.audio_url} type="audio/webm" />
                          <source src={note.audio_url} type="audio/mp3" />
                          <source src={note.audio_url} type="audio/wav" />
                          <source src={note.audio_url} type="audio/m4a" />
                          Your browser does not support audio playback.
                        </audio>
                      </div>
                    )}

                    {/* Timestamp and reply button */}
                    <div className={`flex items-center justify-between gap-2 mt-2 text-xs ${
                      isCurrentUser ? 'text-emerald-100' : 'text-gray-500'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(note.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}</span>
                      </div>

                      {/* Reply button - only show for messages from OTHER users */}
                      {!isCurrentUser && (
                        <button
                          onClick={() => setReplyingTo(note.id)}
                          className="text-xs underline hover:no-underline text-emerald-600"
                        >
                          Reply {note.reply_count > 0 && `(${note.reply_count})`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Voice Recorder (if active) */}
      {showVoiceRecorder && (
        <div className="border-t p-4 bg-white">
          <VoiceNoteRecorder
            onSave={handleVoiceNoteReady}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4 bg-white space-y-3">
        {/* Reply indicator */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-2">
            <span className="text-xs text-blue-700">
              Replying to {notes.find(n => n.id === replyingTo)?.author_name || 'message'}
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-xs text-blue-700 hover:text-blue-900"
            >
              ✕ Cancel
            </button>
          </div>
        )}

        {/* Voice note toggle */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            className={`p-2 rounded-full transition-colors ${
              showVoiceRecorder
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Voice note"
          >
            {showVoiceRecorder ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Text input */}
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={add}
            disabled={!text.trim() || isLoading}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>

        {/* Mark as Completed Button - Only for teachers */}
        {currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin' || currentUser.role === 'owner') && !isCompleted && (
          <div className="pt-3 border-t">
            <button
              onClick={markAsCompleted}
              disabled={isCompleting}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <CheckCircle className="w-5 h-5" />
              {isCompleting ? 'Marking as Completed...' : 'Mark as Completed'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              This will turn the highlight gold and track progress
            </p>
          </div>
        )}

        {/* Completed Status - Shows original mistake type context */}
        {isCompleted && (
          <div className="pt-3 border-t">
            <div className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-semibold rounded-lg flex flex-col items-center justify-center gap-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Completed</span>
              </div>
              {highlightData?.previous_color && (
                <div className="text-xs text-yellow-800 font-normal">
                  {highlightData.previous_color === 'purple' && 'Originally: Recap/Review'}
                  {highlightData.previous_color === 'orange' && 'Originally: Tajweed Issue'}
                  {highlightData.previous_color === 'red' && 'Originally: Haraka Issue'}
                  {(highlightData.previous_color === 'brown' || highlightData.previous_color === 'amber') && 'Originally: Letter Issue'}
                  {highlightData.previous_color === 'green' && 'Originally: Homework'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}