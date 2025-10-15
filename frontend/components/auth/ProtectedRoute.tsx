'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
type Role = 'owner' | 'admin' | 'teacher' | 'student' | 'parent';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requiredRole?: Role;
  fallbackRoute?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requiredRole,
  fallbackRoute = '/',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      router.push(fallbackRoute);
      return;
    }

    // Authenticated but no user data yet - wait
    if (!user) return;

    const userRole = user.role as Role;

    // Check specific required role
    if (requiredRole && userRole !== requiredRole) {
      redirectToAppropriateRoute(userRole);
      return;
    }

    // Check allowed roles
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      redirectToAppropriateRoute(userRole);
      return;
    }
  }, [isAuthenticated, user, requiredRole, allowedRoles, router, fallbackRoute]);

  const redirectToAppropriateRoute = (userRole: Role) => {
    switch (userRole) {
      case 'owner':
      case 'admin':
        router.push('/admin');
        break;
      case 'teacher':
        router.push('/teacher');
        break;
      case 'student':
        router.push('/student');
        break;
      case 'parent':
        router.push('/parent');
        break;
      default:
        router.push(fallbackRoute);
    }
  };

  // Show loading while checking authentication
  if (!isAuthenticated || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="loading-spinner mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
}

// Hook for role-based access control
export function useRoleAccess() {
  const { user } = useAuthStore();
  
  const hasRole = (role: Role): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    return user ? roles.includes(user.role as Role) : false;
  };

  const isAdmin = (): boolean => {
    return hasAnyRole(['owner', 'admin']);
  };

  const isTeacher = (): boolean => {
    return hasRole('teacher');
  };

  const isStudent = (): boolean => {
    return hasRole('student');
  };

  const isParent = (): boolean => {
    return hasRole('parent');
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
  };
}