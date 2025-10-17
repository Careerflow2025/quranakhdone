'use client';
import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useAnnotationStore } from '../state/useAnnotationStore';

// We'll load PDF.js dynamically to avoid SSR issues
let pdfjsLib: any = null;
let pdfjsWorker: any = null;

interface Props {
  pdfUrl: string;
}

export default function QuranAnnotator({ pdfUrl }: Props) {
  // Refs for canvases
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  
  // State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pageAnnotations] = useState<Map<number, any>>(new Map());
  
  // Store
  const { page, setPage, zoom, setZoom, tool, strokeWidth, setTool } = useAnnotationStore();

  // Initialize PDF.js
  useEffect(() => {
    const initPdfJs = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Dynamic import to avoid SSR issues
        const pdfjs = await import('pdfjs-dist');
        pdfjsLib = pdfjs;
        
        // Set worker to public file
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        
        console.log('PDF.js initialized successfully');
        
        // Now load the PDF
        loadPdf();
      } catch (error) {
        console.error('Failed to initialize PDF.js:', error);
      }
    };
    
    initPdfJs();
  }, []);

  // Load PDF document
  const loadPdf = async () => {
    if (!pdfjsLib) return;
    
    try {
      setIsLoading(true);
      console.log('Loading PDF from:', pdfUrl);
      
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      console.log(`PDF loaded: ${pdf.numPages} pages`);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
    }
  };

  // Render PDF page
  const renderPage = async () => {
    if (!pdfDoc || !pdfCanvasRef.current) return;
    
    try {
      console.log(`Rendering page ${page}`);
      
      // Get the page
      const pdfPage = await pdfDoc.getPage(page);
      const viewport = pdfPage.getViewport({ scale: zoom * 1.5 });
      
      // Setup canvas
      const canvas = pdfCanvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render PDF page
      await pdfPage.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      console.log(`Page ${page} rendered`);
      
      // Setup or update Fabric canvas
      setupFabricCanvas(viewport.width, viewport.height);
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  // Setup Fabric.js canvas for annotations
  const setupFabricCanvas = (width: number, height: number) => {
    const container = containerRef.current;
    if (!container) return;
    
    // Save current annotations before changing
    if (fabricRef.current) {
      const json = fabricRef.current.toJSON();
      pageAnnotations.set(page, json);
    }
    
    // Check if we need to create a new fabric canvas
    let fabricCanvas = document.getElementById('fabric-canvas') as HTMLCanvasElement;
    
    if (!fabricCanvas) {
      // Create canvas element
      fabricCanvas = document.createElement('canvas');
      fabricCanvas.id = 'fabric-canvas';
      fabricCanvas.style.position = 'absolute';
      fabricCanvas.style.top = '0';
      fabricCanvas.style.left = '0';
      fabricCanvas.style.pointerEvents = 'auto';
      fabricCanvas.style.cursor = 'crosshair';
      container.appendChild(fabricCanvas);
      console.log('Created fabric canvas element');
    }
    
    // Initialize or update Fabric instance
    if (!fabricRef.current) {
      fabricRef.current = new fabric.Canvas('fabric-canvas', {
        isDrawingMode: true,
        width: width,
        height: height,
        selection: false,
        backgroundColor: 'transparent',
      });
      
      // Set up pencil brush for smooth drawing
      if (fabricRef.current) {
        const brush = new fabric.PencilBrush(fabricRef.current);
        fabricRef.current.freeDrawingBrush = brush;
      }
      
      console.log('Fabric.js canvas initialized');

      // Add event listeners
      if (fabricRef.current) {
        fabricRef.current.on('path:created', (e) => {
          console.log('Path created');
        });
      }
    } else {
      // Update dimensions
      if (fabricRef.current) {
        fabricRef.current.setWidth(width);
        fabricRef.current.setHeight(height);
      }
      fabricCanvas.width = width;
      fabricCanvas.height = height;
    }

    // Apply tool settings
    applyToolSettings();

    // Restore annotations for this page if they exist
    if (pageAnnotations.has(page) && fabricRef.current) {
      fabricRef.current.loadFromJSON(pageAnnotations.get(page), () => {
        fabricRef.current?.renderAll();
        console.log(`Restored annotations for page ${page}`);
      });
    } else if (fabricRef.current) {
      fabricRef.current.clear();
    }
  };

  // Apply tool settings to Fabric canvas
  const applyToolSettings = () => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    
    if (tool === 'eraser') {
      // Eraser mode - allow selection and deletion
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
      });
      
      // Listen for delete key
      const deleteHandler = (e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const activeObject = canvas.getActiveObject();
          if (activeObject) {
            canvas.remove(activeObject);
            canvas.discardActiveObject();
            canvas.renderAll();
          }
        }
      };
      window.addEventListener('keydown', deleteHandler);
      
      // Store handler for cleanup
      (canvas as any)._deleteHandler = deleteHandler;
    } else {
      // Drawing mode
      canvas.isDrawingMode = true;
      canvas.selection = false;
      
      // Remove delete handler if exists
      if ((canvas as any)._deleteHandler) {
        window.removeEventListener('keydown', (canvas as any)._deleteHandler);
        delete (canvas as any)._deleteHandler;
      }
      
      // Configure brush
      const brush = canvas.freeDrawingBrush;
      if (brush) {
        brush.width = tool === 'yellow_highlight' ? strokeWidth * 3 : strokeWidth;
        
        switch (tool) {
          case 'green_pen':
            brush.color = '#10b981';
            break;
          case 'red_pen':
            brush.color = '#ef4444';
            break;
          case 'yellow_highlight':
            brush.color = 'rgba(250, 204, 21, 0.5)';
            break;
        }
      }
    }
    
    canvas.renderAll();
    console.log(`Applied tool: ${tool}, width: ${strokeWidth}`);
  };

  // Effect: Render page when PDF or page/zoom changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [pdfDoc, page, zoom]);

  // Effect: Apply tool settings when they change
  useEffect(() => {
    applyToolSettings();
  }, [tool, strokeWidth]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
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
          if (page > 1) setPage(page - 1);
          break;
        case 'arrowright':
          e.preventDefault();
          if (page < totalPages) setPage(page + 1);
          break;
      }
      
      // Undo with Ctrl/Cmd+Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (fabricRef.current) {
          const objects = fabricRef.current.getObjects();
          if (objects.length > 0) {
            fabricRef.current.remove(objects[objects.length - 1]);
            fabricRef.current.renderAll();
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, totalPages, setPage, setTool]);

  // Navigation functions
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      // Save current page annotations
      if (fabricRef.current) {
        const json = fabricRef.current.toJSON();
        pageAnnotations.set(page, json);
      }
      setPage(newPage);
    }
  };

  const clearPage = () => {
    if (confirm('Clear all annotations on this page?')) {
      fabricRef.current?.clear();
      pageAnnotations.delete(page);
      console.log(`Cleared annotations for page ${page}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Quran PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Controls */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-wrap gap-3 shadow-sm">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Page</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={page}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-20 px-2 py-1 border rounded-md text-center"
            />
            <span className="text-sm text-gray-600">of {totalPages}</span>
          </div>
          
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Zoom:</span>
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            −
          </button>
          <span className="text-sm font-medium min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            +
          </button>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearPage}
          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors font-medium"
        >
          Clear Page
        </button>
      </div>

      {/* PDF Viewer Container */}
      <div className="flex-1 overflow-auto p-4">
        <div 
          ref={containerRef}
          className="relative mx-auto bg-white shadow-lg"
          style={{ width: 'fit-content' }}
        >
          {/* PDF Canvas */}
          <canvas
            ref={pdfCanvasRef}
            className="block"
          />
          {/* Fabric canvas will be appended here dynamically */}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-white border-t px-4 py-2">
        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-600">
            Current Tool: <span className="font-medium text-gray-800">
              {tool ? tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'None'}
            </span>
            {' • '}
            Stroke Width: <span className="font-medium text-gray-800">{strokeWidth}px</span>
          </div>
          <div className="text-gray-500">
            Shortcuts: G (green) • R (red) • Y (yellow) • E (eraser) • ← → (navigate)
          </div>
        </div>
      </div>
    </div>
  );
}