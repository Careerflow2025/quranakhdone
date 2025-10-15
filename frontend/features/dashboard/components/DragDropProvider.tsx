'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Student } from '../state/useDashboardStore';

interface DragDropContextType {
  draggedStudent: Student | null;
  setDraggedStudent: (student: Student | null) => void;
  dropTarget: string | null;
  setDropTarget: (target: string | null) => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export function DragDropProvider({ children }: { children: ReactNode }) {
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  return (
    <DragDropContext.Provider value={{ 
      draggedStudent, 
      setDraggedStudent, 
      dropTarget, 
      setDropTarget 
    }}>
      {children}
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within DragDropProvider');
  }
  return context;
}