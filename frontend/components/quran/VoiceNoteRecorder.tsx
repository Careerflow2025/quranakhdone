'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Trash2, Upload } from 'lucide-react';

interface VoiceNoteRecorderProps {
  onSave: (audioBlob: Blob) => void;
  onCancel?: () => void;
  maxDuration?: number; // in seconds
  className?: string;
}

export default function VoiceNoteRecorder({
  onSave,
  onCancel,
  maxDuration = 60,
  className = '',
}: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;

      // Try different mime types in order of preference (Supabase Storage compatible)
      const mimeTypes = [
        'audio/mp4',           // Best for Supabase Storage
        'audio/mpeg',          // MP3 format
        'audio/webm',          // Fallback to basic webm (no opus codec)
        'audio/ogg',           // OGG format
        ''                     // Let browser choose default
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (mimeType === '' || MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('📹 Using mime type:', mimeType || 'browser default');
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream,
        selectedMimeType ? { mimeType: selectedMimeType } : undefined
      );

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Use the actual mime type from the recorder
        const actualMimeType = mediaRecorder.mimeType || 'audio/mp4';
        console.log('🎵 Recorded blob mime type:', actualMimeType);

        const blob = new Blob(chunks, { type: actualMimeType });
        setRecordedBlob(blob);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Record in 100ms chunks

      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // Auto-stop at max duration
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          
          return newTime;
        });
      }, 1000);
      
    } catch (err: any) {
      setError('Could not access microphone. Please check permissions.');
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (!recordedBlob) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    
    const audioUrl = URL.createObjectURL(recordedBlob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(audioUrl);
    };
    
    audio.onpause = () => {
      setIsPlaying(false);
    };
    
    audio.play();
    setIsPlaying(true);
  };

  const deleteRecording = () => {
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const handleSave = () => {
    if (recordedBlob) {
      onSave(recordedBlob);
      deleteRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`voice-note-recorder ${className}`}>
      <CardContent className="p-4">
        {error && (
          <div className="text-red-600 text-sm mb-4 p-2 bg-red-50 rounded">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium">Voice Note</div>
          <div className="text-sm text-muted-foreground">
            {formatTime(recordingTime)} / {formatTime(maxDuration)}
          </div>
        </div>

        {/* Recording controls */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          {!recordedBlob ? (
            <>
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className={`rounded-full ${isRecording ? 'voice-note-recording' : ''}`}
                disabled={recordingTime >= maxDuration}
              >
                {isRecording ? (
                  <Square className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </Button>
              <div className="text-sm text-muted-foreground">
                {isRecording ? 'Recording...' : 'Tap to record'}
              </div>
            </>
          ) : (
            <>
              <Button
                onClick={playRecording}
                variant="outline"
                size="lg"
                className="rounded-full"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>
              
              <Button
                onClick={deleteRecording}
                variant="ghost"
                size="lg"
                className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>

        {/* Progress bar */}
        {(isRecording || recordedBlob) && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(recordingTime / maxDuration) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={!recordedBlob}
          >
            <Upload className="w-4 h-4 mr-2" />
            Save Note
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}