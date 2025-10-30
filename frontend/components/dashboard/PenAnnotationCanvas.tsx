'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pen, Eraser, Save, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PenPath {
  points: { x: number; y: number }[]; // Percentage-based coordinates (0-100)
  color: string;
  width: number;
}

interface PenAnnotationCanvasProps {
  studentId: string;
  teacherId: string;
  pageNumber: number;
  scriptId: string;
  zoomLevel: number;
  enabled: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  onSave?: () => void;
  onLoad?: () => void;
  // External control props (controls now in sidebar)
  penColor: string;
  setPenColor: (color: string) => void;
  penWidth: number;
  setPenWidth: (width: number) => void;
  eraserMode: boolean;
  setEraserMode: (mode: boolean) => void;
  onClear?: () => void;
}

export default function PenAnnotationCanvas({
  studentId,
  teacherId,
  pageNumber,
  scriptId,
  zoomLevel,
  enabled,
  containerRef,
  onSave,
  onLoad,
  penColor,
  setPenColor,
  penWidth,
  setPenWidth,
  eraserMode,
  setEraserMode,
  onClear
}: PenAnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<PenPath[]>([]);
  const [currentPath, setCurrentPath] = useState<PenPath | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [scriptUuid, setScriptUuid] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Look up script UUID from code on mount
  useEffect(() => {
    const fetchScriptUuid = async () => {
      try {
        const { data, error } = await supabase
          .from('quran_scripts')
          .select('id')
          .eq('code', scriptId)
          .single();

        if (error) {
          console.error('Error fetching script UUID:', error);
          return;
        }

        if (data) {
          setScriptUuid(data.id);
        }
      } catch (error) {
        console.error('Error fetching script UUID:', error);
      }
    };

    if (scriptId) {
      fetchScriptUuid();
    }
  }, [scriptId]);

  // Load existing annotations on mount or page change
  useEffect(() => {
    if (scriptUuid) {
      loadAnnotations();
    }
  }, [studentId, pageNumber, scriptUuid]);

  // Update canvas size when container changes
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef?.current || canvas?.parentElement;

      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      setContainerDimensions({ width: rect.width, height: rect.height });

      // Set canvas size to match container
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Redraw after resize
      redrawCanvas();
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Observe container size changes
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    const container = containerRef?.current || canvasRef.current?.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      resizeObserver.disconnect();
    };
  }, [containerRef, paths]);

  // Convert absolute coordinates to percentage-based
  const toPercentage = (x: number, y: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    return {
      x: (x / canvas.width) * 100,
      y: (y / canvas.height) * 100
    };
  };

  // Convert percentage-based coordinates to absolute
  const toAbsolute = (x: number, y: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    return {
      x: (x / 100) * canvas.width,
      y: (y / 100) * canvas.height
    };
  };

  // Get mouse/touch position relative to canvas
  const getPosition = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!enabled || !canvasRef.current) return;

    const pos = getPosition(e);
    const percentPos = toPercentage(pos.x, pos.y);

    // Start drawing (pen or eraser - both work the same way)
    setIsDrawing(true);
    const newPath: PenPath = {
      points: [percentPos],
      color: eraserMode ? 'eraser' : penColor, // Special 'eraser' color marker
      width: eraserMode ? penWidth * 3 : penWidth // Eraser is wider
    };
    setCurrentPath(newPath);
  }, [enabled, eraserMode, penColor, penWidth]);

  // Continue drawing
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!isDrawing || !currentPath || !canvasRef.current) return;

    const pos = getPosition(e);
    const percentPos = toPercentage(pos.x, pos.y);

    // Add point to current path
    const updatedPath = {
      ...currentPath,
      points: [...currentPath.points, percentPos]
    };
    setCurrentPath(updatedPath);

    // Draw on canvas immediately for visual feedback
    const ctx = canvasRef.current.getContext('2d');
    if (ctx && currentPath.points.length > 0) {
      const lastPoint = currentPath.points[currentPath.points.length - 1];
      const lastAbs = toAbsolute(lastPoint.x, lastPoint.y);

      // Set composite operation for eraser
      if (currentPath.color === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.beginPath();
      ctx.moveTo(lastAbs.x, lastAbs.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = currentPath.color === 'eraser' ? 'rgba(0,0,0,1)' : currentPath.color;
      ctx.lineWidth = currentPath.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Reset to normal
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [isDrawing, currentPath]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (isDrawing && currentPath) {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath(null);
      setHasUnsavedChanges(true); // Mark as having unsaved changes
    }
    setIsDrawing(false);
  }, [isDrawing, currentPath]);

  // Redraw all paths on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // DEBUG: Log what we're redrawing
    const eraserPaths = paths.filter(p => p.color === 'eraser');
    if (eraserPaths.length > 0) {
      console.log('🎨 REDRAWING with', eraserPaths.length, 'eraser paths');
    }

    // Redraw all paths
    paths.forEach((path, pathIndex) => {
      if (path.points.length < 2) return;

      // Set composite operation for eraser paths
      if (path.color === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        console.log(`  Eraser path #${pathIndex} with ${path.points.length} points, width ${path.width}`);
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.beginPath();
      ctx.strokeStyle = path.color === 'eraser' ? 'rgba(0,0,0,1)' : path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      path.points.forEach((point, index) => {
        const absPoint = toAbsolute(point.x, point.y);
        if (index === 0) {
          ctx.moveTo(absPoint.x, absPoint.y);
        } else {
          ctx.lineTo(absPoint.x, absPoint.y);
        }
      });

      ctx.stroke();
    });

    // Reset to normal
    ctx.globalCompositeOperation = 'source-over';

    // Draw current path if drawing
    if (currentPath && currentPath.points.length > 0) {
      // Set composite operation for eraser
      if (currentPath.color === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      }

      ctx.beginPath();
      ctx.strokeStyle = currentPath.color === 'eraser' ? 'rgba(0,0,0,1)' : currentPath.color;
      ctx.lineWidth = currentPath.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      currentPath.points.forEach((point, index) => {
        const absPoint = toAbsolute(point.x, point.y);
        if (index === 0) {
          ctx.moveTo(absPoint.x, absPoint.y);
        } else {
          ctx.lineTo(absPoint.x, absPoint.y);
        }
      });

      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [paths, currentPath]);

  // Redraw when paths change
  useEffect(() => {
    redrawCanvas();
  }, [paths, currentPath, redrawCanvas]);

  // Load annotations from database
  const loadAnnotations = async () => {
    if (!studentId || !pageNumber || !scriptUuid) return;

    setIsLoading(true);
    try {
      // Get the auth session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No auth session found');
        return;
      }

      const response = await fetch(
        `/api/pen-annotations/load?studentId=${studentId}&pageNumber=${pageNumber}&scriptId=${scriptUuid}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load annotations');
      }

      const result = await response.json();
      if (result.success && result.data.combinedPaths) {
        // DEBUG: Log what we loaded
        const loadedEraserPaths = result.data.combinedPaths.filter((p: any) => p.color === 'eraser');
        const loadedRegularPaths = result.data.combinedPaths.filter((p: any) => p.color !== 'eraser');
        console.log('📂 LOADED:', {
          total: result.data.combinedPaths.length,
          regular: loadedRegularPaths.length,
          eraser: loadedEraserPaths.length,
          eraserColors: loadedEraserPaths.map((p: any) => p.color)
        });

        setPaths(result.data.combinedPaths);
        onLoad?.();
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save annotations to database
  const saveAnnotations = async () => {
    if (paths.length === 0) {
      console.log('No annotations to save');
      return;
    }

    if (!scriptUuid) {
      console.error('Script UUID not loaded yet');
      return;
    }

    // DEBUG: Log what we're saving
    const eraserPaths = paths.filter(p => p.color === 'eraser');
    const regularPaths = paths.filter(p => p.color !== 'eraser');
    console.log('💾 SAVING:', {
      total: paths.length,
      regular: regularPaths.length,
      eraser: eraserPaths.length,
      eraserColors: eraserPaths.map(p => p.color)
    });

    setIsSaving(true);
    try {
      // Get the auth session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No auth session found');
        return;
      }

      const response = await fetch('/api/pen-annotations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          studentId,
          teacherId,
          pageNumber,
          scriptId: scriptUuid,
          paths,
          containerDimensions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save annotations');
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ Annotations saved successfully');
        setHasUnsavedChanges(false); // Clear unsaved changes flag
        onSave?.();
      }
    } catch (error) {
      console.error('❌ Error saving annotations:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete annotations from database
  const deleteAnnotations = async () => {
    if (!studentId || !pageNumber || !scriptUuid) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No auth session found');
        return;
      }

      // Get the annotation ID first
      const loadResponse = await fetch(
        `/api/pen-annotations/load?studentId=${studentId}&pageNumber=${pageNumber}&scriptId=${scriptUuid}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!loadResponse.ok) return;

      const loadResult = await loadResponse.json();
      if (loadResult.success && loadResult.data.annotations && loadResult.data.annotations.length > 0) {
        // Delete each annotation
        for (const annotation of loadResult.data.annotations) {
          await fetch(`/api/pen-annotations/delete?id=${annotation.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
        }
      }

      console.log('✅ Annotations deleted from database');
    } catch (error) {
      console.error('❌ Error deleting annotations:', error);
    }
  };

  // Clear all drawings (exposed to parent via onClear)
  const clearDrawings = async () => {
    setPaths([]);
    setCurrentPath(null);
    setHasUnsavedChanges(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    // Delete from database
    await deleteAnnotations();
  };

  // Expose clear function to parent
  React.useEffect(() => {
    if (onClear) {
      (window as any).__clearPenAnnotations = clearDrawings;
    }
  }, [onClear]);

  // Add event listeners for drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => draw(e);
    const handleMouseUp = () => stopDrawing();
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      draw(e);
    };
    const handleTouchEnd = () => stopDrawing();

    // Add global listeners for mouse/touch move and up
    if (isDrawing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawing, draw, stopDrawing]);

  // Expose save function for external button
  React.useEffect(() => {
    (window as any).__savePenAnnotations = saveAnnotations;
    (window as any).__penAnnotationsHaveChanges = hasUnsavedChanges && !isSaving;
    (window as any).__penAnnotationsSaving = isSaving;
  }, [hasUnsavedChanges, isSaving]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${
        enabled ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      style={{
        zIndex: enabled ? 20 : 10,
        cursor: enabled ? (eraserMode ? 'crosshair' : 'default') : 'default'
        // NO CSS transform - percentage-based coordinates handle all zoom (browser + app)
      }}
      onMouseDown={startDrawing}
      onTouchStart={startDrawing}
    />
  );
}