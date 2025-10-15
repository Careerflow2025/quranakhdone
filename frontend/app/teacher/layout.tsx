'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="teacher">
      {children}
    </ProtectedRoute>
  );
}