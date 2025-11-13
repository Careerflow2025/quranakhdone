'use client';

import SchoolDashboard from '@/components/dashboard/SchoolDashboard';

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function SchoolDashboardPage() {
  // PRODUCTION VERSION - Beautiful UI with real Supabase data
  // All features connected to database
  return <SchoolDashboard />;
}