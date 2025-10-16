'use client';

import React from 'react';

interface QuranViewerProps {
  surah: number;
  ayah?: number;
  studentId?: string;
  isTeacher?: boolean;
  className?: string;
}

export default function QuranViewer({
  surah,
  ayah,
  studentId,
  isTeacher = false,
  className = '',
}: QuranViewerProps) {
  return (
    <div className={`quran-viewer ${className} p-8`}>
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Surah {surah}</h2>
        <p className="text-muted-foreground">
          Quran Viewer - Coming Soon
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Full Quran text display with highlighting features will be available after initial deployment.
        </p>
      </div>
    </div>
  );
}
