'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Eye, User, Clock } from 'lucide-react';

interface Note {
  id: string;
  student_id: string;
  author_id: string;
  school_id: string;
  text: string;
  visible_to_parent: boolean;
  created_at: string;
  author?: {
    display_name: string;
    role: string;
  };
}

interface ParentNotesViewerProps {
  studentId: string;
  highlightId?: string; // Optional: filter by highlight
  mode?: 'sidebar' | 'modal';
  onClose?: () => void;
}

export default function ParentNotesViewer({
  studentId,
  highlightId,
  mode = 'sidebar',
  onClose
}: ParentNotesViewerProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [studentName, setStudentName] = useState('Student');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load student name
  useEffect(() => {
    async function loadStudentName() {
      const { data } = await supabase
        .from('students')
        .select('profiles(display_name)')
        .eq('id', studentId)
        .single();

      if (data) {
        setStudentName(data.profiles?.display_name || 'Student');
      }
    }
    loadStudentName();
  }, [studentId]);

  // Load notes (only visible to parents)
  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/notes/list?studentId=${studentId}&all=0`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const j = await res.json();
      if (j.ok) {
        // Only show notes visible to parent
        const parentVisibleNotes = (j.notes || []).filter((n: Note) => n.visible_to_parent);
        setNotes(parentVisibleNotes);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [studentId]);

  const isSidebarMode = mode === 'sidebar';

  return (
    <div className={`flex flex-col h-full ${isSidebarMode ? 'bg-white' : 'bg-white rounded-lg shadow-xl'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">Teacher-Student Notes</h3>
            <p className="text-xs opacity-90">{studentName}'s conversation</p>
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

      {/* Read-only Conversation View */}
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
              <p className="text-sm">No visible messages yet</p>
              <p className="text-xs mt-1">The teacher will share notes here</p>
            </div>
          </div>
        ) : (
          <>
            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium">Read-only view</p>
                  <p className="mt-1">You're viewing the conversation between your child and their teacher.</p>
                </div>
              </div>
            </div>

            {notes.map((note) => {
              const isTeacher = note.author?.role === 'teacher';
              return (
                <div
                  key={note.id}
                  className={`flex ${isTeacher ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      isTeacher
                        ? 'bg-white text-gray-800 border border-gray-200'
                        : 'bg-blue-100 text-gray-800 border border-blue-200'
                    }`}
                  >
                    {/* Author name */}
                    <div className="flex items-center gap-1 mb-1">
                      <User className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600">
                        {isTeacher ? (note.author?.display_name || 'Teacher') : studentName}
                      </span>
                    </div>

                    {/* Message text */}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {note.text}
                    </p>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(note.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })} at {new Date(note.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Footer info */}
      <div className="border-t p-4 bg-white">
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>📖 This conversation helps track your child's progress</p>
          <p>🔄 Updates automatically every 30 seconds</p>
        </div>
      </div>
    </div>
  );
}
