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
  onLoad
}: PenAnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<PenPath[]>([]);
  const [currentPath, setCurrentPath] = useState<PenPath | null>(null);
  const [eraserMode, setEraserMode] = useState(false);
  const [penColor, setPenColor] = useState('#FF0000');
  const [penWidth, setPenWidth] = useState(2);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Load existing annotations on mount or page change
  useEffect(() => {
    loadAnnotations();
  }, [studentId, pageNumber, scriptId]);

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
    const scale = zoomLevel / 100;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) / scale,
        y: (e.touches[0].clientY - rect.top) / scale
      };
    } else {
      return {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale
      };
    }
  };

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!enabled || !canvasRef.current) return;

    const pos = getPosition(e);
    const percentPos = toPercentage(pos.x, pos.y);

    if (eraserMode) {
      // Eraser mode - remove paths near the click point
      const eraserRadius = 10; // pixels
      setPaths(prevPaths =>
        prevPaths.filter(path => {
          // Check if any point in the path is within eraser radius
          return !path.points.some(point => {
            const absPoint = toAbsolute(point.x, point.y);
            const distance = Math.sqrt(
              Math.pow(absPoint.x - pos.x, 2) +
              Math.pow(absPoint.y - pos.y, 2)
            );
            return distance < eraserRadius;
          });
        })
      );
    } else {
      // Drawing mode
      setIsDrawing(true);
      const newPath: PenPath = {
        points: [percentPos],
        color: penColor,
        width: penWidth
      };
      setCurrentPath(newPath);
    }
  }, [enabled, eraserMode, penColor, penWidth, zoomLevel]);

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

      ctx.beginPath();
      ctx.moveTo(lastAbs.x, lastAbs.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = currentPath.color;
      ctx.lineWidth = currentPath.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }, [isDrawing, currentPath]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (isDrawing && currentPath) {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath(null);
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

    // Redraw all paths
    paths.forEach(path => {
      if (path.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = path.color;
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

    // Draw current path if drawing
    if (currentPath && currentPath.points.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = currentPath.color;
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
    }
  }, [paths, currentPath]);

  // Redraw when paths change or zoom changes
  useEffect(() => {
    redrawCanvas();
  }, [paths, currentPath, zoomLevel, redrawCanvas]);

  // Load annotations from database
  const loadAnnotations = async () => {
    if (!studentId || !pageNumber || !scriptId) return;

    setIsLoading(true);
    try {
      // Get the auth session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No auth session found');
        return;
      }

      const response = await fetch(
        `/api/pen-annotations/load?studentId=${studentId}&pageNumber=${pageNumber}&scriptId=${scriptId}`,
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
          scriptId,
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
        onSave?.();
      }
    } catch (error) {
      console.error('❌ Error saving annotations:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Clear all drawings
  const clearDrawings = () => {
    setPaths([]);
    setCurrentPath(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

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

  return (
    <>
      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${
          enabled ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{
          zIndex: enabled ? 20 : 10,
          cursor: enabled ? (eraserMode ? 'crosshair' : 'default') : 'default'
        }}
        onMouseDown={startDrawing}
        onTouchStart={startDrawing}
      />

      {/* Pen controls */}
      {enabled && (
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
          {/* Color picker */}
          <div className="flex gap-1">
            {['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#000000'].map(color => (
              <button
                key={color}
                className={`w-8 h-8 rounded ${penColor === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  setPenColor(color);
                  setEraserMode(false);
                }}
              />
            ))}
          </div>

          {/* Width selector */}
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-600">Width:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={penWidth}
              onChange={(e) => setPenWidth(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-xs text-gray-600 w-4">{penWidth}</span>
          </div>

          {/* Tool buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => setEraserMode(!eraserMode)}
              className={`p-2 rounded ${eraserMode ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              onClick={clearDrawings}
              className="p-2 rounded hover:bg-gray-100"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={saveAnnotations}
              disabled={isSaving || paths.length === 0}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
              title="Save annotations"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Status indicators */}
          {isLoading && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              Loading...
            </div>
          )}
          {paths.length > 0 && !isSaving && (
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <AlertCircle className="w-3 h-3" />
              Unsaved changes
            </div>
          )}
        </div>
      )}
    </>
  );
}