'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAnnotationStore } from '../state/useAnnotationStore';

// PDF.js imports
let pdfjsLib: any = null;

interface Props {
  pdfUrl: string;
  studentId?: string;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: string;
  pageNumber: number;
}

export default function InstantZoomViewer({ pdfUrl, studentId = 'demo' }: Props) {
  // State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [allStrokes, setAllStrokes] = useState<Stroke[]>([]);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesReady, setPagesReady] = useState(false);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const drawingStateRef = useRef({ isDrawing: false, currentStroke: [] as Point[], currentPage: 1 });
  
  // Store
  const { tool, strokeWidth, setTool, setStrokeWidth } = useAnnotationStore();

  // Store current tool in ref for event handlers
  const toolRef = useRef(tool);
  const strokeWidthRef = useRef(strokeWidth);
  
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);
  
  useEffect(() => {
    strokeWidthRef.current = strokeWidth;
  }, [strokeWidth]);

  // Initialize PDF.js
  useEffect(() => {
    const initPdf = async () => {
      if (typeof window === 'undefined') return;
      
      const pdfjs = await import('pdfjs-dist');
      pdfjsLib = pdfjs;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
      console.log('⚡ Instant zoom viewer initialized');
      loadPdf();
    };
    
    initPdf();
  }, [pdfUrl]);

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
      
      // Render all pages
      await renderAllPages(pdf);
      setPagesReady(true);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
    }
  };

  // Get tool properties
  const getToolColor = useCallback(() => {
    const currentTool = toolRef.current;
    switch (currentTool) {
      case 'green_pen':
        return '#10b981';
      case 'red_pen':
        return '#ef4444';
      case 'yellow_highlight':
        return 'rgba(250, 204, 21, 0.3)';
      default:
        return '#000000';
    }
  }, []);

  const getToolWidth = useCallback(() => {
    const currentTool = toolRef.current;
    const currentWidth = strokeWidthRef.current;
    if (currentTool === 'yellow_highlight') {
      return currentWidth * 4;
    }
    return currentWidth;
  }, []);

  // Render all pages
  const renderAllPages = async (pdf: any) => {
    if (!containerRef.current) return;
    
    // Clear container
    containerRef.current.innerHTML = '';
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-wrapper';
    wrapper.style.transformOrigin = 'top center';
    containerRef.current.appendChild(wrapper);
    
    // Render each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });
      
      // Page container
      const pageDiv = document.createElement('div');
      pageDiv.className = 'pdf-page-container';
      pageDiv.style.position = 'relative';
      pageDiv.style.marginBottom = '10px';
      pageDiv.style.width = viewport.width + 'px';
      pageDiv.style.height = viewport.height + 'px';
      pageDiv.style.backgroundColor = 'white';
      pageDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      
      // PDF canvas
      const pdfCanvas = document.createElement('canvas');
      pdfCanvas.width = viewport.width;
      pdfCanvas.height = viewport.height;
      pdfCanvas.style.display = 'block';
      pageDiv.appendChild(pdfCanvas);
      
      // Render PDF
      const pdfContext = pdfCanvas.getContext('2d');
      if (pdfContext) {
        await page.render({
          canvasContext: pdfContext,
          viewport: viewport,
        }).promise;
      }
      
      // Drawing canvas overlay
      const drawCanvas = document.createElement('canvas');
      drawCanvas.width = viewport.width;
      drawCanvas.height = viewport.height;
      drawCanvas.style.position = 'absolute';
      drawCanvas.style.top = '0';
      drawCanvas.style.left = '0';
      drawCanvas.style.pointerEvents = 'auto';
      drawCanvas.className = 'annotation-canvas';
      drawCanvas.dataset.pageNum = String(pageNum);
      
      pageDiv.appendChild(drawCanvas);
      wrapper.appendChild(pageDiv);
    }
  };

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const currentTool = toolRef.current;
    if (!currentTool || currentTool === 'eraser') return;
    
    const target = e.target as HTMLElement;
    if (!target.classList.contains('annotation-canvas')) return;
    
    const canvas = target as HTMLCanvasElement;
    const pageNum = parseInt(canvas.dataset.pageNum || '1');
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    console.log(`Starting draw on page ${pageNum} at (${x.toFixed(0)}, ${y.toFixed(0)}) with tool: ${currentTool}`);
    
    drawingStateRef.current = {
      isDrawing: true,
      currentStroke: [{ x, y }],
      currentPage: pageNum
    };
    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);
    setCurrentPage(pageNum);
  }, []);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawingStateRef.current.isDrawing) return;
    
    const currentTool = toolRef.current;
    if (!currentTool || currentTool === 'eraser') return;
    
    const target = e.target as HTMLElement;
    if (!target.classList.contains('annotation-canvas')) return;
    
    const canvas = target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Update stroke
    const newPoint = { x, y };
    drawingStateRef.current.currentStroke.push(newPoint);
    setCurrentStroke([...drawingStateRef.current.currentStroke]);
    
    // Draw on canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = getToolColor();
    ctx.lineWidth = getToolWidth();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (currentTool === 'yellow_highlight') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    
    ctx.beginPath();
    const lastPoint = drawingStateRef.current.currentStroke[drawingStateRef.current.currentStroke.length - 2];
    if (lastPoint) {
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, [getToolColor, getToolWidth]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!drawingStateRef.current.isDrawing) return;
    
    const currentTool = toolRef.current;
    if (drawingStateRef.current.currentStroke.length > 1 && currentTool) {
      const newStroke: Stroke = {
        points: [...drawingStateRef.current.currentStroke],
        color: getToolColor(),
        width: strokeWidthRef.current,
        tool: currentTool,
        pageNumber: drawingStateRef.current.currentPage
      };
      
      console.log(`Saving stroke with ${newStroke.points.length} points on page ${newStroke.pageNumber}`);
      setAllStrokes(prev => [...prev, newStroke]);
    }
    
    drawingStateRef.current = {
      isDrawing: false,
      currentStroke: [],
      currentPage: 1
    };
    setIsDrawing(false);
    setCurrentStroke([]);
  }, [getToolColor]);

  // Handle click for eraser
  const handleClick = useCallback((e: React.MouseEvent) => {
    const currentTool = toolRef.current;
    if (currentTool !== 'eraser') return;
    
    const target = e.target as HTMLElement;
    if (!target.classList.contains('annotation-canvas')) return;
    
    const canvas = target as HTMLCanvasElement;
    const pageNum = parseInt(canvas.dataset.pageNum || '1');
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    console.log(`Eraser click at (${x.toFixed(0)}, ${y.toFixed(0)}) on page ${pageNum}`);
    
    // Find and remove stroke
    const threshold = 20;
    setAllStrokes(prev => {
      const filtered = prev.filter(stroke => {
        if (stroke.pageNumber !== pageNum) return true;
        
        return !stroke.points.some(point => 
          Math.abs(point.x - x) < threshold && Math.abs(point.y - y) < threshold
        );
      });
      
      if (filtered.length < prev.length) {
        console.log(`Removed ${prev.length - filtered.length} strokes`);
        // Redraw page
        setTimeout(() => redrawPage(pageNum), 0);
      }
      
      return filtered;
    });
  }, []);

  // Redraw a specific page
  const redrawPage = (pageNum: number) => {
    const canvases = containerRef.current?.querySelectorAll('.annotation-canvas');
    if (!canvases) return;
    
    canvases.forEach(canvas => {
      const c = canvas as HTMLCanvasElement;
      if (parseInt(c.dataset.pageNum || '0') === pageNum) {
        const ctx = c.getContext('2d');
        if (!ctx) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, c.width, c.height);
        
        // Redraw strokes for this page
        allStrokes.filter(s => s.pageNumber === pageNum).forEach(stroke => {
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.tool === 'yellow_highlight' ? stroke.width * 4 : stroke.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          if (stroke.tool === 'yellow_highlight') {
            ctx.globalCompositeOperation = 'multiply';
            ctx.globalAlpha = 0.3;
          }
          
          ctx.beginPath();
          stroke.points.forEach((point, index) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
          
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        });
      }
    });
  };

  // Redraw all pages when strokes change
  useEffect(() => {
    if (!pagesReady) return;
    
    for (let i = 1; i <= totalPages; i++) {
      redrawPage(i);
    }
  }, [allStrokes, pagesReady, totalPages]);

  // Apply zoom with CSS
  useEffect(() => {
    const wrapper = containerRef.current?.querySelector('.pdf-wrapper') as HTMLElement;
    if (wrapper) {
      wrapper.style.transform = `scale(${zoom})`;
    }
  }, [zoom]);

  // Clear current page
  const clearCurrentPage = () => {
    const scrollTop = scrollViewRef.current?.scrollTop || 0;
    const pageHeight = 1200 * zoom;
    const currentPage = Math.floor(scrollTop / pageHeight) + 1;
    
    if (confirm(`Clear all annotations on page ${currentPage}?`)) {
      setAllStrokes(prev => prev.filter(s => s.pageNumber !== currentPage));
    }
  };

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
              <h3 className="font-medium mb-2">Info</h3>
              <div className="text-sm space-y-1">
                <div>Pages: {totalPages}</div>
                <div>Tool: {tool || 'None'}</div>
                <div className="text-emerald-600 font-medium">
                  ⚡ Instant CSS Zoom
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
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  −
                </button>
                <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Container */}
        <div 
          ref={scrollViewRef}
          className="flex-1 overflow-auto bg-gray-100"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
        >
          <div className="flex justify-center py-4">
            <div ref={containerRef} />
          </div>
        </div>
      </div>
    </div>
  );
}