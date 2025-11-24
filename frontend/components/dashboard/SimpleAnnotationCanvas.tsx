'use client';

import React, { useRef, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

// Canvas fixed dimensions (matches typical Quran page aspect ratio)
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1200;

interface Point {
  x: number;
  y: number;
}

interface Path {
  points: Point[];
  color: string;
  width: number;
  isEraser: boolean;
}

interface AnnotationData {
  version: string;
  canvasWidth: number;
  canvasHeight: number;
  paths: Path[];
}

interface SimpleAnnotationCanvasProps {
  studentId: string;
  teacherId: string;
  pageNumber: number;
  scriptId: string;
  enabled: boolean;
  penColor: string;
  penWidth: number;
  eraserMode: boolean;
  onSave?: () => void;
  onLoad?: () => void;
  onClear?: () => void;
}

export default function SimpleAnnotationCanvas({
  studentId,
  teacherId,
  pageNumber,
  scriptId,
  enabled,
  penColor,
  penWidth,
  eraserMode,
  onSave,
  onLoad,
  onClear
}: SimpleAnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentPath, setCurrentPath] = useState<Path | null>(null);
  const [scriptUuid, setScriptUuid] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get script UUID from code
  useEffect(() => {
    const fetchScriptUuid = async () => {
      console.log('🔎 [SCRIPT LOOKUP] Fetching UUID for code:', scriptId);
      const { data, error } = await supabase
        .from('quran_scripts')
        .select('id')
        .eq('code', scriptId)
        .single();

      if (data && !error) {
        const uuid = (data as any).id;
        console.log('✅ [SCRIPT FOUND] UUID:', uuid);
        setScriptUuid(uuid);
      } else {
        console.error('❌ [SCRIPT ERROR]:', error);
      }
    };

    if (scriptId) {
      fetchScriptUuid();
    }
  }, [scriptId]);

  // Load annotations from database
  useEffect(() => {
    if (scriptUuid && studentId && pageNumber) {
      loadAnnotations();
    }
  }, [studentId, pageNumber, scriptUuid]);

  // Convert event coordinates to canvas pixel coordinates
  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    // rect.width/height are scaled by CSS transform
    // canvas.width/height are actual pixel dimensions
    // Convert from visual space to canvas pixel space
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    return { x, y };
  };

  // Convert canvas pixel coordinates to relative (0-1 range) for storage
  const toRelativeCoordinates = (paths: Path[]): Path[] => {
    return paths.map(path => ({
      ...path,
      points: path.points.map(point => ({
        x: point.x / CANVAS_WIDTH,
        y: point.y / CANVAS_HEIGHT
      }))
    }));
  };

  // Convert relative coordinates (0-1 range) to canvas pixels for rendering
  const toCanvasCoordinates = (paths: Path[]): Path[] => {
    return paths.map(path => ({
      ...path,
      points: path.points.map(point => ({
        x: point.x * CANVAS_WIDTH,
        y: point.y * CANVAS_HEIGHT
      }))
    }));
  };

  // Validate that all coordinates are in 0-1 range
  const validateRelativeCoordinates = (data: AnnotationData): boolean => {
    if (data.version !== '3.0') {
      console.error('❌ Invalid version:', data.version);
      return false;
    }

    for (const path of data.paths) {
      for (const point of path.points) {
        if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
          console.error('❌ Invalid relative coordinate:', point);
          return false;
        }
      }
    }

    return true;
  };

  // Render all paths to canvas
  const renderAllPaths = (pathsToRender: Path[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all non-eraser paths first
    pathsToRender
      .filter(p => !p.isEraser)
      .forEach(path => {
        if (path.points.length < 2) return;

        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over';

        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);

        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }

        ctx.stroke();
      });

    // Apply eraser paths
    pathsToRender
      .filter(p => p.isEraser)
      .forEach(path => {
        if (path.points.length < 2) return;

        ctx.lineWidth = path.width * 3; // Eraser is wider
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'destination-out';

        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);

        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }

        ctx.stroke();
      });
  };

  // Re-render whenever paths change
  useEffect(() => {
    const allPaths = currentPath ? [...paths, currentPath] : paths;
    renderAllPaths(allPaths);
  }, [paths, currentPath]);

  // Load annotations from database
  const loadAnnotations = async () => {
    if (!studentId || !pageNumber || !scriptUuid) return;

    console.log('🔄 [LOADING] Page:', pageNumber, 'Student:', studentId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/pen-annotations/load?studentId=${studentId}&pageNumber=${pageNumber}&scriptId=${scriptUuid}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        console.error('❌ [LOAD ERROR]:', response.status, response.statusText);
        return;
      }

      const result = await response.json();

      if (result.success && result.data.annotations && result.data.annotations.length > 0) {
        const latestAnnotation = result.data.annotations[0];
        if (latestAnnotation.drawing_data) {
          const data = latestAnnotation.drawing_data as AnnotationData;

          // Validate data format
          if (!validateRelativeCoordinates(data)) {
            console.error('❌ Invalid annotation data - skipping load');
            return;
          }

          // Convert relative coordinates to canvas pixels
          const canvasPaths = toCanvasCoordinates(data.paths);
          setPaths(canvasPaths);
          setHasUnsavedChanges(false);

          console.log('✅ [LOADED]', canvasPaths.length, 'paths');
          onLoad?.();
        }
      } else {
        console.log('ℹ️ No annotations to load');
        setPaths([]);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('❌ Error loading annotations:', error);
    }
  };

  // Save annotations to database
  const saveAnnotations = async () => {
    if (!scriptUuid) return;

    console.log('💾 [SAVING] Page:', pageNumber, 'Paths:', paths.length);
    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No auth session');
        setIsSaving(false);
        return;
      }

      // Convert canvas pixel coordinates to relative (0-1 range)
      const relativePaths = toRelativeCoordinates(paths);

      const annotationData: AnnotationData = {
        version: '3.0',
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        paths: relativePaths
      };

      // Validate before saving
      if (!validateRelativeCoordinates(annotationData)) {
        console.error('❌ [SAVE ABORTED] Invalid coordinates detected');
        setIsSaving(false);
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
          drawingData: annotationData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save annotations');
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ [SAVED] Successfully with relative coordinates');
        setHasUnsavedChanges(false);
        onSave?.();
      }
    } catch (error) {
      console.error('❌ Error saving annotations:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete all annotations for this page
  const deleteAnnotations = async () => {
    if (!scriptUuid) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const loadResponse = await fetch(
        `/api/pen-annotations/load?studentId=${studentId}&pageNumber=${pageNumber}&scriptId=${scriptUuid}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      const loadResult = await loadResponse.json();
      if (loadResult.success && loadResult.data.annotations) {
        for (const annotation of loadResult.data.annotations) {
          await fetch(`/api/pen-annotations/delete?id=${annotation.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ Error deleting annotations:', error);
    }
  };

  // Clear canvas
  const clearCanvas = async () => {
    setPaths([]);
    setCurrentPath(null);
    await deleteAnnotations();
    setHasUnsavedChanges(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    onClear?.();
  };

  // Expose functions for external buttons
  useEffect(() => {
    (window as any).__savePenAnnotations = saveAnnotations;
    (window as any).__clearPenAnnotations = clearCanvas;
    (window as any).__penAnnotationsHaveChanges = hasUnsavedChanges && !isSaving;
    (window as any).__penAnnotationsSaving = isSaving;
  }, [hasUnsavedChanges, isSaving, paths]);

  // Auto-save with debouncing
  useEffect(() => {
    if (hasUnsavedChanges && paths.length > 0) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Auto-save after 2 seconds of inactivity
      saveTimeoutRef.current = setTimeout(() => {
        console.log('💾 [AUTO-SAVE] Triggered');
        saveAnnotations();
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, paths]);

  // Drawing event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return;

    e.preventDefault();
    const point = getCanvasCoordinates(e);

    setIsDrawing(true);
    setCurrentPath({
      points: [point],
      color: penColor,
      width: penWidth,
      isEraser: eraserMode
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled || !isDrawing || !currentPath) return;

    e.preventDefault();
    const point = getCanvasCoordinates(e);

    setCurrentPath({
      ...currentPath,
      points: [...currentPath.points, point]
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled || !isDrawing || !currentPath) return;

    e.preventDefault();

    // Add completed path to paths array
    if (currentPath.points.length > 1) {
      setPaths(prev => [...prev, currentPath]);
      setHasUnsavedChanges(true);
    }

    setIsDrawing(false);
    setCurrentPath(null);
  };

  return (
    <div
      className="absolute inset-0 w-full h-full"
      style={{
        pointerEvents: enabled ? 'auto' : 'none',
        zIndex: enabled ? 20 : 10,
        touchAction: 'none', // Prevent touch gestures
        userSelect: 'none'   // Prevent text selection
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp} // End drawing if pointer leaves canvas
        style={{
          width: '100%',
          height: '100%',
          cursor: enabled ? (eraserMode ? 'crosshair' : 'crosshair') : 'default'
        }}
      />

      {/* Save indicator */}
      {isSaving && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Saving...
        </div>
      )}
      {hasUnsavedChanges && !isSaving && (
        <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
          Unsaved changes
        </div>
      )}
    </div>
  );
}
