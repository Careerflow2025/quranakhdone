'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send, Eye, EyeOff, Mic, MicOff, Play, Pause, User, Clock, Volume2 } from 'lucide-react';
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
  const [visible, setVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // For threading
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
    if (!highlightId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/highlights/${highlightId}/notes/thread`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const j = await res.json();
      if (j.success) {
        setNotes(j.thread || []);
        // Scroll to bottom on new messages
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (error) {
      console.error('Failed to load conversation thread:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [highlightId]);

  // Add note or reply
  async function add() {
    if (!text.trim() || !currentUser || !highlightId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/highlights/${highlightId}/notes/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: 'text',
          text: text.trim(),
          parent_note_id: replyingTo,
          visible_to_parent: visible
        })
      });

      const j = await res.json();
      if (j.success) {
        // Reload full thread to show new note in correct position
        await load();
        setText('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle voice note upload
  const handleVoiceNoteReady = async (audioBlob: Blob) => {
    if (!currentUser || !highlightId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setIsLoading(true);
    try {
      // Create form data with audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-note.m4a');
      formData.append('highlightId', highlightId);

      // Upload to storage
      const uploadRes = await fetch('/api/voice-notes/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        console.error('Failed to upload voice note:', uploadData.error);
        alert('Failed to upload voice note. Please try again.');
        return;
      }

      // Create note with audio URL
      const res = await fetch(`/api/highlights/${highlightId}/notes/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: 'audio',
          audio_url: uploadData.audioUrl,
          parent_note_id: replyingTo,
          visible_to_parent: visible
        })
      });

      const j = await res.json();
      if (j.success) {
        // Reload full thread to show new note in correct position
        await load();
        setReplyingTo(null);
        setShowVoiceRecorder(false);
        console.log('✅ Voice note added successfully');
      }
    } catch (error) {
      console.error('Failed to add voice note:', error);
      alert('Failed to save voice note. Please try again.');
    } finally {
      setIsLoading(false);
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
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                        <Volume2 className="w-4 h-4" />
                        <audio controls className="w-full max-w-xs">
                          <source src={note.audio_url} type="audio/m4a" />
                          <source src={note.audio_url} type="audio/webm" />
                          Your browser does not support audio playback.
                        </audio>
                      </div>
                    )}

                    {/* Timestamp, visibility, and reply button */}
                    <div className={`flex items-center justify-between gap-2 mt-2 text-xs ${
                      isCurrentUser ? 'text-emerald-100' : 'text-gray-500'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(note.created_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        {note.visible_to_parent ? (
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>Parent</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            <span>Private</span>
                          </div>
                        )}
                      </div>

                      {/* Reply button */}
                      <button
                        onClick={() => setReplyingTo(note.id)}
                        className={`text-xs underline hover:no-underline ${
                          isCurrentUser ? 'text-emerald-100' : 'text-emerald-600'
                        }`}
                      >
                        Reply {note.reply_count > 0 && `(${note.reply_count})`}
                      </button>
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
            onRecordingComplete={handleVoiceNoteReady}
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

        {/* Visibility toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setVisible(!visible)}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full transition-colors ${
              visible
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {visible ? (
              <>
                <Eye className="w-3 h-3" />
                <span>Visible to parent</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3" />
                <span>Teacher only</span>
              </>
            )}
          </button>

          {/* Voice note toggle */}
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
      </div>
    </div>
  );
}