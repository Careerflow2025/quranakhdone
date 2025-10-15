import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for API routes, static files, and auth pages
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/auth/')
  ) {
    return NextResponse.next();
  }

  // Get user role from headers or cookies (this would normally be from auth)
  // For now, we'll detect based on path - in real implementation, use auth tokens
  const userRole = getUserRole(request);

  // Protect teacher routes from school admin access
  if (pathname.startsWith('/teacher/') && userRole === 'school_admin') {
    // Redirect school admin to their dashboard instead of teacher routes
    return NextResponse.redirect(new URL('/school/dashboard', request.url));
  }

  // Protect school routes from teacher access
  if (pathname.startsWith('/school/') && userRole === 'teacher') {
    // Redirect teacher to their dashboard instead of school admin routes
    return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
  }

  // Protect student routes from non-students
  if (pathname.startsWith('/student/') && userRole !== 'student') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Protect parent routes from non-parents
  if (pathname.startsWith('/parent/') && userRole !== 'parent') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

function getUserRole(request: NextRequest): string {
  // In a real implementation, you would:
  // 1. Get the JWT token from cookies or headers
  // 2. Verify and decode the token
  // 3. Return the user role from the token

  // For now, we'll use a simple detection based on referrer or session storage
  // This is a temporary solution - replace with proper JWT auth
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  
  // Simple role detection based on current path or referrer
  if (referer.includes('/school/') || request.nextUrl.pathname.startsWith('/school/')) {
    return 'school_admin';
  }
  if (referer.includes('/teacher/') || request.nextUrl.pathname.startsWith('/teacher/')) {
    return 'teacher';
  }
  if (referer.includes('/student/') || request.nextUrl.pathname.startsWith('/student/')) {
    return 'student';
  }
  if (referer.includes('/parent/') || request.nextUrl.pathname.startsWith('/parent/')) {
    return 'parent';
  }

  // Default to no role - will be handled by auth pages
  return 'guest';
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};