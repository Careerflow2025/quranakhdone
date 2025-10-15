'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAnnotationStore } from '../state/useAnnotationStore';

// PDF.js - we know this works
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

export default function FinalWorkingViewer({ pdfUrl, studentId = 'demo' }: Props) {
  // Refs for container and pages
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, { pdf: HTMLCanvasElement; draw: HTMLCanvasElement }>>(new Map());
  
  // State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [currentDrawingPage, setCurrentDrawingPage] = useState(1);
  const [allStrokes, setAllStrokes] = useState<Stroke[]>([]);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'history' | 'info'>('notes');
  
  // Store
  const { tool, strokeWidth, setTool, setStrokeWidth } = useAnnotationStore();
  const [zoom, setZoom] = useState(1);

  // Initialize PDF.js (this approach works)
  useEffect(() => {
    const initPdf = async () => {
      if (typeof window === 'undefined') return;
      
      const pdfjs = await import('pdfjs-dist');
      pdfjsLib = pdfjs;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
      console.log('PDF.js initialized');
      loadPdf();
    };
    
    initPdf();
  }, []);

  // Load PDF
  const loadPdf = async () => {
    if (!pdfjsLib) return;
    
    try {
      setIsLoading(true);
      console.log('Loading PDF from:', pdfUrl);
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      console.log('PDF loaded successfully, pages:', pdf.numPages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
    }
  };

  // Create ALL page containers when PDF loads
  useEffect(() => {
    if (!pdfDoc || totalPages === 0) return;
    
    const container = pagesContainerRef.current;
    if (!container) return;
    
    console.log('Creating containers for', totalPages, 'pages');
    
    // Clear existing
    container.innerHTML = '';
    pageRefs.current.clear();
    
    // Create container for each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageContainer = document.createElement('div');
      pageContainer.id = `page-${pageNum}`;
      pageContainer.className = 'relative mb-4 bg-white shadow-lg rounded';
      pageContainer.style.minHeight = '800px';
      
      // Add loading placeholder
      const placeholder = document.createElement('div');
      placeholder.className = 'flex items-center justify-center h-full text-gray-400';
      placeholder.textContent = `Loading page ${pageNum}...`;
      pageContainer.appendChild(placeholder);
      
      container.appendChild(pageContainer);
    }
    
    // Start rendering pages
    renderVisiblePages();
  }, [pdfDoc, totalPages]);

  // Render a single page
  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || renderedPages.has(pageNum)) return;
    
    try {
      console.log(`Rendering page ${pageNum}`);
      const page = await pdfDoc.getPage(pageNum);
      const scale = zoom * 1.5;
      const viewport = page.getViewport({ scale });
      
      // Get container
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
      
      // Render PDF to canvas
      const pdfContext = pdfCanvas.getContext('2d');
      if (pdfContext) {
        await page.render({
          canvasContext: pdfContext,
          viewport: viewport,
        }).promise;
      }
      
      // Create drawing canvas overlay
      const drawCanvas = document.createElement('canvas');
      drawCanvas.width = viewport.width;
      drawCanvas.height = viewport.height;
      drawCanvas.className = 'absolute top-0 left-0';
      drawCanvas.style.pointerEvents = 'auto';
      drawCanvas.dataset.pageNum = String(pageNum);
      
      // Add event listeners for drawing
      drawCanvas.addEventListener('mousedown', startDrawing);
      drawCanvas.addEventListener('mousemove', draw);
      drawCanvas.addEventListener('mouseup', endDrawing);
      drawCanvas.addEventListener('mouseleave', endDrawing);
      drawCanvas.addEventListener('click', handleEraser);
      
      container.appendChild(drawCanvas);
      
      // Store references
      pageRefs.current.set(pageNum, { pdf: pdfCanvas, draw: drawCanvas });
      setRenderedPages(prev => new Set(prev).add(pageNum));
      
      // Redraw existing strokes for this page
      redrawPageStrokes(pageNum);
      
      console.log(`Page ${pageNum} rendered successfully`);
    } catch (error) {
      console.error(`Error rendering page ${pageNum}:`, error);
    }
  };

  // Render visible pages on scroll
  const renderVisiblePages = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    // Find visible pages
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageElement = document.getElementById(`page-${pageNum}`);
      if (!pageElement) continue;
      
      const pageTop = pageElement.offsetTop - container.offsetTop;
      const pageBottom = pageTop + pageElement.offsetHeight;
      
      // Check if page is visible (with buffer)
      if (pageBottom >= scrollTop - 200 && pageTop <= scrollTop + containerHeight + 200) {
        if (!renderedPages.has(pageNum)) {
          renderPage(pageNum);
        }
      }
    }
  }, [totalPages, renderedPages, pdfDoc]);

  // Handle scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      renderVisiblePages();
    };
    
    container.addEventListener('scroll', handleScroll);
    // Initial render
    handleScroll();
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [renderVisiblePages]);

  // Get tool properties (these work)
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

  // Drawing functions (proven to work)
  const startDrawing = (e: MouseEvent) => {
    // Don't draw if no tool is selected
    if (!tool || tool === 'eraser') return;
    
    const canvas = e.target as HTMLCanvasElement;
    const pageNum = parseInt(canvas.dataset.pageNum || '1');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    console.log('Starting drawing with tool:', tool, 'at', x, y, 'on page', pageNum);
    
    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);
    setCurrentDrawingPage(pageNum);
  };

  const draw = (e: MouseEvent) => {
    if (!isDrawing || !tool || tool === 'eraser') return;
    
    const canvas = e.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const newStroke = [...currentStroke, { x, y }];
    setCurrentStroke(newStroke);
    
    // Draw the current stroke
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
      ctx.moveTo(currentStroke[currentStroke.length - 1].x, currentStroke[currentStroke.length - 1].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    
    if (currentStroke.length > 1) {
      // Save the stroke
      const newStroke: Stroke = {
        points: currentStroke,
        color: getToolColor(),
        width: getToolWidth(),
        tool: tool,
        pageNumber: currentDrawingPage
      };
      
      setAllStrokes(prev => [...prev, newStroke]);
    }
    
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const handleEraser = (e: MouseEvent) => {
    if (tool !== 'eraser') return;
    
    const canvas = e.target as HTMLCanvasElement;
    const pageNum = parseInt(canvas.dataset.pageNum || '1');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Find and remove stroke near click point
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

  // Redraw strokes for a page
  const redrawPageStrokes = (pageNum: number) => {
    const canvases = pageRefs.current.get(pageNum);
    if (!canvases) return;
    
    const ctx = canvases.draw.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvases.draw.width, canvases.draw.height);
    
    // Get strokes for this page
    const pageStrokes = allStrokes.filter(s => s.pageNumber === pageNum);
    
    // Redraw each stroke
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
    });
  };

  // Clear current page
  const clearCurrentPage = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // Find current visible page
    const scrollTop = container.scrollTop;
    const pageHeight = container.scrollHeight / totalPages;
    const currentPage = Math.ceil((scrollTop + 100) / pageHeight);
    
    if (confirm(`Clear all annotations on page ${currentPage}?`)) {
      setAllStrokes(prev => prev.filter(s => s.pageNumber !== currentPage));
      redrawPageStrokes(currentPage);
    }
  };

  // Update cursor based on tool
  useEffect(() => {
    // Update cursor for all drawing canvases
    pageRefs.current.forEach((canvases) => {
      if (canvases.draw) {
        if (!tool) {
          canvases.draw.style.cursor = 'not-allowed';
        } else if (tool === 'eraser') {
          canvases.draw.style.cursor = 'pointer';
        } else {
          canvases.draw.style.cursor = 'crosshair';
        }
      }
    });
  }, [tool]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Quran PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Left Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-12'} bg-white border-r shadow-lg transition-all duration-300 flex flex-col`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 hover:bg-gray-100 border-b"
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
            {!tool && (
              <span className="text-sm text-gray-500 italic mr-2">
                👈 Select a tool to start
              </span>
            )}
            
            <button
              onClick={() => setTool('green_pen')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                tool === 'green_pen' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              ✓ Correct
            </button>
            
            <button
              onClick={() => setTool('red_pen')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                tool === 'red_pen' ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              ✗ Incorrect
            </button>
            
            <button
              onClick={() => setTool('yellow_highlight')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                tool === 'yellow_highlight' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              ⬚ Highlight
            </button>
            
            <button
              onClick={() => setTool('eraser')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                tool === 'eraser' ? 'bg-gray-600 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              ⌫ Eraser
            </button>
            
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
            
            {/* Stroke Width Control - IMPORTANT */}
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
        
        {/* PDF Container with ALL pages */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-gray-100"
        >
          <div 
            ref={pagesContainerRef}
            className="flex flex-col items-center py-4"
          >
            {/* All pages will be rendered here */}
          </div>
        </div>
      </div>
    </div>
  );
}