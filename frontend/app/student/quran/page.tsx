'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import QuranViewer from '@/components/quran/QuranViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Eye, Bookmark } from 'lucide-react';

export default function StudentQuranPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const [selectedSurah, setSelectedSurah] = useState(
    parseInt(searchParams.get('surah') || '1')
  );
  const [surahInput, setSurahInput] = useState(selectedSurah.toString());

  const handleSurahChange = () => {
    const surahNumber = parseInt(surahInput);
    if (surahNumber >= 1 && surahNumber <= 114) {
      setSelectedSurah(surahNumber);
    }
  };

  // In a real app, you'd get the student ID from the user profile
  const studentId = user?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quran Reading</h1>
          <p className="text-muted-foreground">
            Read the Quran and view your teacher's highlights and notes
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Select Surah
            </CardTitle>
            <CardDescription>
              Choose which Surah to read
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex space-x-2">
              <Input
                type="number"
                min="1"
                max="114"
                value={surahInput}
                onChange={(e) => setSurahInput(e.target.value)}
                placeholder="Surah number (1-114)"
              />
              <Button onClick={handleSurahChange}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Currently reading: Surah {selectedSurah}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Highlight Legend
            </CardTitle>
            <CardDescription>
              Understanding your teacher's feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-purple-200 border-l-4 border-purple-500 rounded-sm" />
              <div>
                <p className="font-medium">Recap</p>
                <p className="text-xs text-muted-foreground">Review this section</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-orange-200 border-l-4 border-orange-500 rounded-sm" />
              <div>
                <p className="font-medium">Tajweed</p>
                <p className="text-xs text-muted-foreground">Pronunciation rules</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-200 border-l-4 border-red-500 rounded-sm" />
              <div>
                <p className="font-medium">Haraka</p>
                <p className="text-xs text-muted-foreground">Vowel marks</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-amber-200 border-l-4 border-amber-700 rounded-sm" />
              <div>
                <p className="font-medium">Letter</p>
                <p className="text-xs text-muted-foreground">Letter pronunciation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bookmark className="w-5 h-5 mr-2" />
            Quick Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[
              { surah: 1, name: "Al-Fatiha" },
              { surah: 2, name: "Al-Baqarah" },
              { surah: 3, name: "Ali 'Imran" },
              { surah: 18, name: "Al-Kahf" },
              { surah: 36, name: "Ya-Sin" },
              { surah: 67, name: "Al-Mulk" },
            ].map(({ surah, name }) => (
              <Button
                key={surah}
                variant={selectedSurah === surah ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedSurah(surah);
                  setSurahInput(surah.toString());
                }}
                className="text-xs"
              >
                {surah}. {name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quran Viewer */}
      <div className="bg-white rounded-lg shadow">
        <QuranViewer
          surah={selectedSurah}
          studentId={studentId}
          isTeacher={false}
          className="p-6"
        />
      </div>

      {/* Reading Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Reading Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-700">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
            <p>Pay attention to highlighted sections - these are areas your teacher wants you to focus on</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
            <p>Listen to your teacher's voice notes for pronunciation guidance</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
            <p>Practice the highlighted areas regularly to improve your recitation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}