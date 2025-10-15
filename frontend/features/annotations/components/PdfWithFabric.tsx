'use client';
import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import debounce from 'lodash.debounce';
import { useAnnotationStore } from '../state/useAnnotationStore';
import { serializeFabric, deserializeFabric } from '../utils/serialization';
import { flattenPdfAndFabric } from '../utils/flatten';
import { enqueue } from '../utils/offlineQueue';
import useOfflineSync from '../hooks/useOfflineSync';
import { initAutosave, triggerAutosave, flushAutosave, cancelAutosave } from '../utils/autosave';
import { telemetry } from '../../telemetry/client';
import { cacheAnnotation, getCachedAnnotation } from '../utils/cache';

// Dynamic import for PDF.js to avoid SSR issues
let pdfjs: any = null;

// Initialize PDF.js worker
const initPdfJs = async () => {
  if (typeof window !== 'undefined' && !pdfjs) {
    pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'; // We'll serve this from public
  }
  return pdfjs;
};

type Props = { pdfUrl: string };
export default function PdfWithFabric({ pdfUrl }: Props){
  const containerRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas| null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { page, setPage, zoom, setZoom, tool, setTool, strokeWidth, pushSnapshot, undo, redo, resetHistory } = useAnnotationStore();
  
  // Initialize offline sync
  useOfflineSync();
  
  // Initialize autosave
  useEffect(() => {
    initAutosave(async (payload: any) => {
      try {
        const res = await fetch('/api/annotations/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const j = await res.json();
        if (!j.ok) throw new Error(j.error);
        setHasChanges(false);
        telemetry.logEvent('annotation.autosaved', { page: payload.page });
      } catch (err) {
        await enqueue(payload);
        telemetry.logEvent('annotation.autosave_failed', { page: payload.page });
      }
    });
    
    // Cleanup on unmount
    return () => cancelAutosave();
  }, [page]);

  useEffect(()=>{ 
    (async()=>{ 
      setIsLoading(true);
      try {
        const pdf = await initPdfJs();
        if (pdf) {
          const loadingTask = pdf.getDocument(pdfUrl); 
          const doc = await loadingTask.promise; 
          setPdfDoc(doc);
          telemetry.logEvent('annotation.pdf_loaded', { total_pages: doc.numPages });
        }
      } catch (err) {
        console.error('PDF load error:', err);
        telemetry.logEvent('annotation.pdf_load_failed', { error: err instanceof Error ? err.message : 'Unknown' });
      } finally {
        setIsLoading(false);
      }
    })(); 
  }, [pdfUrl]);

  useEffect(()=>{ if(!pdfDoc) return; renderPage(); }, [pdfDoc, page, zoom]);

  async function renderPage(){
    const pdfPage = await pdfDoc.getPage(page);
    const viewport = pdfPage.getViewport({ scale: zoom });
    const pageCanvas = pageCanvasRef.current!; const ctx = pageCanvas.getContext('2d')!;
    pageCanvas.width = viewport.width; pageCanvas.height = viewport.height;
    await pdfPage.render({ canvasContext: ctx, viewport }).promise;
    setupFabric(viewport.width, viewport.height);
    
    // Try cached annotation first for instant load
    const cached = getCachedAnnotation('demo', page);
    if (cached) {
      const f = fabricRef.current!;
      await deserializeFabric(f, cached.payload);
      resetHistory(serializeFabric(f));
      telemetry.logEvent('annotation.loaded_from_cache', { page });
    } else {
      // Load latest annotation from server if no cache
      try {
        const res = await fetch(`/api/annotations/latest?studentId=demo&page=${page}`);
        const j = await res.json();
        if(j.ok && j.ann){
          const f = fabricRef.current!;
          await deserializeFabric(f, j.ann.payload);
          resetHistory(serializeFabric(f));
          // Cache for next time
          cacheAnnotation('demo', page, j.ann);
          telemetry.logEvent('annotation.loaded_from_server', { page });
        } else {
          // No prior annotation -> reset history with blank canvas state
          const f = fabricRef.current!; 
          resetHistory(serializeFabric(f));
          telemetry.logEvent('annotation.loaded_blank', { page });
        }
      } catch(err) { 
        console.warn('No prior annotation or error loading:', err);
        // Fallback to blank state
        const f = fabricRef.current!; 
        resetHistory(serializeFabric(f));
        telemetry.logEvent('annotation.load_failed', { page, error: err instanceof Error ? err.message : 'Unknown' });
      }
    }
  }

  function setupFabric(w:number, h:number){
    if(!containerRef.current) return;
    if(!fabricRef.current){
      const f = new fabric.Canvas('annot-canvas', { isDrawingMode: true, selection: false });
      // stroke smoother
      // @ts-ignore
      f.freeDrawingBrush = new fabric.PencilBrush(f);
      f.on('path:created', handlePathCreated);
      f.on('object:removed', handleObjectRemoved);
      // keyboard shortcuts
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('annot-undo', handleUndo as any);
      document.addEventListener('annot-redo', handleRedo as any);
      document.addEventListener('annot-clear', handleClear as any);
      fabricRef.current = f;
    }
    const f = fabricRef.current!;
    const el = document.getElementById('annot-canvas') as HTMLCanvasElement;
    el.width = w; el.height = h; f.setWidth(w); f.setHeight(h); f.renderAll();
    applyTool();
  }

  const captureSnapshot = debounce(()=>{
    const f = fabricRef.current; if(!f) return;
    const json = serializeFabric(f);
    pushSnapshot(json);
    setHasChanges(true);
    
    // Trigger autosave with latest data
    const payload = {
      schoolId: 'demo',
      studentId: 'demo',
      page,
      toolType: tool,
      layerJson: json,
      userId: 'demo'
    };
    triggerAutosave(payload);
  }, 150);

  function handlePathCreated(){ captureSnapshot(); }
  function handleObjectRemoved(){ captureSnapshot(); }

  useEffect(()=>{ applyTool(); }, [tool, strokeWidth]);
  function applyTool(){
    const f = fabricRef.current; if(!f) return;
    const isEraser = tool==='eraser';
    f.isDrawingMode = !isEraser;
    f.selection = isEraser; // allow selecting strokes for delete
    if(!isEraser){
      const brush = f.freeDrawingBrush as fabric.PencilBrush;
      brush.width = strokeWidth;
      brush.color = tool==='green_pen' ? '#22c55e' : tool==='red_pen' ? '#ef4444' : 'rgba(234, 179, 8, 0.6)';
    }
  }

  async function handlePrev(){ 
    if(page>1) {
      if(hasChanges) flushAutosave(); // Save current page before switching
      setPage(page-1);
    }
  }
  async function handleNext(){ 
    if(pdfDoc && page < pdfDoc.numPages) {
      if(hasChanges) flushAutosave(); // Save current page before switching  
      setPage(page+1);
    }
  }
  function handleClear(){ const f = fabricRef.current; if(!f) return; f.clear(); captureSnapshot(); }
  async function handleUndo(){ const snap = undo(); if(!snap) return; const f = fabricRef.current; if(!f) return; await deserializeFabric(f, snap); }
  async function handleRedo(){ const snap = redo(); if(!snap) return; const f = fabricRef.current; if(!f) return; await deserializeFabric(f, snap); }

  function handleKeyDown(e: KeyboardEvent){
    const cmd = e.metaKey || e.ctrlKey;
    
    // Existing undo/redo shortcuts (cmd required)
    if(cmd && e.key.toLowerCase()==='z' && !e.shiftKey){ e.preventDefault(); handleUndo(); }
    if(cmd && ((e.key.toLowerCase()==='z' && e.shiftKey) || e.key.toLowerCase()==='y')){ e.preventDefault(); handleRedo(); }
    
    // New tool shortcuts (no cmd required, check for input focus)
    const target = e.target as HTMLElement;
    if(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return; // Don't interfere with form inputs
    
    if(e.key.toLowerCase() === 'g'){ e.preventDefault(); setTool('green_pen'); }
    if(e.key.toLowerCase() === 'r'){ e.preventDefault(); setTool('red_pen'); }
    if(e.key.toLowerCase() === 'y'){ e.preventDefault(); setTool('yellow_highlight'); }
    if(e.key.toLowerCase() === 'e'){ e.preventDefault(); setTool('eraser'); }
    if(e.key === 'Delete'){ e.preventDefault(); if(confirm('Clear all annotations?')) handleClear(); }
    if(e.key === 'ArrowLeft'){ e.preventDefault(); handlePrev(); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); handleNext(); }
  }

  return (
    <div className="space-y-2">
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-sm text-gray-600">Loading PDF...</span>
        </div>
      )}
      {hasChanges && (
        <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          ⚠️ Unsaved changes - will auto-save in 10 seconds
        </div>
      )}
      <div className="flex items-center gap-2">
        <button aria-label="Previous page (Left arrow)" className="border px-2 py-1 rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500" onClick={handlePrev}>Prev</button>
        <span className="text-sm">Page {page} / {pdfDoc?.numPages || '?'}</span>
        <button aria-label="Next page (Right arrow)" className="border px-2 py-1 rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500" onClick={handleNext}>Next</button>
        <button aria-label="Zoom out" className="border px-2 py-1 rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500" onClick={()=>setZoom(Math.max(0.5, zoom-0.1))}>-</button>
        <span className="text-sm">Zoom {Math.round(zoom*100)}%</span>
        <button aria-label="Zoom in" className="border px-2 py-1 rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500" onClick={()=>setZoom(Math.min(3, zoom+0.1))}>+</button>
      </div>
      <div className="relative" ref={containerRef}>
        <canvas ref={pageCanvasRef} className="block" />
        <canvas id="annot-canvas" className="absolute inset-0" />
      </div>
      <div className="flex gap-2">
        <button aria-label="Save annotations" className="border px-2 py-1 rounded bg-green-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500" onClick={async()=>{
          const f = fabricRef.current; if(!f) return;
          const pageCanvas = pageCanvasRef.current; if(!pageCanvas) return;
          
          // 1. Serialize Fabric JSON
          const layer = serializeFabric(f);
          
          // 2. Flatten PDF + Fabric overlay to PNG
          const flattenedBlob = await flattenPdfAndFabric(pageCanvas, f);
          const flattenedPngDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(flattenedBlob);
          });
          
          // 3. Prepare payload
          const payload = { 
            schoolId:'demo', 
            studentId:'demo', 
            page, 
            toolType:tool, 
            layerJson:layer, 
            userId:'demo',
            flattenedPngDataUrl
          };
          
          // 4. Try to save online, fallback to offline queue
          try {
            const res = await fetch('/api/annotations/save',{
              method:'POST',
              headers:{'Content-Type':'application/json'},
              body:JSON.stringify(payload)
            });
            const j = await res.json();
            if(!j.ok) throw new Error(j.error);
            console.log('Saved online:', j);
          } catch(err) {
            await enqueue(payload);
            alert('No internet, saved offline. Will sync later.');
            console.log('Queued for offline sync:', payload);
          }
        }}>Save</button>
        <button aria-label="Load annotations" className="border px-2 py-1 rounded bg-blue-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500" onClick={async()=>{
          const res = await fetch(`/api/annotations/load?studentId=demo&page=${page}`);
          const j = await res.json(); 
          if(j.layerJson && fabricRef.current) {
            await deserializeFabric(fabricRef.current, j.layerJson);
          }
          console.log('Loaded', j);
        }}>Load</button>
      </div>
      <p className="text-xs text-muted-foreground">
        <strong>Shortcuts:</strong> Undo ⌘/Ctrl+Z · Redo ⇧+⌘/Ctrl+Z · Tools: G (green) R (red) Y (yellow) E (eraser) · Navigation: ← → arrows · Clear: Delete (confirm)
        <br />
        <strong>Accessibility:</strong> Tab through buttons for keyboard navigation. In Eraser mode, click a stroke to select then press Delete.
      </p>
    </div>
  );
}