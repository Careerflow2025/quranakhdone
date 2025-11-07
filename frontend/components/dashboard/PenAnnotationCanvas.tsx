'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { supabase } from '@/lib/supabase/client';

interface PenAnnotationCanvasProps {
  studentId: string;
  teacherId: string;
  pageNumber: number;
  scriptId: string;
  enabled: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  penColor: string;
  setPenColor: (color: string) => void;
  penWidth: number;
  setPenWidth: (width: number) => void;
  eraserMode: boolean;
  setEraserMode: (mode: boolean) => void;
  onSave?: () => void;
  onLoad?: () => void;
  onClear?: () => void;
}

export default function PenAnnotationCanvas({
  studentId,
  teacherId,
  pageNumber,
  scriptId,
  enabled,
  containerRef,
  penColor,
  setPenColor,
  penWidth,
  setPenWidth,
  eraserMode,
  setEraserMode,
  onSave,
  onLoad,
  onClear
}: PenAnnotationCanvasProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scriptUuid, setScriptUuid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get script UUID from code
  useEffect(() => {
    const fetchScriptUuid = async () => {
      const { data, error } = await supabase
        .from('quran_scripts')
        .select('id')
        .eq('code', scriptId)
        .single();

      if (data && !error) {
        setScriptUuid((data as any).id);
      }
    };

    if (scriptId) {
      fetchScriptUuid();
    }
  }, [scriptId]);

  // CRITICAL: Toggle eraser mode using library's method
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.eraseMode(eraserMode);
    }
  }, [eraserMode]);

  // CRITICAL: Prevent browser zoom on canvas to avoid coordinate drift
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const preventZoom = (e: WheelEvent) => {
      // Prevent Ctrl+scroll zoom (Windows/Linux) and Cmd+scroll (Mac)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const preventGesture = (e: Event) => {
      // Prevent pinch-to-zoom gesture
      e.preventDefault();
    };

    // Add listeners with passive:false to allow preventDefault
    container.addEventListener('wheel', preventZoom, { passive: false });
    container.addEventListener('gesturestart', preventGesture, { passive: false });
    container.addEventListener('gesturechange', preventGesture, { passive: false });

    return () => {
      container.removeEventListener('wheel', preventZoom);
      container.removeEventListener('gesturestart', preventGesture);
      container.removeEventListener('gesturechange', preventGesture);
    };
  }, []);

  // Load annotations from database on mount and when page/script changes
  useEffect(() => {
    if (scriptUuid && studentId && pageNumber) {
      // Wait for canvas to be fully ready before loading
      const checkCanvasReady = setInterval(() => {
        if (canvasRef.current) {
          clearInterval(checkCanvasReady);
          loadAnnotations();
        }
      }, 50);

      // Cleanup if component unmounts
      return () => clearInterval(checkCanvasReady);
    }
  }, [studentId, pageNumber, scriptUuid]);

  // Load annotations from database
  const loadAnnotations = async () => {
    if (!studentId || !pageNumber || !scriptUuid || !canvasRef.current) return;

    console.log('🔄 [LOADING START] Time:', Date.now());
    const startTime = Date.now();
    setIsLoading(true);

    try {
      const sessionStart = Date.now();
      const { data: { session } } = await supabase.auth.getSession();
      console.log('⏱️ [SESSION] Took:', Date.now() - sessionStart, 'ms');

      if (!session) {
        setIsLoading(false);
        return;
      }

      const fetchStart = Date.now();
      const response = await fetch(
        `/api/pen-annotations/load?studentId=${studentId}&pageNumber=${pageNumber}&scriptId=${scriptUuid}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      console.log('⏱️ [API FETCH] Took:', Date.now() - fetchStart, 'ms');

      const parseStart = Date.now();
      const result = await response.json();
      console.log('⏱️ [JSON PARSE] Took:', Date.now() - parseStart, 'ms');

      if (result.success && result.data.annotations && result.data.annotations.length > 0) {
        const latestAnnotation = result.data.annotations[0];
        if (latestAnnotation.drawing_data && canvasRef.current) {
          const renderStart = Date.now();
          await canvasRef.current.loadPaths(latestAnnotation.drawing_data);
          console.log('⏱️ [CANVAS RENDER] Took:', Date.now() - renderStart, 'ms');

          setHasUnsavedChanges(false);
          const totalTime = Date.now() - startTime;
          console.log('✅ [TOTAL LOAD TIME]:', totalTime, 'ms');
          onLoad?.();
        }
      } else {
        // CRITICAL: Clear canvas when no annotations exist for this page
        console.log('ℹ️ No annotations to load - clearing canvas');
        if (canvasRef.current) {
          await canvasRef.current.clearCanvas();
          setHasUnsavedChanges(false);
        }
      }
    } catch (error) {
      console.error('❌ Error loading annotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save annotations to database
  const saveAnnotations = async () => {
    if (!canvasRef.current || !scriptUuid) return;

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No auth session found');
        return;
      }

      // Export paths from react-sketch-canvas
      const exportedData = await canvasRef.current.exportPaths();

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
          drawingData: exportedData // Store the exported JSON directly
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save annotations');
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ Annotations saved successfully');
        setHasUnsavedChanges(false);
        onSave?.();
      }
    } catch (error: any) {
      console.error('Error saving annotations:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete all annotations
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
      console.error('Error deleting annotations:', error);
    }
  };

  // Clear canvas
  const clearCanvas = async () => {
    if (canvasRef.current) {
      await canvasRef.current.clearCanvas();
      await deleteAnnotations();
      setHasUnsavedChanges(false);
      onClear?.();
    }
  };

  // Expose functions for external buttons
  useEffect(() => {
    (window as any).__savePenAnnotations = saveAnnotations;
    (window as any).__clearPenAnnotations = clearCanvas;
    (window as any).__penAnnotationsHaveChanges = hasUnsavedChanges && !isSaving;
    (window as any).__penAnnotationsSaving = isSaving;
  }, [hasUnsavedChanges, isSaving]);

  // Track changes with auto-save (debounced)
  const handleStroke = () => {
    setHasUnsavedChanges(true);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Auto-save after 2 seconds of no drawing
    saveTimeoutRef.current = setTimeout(() => {
      console.log('💾 [AUTO-SAVE] Triggered after 2s of inactivity');
      saveAnnotations();
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={canvasContainerRef}
      className="absolute inset-0 w-full h-full"
      style={{
        pointerEvents: enabled ? 'auto' : 'none',
        zIndex: enabled ? 20 : 10,
        touchAction: 'none', // Prevent pinch-to-zoom on touch devices
      }}
    >
      <ReactSketchCanvas
        ref={canvasRef}
        strokeColor={penColor}
        strokeWidth={penWidth}
        eraserWidth={penWidth * 3}
        canvasColor="transparent"
        style={{
          border: 'none',
          width: '100%',
          height: '100%'
        }}
        onStroke={handleStroke}
        allowOnlyPointerType={enabled ? "all" : "none"}
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
