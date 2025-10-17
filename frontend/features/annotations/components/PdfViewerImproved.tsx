'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useAnnotationStore } from '../state/useAnnotationStore';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface Props {
  pdfUrl: string;
}

export default function PdfViewerImproved({ pdfUrl }: Props) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricInstanceRef = useRef<fabric.Canvas | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAnnotations, setCurrentAnnotations] = useState<Map<number, any>>(new Map());
  
  const { page, setPage, zoom, setZoom, tool, strokeWidth, setTool } = useAnnotationStore();

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        console.log('PDF loaded successfully, pages:', pdf.numPages);
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPdf();
  }, [pdfUrl]);

  // Render PDF page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !pdfCanvasRef.current) return;

    try {
      // Save current annotations before changing page
      if (fabricInstanceRef.current && page > 0) {
        const json = fabricInstanceRef.current.toJSON();
        currentAnnotations.set(page, json);
      }

      const pdfPage = await pdfDoc.getPage(page);
      const viewport = pdfPage.getViewport({ scale: zoom * 1.5 }); // Increase base scale
      
      const canvas = pdfCanvasRef.current;
      const context = canvas.getContext('2d')!;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await pdfPage.render(renderContext).promise;
      
      // Setup or update fabric canvas
      setupFabricCanvas(viewport.width, viewport.height);
      
      // Restore annotations for this page
      if (currentAnnotations.has(page) && fabricInstanceRef.current) {
        fabricInstanceRef.current.loadFromJSON(currentAnnotations.get(page), () => {
          fabricInstanceRef.current?.renderAll();
        });
      }
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }, [pdfDoc, page, zoom]);

  // Setup Fabric canvas
  const setupFabricCanvas = (width: number, height: number) => {
    if (!fabricCanvasRef.current) return;

    if (!fabricInstanceRef.current) {
      // Create new fabric canvas
      fabricInstanceRef.current = new fabric.Canvas(fabricCanvasRef.current, {
        isDrawingMode: true,
        width: width,
        height: height,
        selection: false,
      });
      
      // Set initial brush
      if (fabricInstanceRef.current) {
        const brush = new fabric.PencilBrush(fabricInstanceRef.current);
        fabricInstanceRef.current.freeDrawingBrush = brush;
      }
      
      console.log('Fabric canvas initialized');
    } else {
      // Update dimensions
      fabricInstanceRef.current.setWidth(width);
      fabricInstanceRef.current.setHeight(height);
    }
    
    // Apply current tool settings
    updateBrushSettings();
  };

  // Update brush settings based on selected tool
  const updateBrushSettings = () => {
    if (!fabricInstanceRef.current) return;
    
    const canvas = fabricInstanceRef.current;
    
    if (tool === 'eraser') {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      // Allow selecting and deleting objects
      canvas.on('selection:created', (e) => {
        if (e.selected && e.selected.length > 0) {
          e.selected.forEach(obj => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      });
    } else {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.off('selection:created');
      
      const brush = canvas.freeDrawingBrush;
      if (brush) {
        brush.width = strokeWidth;
        
        switch (tool) {
          case 'green_pen':
            brush.color = '#10b981';
            break;
          case 'red_pen':
            brush.color = '#ef4444';
            break;
          case 'yellow_highlight':
            brush.color = 'rgba(250, 204, 21, 0.4)';
            brush.width = strokeWidth * 3; // Wider for highlight effect
            break;
        }
      }
    }
    
    canvas.renderAll();
  };

  // Update brush when tool or width changes
  useEffect(() => {
    updateBrushSettings();
  }, [tool, strokeWidth]);

  // Render page when PDF loads or page/zoom changes
  useEffect(() => {
    renderPage();
  }, [renderPage]);

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
        case 'arrowleft':
          e.preventDefault();
          if (page > 1) setPage(page - 1);
          break;
        case 'arrowright':
          e.preventDefault();
          if (page < totalPages) setPage(page + 1);
          break;
        case 'delete':
          e.preventDefault();
          if (confirm('Clear all annotations on this page?')) {
            fabricInstanceRef.current?.clear();
          }
          break;
      }
      
      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Redo
          console.log('Redo action');
        } else {
          // Undo - remove last path
          const objects = fabricInstanceRef.current?.getObjects();
          if (objects && objects.length > 0) {
            fabricInstanceRef.current?.remove(objects[objects.length - 1]);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, totalPages, setPage, setTool]);

  // Navigation functions
  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setPage(pageNum);
    }
  };

  const clearPage = () => {
    if (confirm('Clear all annotations on this page?')) {
      fabricInstanceRef.current?.clear();
      currentAnnotations.delete(page);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Quran PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls Bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-wrap gap-3">
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
            <input
              type="number"
              min="1"
              max={totalPages}
              value={page}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 border rounded text-center"
            />
            <span className="text-gray-600">/ {totalPages}</span>
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
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            −
          </button>
          <span className="text-gray-600 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-sm"
          >
            Reset
          </button>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearPage}
          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors"
        >
          🗑️ Clear Page
        </button>
      </div>

      {/* PDF Container with Scrolling */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4" ref={canvasContainerRef}>
        <div className="relative mx-auto" style={{ width: 'fit-content' }}>
          {/* PDF Canvas */}
          <canvas
            ref={pdfCanvasRef}
            className="shadow-lg bg-white"
          />
          
          {/* Fabric Canvas Overlay */}
          <canvas
            ref={fabricCanvasRef}
            className="absolute top-0 left-0"
            style={{ pointerEvents: 'auto' }}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 border-t px-4 py-2 text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <span>
            Tool: <strong className="text-gray-800">{tool ? tool.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'None'}</strong> |
            Width: <strong className="text-gray-800">{strokeWidth}px</strong>
          </span>
          <span>
            Shortcuts: G (green) • R (red) • Y (yellow) • E (eraser) • Delete (clear) • ← → (navigate)
          </span>
        </div>
      </div>
    </div>
  );
}