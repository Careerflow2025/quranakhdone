'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import MushafPageViewer from '@/components/quran/MushafPageViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Users } from 'lucide-react';

export default function TeacherQuranPage() {
  const searchParams = useSearchParams();
  const [selectedSurah, setSelectedSurah] = useState(
    parseInt(searchParams.get('surah') || '1')
  );
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [surahInput, setSurahInput] = useState(selectedSurah.toString());

  const handleSurahChange = () => {
    const surahNumber = parseInt(surahInput);
    if (surahNumber >= 1 && surahNumber <= 114) {
      setSelectedSurah(surahNumber);
    }
  };

  const sampleStudents = [
    { id: '1', name: 'Ahmed Ali' },
    { id: '2', name: 'Fatima Hassan' },
    { id: '3', name: 'Omar Ibrahim' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quran Teaching</h1>
          <p className="text-muted-foreground">
            Select students and add highlights while teaching
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Select Surah
            </CardTitle>
            <CardDescription>
              Choose which Surah to display
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
              Currently viewing: Surah {selectedSurah}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Select Student
            </CardTitle>
            <CardDescription>
              Choose a student to add highlights for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a student...</option>
              {sampleStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
            {selectedStudent && (
              <p className="text-sm text-muted-foreground mt-2">
                Adding highlights for: {sampleStudents.find(s => s.id === selectedStudent)?.name}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teaching Tips</CardTitle>
            <CardDescription>
              How to use the Quran viewer effectively
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
              <p><strong>Purple:</strong> Recap needed</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
              <p><strong>Orange:</strong> Tajweed rules</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
              <p><strong>Red:</strong> Haraka (vowels)</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-amber-700 rounded-full mt-2" />
              <p><strong>Brown:</strong> Letter pronunciation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mushaf Viewer */}
      <MushafPageViewer
        surah={selectedSurah}
        studentId={selectedStudent}
        isTeacher={true}
      />
    </div>
  );
}