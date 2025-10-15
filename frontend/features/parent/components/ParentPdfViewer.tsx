'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useParentStore } from '../state/useParentStore';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface Props {
  pdfUrl: string;
  studentId: string;
}

export default function ParentPdfViewer({ pdfUrl, studentId }: Props) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [visiblePages, setVisiblePages] = useState(new Set<number>());
  const [currentPage, setCurrentPage] = useState(1);
  const [teacherAnnotations, setTeacherAnnotations] = useState<any[]>([]);

  const scrollViewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Load PDF
  useEffect(() => {
    (async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        
        // Load first few pages
        setVisiblePages(new Set([1, 2, 3]));
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    })();
  }, [pdfUrl]);

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page') || '0');
            setVisiblePages(prev => {
              const newSet = new Set(prev);
              newSet.add(pageNum);
              // Pre-load adjacent pages
              if (pageNum > 1) newSet.add(pageNum - 1);
              if (pageNum < totalPages) newSet.add(pageNum + 1);
              return newSet;
            });
            
            // Update current page
            if (entry.intersectionRatio > 0.5) {
              setCurrentPage(pageNum);
            }
          }
        });
      },
      { 
        root: scrollViewRef.current, 
        rootMargin: '100px',
        threshold: [0, 0.5, 1]
      }
    );
    
    // Observe all page containers
    const pageContainers = containerRef.current.querySelectorAll('.page-container');
    pageContainers.forEach(container => {
      observerRef.current?.observe(container);
    });
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [totalPages, setCurrentPage]);

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => {
      const newZoom = Math.max(0.5, Math.min(3, prev + delta));
      
      // Apply zoom with CSS transform
      const wrapper = containerRef.current?.querySelector('.pdf-wrapper');
      if (wrapper) {
        (wrapper as HTMLElement).style.transform = `scale(${newZoom})`;
        (wrapper as HTMLElement).style.transformOrigin = 'top center';
      }
      
      return newZoom;
    });
  }, []);

  // Navigate to page
  const goToPage = (pageNum: number) => {
    const element = document.querySelector(`[data-page="${pageNum}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => goToPage(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go to first page"
          >
            <Home className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => currentPage > 1 && goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="text-sm font-medium px-3">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => currentPage < totalPages && goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <span className="text-sm font-medium px-2">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={() => handleZoom(0.1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* PDF Container */}
      <div 
        ref={scrollViewRef}
        className="flex-1 overflow-auto"
      >
        <div ref={containerRef} className="flex flex-col items-center py-4">
          <div className="pdf-wrapper">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <div
                key={pageNum}
                data-page={pageNum}
                className="page-container mb-4"
                style={{ minHeight: '800px' }}
              >
                {visiblePages.has(pageNum) && pdfDoc && (
                  <PageCanvas 
                    pdfDoc={pdfDoc} 
                    pageNumber={pageNum}
                    annotations={teacherAnnotations.filter(a => a.pageNumber === pageNum)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual page component
function PageCanvas({ 
  pdfDoc, 
  pageNumber,
  annotations 
}: { 
  pdfDoc: any; 
  pageNumber: number;
  annotations: any[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    (async () => {
      if (!pdfDoc || !canvasRef.current) return;
      
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d')!;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Draw teacher annotations
      if (annotationCanvasRef.current && annotations.length > 0) {
        const annotCanvas = annotationCanvasRef.current;
        const annotCtx = annotCanvas.getContext('2d')!;
        
        annotCanvas.width = viewport.width;
        annotCanvas.height = viewport.height;
        
        // Draw each annotation
        annotations.forEach(annotation => {
          const color = 
            annotation.toolType === 'green_pen' ? '#10b981' :
            annotation.toolType === 'red_pen' ? '#ef4444' :
            'rgba(250, 204, 21, 0.3)';
          
          annotCtx.strokeStyle = color;
          annotCtx.lineWidth = 3;
          annotCtx.lineCap = 'round';
          annotCtx.lineJoin = 'round';
          
          if (annotation.toolType === 'yellow_highlight') {
            annotCtx.globalCompositeOperation = 'multiply';
            annotCtx.globalAlpha = 0.3;
            annotCtx.lineWidth = 20;
          }
          
          // Draw strokes
          annotation.strokes.forEach((stroke: any) => {
            if (stroke.points && stroke.points.length > 0) {
              annotCtx.beginPath();
              annotCtx.moveTo(
                stroke.points[0].x * viewport.width,
                stroke.points[0].y * viewport.height
              );
              
              stroke.points.forEach((point: any) => {
                annotCtx.lineTo(
                  point.x * viewport.width,
                  point.y * viewport.height
                );
              });
              
              annotCtx.stroke();
            }
          });
          
          // Reset composite operation
          annotCtx.globalCompositeOperation = 'source-over';
          annotCtx.globalAlpha = 1;
        });
      }
    })();
  }, [pdfDoc, pageNumber, annotations]);
  
  return (
    <div className="relative bg-white shadow-lg">
      <canvas ref={canvasRef} className="block" />
      <canvas 
        ref={annotationCanvasRef} 
        className="absolute inset-0 pointer-events-none"
        style={{ mixBlendMode: 'multiply' }}
      />
    </div>
  );
}