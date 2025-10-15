'use client';
import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useAnnotationStore } from '../state/useAnnotationStore';

// Dynamic import for PDF.js to avoid SSR issues
let pdfjs: any = null;

// Initialize PDF.js worker
const initPdfJs = async () => {
  if (typeof window !== 'undefined' && !pdfjs) {
    pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }
  return pdfjs;
};

type Props = { pdfUrl: string };

export default function PdfWithFabricDemo({ pdfUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { page, setPage, zoom, setZoom, tool, strokeWidth, setTool } = useAnnotationStore();

  // Load PDF document
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const pdf = await initPdfJs();
        if (pdf) {
          const loadingTask = pdf.getDocument(pdfUrl);
          const doc = await loadingTask.promise;
          setPdfDoc(doc);
          console.log('PDF loaded, pages:', doc.numPages);
        }
      } catch (err) {
        console.error('PDF load error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [pdfUrl]);

  // Render page when PDF is loaded or page/zoom changes
  useEffect(() => {
    if (!pdfDoc) return;
    renderPage();
  }, [pdfDoc, page, zoom]);

  async function renderPage() {
    try {
      const pdfPage = await pdfDoc.getPage(page);
      const viewport = pdfPage.getViewport({ scale: zoom });
      const pageCanvas = pageCanvasRef.current!;
      const ctx = pageCanvas.getContext('2d')!;
      
      pageCanvas.width = viewport.width;
      pageCanvas.height = viewport.height;
      
      await pdfPage.render({ canvasContext: ctx, viewport }).promise;
      setupFabric(viewport.width, viewport.height);
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  }

  function setupFabric(w: number, h: number) {
    if (!containerRef.current) return;
    
    if (!fabricRef.current) {
      const f = new fabric.Canvas('annot-canvas', { 
        isDrawingMode: true, 
        selection: false 
      });
      
      // Set up pencil brush for smoother strokes
      f.freeDrawingBrush = new fabric.PencilBrush(f);
      
      // Add keyboard shortcuts
      document.addEventListener('keydown', handleKeyDown);
      
      fabricRef.current = f;
    }
    
    const f = fabricRef.current!;
    const el = document.getElementById('annot-canvas') as HTMLCanvasElement;
    el.width = w;
    el.height = h;
    f.setWidth(w);
    f.setHeight(h);
    f.renderAll();
    
    applyTool();
  }

  // Apply tool settings
  useEffect(() => {
    applyTool();
  }, [tool, strokeWidth]);

  function applyTool() {
    const f = fabricRef.current;
    if (!f) return;
    
    const isEraser = tool === 'eraser';
    f.isDrawingMode = !isEraser;
    f.selection = isEraser;
    
    if (!isEraser) {
      const brush = f.freeDrawingBrush as fabric.PencilBrush;
      brush.width = strokeWidth;
      brush.color = tool === 'green_pen' ? '#22c55e' : 
                   tool === 'red_pen' ? '#ef4444' : 
                   'rgba(234, 179, 8, 0.6)';
    }
  }

  // Navigation functions
  async function handlePrev() {
    if (page > 1) {
      setPage(page - 1);
    }
  }

  async function handleNext() {
    if (pdfDoc && page < pdfDoc.numPages) {
      setPage(page + 1);
    }
  }

  function handleClear() {
    const f = fabricRef.current;
    if (!f) return;
    if (confirm('Clear all annotations on this page?')) {
      f.clear();
    }
  }

  // Keyboard shortcuts
  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    
    switch(e.key.toLowerCase()) {
      case 'g':
        e.preventDefault();
        setTool('green_pen');
        break;
      case 'r':
        e.preventDefault();
        setTool('red_pen');
        break;
      case 'y':
        e.preventDefault();
        setTool('yellow_highlight');
        break;
      case 'e':
        e.preventDefault();
        setTool('eraser');
        break;
      case 'arrowleft':
        e.preventDefault();
        handlePrev();
        break;
      case 'arrowright':
        e.preventDefault();
        handleNext();
        break;
      case 'delete':
        e.preventDefault();
        handleClear();
        break;
    }
    
    // Undo/Redo with Ctrl/Cmd
    const cmd = e.metaKey || e.ctrlKey;
    if (cmd && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        // Redo
        console.log('Redo');
      } else {
        // Undo
        console.log('Undo');
      }
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="space-y-2">
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-sm text-gray-600">Loading PDF...</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 flex-wrap">
        <button 
          className="border px-3 py-1 rounded hover:bg-gray-100 transition-colors" 
          onClick={handlePrev}
          disabled={page <= 1}
        >
          ← Prev
        </button>
        <span className="text-sm font-medium">
          Page {page} / {pdfDoc?.numPages || '?'}
        </span>
        <button 
          className="border px-3 py-1 rounded hover:bg-gray-100 transition-colors" 
          onClick={handleNext}
          disabled={!pdfDoc || page >= pdfDoc.numPages}
        >
          Next →
        </button>
        
        <div className="ml-4 flex items-center gap-2">
          <button 
            className="border px-2 py-1 rounded hover:bg-gray-100 transition-colors" 
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          >
            −
          </button>
          <span className="text-sm">Zoom {Math.round(zoom * 100)}%</span>
          <button 
            className="border px-2 py-1 rounded hover:bg-gray-100 transition-colors" 
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
          >
            +
          </button>
        </div>
        
        <button 
          className="ml-4 border px-3 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors text-red-600" 
          onClick={handleClear}
        >
          Clear Page
        </button>
      </div>
      
      <div className="relative border rounded-lg overflow-auto max-h-[80vh] bg-gray-50" ref={containerRef}>
        <canvas ref={pageCanvasRef} className="block" />
        <canvas id="annot-canvas" className="absolute inset-0 pointer-events-auto" />
      </div>
    </div>
  );
}