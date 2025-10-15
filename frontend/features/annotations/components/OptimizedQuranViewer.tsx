'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAnnotationStore } from '../state/useAnnotationStore';

let pdfjsLib: any = null;

interface Props {
  pdfUrl: string;
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool: string;
  pageNumber: number;
}

export default function OptimizedQuranViewer({ pdfUrl }: Props) {
  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const annotationCanvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  
  // State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ points: { x: number; y: number }[], pageNumber: number } | null>(null);
  const [allStrokes, setAllStrokes] = useState<Stroke[]>([]);
  const [visiblePages, setVisiblePages] = useState<number[]>([1]);
  
  // Store
  const { tool, strokeWidth, setTool } = useAnnotationStore();
  const [zoom, setZoom] = useState(1);

  // Initialize PDF.js
  useEffect(() => {
    const initPdf = async () => {
      if (typeof window === 'undefined') return;
      
      const pdfjs = await import('pdfjs-dist');
      pdfjsLib = pdfjs;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
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
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
    }
  };

  // Render a single page
  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || renderedPages.has(pageNum)) return;
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      const scale = zoom * 1.5; // Good default scale
      const viewport = page.getViewport({ scale });
      
      // Create or get page container
      let pageContainer = document.getElementById(`page-${pageNum}`);
      if (!pageContainer) {
        pageContainer = document.createElement('div');
        pageContainer.id = `page-${pageNum}`;
        pageContainer.className = 'relative mb-4 bg-white shadow-lg';
        pageContainer.style.width = `${viewport.width}px`;
        pageContainer.style.height = `${viewport.height}px`;
        canvasContainerRef.current?.appendChild(pageContainer);
      }
      
      // Create PDF canvas
      let pdfCanvas = pagesRef.current.get(pageNum);
      if (!pdfCanvas) {
        pdfCanvas = document.createElement('canvas');
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        pdfCanvas.className = 'block';
        pageContainer.appendChild(pdfCanvas);
        pagesRef.current.set(pageNum, pdfCanvas);
      }
      
      // Render PDF
      const context = pdfCanvas.getContext('2d');
      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      }
      
      // Create annotation canvas
      let annotCanvas = annotationCanvasesRef.current.get(pageNum);
      if (!annotCanvas) {
        annotCanvas = document.createElement('canvas');
        annotCanvas.width = viewport.width;
        annotCanvas.height = viewport.height;
        annotCanvas.className = 'absolute top-0 left-0';
        annotCanvas.style.pointerEvents = 'auto';
        annotCanvas.style.cursor = tool === 'eraser' ? 'crosshair' : 'crosshair';
        annotCanvas.dataset.pageNumber = String(pageNum);
        
        // Add event listeners
        annotCanvas.addEventListener('mousedown', handleMouseDown);
        annotCanvas.addEventListener('mousemove', handleMouseMove);
        annotCanvas.addEventListener('mouseup', handleMouseUp);
        annotCanvas.addEventListener('mouseleave', handleMouseUp);
        annotCanvas.addEventListener('click', handleCanvasClick);
        
        pageContainer.appendChild(annotCanvas);
        annotationCanvasesRef.current.set(pageNum, annotCanvas);
      }
      
      // Set canvas context for drawing
      const annotCtx = annotCanvas.getContext('2d');
      if (annotCtx) {
        annotCtx.lineCap = 'round';
        annotCtx.lineJoin = 'round';
        
        // Set composite operation for highlighter
        if (tool === 'yellow_highlight') {
          annotCtx.globalCompositeOperation = 'multiply';
        } else {
          annotCtx.globalCompositeOperation = 'source-over';
        }
      }
      
      setRenderedPages(prev => new Set(prev).add(pageNum));
      
      // Redraw existing strokes for this page
      redrawPageStrokes(pageNum);
    } catch (error) {
      console.error(`Error rendering page ${pageNum}:`, error);
    }
  };

  // Render visible pages
  const renderVisiblePages = useCallback(() => {
    if (!pdfDoc) return;
    
    // Render first 3 pages initially, then render others as needed
    const pagesToRender = visiblePages.length > 0 ? visiblePages : [1, 2, 3];
    
    pagesToRender.forEach(pageNum => {
      if (pageNum <= totalPages) {
        renderPage(pageNum);
      }
    });
  }, [pdfDoc, visiblePages, totalPages, zoom]);

  // Handle scroll to determine visible pages
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    
    const newVisiblePages: number[] = [];
    
    // Check which pages are visible
    for (let i = 1; i <= totalPages; i++) {
      const pageElement = document.getElementById(`page-${i}`);
      if (pageElement) {
        const pageTop = pageElement.offsetTop;
        const pageBottom = pageTop + pageElement.offsetHeight;
        
        if (pageBottom >= containerTop && pageTop <= containerBottom) {
          newVisiblePages.push(i);
        }
      }
    }
    
    // Add buffer pages
    if (newVisiblePages.length > 0) {
      const firstVisible = Math.max(1, newVisiblePages[0] - 1);
      const lastVisible = Math.min(totalPages, newVisiblePages[newVisiblePages.length - 1] + 1);
      
      for (let i = firstVisible; i <= lastVisible; i++) {
        if (!newVisiblePages.includes(i)) {
          newVisiblePages.push(i);
        }
      }
    }
    
    setVisiblePages(newVisiblePages.sort((a, b) => a - b));
  }, [totalPages]);

  // Drawing functions
  const getToolColor = () => {
    switch (tool) {
      case 'green_pen':
        return '#10b981';
      case 'red_pen':
        return '#ef4444';
      case 'yellow_highlight':
        return 'rgba(250, 204, 21, 0.3)'; // More transparent for highlight
      default:
        return '#000000';
    }
  };

  const getToolWidth = () => {
    if (tool === 'yellow_highlight') {
      return strokeWidth * 5; // Wider for highlight
    }
    return strokeWidth;
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (tool === 'eraser') return;
    
    const canvas = e.target as HTMLCanvasElement;
    const pageNumber = parseInt(canvas.dataset.pageNumber || '1');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setIsDrawing(true);
    setCurrentStroke({ points: [{ x, y }], pageNumber });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing || !currentStroke || tool === 'eraser') return;
    
    const canvas = e.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Draw on canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set composite operation for proper transparency
    if (tool === 'yellow_highlight') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    
    ctx.strokeStyle = getToolColor();
    ctx.lineWidth = getToolWidth();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Reset alpha
    ctx.globalAlpha = 1;
    
    setCurrentStroke(prev => ({
      ...prev!,
      points: [...prev!.points, { x, y }]
    }));
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentStroke) return;
    
    if (currentStroke.points.length > 1) {
      const newStroke: Stroke = {
        points: currentStroke.points,
        color: getToolColor(),
        width: getToolWidth(),
        tool: tool,
        pageNumber: currentStroke.pageNumber
      };
      
      setAllStrokes(prev => [...prev, newStroke]);
    }
    
    setIsDrawing(false);
    setCurrentStroke(null);
  };

  const handleCanvasClick = (e: MouseEvent) => {
    if (tool !== 'eraser') return;
    
    const canvas = e.target as HTMLCanvasElement;
    const pageNumber = parseInt(canvas.dataset.pageNumber || '1');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Find and remove strokes near click
    const threshold = 20;
    const filteredStrokes = allStrokes.filter(stroke => {
      if (stroke.pageNumber !== pageNumber) return true;
      
      return !stroke.points.some(point => 
        Math.abs(point.x - x) < threshold && Math.abs(point.y - y) < threshold
      );
    });
    
    if (filteredStrokes.length < allStrokes.length) {
      setAllStrokes(filteredStrokes);
      redrawPageStrokes(pageNumber);
    }
  };

  const redrawPageStrokes = (pageNumber: number) => {
    const canvas = annotationCanvasesRef.current.get(pageNumber);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw strokes for this page
    const pageStrokes = allStrokes.filter(s => s.pageNumber === pageNumber);
    
    pageStrokes.forEach(stroke => {
      // Set composite operation based on tool
      if (stroke.tool === 'yellow_highlight') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.3;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      stroke.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
      
      // Reset alpha
      ctx.globalAlpha = 1;
    });
  };

  const clearCurrentPage = () => {
    const firstVisiblePage = visiblePages[0] || 1;
    if (confirm(`Clear all annotations on page ${firstVisiblePage}?`)) {
      setAllStrokes(prev => prev.filter(s => s.pageNumber !== firstVisiblePage));
      redrawPageStrokes(firstVisiblePage);
    }
  };

  // Effects
  useEffect(() => {
    renderVisiblePages();
  }, [renderVisiblePages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
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
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-pulse mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Quran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Minimal Top Bar with Annotation Tools */}
      <div className="bg-white border-b shadow-sm px-4 py-2 flex items-center justify-between">
        {/* Tools */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTool('green_pen')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              tool === 'green_pen' 
                ? 'bg-emerald-500 text-white shadow-md' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            ✓ Correct
          </button>
          
          <button
            onClick={() => setTool('red_pen')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              tool === 'red_pen' 
                ? 'bg-red-500 text-white shadow-md' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            ✗ Incorrect
          </button>
          
          <button
            onClick={() => setTool('yellow_highlight')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              tool === 'yellow_highlight' 
                ? 'bg-yellow-500 text-white shadow-md' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            ⬚ Highlight
          </button>
          
          <button
            onClick={() => setTool('eraser')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              tool === 'eraser' 
                ? 'bg-gray-600 text-white shadow-md' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            ⌫ Eraser
          </button>
          
          <div className="h-6 w-px bg-gray-300"></div>
          
          <button
            onClick={clearCurrentPage}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors"
          >
            Clear Page
          </button>
        </div>
        
        {/* Zoom and Page Info */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Pages: {visiblePages.join(', ')} / {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              −
            </button>
            <span className="text-sm min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              +
            </button>
          </div>
        </div>
      </div>
      
      {/* PDF Container with Continuous Scroll */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div 
          ref={canvasContainerRef}
          className="flex flex-col items-center py-4"
        >
          {/* Pages will be rendered here dynamically */}
        </div>
      </div>
    </div>
  );
}