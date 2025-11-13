import { create } from 'zustand';
import { Highlight, Note, MistakeType } from '@/types';
import { highlightApi, noteApi } from '@/lib/api';
import { socketService } from '@/lib/socket';

interface HighlightState {
  highlights: Highlight[];
  isLoading: boolean;
  selectedHighlight: Highlight | null;
  
  // Actions
  fetchHighlights: (params?: { student_id?: string; ayah_id?: string }) => Promise<void>;
  createHighlight: (data: {
    student_id: string;
    ayah_id: string;
    token_start: number;
    token_end: number;
    mistake: MistakeType;
    note?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateHighlight: (id: string, data: Partial<Highlight>) => Promise<{ success: boolean; error?: string }>;
  deleteHighlight: (id: string) => Promise<{ success: boolean; error?: string }>;
  addNote: (highlightId: string, noteData: {
    type: 'text' | 'audio';
    text?: string;
    audio_url?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  setSelectedHighlight: (highlight: Highlight | null) => void;
  addHighlightFromSocket: (highlight: Highlight) => void;
  updateHighlightFromSocket: (highlight: Highlight) => void;
  removeHighlightFromSocket: (highlightId: string) => void;
  addNoteFromSocket: (note: Note) => void;
}

export const useHighlightStore = create<HighlightState>((set, get) => ({
  highlights: [],
  isLoading: false,
  selectedHighlight: null,

  fetchHighlights: async (params) => {
    set({ isLoading: true });

    try {
      const response = await highlightApi.getHighlights(params);

      if (response.success && response.data) {
        // SAFETY: Ensure response.data is an array before setting
        const highlightsArray = Array.isArray(response.data)
          ? response.data
          : [];

        console.log('✅ Highlights loaded:', highlightsArray.length);

        set({
          highlights: highlightsArray as Highlight[],
          isLoading: false
        });
      } else {
        console.error('Failed to fetch highlights:', response.error);
        set({ highlights: [], isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch highlights:', error);
      set({ highlights: [], isLoading: false });
    }
  },

  createHighlight: async (data) => {
    try {
      const response = await highlightApi.createHighlight(data);
      
      if (response.success && response.data) {
        const newHighlight = response.data as Highlight;
        
        set(state => ({
          highlights: [...state.highlights, newHighlight]
        }));
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to create highlight' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to create highlight' };
    }
  },

  updateHighlight: async (id, data) => {
    try {
      const response = await highlightApi.updateHighlight(id, data);
      
      if (response.success && response.data) {
        const updatedHighlight = response.data as Highlight;
        
        set(state => ({
          highlights: state.highlights.map(h => 
            h.id === id ? updatedHighlight : h
          )
        }));
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to update highlight' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update highlight' };
    }
  },

  deleteHighlight: async (id) => {
    try {
      const response = await highlightApi.deleteHighlight(id);
      
      if (response.success) {
        set(state => ({
          highlights: state.highlights.filter(h => h.id !== id),
          selectedHighlight: state.selectedHighlight?.id === id ? null : state.selectedHighlight
        }));
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to delete highlight' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to delete highlight' };
    }
  },

  addNote: async (highlightId, noteData) => {
    try {
      const response = await noteApi.createNote({
        highlight_id: highlightId,
        ...noteData
      });
      
      if (response.success && response.data) {
        const newNote = response.data as Note;
        
        set(state => ({
          highlights: state.highlights.map(h => 
            h.id === highlightId
              ? { ...h, notes: [...(h.notes || []), newNote] }
              : h
          )
        }));
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to add note' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to add note' };
    }
  },

  setSelectedHighlight: (highlight) => {
    set({ selectedHighlight: highlight });
  },

  addHighlightFromSocket: (highlight) => {
    set(state => ({
      highlights: [...state.highlights, highlight]
    }));
  },

  updateHighlightFromSocket: (highlight) => {
    set(state => ({
      highlights: state.highlights.map(h => 
        h.id === highlight.id ? highlight : h
      )
    }));
  },

  removeHighlightFromSocket: (highlightId) => {
    set(state => ({
      highlights: state.highlights.filter(h => h.id !== highlightId),
      selectedHighlight: state.selectedHighlight?.id === highlightId ? null : state.selectedHighlight
    }));
  },

  addNoteFromSocket: (note) => {
    set(state => ({
      highlights: state.highlights.map(h => 
        h.id === note.highlight_id
          ? { ...h, notes: [...(h.notes || []), note] }
          : h
      )
    }));
  },
}));

// Setup socket event listeners
if (typeof window !== 'undefined') {
  const store = useHighlightStore.getState();
  
  socketService.onHighlightCreated((highlight) => {
    store.addHighlightFromSocket(highlight);
  });
  
  socketService.onHighlightUpdated((highlight) => {
    store.updateHighlightFromSocket(highlight);
  });
  
  socketService.onHighlightDeleted((highlightId) => {
    store.removeHighlightFromSocket(highlightId);
  });
  
  socketService.onNoteCreated((note) => {
    store.addNoteFromSocket(note);
  });
}