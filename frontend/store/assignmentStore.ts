import { create } from 'zustand';
import { Assignment, AssignmentStatus } from '@/types';
import { assignmentApi } from '@/lib/api';
import { socketService } from '@/lib/socket';

interface AssignmentState {
  assignments: Assignment[];
  isLoading: boolean;
  selectedAssignment: Assignment | null;
  
  // Actions
  fetchAssignments: (params?: { 
    student_id?: string; 
    teacher_id?: string; 
    status?: AssignmentStatus;
  }) => Promise<void>;
  createAssignment: (data: {
    student_id: string;
    title: string;
    description?: string;
    due_at: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateAssignment: (id: string, data: Partial<Assignment>) => Promise<{ success: boolean; error?: string }>;
  deleteAssignment: (id: string) => Promise<{ success: boolean; error?: string }>;
  submitAssignment: (id: string, data: {
    text?: string;
    attachments?: File[];
  }) => Promise<{ success: boolean; error?: string }>;
  transitionAssignment: (id: string, status: AssignmentStatus) => Promise<{ success: boolean; error?: string }>;
  setSelectedAssignment: (assignment: Assignment | null) => void;
  updateAssignmentFromSocket: (assignment: Assignment) => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  isLoading: false,
  selectedAssignment: null,

  fetchAssignments: async (params) => {
    set({ isLoading: true });
    
    try {
      const response = await assignmentApi.getAssignments(params);
      
      if (response.success && response.data) {
        set({ 
          assignments: response.data as Assignment[], 
          isLoading: false 
        });
      } else {
        console.error('Failed to fetch assignments:', response.error);
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      set({ isLoading: false });
    }
  },

  createAssignment: async (data) => {
    try {
      const response = await assignmentApi.createAssignment(data);
      
      if (response.success && response.data) {
        const newAssignment = response.data as Assignment;
        
        set(state => ({
          assignments: [...state.assignments, newAssignment]
        }));
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to create assignment' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to create assignment' };
    }
  },

  updateAssignment: async (id, data) => {
    try {
      const response = await assignmentApi.updateAssignment(id, data);
      
      if (response.success && response.data) {
        const updatedAssignment = response.data as Assignment;
        
        set(state => ({
          assignments: state.assignments.map(a => 
            a.id === id ? updatedAssignment : a
          ),
          selectedAssignment: state.selectedAssignment?.id === id 
            ? updatedAssignment 
            : state.selectedAssignment
        }));
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to update assignment' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update assignment' };
    }
  },

  deleteAssignment: async (id) => {
    try {
      const response = await assignmentApi.deleteAssignment(id);
      
      if (response.success) {
        set(state => ({
          assignments: state.assignments.filter(a => a.id !== id),
          selectedAssignment: state.selectedAssignment?.id === id ? null : state.selectedAssignment
        }));
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to delete assignment' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to delete assignment' };
    }
  },

  submitAssignment: async (id, data) => {
    try {
      const response = await assignmentApi.submitAssignment(id, data);
      
      if (response.success && response.data) {
        const updatedAssignment = response.data as Assignment;
        
        set(state => ({
          assignments: state.assignments.map(a => 
            a.id === id ? updatedAssignment : a
          ),
          selectedAssignment: state.selectedAssignment?.id === id 
            ? updatedAssignment 
            : state.selectedAssignment
        }));
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to submit assignment' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to submit assignment' };
    }
  },

  transitionAssignment: async (id, status) => {
    try {
      const response = await assignmentApi.transitionAssignment(id, status);
      
      if (response.success && response.data) {
        const updatedAssignment = response.data as Assignment;
        
        set(state => ({
          assignments: state.assignments.map(a => 
            a.id === id ? updatedAssignment : a
          ),
          selectedAssignment: state.selectedAssignment?.id === id 
            ? updatedAssignment 
            : state.selectedAssignment
        }));
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to transition assignment' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to transition assignment' };
    }
  },

  setSelectedAssignment: (assignment) => {
    set({ selectedAssignment: assignment });
  },

  updateAssignmentFromSocket: (assignment) => {
    set(state => ({
      assignments: state.assignments.map(a => 
        a.id === assignment.id ? assignment : a
      ),
      selectedAssignment: state.selectedAssignment?.id === assignment.id 
        ? assignment 
        : state.selectedAssignment
    }));
  },
}));

// Setup socket event listener
if (typeof window !== 'undefined') {
  socketService.onAssignmentUpdated((assignment) => {
    useAssignmentStore.getState().updateAssignmentFromSocket(assignment);
  });
}