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

export default function UnifiedPdfViewer({ pdfUrl, studentId = 'demo' }: Props) {
  // State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [allStrokes, setAllStrokes] = useState<Stroke[]>([]);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const pdfPagesRef = useRef<Map<number, HTMLDivElement>>(new Map());
  
  // Store
  const { tool, strokeWidth, setTool, setStrokeWidth } = useAnnotationStore();

  // Initialize PDF.js
  useEffect(() => {
    const initPdf = async () => {
      if (typeof window === 'undefined') return;
      
      const pdfjs = await import('pdfjs-dist');
      pdfjsLib = pdfjs;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
      console.log('🎯 Unified PDF viewer initialized');
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
      renderAllPages(pdf);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
    }
  };

  // Render all pages at once with fixed size
  const renderAllPages = async (pdf: any) => {
    if (!containerRef.current) return;
    
    // Clear container
    containerRef.current.innerHTML = '';
    pdfPagesRef.current.clear();
    
    // Create pages container
    const pagesContainer = document.createElement('div');
    pagesContainer.className = 'pdf-pages-container';
    pagesContainer.style.transformOrigin = 'top left';
    containerRef.current.appendChild(pagesContainer);
    
    // Render each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Use base scale of 2 for clarity
      const viewport = page.getViewport({ scale: 2 });
      
      // Create page container
      const pageDiv = document.createElement('div');
      pageDiv.className = 'pdf-page';
      pageDiv.style.position = 'relative';
      pageDiv.style.marginBottom = '10px';
      pageDiv.style.width = viewport.width + 'px';
      pageDiv.style.height = viewport.height + 'px';
      pageDiv.style.backgroundColor = 'white';
      pageDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      pageDiv.dataset.pageNum = String(pageNum);
      
      // Create canvas for PDF
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      
      pageDiv.appendChild(canvas);
      pagesContainer.appendChild(pageDiv);
      
      // Store reference
      pdfPagesRef.current.set(pageNum, pageDiv);
      
      // Render PDF page
      const context = canvas.getContext('2d');
      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      }
      
      // Add drawing overlay canvas
      const drawCanvas = document.createElement('canvas');
      drawCanvas.width = viewport.width;
      drawCanvas.height = viewport.height;
      drawCanvas.style.position = 'absolute';
      drawCanvas.style.top = '0';
      drawCanvas.style.left = '0';
      drawCanvas.style.width = '100%';
      drawCanvas.style.height = '100%';
      drawCanvas.style.pointerEvents = 'auto';
      drawCanvas.style.cursor = tool === 'eraser' ? 'crosshair' : 'default';
      drawCanvas.className = 'draw-canvas';
      drawCanvas.dataset.pageNum = String(pageNum);
      
      // Add event listeners directly
      drawCanvas.addEventListener('mousedown', handleMouseDown);
      drawCanvas.addEventListener('mousemove', handleMouseMove);
      drawCanvas.addEventListener('mouseup', handleMouseUp);
      drawCanvas.addEventListener('mouseleave', handleMouseUp);
      drawCanvas.addEventListener('click', handleClick);
      
      pageDiv.appendChild(drawCanvas);
    }
    
    // Apply initial zoom
    applyZoom();
    
    // Redraw all strokes
    redrawAllStrokes();
  };

  // Apply zoom using CSS transform (instant!)
  const applyZoom = () => {
    const container = containerRef.current?.querySelector('.pdf-pages-container') as HTMLElement;
    if (container) {
      container.style.transform = `scale(${zoom})`;
      container.style.transformOrigin = 'top left';
      
      // Adjust container size
      if (containerRef.current) {
        const firstPage = pdfPagesRef.current.get(1);
        if (firstPage) {
          const baseWidth = parseFloat(firstPage.style.width);
          const baseHeight = parseFloat(firstPage.style.height);
          containerRef.current.style.width = (baseWidth * zoom) + 'px';
          containerRef.current.style.minHeight = (baseHeight * totalPages * zoom) + 'px';
        }
      }
    }
  };

  // Handle zoom change - instant with CSS transform
  useEffect(() => {
    applyZoom();
  }, [zoom]);

  // Get tool properties
  const getToolColor = () => {
    switch (tool) {
      case 'green_pen':
        return '#10b981';
      case 'red_pen':
        return '#ef4444';
      case 'yellow_highlight':
        return 'rgba(250, 204, 21, 0.3)';
      default:
        return '#000000';
    }
  };

  const getToolWidth = () => {
    if (tool === 'yellow_highlight') {
      return strokeWidth * 4;
    }
    return strokeWidth;
  };

  // Mouse handlers
  const handleMouseDown = (e: MouseEvent) => {
    if (!tool || tool === 'eraser') return;
    
    const canvas = e.target as HTMLCanvasElement;
    const pageNum = parseInt(canvas.dataset.pageNum || '1');
    const rect = canvas.getBoundingClientRect();
    
    // Get coordinates relative to the canvas (not affected by zoom)
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);
    setCurrentPage(pageNum);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing || !tool || tool === 'eraser') return;
    
    const canvas = e.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const newStroke = [...currentStroke, { x, y }];
    setCurrentStroke(newStroke);
    
    // Draw immediately on canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = getToolColor();
    ctx.lineWidth = getToolWidth();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'yellow_highlight') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    
    ctx.beginPath();
    if (currentStroke.length > 0) {
      const lastPoint = currentStroke[currentStroke.length - 1];
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    if (currentStroke.length > 1 && tool) {
      const newStroke: Stroke = {
        points: currentStroke,
        color: getToolColor(),
        width: getToolWidth(),
        tool: tool,
        pageNumber: currentPage
      };
      
      setAllStrokes(prev => [...prev, newStroke]);
    }
    
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const handleClick = (e: MouseEvent) => {
    if (tool !== 'eraser') return;
    
    const canvas = e.target as HTMLCanvasElement;
    const pageNum = parseInt(canvas.dataset.pageNum || '1');
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Find and remove stroke
    const threshold = 15;
    const filteredStrokes = allStrokes.filter(stroke => {
      if (stroke.pageNumber !== pageNum) return true;
      
      return !stroke.points.some(point => 
        Math.abs(point.x - x) < threshold && Math.abs(point.y - y) < threshold
      );
    });
    
    if (filteredStrokes.length < allStrokes.length) {
      setAllStrokes(filteredStrokes);
      redrawPageStrokes(pageNum);
    }
  };

  // Redraw strokes for a specific page
  const redrawPageStrokes = (pageNum: number) => {
    const pageDiv = pdfPagesRef.current.get(pageNum);
    if (!pageDiv) return;
    
    const canvas = pageDiv.querySelector('.draw-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw strokes for this page
    const pageStrokes = allStrokes.filter(s => s.pageNumber === pageNum);
    
    pageStrokes.forEach(stroke => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
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
  };

  // Redraw all strokes
  const redrawAllStrokes = () => {
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      redrawPageStrokes(pageNum);
    }
  };

  // Update strokes when they change
  useEffect(() => {
    redrawAllStrokes();
  }, [allStrokes]);

  // Clear current page
  const clearCurrentPage = () => {
    const scrollTop = scrollViewRef.current?.scrollTop || 0;
    const pageHeight = 800 * zoom; // Approximate
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
                  🎯 Unified PDF + Annotations
                </div>
                <div className="text-blue-600 font-medium">
                  ⚡ Instant CSS zoom
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
        >
          <div className="flex justify-center py-4">
            <div 
              ref={containerRef}
              className="pdf-container"
              style={{
                transformOrigin: 'top center',
                transition: 'none' // No transition for instant zoom
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}