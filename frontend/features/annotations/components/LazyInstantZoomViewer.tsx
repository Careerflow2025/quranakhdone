'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAnnotationStore } from '../state/useAnnotationStore';
import NotesSystem from '@/features/notes/components/NotesSystem';

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

interface PageInfo {
  width: number;
  height: number;
  rendered: boolean;
}

export default function LazyInstantZoomViewer({ pdfUrl, studentId = 'demo' }: Props) {
  // State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [allStrokes, setAllStrokes] = useState<Stroke[]>([]);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInfos, setPageInfos] = useState<Map<number, PageInfo>>(new Map());
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const drawingStateRef = useRef({ isDrawing: false, currentStroke: [] as Point[], currentPage: 1 });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  
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
      
      console.log('🚀 Lazy loading PDF viewer initialized');
      loadPdf();
    };
    
    initPdf();
  }, [pdfUrl]);

  // Load PDF document
  const loadPdf = async () => {
    if (!pdfjsLib) return;
    
    try {
      setIsLoading(true);
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      
      // Get dimensions for all pages (fast, doesn't render)
      await initializePageDimensions(pdf);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
    }
  };

  // Initialize page dimensions without rendering
  const initializePageDimensions = async (pdf: any) => {
    const infos = new Map<number, PageInfo>();
    
    // Just get dimensions, don't render yet
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      // Ultra high quality: 8x resolution for crystal clear text
      const devicePixelRatio = window.devicePixelRatio || 1;
      const baseScale = 8; // Maximum resolution for perfect clarity
      const scale = baseScale;
      const viewport = page.getViewport({ scale: scale });
      infos.set(pageNum, {
        width: viewport.width,
        height: viewport.height,
        rendered: false
      });
    }
    
    setPageInfos(infos);
    
    // Create page placeholders
    createPagePlaceholders(infos);
    
    // Start observing for lazy loading
    setupIntersectionObserver();
  };

  // Create placeholders for all pages
  const createPagePlaceholders = (infos: Map<number, PageInfo>) => {
    if (!containerRef.current) return;
    
    // Clear container
    containerRef.current.innerHTML = '';
    pageRefs.current.clear();
    
    // Create wrapper with zoom support
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-wrapper';
    wrapper.style.transformOrigin = 'top center';
    wrapper.style.transform = `scale(1)`; // Start at scale 1, will be updated by useEffect
    wrapper.style.transition = 'transform 0.2s ease';
    wrapper.style.width = 'fit-content';
    wrapper.style.margin = '0 auto';
    containerRef.current.appendChild(wrapper);
    
    // Create placeholder for each page
    for (let pageNum = 1; pageNum <= infos.size; pageNum++) {
      const info = infos.get(pageNum);
      if (!info) continue;
      
      // Page container (scale down visually from 8x ultra-high resolution)
      const pageDiv = document.createElement('div');
      pageDiv.className = 'pdf-page-placeholder';
      pageDiv.dataset.pageNum = String(pageNum);
      pageDiv.style.position = 'relative';
      pageDiv.style.marginBottom = '20px'; // More spacing for clarity
      // Display at comfortable size while maintaining 8x internal resolution
      const displayWidth = Math.round(info.width / 5); // 8x internal, display at ~1.6x
      const displayHeight = Math.round(info.height / 5);
      pageDiv.style.width = displayWidth + 'px';
      pageDiv.style.height = displayHeight + 'px';
      pageDiv.style.backgroundColor = 'white';
      pageDiv.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; // Enhanced shadow
      pageDiv.style.display = 'flex';
      pageDiv.style.alignItems = 'center';
      pageDiv.style.justifyContent = 'center';
      pageDiv.style.border = '1px solid #e5e7eb'; // Professional border
      
      // Loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'page-loading';
      loadingDiv.style.color = '#9ca3af';
      loadingDiv.style.fontSize = '14px';
      loadingDiv.textContent = `Page ${pageNum}`;
      pageDiv.appendChild(loadingDiv);
      
      wrapper.appendChild(pageDiv);
      pageRefs.current.set(pageNum, pageDiv);
    }
  };

  // Setup intersection observer for lazy loading
  const setupIntersectionObserver = () => {
    if (!scrollViewRef.current) return;
    
    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageNum = parseInt((entry.target as HTMLElement).dataset.pageNum || '0');
            if (pageNum > 0) {
              // Update current page for notes
              setCurrentPage(pageNum);
              
              setVisiblePages(prev => {
                const newSet = new Set(prev);
                newSet.add(pageNum);
                // Also add adjacent pages for smooth scrolling
                if (pageNum > 1) newSet.add(pageNum - 1);
                if (pageNum < totalPages) newSet.add(pageNum + 1);
                return newSet;
              });
            }
          }
        });
      },
      {
        root: scrollViewRef.current,
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0.01
      }
    );
    
    // Observe all page placeholders
    pageRefs.current.forEach(pageDiv => {
      observerRef.current?.observe(pageDiv);
    });
  };

  // Render visible pages
  useEffect(() => {
    if (!pdfDoc) return;
    
    visiblePages.forEach(pageNum => {
      const info = pageInfos.get(pageNum);
      if (info && !info.rendered) {
        renderPage(pageNum);
      }
    });
  }, [visiblePages, pdfDoc, pageInfos]);

  // Render a single page
  const renderPage = async (pageNum: number) => {
    if (!pdfDoc) return;
    
    const pageDiv = pageRefs.current.get(pageNum);
    if (!pageDiv) return;
    
    const info = pageInfos.get(pageNum);
    if (!info || info.rendered) return;
    
    console.log(`📄 Rendering page ${pageNum}`);
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      
      // Ultra high quality: 8x resolution for maximum clarity
      const devicePixelRatio = window.devicePixelRatio || 1;
      const baseScale = 8; // Maximum quality rendering
      const scale = baseScale;
      const viewport = page.getViewport({ scale: scale });
      
      // Clear loading indicator
      pageDiv.innerHTML = '';
      
      // PDF canvas with maximum quality
      const pdfCanvas = document.createElement('canvas');
      pdfCanvas.width = viewport.width;
      pdfCanvas.height = viewport.height;
      pdfCanvas.style.display = 'block';
      pdfCanvas.style.width = '100%';  // Scale down visually while keeping ultra high resolution
      pdfCanvas.style.height = 'auto';
      pdfCanvas.style.imageRendering = 'crisp-edges'; // Crisp rendering
      pdfCanvas.style.imageRendering = '-webkit-optimize-contrast'; // WebKit browsers
      pageDiv.appendChild(pdfCanvas);
      
      // Render PDF with maximum quality settings
      const pdfContext = pdfCanvas.getContext('2d', { 
        alpha: false,
        desynchronized: true,
        willReadFrequently: false 
      });
      
      if (pdfContext) {
        // Maximum quality settings - disable smoothing for sharpest text
        pdfContext.imageSmoothingEnabled = false;
        pdfContext.imageSmoothingQuality = 'high';
        (pdfContext as any).mozImageSmoothingEnabled = false;
        (pdfContext as any).webkitImageSmoothingEnabled = false;
        (pdfContext as any).msImageSmoothingEnabled = false;
        
        // Set maximum quality hints
        if ((pdfContext as any).quality) (pdfContext as any).quality = 'best';
        if ((pdfContext as any).antialias) (pdfContext as any).antialias = 'subpixel';
        
        await page.render({
          canvasContext: pdfContext,
          viewport: viewport,
          intent: 'print',  // Print intent for maximum quality
          enableWebGL: true,  // Enable WebGL acceleration if available
          renderInteractiveForms: false,
          useSystemFonts: true, // Use system fonts for better rendering
        }).promise;
      }
      
      // Drawing canvas overlay (matching high resolution)
      const drawCanvas = document.createElement('canvas');
      drawCanvas.width = viewport.width;
      drawCanvas.height = viewport.height;
      drawCanvas.style.position = 'absolute';
      drawCanvas.style.top = '0';
      drawCanvas.style.left = '0';
      drawCanvas.style.width = '100%';  // Scale to match PDF canvas
      drawCanvas.style.height = '100%';
      drawCanvas.style.pointerEvents = 'auto';
      drawCanvas.className = 'annotation-canvas';
      drawCanvas.dataset.pageNum = String(pageNum);
      
      pageDiv.appendChild(drawCanvas);
      
      // Mark as rendered
      setPageInfos(prev => {
        const newMap = new Map(prev);
        const existingInfo = newMap.get(pageNum);
        if (existingInfo) {
          newMap.set(pageNum, { ...existingInfo, rendered: true });
        }
        return newMap;
      });
      
      // Immediately redraw existing strokes for this page
      const pageStrokes = allStrokes.filter(s => s.pageNumber === pageNum);
      if (pageStrokes.length > 0) {
        const ctx = drawCanvas.getContext('2d');
        if (ctx) {
          pageStrokes.forEach(stroke => {
            ctx.save();
            
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
            
            ctx.restore();
          });
        }
      }
      
    } catch (error) {
      console.error(`Error rendering page ${pageNum}:`, error);
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
    
    console.log(`Starting draw on page ${pageNum} with tool: ${currentTool}`);
    
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

  // Handle click for eraser - INSTANT deletion
  const handleClick = useCallback((e: React.MouseEvent) => {
    const currentTool = toolRef.current;
    if (currentTool !== 'eraser') return;
    
    const target = e.target as HTMLElement;
    if (!target.classList.contains('annotation-canvas')) return;
    
    const canvas = target as HTMLCanvasElement;
    const pageNum = parseInt(canvas.dataset.pageNum || '1');
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Find and remove stroke INSTANTLY
    const threshold = 20;
    const pageStrokes = allStrokes.filter(s => s.pageNumber === pageNum);
    const remainingStrokes: Stroke[] = [];
    let found = false;
    
    // Check each stroke
    for (const stroke of pageStrokes) {
      if (!found && stroke.points.some(point => 
        Math.abs(point.x - x) < threshold && Math.abs(point.y - y) < threshold
      )) {
        found = true; // Skip this stroke (remove it)
      } else {
        remainingStrokes.push(stroke); // Keep this stroke
      }
    }
    
    // If we removed something, update instantly
    if (found) {
      // Clear canvas IMMEDIATELY
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Redraw remaining strokes IMMEDIATELY
      remainingStrokes.forEach(stroke => {
        ctx.save();
        
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
        
        ctx.restore();
      });
      
      // Update state to match what's visually shown
      setAllStrokes(prev => {
        const otherPageStrokes = prev.filter(s => s.pageNumber !== pageNum);
        return [...otherPageStrokes, ...remainingStrokes];
      });
    }
  }, [allStrokes]);

  // Optimized redraw for eraser (immediate)
  const redrawPageOptimized = useCallback((pageNum: number) => {
    const pageDiv = pageRefs.current.get(pageNum);
    if (!pageDiv) return;
    
    const canvas = pageDiv.querySelector('.annotation-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear and redraw immediately
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get strokes for this page from current state
    const pageStrokes = allStrokes.filter(s => s.pageNumber === pageNum);
    
    // Redraw all strokes for this page
    pageStrokes.forEach(stroke => {
      ctx.save();
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.tool === 'yellow_highlight' ? stroke.width * 4 : stroke.width;
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
      
      ctx.restore();
    });
  }, [allStrokes]);

  // Redraw a specific page (for general use)
  const redrawPage = (pageNum: number) => {
    const pageDiv = pageRefs.current.get(pageNum);
    if (!pageDiv) return;
    
    const canvas = pageDiv.querySelector('.annotation-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
  };

  // Only redraw when adding new strokes (not when removing)
  useEffect(() => {
    // Skip redraw on eraser actions - they handle their own redraw
    if (toolRef.current === 'eraser') return;
    
    // Only redraw rendered pages when adding strokes
    pageInfos.forEach((info, pageNum) => {
      if (info.rendered) {
        const pageStrokes = allStrokes.filter(s => s.pageNumber === pageNum);
        if (pageStrokes.length > 0) {
          // Use requestAnimationFrame for smooth updates
          requestAnimationFrame(() => redrawPage(pageNum));
        }
      }
    });
  }, [allStrokes.length]); // Only watch length changes, not content

  // Apply zoom with CSS
  useEffect(() => {
    // Small delay to ensure wrapper exists
    const applyZoom = () => {
      const wrapper = containerRef.current?.querySelector('.pdf-wrapper') as HTMLElement;
      if (wrapper) {
        console.log(`🔍 Applying zoom: ${zoom}`);
        wrapper.style.transform = `scale(${zoom})`;
        wrapper.style.transformOrigin = 'top center';
        wrapper.style.transition = 'transform 0.2s ease';
        
        // Ensure wrapper maintains proper dimensions
        if (zoom !== 1) {
          wrapper.style.width = 'fit-content';
        }
      }
    };
    
    applyZoom();
    // Also apply after a short delay to catch dynamically created wrapper
    const timer = setTimeout(applyZoom, 100);
    
    return () => clearTimeout(timer);
  }, [zoom, pdfDoc]); // Also trigger when PDF loads

  // Clear current page
  const clearCurrentPage = () => {
    const scrollTop = scrollViewRef.current?.scrollTop || 0;
    const firstPageInfo = pageInfos.get(1);
    const pageHeight = (firstPageInfo?.height || 800) * zoom + 10;
    const currentPage = Math.floor(scrollTop / pageHeight) + 1;
    
    if (confirm(`Clear all annotations on page ${currentPage}?`)) {
      setAllStrokes(prev => prev.filter(s => s.pageNumber !== currentPage));
    }
  };

  // Cleanup observer
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
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
      <style jsx global>{`
        /* Maximum quality rendering for PDF canvas */
        .pdf-page-placeholder canvas {
          image-rendering: -webkit-optimize-contrast !important;
          image-rendering: crisp-edges !important;
          image-rendering: pixelated !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          text-rendering: optimizeLegibility !important;
          shape-rendering: crispEdges !important;
        }
        
        /* Ensure container doesn't blur the canvas */
        .pdf-wrapper {
          -webkit-backface-visibility: hidden !important;
          -webkit-transform: translateZ(0) scale(1.0, 1.0) !important;
          transform: translateZ(0) !important;
        }
      `}</style>
      
      {/* Sidebar - Increased width by 15% (from 256px to 295px) */}
      <div className="bg-white shadow-lg flex flex-col" style={{ width: '295px' }}>
        <div className="px-6 py-5 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
          <h2 className="text-xl font-semibold text-gray-800">Student: {studentId}</h2>
        </div>
        <div className="flex-1 overflow-hidden px-5 py-5">
          <NotesSystem studentId={studentId} currentPage={currentPage} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Premium Toolbar */}
        <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 shadow-lg border-b border-gray-200">
          <div className="px-6 py-4">
            {/* Tool Section Label */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Annotation Tools</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Select a tool to mark student recitation</p>
                </div>
              </div>
              <div className="text-xs text-gray-400 font-medium">
                <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></span>
                  Session Active
                </span>
              </div>
            </div>
            
            {/* Main Toolbar Content */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Tool Buttons Group */}
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl">
                  <button
                    className={`relative px-4 py-2.5 rounded-lg font-medium transition-all duration-200 transform ${
                      tool === 'green_pen' 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg scale-105 shadow-emerald-500/25' 
                        : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
                    }`}
                    onClick={() => setTool('green_pen')}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">✅</span>
                      <span className="text-sm font-semibold">Correct</span>
                    </span>
                    {tool === 'green_pen' && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
                    )}
                  </button>
                  <button
                    className={`relative px-4 py-2.5 rounded-lg font-medium transition-all duration-200 transform ${
                      tool === 'red_pen' 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg scale-105 shadow-red-500/25' 
                        : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
                    }`}
                    onClick={() => setTool('red_pen')}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">❌</span>
                      <span className="text-sm font-semibold">Incorrect</span>
                    </span>
                    {tool === 'red_pen' && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></span>
                    )}
                  </button>
                  <button
                    className={`relative px-4 py-2.5 rounded-lg font-medium transition-all duration-200 transform ${
                      tool === 'yellow_highlight' 
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg scale-105 shadow-yellow-500/25' 
                        : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
                    }`}
                    onClick={() => setTool('yellow_highlight')}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">🟨</span>
                      <span className="text-sm font-semibold">Highlight</span>
                    </span>
                    {tool === 'yellow_highlight' && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></span>
                    )}
                  </button>
                  <button
                    className={`relative px-4 py-2.5 rounded-lg font-medium transition-all duration-200 transform ${
                      tool === 'eraser' 
                        ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg scale-105 shadow-gray-700/25' 
                        : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md'
                    }`}
                    onClick={() => setTool('eraser')}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">🗑️</span>
                      <span className="text-sm font-semibold">Eraser</span>
                    </span>
                    {tool === 'eraser' && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-gray-600 rounded-full animate-ping"></span>
                    )}
                  </button>
                </div>
                
                {/* Divider */}
                <div className="h-10 w-px bg-gray-200"></div>
                
                {/* Stroke Width Control */}
                <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stroke</label>
                      <p className="text-[10px] text-gray-400">Width</p>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                      className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="text-sm font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg min-w-[45px] text-center">
                      {strokeWidth}px
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                {/* Clear Page Button */}
                <button
                  onClick={clearCurrentPage}
                  className="px-4 py-2.5 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 text-red-600 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 border border-red-200 hover:shadow-lg hover:shadow-red-500/10"
                >
                  <span className="flex items-center gap-2">
                    <span>🧹</span>
                    <span>Clear Page</span>
                  </span>
                </button>
                
                {/* Zoom Control */}
                <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Zoom</span>
                    <div className="flex items-center bg-gray-50 rounded-lg">
                      <button
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors font-bold text-lg"
                      >
                        −
                      </button>
                      <span className="px-3 py-1.5 text-sm font-bold text-gray-700 bg-white border-x border-gray-200 min-w-[60px] text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
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