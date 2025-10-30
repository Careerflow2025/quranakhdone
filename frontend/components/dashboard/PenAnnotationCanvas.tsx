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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scriptUuid, setScriptUuid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
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

      const result = await response.json();
      if (result.success && result.data.annotations && result.data.annotations.length > 0) {
        const latestAnnotation = result.data.annotations[0];
        if (latestAnnotation.drawing_data && canvasRef.current) {
          await canvasRef.current.loadPaths(latestAnnotation.drawing_data);
          setHasUnsavedChanges(false);
          console.log('✅ Annotations loaded successfully');
          onLoad?.();
        }
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
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

  // Track changes
  const handleStroke = () => {
    setHasUnsavedChanges(true);
  };

  return (
    <div className="absolute inset-0 w-full h-full" style={{
      pointerEvents: enabled ? 'auto' : 'none',
      zIndex: enabled ? 20 : 10
    }}>
      <ReactSketchCanvas
        ref={canvasRef}
        strokeColor={penColor}
        strokeWidth={penWidth}
        eraserWidth={penWidth * 3}
        canvasColor="transparent"
        preserveBackgroundImageAspectRatio="none"
        width="100%"
        height="100%"
        style={{
          border: 'none',
          width: '100%',
          height: '100%',
          touchAction: 'none'
        }}
        onStroke={handleStroke}
        allowOnlyPointerType={enabled ? "all" : "none"}
        withViewBox={true}
      />
    </div>
  );
}
