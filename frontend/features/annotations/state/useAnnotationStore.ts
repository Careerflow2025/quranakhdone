import { create } from 'zustand';

export type Tool = 'green_pen'|'red_pen'|'yellow_highlight'|'eraser'|null;

interface HistoryState {
  // JSON strings for compactness and deep copy safety
  past: string[]; // previous canvas JSON states
  present: string | null; // current canvas JSON
  future: string[]; // undone states
}

interface AnnotationState extends HistoryState {
  tool: Tool;
  strokeWidth: number;
  page: number;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  setTool: (t: Tool)=>void;
  setStrokeWidth: (w: number)=>void;
  setPage: (p: number)=>void;
  setZoom: (z: number)=>void;
  pushSnapshot: (json: object)=>void;
  undo: ()=>string | null; // returns JSON to load or null
  redo: ()=>string | null; // returns JSON to load or null
  resetHistory: (json?: object)=>void;
}

const MAX_HISTORY = 50;

export const useAnnotationStore = create<AnnotationState>((set, get)=>({
  tool: null,
  strokeWidth: 4,
  page: 1,
  zoom: 1,
  past: [],
  present: null,
  future: [],
  canUndo: false,
  canRedo: false,
  setTool: (tool)=> set({ tool }),
  setStrokeWidth: (strokeWidth)=> set({ strokeWidth }),
  setPage: (page)=> set({ page }),
  setZoom: (zoom)=> set({ zoom }),
  pushSnapshot: (json)=>{
    const state = get();
    const snapshot = JSON.stringify(json);
    if(state.present === snapshot) return; // ignore no-op
    const newPast = [...state.past, state.present].filter(Boolean) as string[];
    // clamp
    const clampedPast = newPast.length > MAX_HISTORY ? newPast.slice(newPast.length - MAX_HISTORY) : newPast;
    set({
      past: clampedPast,
      present: snapshot,
      future: [],
      canUndo: clampedPast.length > 0,
      canRedo: false
    });
  },
  undo: ()=>{
    const { past, present, future } = get();
    if(past.length === 0 || !present) return null;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const newFuture = [present, ...future];
    set({ past: newPast, present: previous, future: newFuture, canUndo: newPast.length > 0, canRedo: newFuture.length > 0 });
    return previous;
  },
  redo: ()=>{
    const { future, past, present } = get();
    if(future.length === 0 || !present) return null;
    const next = future[0];
    const newFuture = future.slice(1);
    const newPast = [...past, present];
    set({ past: newPast, present: next, future: newFuture, canUndo: newPast.length > 0, canRedo: newFuture.length > 0 });
    return next;
  },
  resetHistory: (json)=>{
    if(!json){ set({ past:[], present:null, future:[], canUndo:false, canRedo:false }); return; }
    const snap = JSON.stringify(json);
    set({ past:[], present:snap, future:[], canUndo:false, canRedo:false });
  }
}));