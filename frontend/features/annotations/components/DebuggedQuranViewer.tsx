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

export default function DebuggedQuranViewer({ pdfUrl, studentId = 'demo' }: Props) {
  // Container refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [currentDrawingPage, setCurrentDrawingPage] = useState(1);
  const [allStrokes, setAllStrokes] = useState<Stroke[]>([]);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const [zoom, setZoom] = useState(1);
  
  // Store
  const { tool, strokeWidth, setTool, setStrokeWidth } = useAnnotationStore();

  // Initialize PDF.js
  useEffect(() => {
    const initPdf = async () => {
      if (typeof window === 'undefined') return;
      
      const pdfjs = await import('pdfjs-dist');
      pdfjsLib = pdfjs;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
      console.log('✅ PDF.js initialized');
      loadPdf();
    };
    
    initPdf();
  }, []);

  // Load PDF
  const loadPdf = async () => {
    if (!pdfjsLib) return;
    
    try {
      setIsLoading(true);
      console.log('📄 Loading PDF from:', pdfUrl);
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      console.log('✅ PDF loaded, pages:', pdf.numPages);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error loading PDF:', error);
      setIsLoading(false);
    }
  };

  // Tool properties
  const getToolColor = useCallback(() => {
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
  }, [tool]);

  const getToolWidth = useCallback(() => {
    if (tool === 'yellow_highlight') {
      return strokeWidth * 4;
    }
    return strokeWidth;
  }, [tool, strokeWidth]);

  // Drawing functions with debugging
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('🖱️ Mouse down, tool:', tool);
    
    // Important: Only prevent drawing if tool is eraser, not if it's null
    if (tool === 'eraser') {
      console.log('🗑️ Eraser mode, not starting stroke');
      return;
    }
    
    // Allow drawing if any pen/highlight tool is selected
    if (!tool || !['green_pen', 'red_pen', 'yellow_highlight'].includes(tool)) {
      console.log('⚠️ No drawing tool selected');
      return;
    }
    
    const canvas = e.currentTarget;
    const pageNum = parseInt(canvas.dataset.pageNum || '1');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    console.log(`✏️ Starting stroke at (${x.toFixed(0)}, ${y.toFixed(0)}) on page ${pageNum}`);
    
    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);
    setCurrentDrawingPage(pageNum);
  }, [tool]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !tool || tool === 'eraser') return;
    
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const newStroke = [...currentStroke, { x, y }];
    setCurrentStroke(newStroke);
    
    // Draw on canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = getToolColor();
    ctx.lineWidth = getToolWidth();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Special handling for highlighter
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
  }, [isDrawing, tool, currentStroke, getToolColor, getToolWidth]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    
    console.log(`✅ Ending stroke with ${currentStroke.length} points`);
    
    if (currentStroke.length > 1 && tool) {
      const newStroke: Stroke = {
        points: currentStroke,
        color: getToolColor(),
        width: getToolWidth(),
        tool: tool,
        pageNumber: currentDrawingPage
      };
      
      setAllStrokes(prev => [...prev, newStroke]);
      console.log('💾 Stroke saved for page', currentDrawingPage);
    }
    
    setIsDrawing(false);
    setCurrentStroke([]);
  }, [isDrawing, currentStroke, tool, currentDrawingPage, getToolColor, getToolWidth]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'eraser') return;
    
    const canvas = e.currentTarget;
    const pageNum = parseInt(canvas.dataset.pageNum || '1');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    console.log('🗑️ Eraser click at', x.toFixed(0), y.toFixed(0));
    
    const threshold = 15;
    const filteredStrokes = allStrokes.filter(stroke => {
      if (stroke.pageNumber !== pageNum) return true;
      
      return !stroke.points.some(point => 
        Math.abs(point.x - x) < threshold && Math.abs(point.y - y) < threshold
      );
    });
    
    if (filteredStrokes.length < allStrokes.length) {
      console.log('🗑️ Removed', allStrokes.length - filteredStrokes.length, 'strokes');
      setAllStrokes(filteredStrokes);
      redrawPageStrokes(pageNum);
    }
  }, [tool, allStrokes]);

  // Redraw strokes for a page
  const redrawPageStrokes = useCallback((pageNum: number) => {
    const container = document.getElementById(`page-${pageNum}`);
    if (!container) return;
    
    const canvas = container.querySelector('canvas[data-page-num]') as HTMLCanvasElement;
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
    
    console.log(`🎨 Redrawn ${pageStrokes.length} strokes on page ${pageNum}`);
  }, [allStrokes]);

  // Render a single page
  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || renderedPages.has(pageNum)) return;
    
    try {
      console.log(`📄 Rendering page ${pageNum}`);
      const page = await pdfDoc.getPage(pageNum);
      const scale = zoom * 1.5;
      const viewport = page.getViewport({ scale });
      
      const container = document.getElementById(`page-${pageNum}`);
      if (!container) return;
      
      // Clear placeholder
      container.innerHTML = '';
      container.style.width = viewport.width + 'px';
      container.style.height = viewport.height + 'px';
      
      // Create PDF canvas
      const pdfCanvas = document.createElement('canvas');
      pdfCanvas.width = viewport.width;
      pdfCanvas.height = viewport.height;
      pdfCanvas.className = 'block';
      container.appendChild(pdfCanvas);
      
      // Render PDF
      const pdfContext = pdfCanvas.getContext('2d');
      if (pdfContext) {
        await page.render({
          canvasContext: pdfContext,
          viewport: viewport,
        }).promise;
      }
      
      // Create React wrapper for drawing canvas
      const drawWrapper = document.createElement('div');
      drawWrapper.className = 'absolute top-0 left-0 w-full h-full';
      drawWrapper.dataset.pageNum = String(pageNum);
      container.appendChild(drawWrapper);
      
      setRenderedPages(prev => new Set(prev).add(pageNum));

      // Force re-render to attach React events
      triggerUpdate();

      console.log(`✅ Page ${pageNum} rendered`);
    } catch (error) {
      console.error(`❌ Error rendering page ${pageNum}:`, error);
    }
  };

  // Force update hack
  const [, forceUpdate] = useState(0);
  const triggerUpdate = () => forceUpdate(prev => prev + 1);

  // Create page containers
  useEffect(() => {
    if (!pdfDoc || totalPages === 0) return;
    
    const container = pagesContainerRef.current;
    if (!container) return;
    
    console.log('📚 Creating containers for', totalPages, 'pages');
    
    container.innerHTML = '';
    setRenderedPages(new Set());
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageContainer = document.createElement('div');
      pageContainer.id = `page-${pageNum}`;
      pageContainer.className = 'relative mb-4 bg-white shadow-lg rounded';
      pageContainer.style.minHeight = '800px';
      
      const placeholder = document.createElement('div');
      placeholder.className = 'flex items-center justify-center h-full text-gray-400';
      placeholder.textContent = `Loading page ${pageNum}...`;
      pageContainer.appendChild(placeholder);
      
      container.appendChild(pageContainer);
    }
    
    renderVisiblePages();
  }, [pdfDoc, totalPages]);

  // Render visible pages on scroll
  const renderVisiblePages = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageElement = document.getElementById(`page-${pageNum}`);
      if (!pageElement) continue;
      
      const pageTop = pageElement.offsetTop - container.offsetTop;
      const pageBottom = pageTop + pageElement.offsetHeight;
      
      if (pageBottom >= scrollTop - 200 && pageTop <= scrollTop + containerHeight + 200) {
        if (!renderedPages.has(pageNum)) {
          renderPage(pageNum);
        }
      }
    }
  }, [totalPages, renderedPages, pdfDoc]);

  // Scroll handler
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      renderVisiblePages();
    };
    
    container.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [renderVisiblePages]);

  // Render React canvases over dynamic pages
  const renderDrawingCanvases = () => {
    const canvases = [];
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (renderedPages.has(pageNum)) {
        const container = document.getElementById(`page-${pageNum}`);
        const wrapper = container?.querySelector('[data-page-num]') as HTMLElement;
        if (wrapper) {
          const rect = wrapper.getBoundingClientRect();
          canvases.push(
            <canvas
              key={`draw-${pageNum}`}
              data-page-num={pageNum}
              className="absolute top-0 left-0"
              width={rect.width}
              height={rect.height}
              style={{
                position: 'absolute',
                top: wrapper.offsetTop,
                left: wrapper.offsetLeft,
                cursor: tool === 'eraser' ? 'crosshair' : 'default',
                pointerEvents: 'auto'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleClick}
            />
          );
        }
      }
    }
    return canvases;
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
              <h3 className="font-medium mb-2">History</h3>
              <div className="text-sm text-gray-500">No previous sessions</div>
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
                onClick={() => {
                  setTool('green_pen');
                  console.log('✅ Selected green pen');
                }}
              >
                ✅ Correct
              </button>
              <button
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  tool === 'red_pen' 
                    ? 'bg-red-100 text-red-700 border-2 border-red-500' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => {
                  setTool('red_pen');
                  console.log('❌ Selected red pen');
                }}
              >
                ❌ Incorrect
              </button>
              <button
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  tool === 'yellow_highlight' 
                    ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => {
                  setTool('yellow_highlight');
                  console.log('🟨 Selected highlighter');
                }}
              >
                🟨 Highlight
              </button>
              <button
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  tool === 'eraser' 
                    ? 'bg-gray-700 text-white border-2 border-gray-900' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => {
                  setTool('eraser');
                  console.log('🗑️ Selected eraser');
                }}
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                −
              </button>
              <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-gray-100"
        >
          <div 
            ref={pagesContainerRef}
            className="max-w-4xl mx-auto py-4 relative"
          >
            {/* Dynamic pages will be inserted here */}
          </div>
          
          {/* React-managed drawing canvases overlay */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {renderDrawingCanvases()}
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs max-w-xs">
        <div>Tool: {tool || 'none'}</div>
        <div>Drawing: {isDrawing ? 'yes' : 'no'}</div>
        <div>Strokes: {allStrokes.length}</div>
        <div>Pages: {renderedPages.size}/{totalPages}</div>
      </div>
    </div>
  );
}