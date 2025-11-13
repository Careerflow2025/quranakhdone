'use client';

import React, { useState } from 'react';
import { MistakeType, MISTAKE_COLORS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, MessageCircle } from 'lucide-react';

interface HighlightPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  selectedText: string;
  selection: {
    ayahId: string;
    tokenStart: number;
    tokenEnd: number;
  };
  onSave: (mistakeType: MistakeType, note?: string) => void;
}

const MISTAKE_TYPES: { value: MistakeType; label: string; color: string; description: string }[] = [
  {
    value: 'recap',
    label: 'Recap',
    color: MISTAKE_COLORS.recap,
    description: 'Review or repetition needed'
  },
  {
    value: 'tajweed',
    label: 'Tajweed',
    color: MISTAKE_COLORS.tajweed,
    description: 'Pronunciation rules issue'
  },
  {
    value: 'haraka',
    label: 'Haraka',
    color: MISTAKE_COLORS.haraka,
    description: 'Vowel marks error'
  },
  {
    value: 'letter',
    label: 'Letter',
    color: MISTAKE_COLORS.letter,
    description: 'Letter pronunciation error'
  },
];

export default function HighlightPopover({
  isOpen,
  onClose,
  position,
  selectedText,
  selection,
  onSave,
}: HighlightPopoverProps) {
  const [selectedMistake, setSelectedMistake] = useState<MistakeType | null>(null);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!selectedMistake) return;
    
    onSave(selectedMistake, note.trim() || undefined);
    
    // Reset form
    setSelectedMistake(null);
    setNote('');
    setShowNoteInput(false);
  };

  const handleCancel = () => {
    setSelectedMistake(null);
    setNote('');
    setShowNoteInput(false);
    onClose();
  };

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <Card
        className="absolute w-80 max-w-sm pointer-events-auto shadow-lg border-2"
        style={{
          left: Math.min(position.x - 160, window.innerWidth - 320 - 20),
          top: Math.min(position.y, window.innerHeight - 400 - 20),
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Create Highlight</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded max-h-20 overflow-y-auto" dir="rtl">
            "{selectedText}"
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mistake type selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select mistake type:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MISTAKE_TYPES.map((mistake) => (
                <button
                  key={mistake.value}
                  onClick={() => setSelectedMistake(mistake.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all hover:opacity-90 ${
                    selectedMistake === mistake.value
                      ? 'ring-2 ring-offset-2'
                      : ''
                  }`}
                  style={{
                    backgroundColor: `${mistake.color}30`,
                    borderColor: mistake.color,
                    color: mistake.color,
                    ...(selectedMistake === mistake.value && {
                      backgroundColor: `${mistake.color}50`,
                      ringColor: mistake.color,
                    }),
                  }}
                >
                  <div className="font-bold text-sm">{mistake.label}</div>
                  <div className="text-xs mt-1" style={{ opacity: 0.85 }}>
                    {mistake.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Add note button */}
          {!showNoteInput && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNoteInput(true)}
              className="w-full"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Add Note (Optional)
            </Button>
          )}

          {/* Note input */}
          {showNoteInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Note:</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add additional context or instructions..."
                className="w-full"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNoteInput(false);
                  setNote('');
                }}
                className="text-xs"
              >
                Remove note
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedMistake}
              style={{
                backgroundColor: selectedMistake ? MISTAKE_COLORS[selectedMistake] : undefined,
              }}
            >
              Create Highlight
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}