'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAnnotationStore } from '../state/useAnnotationStore';

// PDF.js imports
let pdfjsLib: any = null;

interface Props {
  pdfUrl: string;
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
}

export default function ProfessionalQuranViewer({ pdfUrl }: Props) {
  // Canvas refs
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [pageStrokes, setPageStrokes] = useState<Map<number, Stroke[]>>(new Map());
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Store
  const { page, setPage, zoom, setZoom, tool, strokeWidth, setTool } = useAnnotationStore();

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

  // Render PDF page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !pdfCanvasRef.current) return;
    
    try {
      const pdfPage = await pdfDoc.getPage(page);
      const viewport = pdfPage.getViewport({ scale: zoom * 2 }); // Higher scale for clarity
      
      const canvas = pdfCanvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await pdfPage.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      // Setup drawing canvas
      setupDrawingCanvas(viewport.width, viewport.height);
      
      // Restore strokes for this page
      redrawStrokes();
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }, [pdfDoc, page, zoom]);

  // Setup drawing canvas
  const setupDrawingCanvas = (width: number, height: number) => {
    if (!drawCanvasRef.current) return;
    
    const canvas = drawCanvasRef.current;
    canvas.width = width;
    canvas.height = height;
    setCanvasSize({ width, height });
    
    // Set canvas style for smooth drawing
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  // Get color for tool
  const getToolColor = () => {
    switch (tool) {
      case 'green_pen':
        return '#10b981';
      case 'red_pen':
        return '#ef4444';
      case 'yellow_highlight':
        return 'rgba(250, 204, 21, 0.4)';
      default:
        return '#000000';
    }
  };

  // Get stroke width for tool
  const getToolWidth = () => {
    if (tool === 'yellow_highlight') {
      return strokeWidth * 4;
    }
    return strokeWidth;
  };

  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'eraser') return;
    
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);
  };

  // Draw on canvas
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'eraser') return;
    
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    
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
    ctx.beginPath();
    
    if (currentStroke.length > 0) {
      ctx.moveTo(currentStroke[currentStroke.length - 1].x, currentStroke[currentStroke.length - 1].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  // End drawing
  const endDrawing = () => {
    if (!isDrawing) return;
    
    if (currentStroke.length > 1) {
      // Save the stroke
      const strokes = pageStrokes.get(page) || [];
      const newStroke: Stroke = {
        points: currentStroke,
        color: getToolColor(),
        width: getToolWidth(),
        tool: tool || 'green_pen',
      };
      
      const updatedStrokes = [...strokes, newStroke];
      pageStrokes.set(page, updatedStrokes);
      setPageStrokes(new Map(pageStrokes));
    }
    
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  // Redraw all strokes for current page
  const redrawStrokes = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get strokes for current page
    const strokes = pageStrokes.get(page) || [];
    
    // Redraw each stroke
    strokes.forEach(stroke => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      
      stroke.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      ctx.stroke();
    });
  };

  // Handle eraser
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'eraser') return;
    
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Find and remove stroke near click point
    const strokes = pageStrokes.get(page) || [];
    const threshold = 10; // pixels
    
    const filteredStrokes = strokes.filter(stroke => {
      return !stroke.points.some(point => 
        Math.abs(point.x - x) < threshold && Math.abs(point.y - y) < threshold
      );
    });
    
    if (filteredStrokes.length < strokes.length) {
      pageStrokes.set(page, filteredStrokes);
      setPageStrokes(new Map(pageStrokes));
      redrawStrokes();
    }
  };

  // Clear page
  const clearPage = () => {
    if (confirm('Clear all annotations on this page?')) {
      pageStrokes.set(page, []);
      setPageStrokes(new Map(pageStrokes));
      redrawStrokes();
    }
  };

  // Navigation
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Effects
  useEffect(() => {
    renderPage();
  }, [renderPage]);

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
        case 'arrowleft':
          e.preventDefault();
          if (page > 1) goToPage(page - 1);
          break;
        case 'arrowright':
          e.preventDefault();
          if (page < totalPages) goToPage(page + 1);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, totalPages]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-200 rounded-full animate-pulse"></div>
            <div className="w-20 h-20 border-4 border-emerald-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
          </div>
          <p className="mt-4 text-gray-700 font-medium">Loading Quran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Logo/Title */}
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Quran Annotation System
                </h1>
                <p className="text-sm text-gray-500">Professional Teaching Platform</p>
              </div>
              
              {/* Page Navigation */}
              <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2 space-x-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="p-2 hover:bg-white rounded-md transition-colors disabled:opacity-30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={page}
                    onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-center border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">/</span>
                  <span className="font-medium">{totalPages}</span>
                </div>
                
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 hover:bg-white rounded-md transition-colors disabled:opacity-30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Right Controls */}
            <div className="flex items-center space-x-4">
              {/* Zoom */}
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  className="p-1 hover:bg-white rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-sm font-medium min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  className="p-1 hover:bg-white rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              
              {/* Clear Button */}
              <button
                onClick={clearPage}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
              >
                Clear Page
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* PDF Viewer Container - Fixed height with scroll */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-6">
        <div 
          className="bg-white rounded-xl shadow-2xl overflow-auto max-h-full max-w-full"
          style={{ 
            maxHeight: 'calc(100vh - 200px)',
            maxWidth: '90%'
          }}
        >
          <div 
            ref={containerRef}
            className="relative"
            style={{ margin: '20px' }}
          >
            {/* PDF Canvas */}
            <canvas
              ref={pdfCanvasRef}
              className="block"
            />
            
            {/* Drawing Canvas Overlay */}
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
              onClick={handleCanvasClick}
            />
          </div>
        </div>
      </div>

      {/* Modern Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Active Tool:</span>{' '}
            <span className="text-gray-800 font-semibold">
              {tool ? tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'None'}
            </span>
            {' • '}
            <span className="font-medium">Width:</span>{' '}
            <span className="text-gray-800 font-semibold">{strokeWidth}px</span>
          </div>
          
          <div className="text-sm text-gray-500">
            Press <kbd className="px-2 py-1 bg-gray-100 rounded">G</kbd> Green •{' '}
            <kbd className="px-2 py-1 bg-gray-100 rounded">R</kbd> Red •{' '}
            <kbd className="px-2 py-1 bg-gray-100 rounded">Y</kbd> Yellow •{' '}
            <kbd className="px-2 py-1 bg-gray-100 rounded">E</kbd> Eraser
          </div>
        </div>
      </footer>
    </div>
  );
}