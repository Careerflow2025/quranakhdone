'use client';
import { useState, useEffect } from 'react';
// No external icon library needed

interface Note {
  id: string;
  content: string;
  visibleToParents: boolean;
  createdAt: Date;
  studentId: string;
  pageNumber?: number;
}

interface NotesSystemProps {
  studentId: string;
  currentPage?: number;
}

export default function NotesSystem({ studentId, currentPage }: NotesSystemProps) {
  const [currentNote, setCurrentNote] = useState('');
  const [visibleToParents, setVisibleToParents] = useState(true);
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load notes from localStorage on mount
  useEffect(() => {
    const storedNotes = localStorage.getItem(`notes_${studentId}`);
    if (storedNotes) {
      const parsed = JSON.parse(storedNotes);
      setSavedNotes(parsed.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt)
      })));
    }
  }, [studentId]);

  // Save note
  const handleSaveNote = () => {
    if (!currentNote.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      content: currentNote,
      visibleToParents,
      createdAt: new Date(),
      studentId,
      pageNumber: currentPage
    };

    const updatedNotes = [...savedNotes, newNote];
    setSavedNotes(updatedNotes);
    
    // Save to localStorage
    localStorage.setItem(`notes_${studentId}`, JSON.stringify(updatedNotes));
    
    // Clear current note
    setCurrentNote('');
    
    // Show success feedback
    const button = document.getElementById('save-note-btn');
    if (button) {
      button.textContent = 'Saved!';
      button.classList.add('bg-green-500');
      setTimeout(() => {
        button.textContent = 'Save Note';
        button.classList.remove('bg-green-500');
      }, 1500);
    }
  };

  // Get first line of note for preview
  const getFirstLine = (content: string) => {
    const firstLine = content.split('\n')[0];
    if (firstLine.length > 30) {
      return firstLine.substring(0, 30) + '...';
    }
    return firstLine;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Open note in modal
  const openNoteModal = (note: Note) => {
    setSelectedNote(note);
    setShowModal(true);
  };

  // Delete note
  const deleteNote = (noteId: string) => {
    const updatedNotes = savedNotes.filter(n => n.id !== noteId);
    setSavedNotes(updatedNotes);
    localStorage.setItem(`notes_${studentId}`, JSON.stringify(updatedNotes));
    setShowModal(false);
    setSelectedNote(null);
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Note Input Section */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-lg text-gray-800 mb-1">Teacher Notes</h3>
            <p className="text-xs text-gray-500">Record observations and feedback</p>
          </div>
          
          <textarea 
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            className="w-full h-36 p-4 border border-gray-200 rounded-xl resize-none text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
            placeholder="Add notes for this student..."
          />
          
          {/* Visibility Toggle */}
          <div className="bg-gray-50 p-3 rounded-xl">
            <div className="flex items-center justify-center space-x-3">
              <input
                type="checkbox"
                id="parent-visibility"
                checked={visibleToParents}
                onChange={(e) => setVisibleToParents(e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="parent-visibility" className="text-sm font-medium text-gray-700 cursor-pointer">
                Visible to parents
              </label>
              <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600">
                {visibleToParents ? '👁️ Public' : '🔒 Private'}
              </span>
            </div>
          </div>
          
          {/* Save Button */}
          <button
            id="save-note-btn"
            onClick={handleSaveNote}
            disabled={!currentNote.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Save Note
          </button>
        </div>

        {/* Saved Notes List */}
        <div className="mt-6 flex-1 overflow-y-auto">
          <div className="mb-4 text-center">
            <h4 className="font-semibold text-gray-800">Saved Notes</h4>
            <p className="text-xs text-gray-500 mt-1">{savedNotes.length} {savedNotes.length === 1 ? 'note' : 'notes'} recorded</p>
          </div>
          
          {savedNotes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400 italic">No notes saved yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => openNoteModal(note)}
                  className="p-4 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800 flex-1 mr-2">
                        {getFirstLine(note.content)}
                      </p>
                      {note.visibleToParents ? (
                        <span className="inline-flex items-center text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-medium whitespace-nowrap">
                          👁️ Parents
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium whitespace-nowrap">
                          🔒 Private
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {formatDate(note.createdAt)}
                      </span>
                      {note.pageNumber && (
                        <span className="text-xs text-gray-400">
                          • Page {note.pageNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note Modal */}
      {showModal && selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Note Details</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">
                    {formatDate(selectedNote.createdAt)}
                  </span>
                  {selectedNote.pageNumber && (
                    <span className="text-sm text-gray-500">
                      • Page {selectedNote.pageNumber}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-xl text-gray-500">×</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
              <div className="mb-4">
                {selectedNote.visibleToParents ? (
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    👁️ Visible to parents
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm">
                    🔒 Teacher only
                  </span>
                )}
              </div>
              
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">
                  {selectedNote.content}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => deleteNote(selectedNote.id)}
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium"
              >
                Delete Note
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}