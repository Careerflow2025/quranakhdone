import { describe, it, expect, beforeEach } from 'vitest';
import { useAnnotationStore } from './useAnnotationStore';

function snap(n:number){ return { objects: Array.from({length:n}).map((_,i)=>({ type:'path', id:i })) } }

describe('history', ()=>{
  beforeEach(()=>{ const { resetHistory } = useAnnotationStore.getState(); resetHistory(); });
  it('push + undo + redo', ()=>{
    const s = useAnnotationStore.getState();
    s.resetHistory(snap(0));
    s.pushSnapshot(snap(1));
    s.pushSnapshot(snap(2));
    expect(useAnnotationStore.getState().canUndo).toBe(true);
    const u1 = s.undo();
    expect(u1).toBeTypeOf('string');
    expect(useAnnotationStore.getState().canRedo).toBe(true);
    const r1 = s.redo();
    expect(r1).toBeTypeOf('string');
  });
});