'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  ChevronRight,
  ChevronLeft,
  User,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { useParentStore } from '../state/useParentStore';

export default function ParentNotesPanel() {
  const [newNote, setNewNote] = useState('');
  const [isVisibleToTeacher, setIsVisibleToTeacher] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-notes' | 'teacher-notes'>('my-notes');
  const [isNotePanelOpen, setNotePanelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [parentNotes, setParentNotes] = useState<any[]>([]);
  const [teacherNotes, setTeacherNotes] = useState<any[]>([]);

  const { currentChild } = useParentStore();

  const addParentNote = (noteData: any) => {
    const newNoteItem = {
      id: Date.now().toString(),
      ...noteData,
      createdAt: new Date().toISOString()
    };
    setParentNotes(prev => [...prev, newNoteItem]);
  };

  const handleSubmitNote = () => {
    if (!newNote.trim() || !currentChild) return;

    addParentNote({
      studentId: currentChild.id,
      pageNumber: currentPage,
      noteText: newNote.trim(),
      isVisibleToTeacher
    });

    setNewNote('');
  };

  // Filter notes for current page
  const currentPageParentNotes = parentNotes.filter(n => n.pageNumber === currentPage);
  const currentPageTeacherNotes = teacherNotes.filter(n => n.pageNumber === currentPage);
  
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setNotePanelOpen(!isNotePanelOpen)}
        className={`
          fixed top-1/2 transform -translate-y-1/2 z-40
          bg-white shadow-lg rounded-r-lg p-3 hover:bg-gray-50
          transition-all duration-300 border border-gray-200
        `}
        style={{ left: isNotePanelOpen ? '320px' : '0' }}
      >
        {isNotePanelOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
      
      {/* Notes Panel */}
      <AnimatePresence>
        {isNotePanelOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-30 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5" />
                <h2 className="text-lg font-bold">Notes & Communication</h2>
              </div>
              <p className="text-sm opacity-90">
                Page {currentPage} • {currentChild?.name}
              </p>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('my-notes')}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'my-notes' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                My Notes ({currentPageParentNotes.length})
              </button>
              <button
                onClick={() => setActiveTab('teacher-notes')}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'teacher-notes' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Teacher Notes ({currentPageTeacherNotes.length})
              </button>
            </div>
            
            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTab === 'my-notes' ? (
                <>
                  {currentPageParentNotes.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notes on this page</p>
                      <p className="text-xs mt-1">Add a note below</p>
                    </div>
                  ) : (
                    currentPageParentNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{note.noteText}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(note.createdAt).toLocaleDateString()}
                              </span>
                              {note.isVisibleToTeacher && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Eye className="w-3 h-3" />
                                  Visible to teacher
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Teacher Response */}
                        {note.teacherResponse && (
                          <div className="bg-white rounded p-2 border-l-2 border-purple-400">
                            <p className="text-xs font-medium text-purple-600 mb-1">Teacher Response:</p>
                            <p className="text-sm text-gray-700">{note.teacherResponse}</p>
                            {note.teacherRespondedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(note.teacherRespondedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </>
              ) : (
                <>
                  {currentPageTeacherNotes.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No teacher notes on this page</p>
                    </div>
                  ) : (
                    currentPageTeacherNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-purple-50 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            T
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{note.noteText}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </>
              )}
            </div>
            
            {/* Add Note Form (Only in My Notes tab) */}
            {activeTab === 'my-notes' && (
              <div className="border-t p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsVisibleToTeacher(!isVisibleToTeacher)}
                    className={`flex items-center gap-2 text-xs px-2 py-1 rounded-full transition-colors ${
                      isVisibleToTeacher 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {isVisibleToTeacher ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Teacher can see
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Private note
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitNote();
                      }
                    }}
                    placeholder="Add a note about this page..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleSubmitNote}
                    disabled={!newNote.trim()}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}