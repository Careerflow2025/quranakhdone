'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import with no SSR to prevent build-time rendering
const SchoolDashboard = dynamic(
  () => import('@/components/dashboard/SchoolDashboard'),
  { ssr: false, loading: () => <div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">Loading dashboard...</div></div> }
);

export default function SchoolPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">Loading...</div></div>}>
      <SchoolDashboard />
    </Suspense>
  );
}