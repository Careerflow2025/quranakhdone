'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAnnotationStore } from '../state/useAnnotationStore';
import NotesPanel from './NotesPanel';
import HistoryPanel from './HistoryPanel';

let pdfjsLib: any = null;

interface Props {
  pdfUrl: string;
  studentId?: string;
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool: string;
  pageNumber: number;
}

export default function CompleteQuranViewer({ pdfUrl, studentId = 'demo' }: Props) {
  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const pageCanvases = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const annotationCanvases = useRef<Map<number, HTMLCanvasElement>>(new Map());
  
  // State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [currentPageDrawing, setCurrentPageDrawing] = useState<number>(1);
  const [allStrokes, setAllStrokes] = useState<Stroke[]>([]);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'history' | 'info'>('notes');
  
  // Store
  const { tool, strokeWidth, setTool, setStrokeWidth } = useAnnotationStore();
  const [zoom, setZoom] = useState(1);

  // Initialize PDF.js
  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') return;
      const pdfjs = await import('pdfjs-dist');
      pdfjsLib = pdfjs;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      loadPdf();
    };
    init();
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
      console.log('PDF loaded with', pdf.numPages, 'pages');
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
    }
  };

  // Render single page
  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || renderedPages.has(pageNum)) return;
    
    try {
      console.log(`Rendering page ${pageNum}`);
      const page = await pdfDoc.getPage(pageNum);
      const scale = zoom * 1.5;
      const viewport = page.getViewport({ scale });
      
      // Get or create page container
      let pageDiv = document.getElementById(`page-container-${pageNum}`);
      if (!pageDiv) {
        pageDiv = document.createElement('div');
        pageDiv.id = `page-container-${pageNum}`;
        pageDiv.className = 'relative mb-4 bg-white shadow-xl rounded-lg overflow-hidden';
        pagesContainerRef.current?.appendChild(pageDiv);
      }
      
      // Clear placeholder content and set proper dimensions
      pageDiv.innerHTML = '';
      pageDiv.style.width = `${viewport.width}px`;
      pageDiv.style.height = `${viewport.height}px`;
      
      // Create and render PDF canvas
      let pdfCanvas = pageCanvases.current.get(pageNum);
      if (!pdfCanvas) {
        pdfCanvas = document.createElement('canvas');
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        pageDiv.appendChild(pdfCanvas);
        pageCanvases.current.set(pageNum, pdfCanvas);
      }
      
      const pdfContext = pdfCanvas.getContext('2d');
      if (pdfContext) {
        await page.render({
          canvasContext: pdfContext,
          viewport: viewport,
        }).promise;
      }
      
      // Create annotation canvas overlay
      let annotCanvas = annotationCanvases.current.get(pageNum);
      if (!annotCanvas) {
        annotCanvas = document.createElement('canvas');
        annotCanvas.width = viewport.width;
        annotCanvas.height = viewport.height;
        annotCanvas.className = 'absolute top-0 left-0';
        annotCanvas.style.cursor = 'crosshair';
        annotCanvas.dataset.page = String(pageNum);
        
        // Add mouse event listeners
        annotCanvas.addEventListener('mousedown', handleMouseDown);
        annotCanvas.addEventListener('mousemove', handleMouseMove);
        annotCanvas.addEventListener('mouseup', handleMouseUp);
        annotCanvas.addEventListener('mouseleave', handleMouseUp);
        
        // Add touch event listeners for tablet support
        annotCanvas.addEventListener('touchstart', handleTouchStart);
        annotCanvas.addEventListener('touchmove', handleTouchMove);
        annotCanvas.addEventListener('touchend', handleTouchEnd);
        
        pageDiv.appendChild(annotCanvas);
        annotationCanvases.current.set(pageNum, annotCanvas);
      }
      
      setRenderedPages(prev => new Set(prev).add(pageNum));
      redrawPageAnnotations(pageNum);
    } catch (error) {
      console.error(`Error rendering page ${pageNum}:`, error);
    }
  };

  // Get tool properties
  const getToolColor = () => {
    switch (tool) {
      case 'green_pen': return '#10b981';
      case 'red_pen': return '#ef4444';
      case 'yellow_highlight': return 'rgba(250, 204, 21, 0.3)';
      default: return '#000000';
    }
  };

  const getToolWidth = () => {
    return tool === 'yellow_highlight' ? strokeWidth * 4 : strokeWidth;
  };

  // Mouse handlers
  const handleMouseDown = (e: MouseEvent) => {
    if (tool === 'eraser') {
      handleErase(e);
      return;
    }
    
    const canvas = e.target as HTMLCanvasElement;
    const pageNum = parseInt(canvas.dataset.page || '1');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
    setCurrentPageDrawing(pageNum);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing || tool === 'eraser') return;
    
    const canvas = e.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Configure drawing
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = getToolWidth();
    ctx.strokeStyle = getToolColor();
    
    // Set composite operation for highlighter
    if (tool === 'yellow_highlight') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    
    // Draw line segment
    ctx.beginPath();
    if (currentPath.length > 0) {
      const lastPoint = currentPath[currentPath.length - 1];
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    if (currentPath.length > 1) {
      const newStroke: Stroke = {
        points: currentPath,
        color: getToolColor(),
        width: getToolWidth(),
        tool: tool || 'green_pen',
        pageNumber: currentPageDrawing
      };
      setAllStrokes(prev => [...prev, newStroke]);
    }
    
    setIsDrawing(false);
    setCurrentPath([]);
  };

  // Touch handlers for tablet
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    (e.target as HTMLCanvasElement).dispatchEvent(mouseEvent);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    (e.target as HTMLCanvasElement).dispatchEvent(mouseEvent);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    (e.target as HTMLCanvasElement).dispatchEvent(mouseEvent);
  };

  // Eraser
  const handleErase = (e: MouseEvent) => {
    const canvas = e.target as HTMLCanvasElement;
    const pageNum = parseInt(canvas.dataset.page || '1');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const threshold = 20;
    const filteredStrokes = allStrokes.filter(stroke => {
      if (stroke.pageNumber !== pageNum) return true;
      return !stroke.points.some(point => 
        Math.abs(point.x - x) < threshold && Math.abs(point.y - y) < threshold
      );
    });
    
    if (filteredStrokes.length < allStrokes.length) {
      setAllStrokes(filteredStrokes);
      redrawPageAnnotations(pageNum);
    }
  };

  // Redraw annotations for a page
  const redrawPageAnnotations = (pageNum: number) => {
    const canvas = annotationCanvases.current.get(pageNum);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const pageStrokes = allStrokes.filter(s => s.pageNumber === pageNum);
    
    pageStrokes.forEach(stroke => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.width;
      ctx.strokeStyle = stroke.color;
      
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
    });
  };

  // Clear current visible page
  const clearCurrentPage = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollTop = container.scrollTop;
    const pageHeight = container.scrollHeight / totalPages;
    const currentPage = Math.ceil((scrollTop + 100) / pageHeight);
    
    if (confirm(`Clear all annotations on page ${currentPage}?`)) {
      setAllStrokes(prev => prev.filter(s => s.pageNumber !== currentPage));
      redrawPageAnnotations(currentPage);
    }
  };

  // Handle scroll for lazy loading
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !pdfDoc) return;
    
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    // Calculate which pages should be visible
    const pageElements = container.querySelectorAll('[id^="page-container-"]');
    pageElements.forEach((element) => {
      const pageTop = (element as HTMLElement).offsetTop;
      const pageBottom = pageTop + (element as HTMLElement).offsetHeight;
      
      if (pageBottom >= scrollTop - 500 && pageTop <= scrollTop + containerHeight + 500) {
        const pageNum = parseInt(element.id.replace('page-container-', ''));
        if (!renderedPages.has(pageNum)) {
          renderPage(pageNum);
        }
      }
    });
  }, [pdfDoc, renderedPages]);

  // Render initial pages when PDF is loaded
  useEffect(() => {
    if (pdfDoc && totalPages > 0) {
      // Create placeholder divs for all pages first
      const container = pagesContainerRef.current;
      if (!container) return;
      
      // Clear existing content
      container.innerHTML = '';
      
      // Create placeholders for all pages
      for (let i = 1; i <= totalPages; i++) {
        const pageDiv = document.createElement('div');
        pageDiv.id = `page-container-${i}`;
        pageDiv.className = 'relative mb-4 bg-white shadow-xl rounded-lg overflow-hidden';
        pageDiv.style.minHeight = '800px'; // Placeholder height
        pageDiv.innerHTML = `<div class="flex items-center justify-center h-full text-gray-400">Page ${i}</div>`;
        container.appendChild(pageDiv);
      }
      
      // Render first few pages immediately
      setTimeout(() => {
        for (let i = 1; i <= Math.min(3, totalPages); i++) {
          renderPage(i);
        }
        // Trigger scroll handler to load visible pages
        handleScroll();
      }, 100);
    }
  }, [pdfDoc, totalPages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch(e.key.toLowerCase()) {
        case 'g': e.preventDefault(); setTool('green_pen'); break;
        case 'r': e.preventDefault(); setTool('red_pen'); break;
        case 'y': e.preventDefault(); setTool('yellow_highlight'); break;
        case 'e': e.preventDefault(); setTool('eraser'); break;
        case 'delete': e.preventDefault(); clearCurrentPage(); break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Left Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-12'} bg-white border-r shadow-lg transition-all duration-300 flex flex-col`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 hover:bg-gray-100 border-b flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
            )}
          </svg>
        </button>
        
        {sidebarOpen && (
          <>
            <div className="p-4 border-b">
              <h2 className="font-bold text-lg">Student Tools</h2>
              <p className="text-sm text-gray-600">ID: {studentId}</p>
            </div>
            
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  activeTab === 'notes' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : ''
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  activeTab === 'history' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : ''
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  activeTab === 'info' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : ''
                }`}
              >
                Info
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'notes' && (
                <div>
                  <textarea
                    className="w-full h-32 p-2 border rounded-md text-sm mb-2"
                    placeholder="Add notes for this session..."
                  />
                  <button className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                    Save Note
                  </button>
                  <div className="mt-4 space-y-2">
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium">Previous Note (2 days ago)</p>
                      <p className="text-gray-600">Student is making good progress on Surah Al-Baqarah</p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'history' && (
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    <p>Page 10 - Reviewed 1 day ago</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    <p>Page 9 - Reviewed 3 days ago</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    <p>Page 8 - Reviewed 5 days ago</p>
                  </div>
                </div>
              )}
              
              {activeTab === 'info' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Student Name</p>
                    <p className="text-gray-600">Ahmed Ali</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Class</p>
                    <p className="text-gray-600">Quran Level 2</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Progress</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mt-4">
                    Export Report
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b shadow-sm px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Drawing Tools */}
            <button
              onClick={() => setTool('green_pen')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                tool === 'green_pen' ? 'bg-emerald-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              ✓ Correct
            </button>
            
            <button
              onClick={() => setTool('red_pen')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                tool === 'red_pen' ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              ✗ Incorrect
            </button>
            
            <button
              onClick={() => setTool('yellow_highlight')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                tool === 'yellow_highlight' ? 'bg-yellow-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              ⬚ Highlight
            </button>
            
            <button
              onClick={() => setTool('eraser')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                tool === 'eraser' ? 'bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              ⌫ Eraser
            </button>
            
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
            
            {/* Stroke Width Control */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Size:</span>
              <input
                type="range"
                min="2"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                className="w-24"
              />
              <span className="text-sm font-bold min-w-[30px]">{strokeWidth}px</span>
            </div>
            
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
            
            <button
              onClick={clearCurrentPage}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md"
            >
              Clear Page
            </button>
          </div>
          
          {/* Zoom Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              −
            </button>
            <span className="text-sm font-medium min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              +
            </button>
          </div>
        </div>
        
        {/* PDF Scroll Container */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-gray-100"
          onScroll={handleScroll}
        >
          <div 
            ref={pagesContainerRef}
            className="flex flex-col items-center py-8"
          >
            {/* Pages will be rendered here */}
          </div>
        </div>
      </div>
    </div>
  );
}