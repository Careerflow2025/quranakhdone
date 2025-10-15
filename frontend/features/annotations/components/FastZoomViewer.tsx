'use client';
import { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react';
import { useAnnotationStore } from '../state/useAnnotationStore';

// PDF.js imports
let pdfjsLib: any = null;

interface Props {
  pdfUrl: string;
  studentId?: string;
}

interface Point {
  x: number;  // PDF coordinate space (0-1 normalized)
  y: number;  // PDF coordinate space (0-1 normalized)
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: string;
}

// Optimized page component with immediate annotation updates
const PageCanvas = memo(({ 
  pageNum, 
  pdfDoc, 
  zoom,
  strokes,
  onStrokeComplete,
  tool,
  strokeWidth,
  forceRedraw
}: {
  pageNum: number;
  pdfDoc: any;
  zoom: number;
  strokes: Stroke[];
  onStrokeComplete: (pageNum: number, stroke: Stroke) => void;
  tool: string | null;
  strokeWidth: number;
  forceRedraw: number; // Increment to force immediate redraw
}) => {
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const pdfDimensionsRef = useRef({ width: 1, height: 1 });
  const currentScaleRef = useRef(1);
  const renderingRef = useRef(false);

  // Store current zoom in ref for immediate access
  useEffect(() => {
    currentScaleRef.current = zoom * 2;
  }, [zoom]);

  // Render PDF page
  const renderPdfPage = useCallback(async () => {
    if (!pdfDoc || !pdfCanvasRef.current || renderingRef.current) return;
    
    renderingRef.current = true;
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      const scale = zoom * 2;
      const viewport = page.getViewport({ scale });
      
      // Store PDF dimensions
      const baseViewport = page.getViewport({ scale: 1 });
      pdfDimensionsRef.current = { 
        width: baseViewport.width, 
        height: baseViewport.height 
      };
      
      const canvas = pdfCanvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      // Setup drawing canvas
      if (drawCanvasRef.current) {
        drawCanvasRef.current.width = viewport.width;
        drawCanvasRef.current.height = viewport.height;
      }
      
      setIsRendered(true);
    } catch (error) {
      console.error(`Error rendering page ${pageNum}:`, error);
    } finally {
      renderingRef.current = false;
    }
  }, [pdfDoc, pageNum, zoom]);

  // Initial render
  useEffect(() => {
    renderPdfPage();
  }, [renderPdfPage]);

  // Fast coordinate conversion functions
  const screenToPdfCoords = useCallback((screenX: number, screenY: number): Point => {
    const scale = currentScaleRef.current;
    return {
      x: screenX / (pdfDimensionsRef.current.width * scale),
      y: screenY / (pdfDimensionsRef.current.height * scale)
    };
  }, []);

  const pdfToScreenCoords = useCallback((pdfX: number, pdfY: number) => {
    const scale = currentScaleRef.current;
    return {
      x: pdfX * pdfDimensionsRef.current.width * scale,
      y: pdfY * pdfDimensionsRef.current.height * scale
    };
  }, []);

  // Tool properties
  const getToolColor = useCallback(() => {
    switch (tool) {
      case 'green_pen': return '#10b981';
      case 'red_pen': return '#ef4444';
      case 'yellow_highlight': return 'rgba(250, 204, 21, 0.3)';
      default: return '#000000';
    }
  }, [tool]);

  const getToolWidth = useCallback(() => {
    const scale = currentScaleRef.current;
    const baseWidth = tool === 'yellow_highlight' ? strokeWidth * 4 : strokeWidth;
    return baseWidth * (scale / 2);
  }, [tool, strokeWidth]);

  // Fast redraw function using requestAnimationFrame
  const redrawStrokes = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    
    requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const scale = currentScaleRef.current;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Batch draw all strokes
      ctx.save();
      
      strokes.forEach(stroke => {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.tool === 'yellow_highlight' 
          ? stroke.width * 4 * (scale / 2)
          : stroke.width * (scale / 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (stroke.tool === 'yellow_highlight') {
          ctx.globalCompositeOperation = 'multiply';
          ctx.globalAlpha = 0.3;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
        }
        
        ctx.beginPath();
        stroke.points.forEach((pdfPoint, index) => {
          const screenPoint = pdfToScreenCoords(pdfPoint.x, pdfPoint.y);
          if (index === 0) {
            ctx.moveTo(screenPoint.x, screenPoint.y);
          } else {
            ctx.lineTo(screenPoint.x, screenPoint.y);
          }
        });
        ctx.stroke();
      });
      
      ctx.restore();
    });
  }, [strokes, pdfToScreenCoords]);

  // Immediate redraw when zoom changes or strokes update
  useEffect(() => {
    if (isRendered) {
      redrawStrokes();
    }
  }, [zoom, strokes, isRendered, forceRedraw, redrawStrokes]);

  // Drawing handlers
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tool || tool === 'eraser') return;
    
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const screenY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const pdfPoint = screenToPdfCoords(screenX, screenY);
    
    setIsDrawing(true);
    setCurrentStroke([pdfPoint]);
  }, [tool, screenToPdfCoords]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !tool || tool === 'eraser') return;
    
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const screenY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const pdfPoint = screenToPdfCoords(screenX, screenY);
    const newStroke = [...currentStroke, pdfPoint];
    setCurrentStroke(newStroke);
    
    // Immediate visual feedback
    requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.strokeStyle = getToolColor();
      ctx.lineWidth = getToolWidth();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (tool === 'yellow_highlight') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.3;
      }
      
      ctx.beginPath();
      if (currentStroke.length > 0) {
        const lastPdfPoint = currentStroke[currentStroke.length - 1];
        const lastScreenPoint = pdfToScreenCoords(lastPdfPoint.x, lastPdfPoint.y);
        ctx.moveTo(lastScreenPoint.x, lastScreenPoint.y);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();
      }
      
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    });
  }, [isDrawing, tool, currentStroke, screenToPdfCoords, pdfToScreenCoords, getToolColor, getToolWidth]);

  const endDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    if (currentStroke.length > 1 && tool) {
      const newStroke: Stroke = {
        points: currentStroke,
        color: getToolColor(),
        width: strokeWidth,
        tool: tool
      };
      
      onStrokeComplete(pageNum, newStroke);
    }
    
    setIsDrawing(false);
    setCurrentStroke([]);
  }, [isDrawing, currentStroke, tool, strokeWidth, pageNum, getToolColor, onStrokeComplete]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'eraser') return;
    
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const screenY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const pdfPoint = screenToPdfCoords(screenX, screenY);
    
    const threshold = 15 / (pdfDimensionsRef.current.width * currentScaleRef.current);
    strokes.forEach((stroke, index) => {
      const isNearStroke = stroke.points.some(point => 
        Math.abs(point.x - pdfPoint.x) < threshold && 
        Math.abs(point.y - pdfPoint.y) < threshold
      );
      
      if (isNearStroke) {
        onStrokeComplete(pageNum, { ...stroke, tool: 'remove_' + index });
      }
    });
  }, [tool, strokes, pageNum, screenToPdfCoords, onStrokeComplete]);

  return (
    <div className="relative mb-4 bg-white shadow-lg rounded">
      <canvas ref={pdfCanvasRef} className="block" />
      <canvas
        ref={drawCanvasRef}
        className="absolute top-0 left-0"
        style={{ 
          cursor: tool === 'eraser' ? 'crosshair' : 'default',
          pointerEvents: 'auto'
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onClick={handleClick}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.pageNum === nextProps.pageNum &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.tool === nextProps.tool &&
    prevProps.strokeWidth === nextProps.strokeWidth &&
    prevProps.strokes === nextProps.strokes &&
    prevProps.forceRedraw === nextProps.forceRedraw
  );
});

PageCanvas.displayName = 'PageCanvas';

export default function FastZoomViewer({ pdfUrl, studentId = 'demo' }: Props) {
  // State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());
  const [pageStrokes, setPageStrokes] = useState<Map<number, Stroke[]>>(new Map());
  const [zoom, setZoom] = useState(1);
  const [forceRedraw, setForceRedraw] = useState(0);
  
  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Store
  const { tool, strokeWidth, setTool, setStrokeWidth } = useAnnotationStore();

  // Initialize PDF.js
  useEffect(() => {
    const initPdf = async () => {
      if (typeof window === 'undefined') return;
      
      const pdfjs = await import('pdfjs-dist');
      pdfjsLib = pdfjs;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
      console.log('⚡ Fast zoom viewer initialized');
      loadPdf();
    };
    
    initPdf();
  }, []);

  // Load PDF
  const loadPdf = async () => {
    if (!pdfjsLib) return;
    
    try {
      setIsLoading(true);
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setIsLoading(false);
      
      // Initially show first few pages
      setVisiblePages(new Set([1, 2, 3]));
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
    }
  };

  // Setup intersection observer
  useEffect(() => {
    if (!scrollContainerRef.current || totalPages === 0) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page') || '0');
            if (pageNum > 0) {
              setVisiblePages(prev => new Set(prev).add(pageNum));
            }
          }
        });
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '100px',
        threshold: 0.01
      }
    );
    
    const placeholders = scrollContainerRef.current.querySelectorAll('[data-page]');
    placeholders.forEach(el => observerRef.current?.observe(el));
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [totalPages]);

  // Handle stroke completion
  const handleStrokeComplete = useCallback((pageNum: number, stroke: Stroke) => {
    if (stroke.tool.startsWith('remove_')) {
      const index = parseInt(stroke.tool.split('_')[1]);
      setPageStrokes(prev => {
        const newMap = new Map(prev);
        const strokes = newMap.get(pageNum) || [];
        newMap.set(pageNum, strokes.filter((_, i) => i !== index));
        return newMap;
      });
    } else {
      setPageStrokes(prev => {
        const newMap = new Map(prev);
        const strokes = newMap.get(pageNum) || [];
        newMap.set(pageNum, [...strokes, stroke]);
        return newMap;
      });
    }
  }, []);

  // Clear current page
  const clearCurrentPage = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollTop = container.scrollTop;
    const pageHeight = container.scrollHeight / totalPages;
    const currentPage = Math.floor(scrollTop / pageHeight) + 1;
    
    if (confirm(`Clear all annotations on page ${currentPage}?`)) {
      setPageStrokes(prev => {
        const newMap = new Map(prev);
        newMap.set(currentPage, []);
        return newMap;
      });
    }
  };

  // Optimized zoom handler with immediate feedback
  const handleZoomChange = useCallback((newZoom: number) => {
    console.time('⚡ Zoom change');
    setZoom(newZoom);
    // Force immediate redraw of all visible annotations
    setForceRedraw(prev => prev + 1);
    console.timeEnd('⚡ Zoom change');
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Quran PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Student: {studentId}</h2>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Notes</h3>
              <textarea 
                className="w-full h-32 p-2 border rounded resize-none text-sm"
                placeholder="Add notes for this student..."
              />
            </div>
            <div>
              <h3 className="font-medium mb-2">History</h3>
              <div className="text-sm text-gray-500">No previous sessions</div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Info</h3>
              <div className="text-sm space-y-1">
                <div>Pages: {totalPages}</div>
                <div>Tool: {tool || 'None'}</div>
                <div>Width: {strokeWidth}px</div>
                <div className="text-emerald-600 font-medium">
                  ⚡ Fast zoom rendering
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  tool === 'green_pen' 
                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => setTool('green_pen')}
              >
                ✅ Correct
              </button>
              <button
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  tool === 'red_pen' 
                    ? 'bg-red-100 text-red-700 border-2 border-red-500' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => setTool('red_pen')}
              >
                ❌ Incorrect
              </button>
              <button
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  tool === 'yellow_highlight' 
                    ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => setTool('yellow_highlight')}
              >
                🟨 Highlight
              </button>
              <button
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  tool === 'eraser' 
                    ? 'bg-gray-700 text-white border-2 border-gray-900' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => setTool('eraser')}
              >
                🗑️ Eraser
              </button>
              
              <div className="ml-4 flex items-center gap-2">
                <span className="text-sm text-gray-600">Width:</span>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm font-medium">{strokeWidth}px</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={clearCurrentPage}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded font-medium"
              >
                Clear Page
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleZoomChange(Math.max(0.5, zoom - 0.25))}
                  className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  −
                </button>
                <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => handleZoomChange(Math.min(2, zoom + 0.25))}
                  className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-gray-100"
        >
          <div className="max-w-4xl mx-auto py-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <div key={pageNum} data-page={pageNum}>
                {visiblePages.has(pageNum) ? (
                  <PageCanvas
                    pageNum={pageNum}
                    pdfDoc={pdfDoc}
                    zoom={zoom}
                    strokes={pageStrokes.get(pageNum) || []}
                    onStrokeComplete={handleStrokeComplete}
                    tool={tool}
                    strokeWidth={strokeWidth}
                    forceRedraw={forceRedraw}
                  />
                ) : (
                  <div className="h-[800px] mb-4 bg-white shadow-lg rounded flex items-center justify-center text-gray-400">
                    Loading page {pageNum}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}