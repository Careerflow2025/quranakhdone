import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // DEBUG: Log middleware execution
  console.log('[Middleware] Processing:', pathname);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for session refresh
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name)?.value;
          console.log('[Middleware] Cookie get:', name, cookie ? 'EXISTS' : 'MISSING');
          return cookie;
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log('[Middleware] Cookie set:', name);
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          console.log('[Middleware] Cookie remove:', name);
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Skip route protection for API routes, static files, and auth pages
  const isApiRoute = pathname.startsWith('/api/');
  const isStaticFile = pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico');
  const isAuthPage = pathname.startsWith('/auth/');

  // Skip route protection logic for API routes, static files, and auth pages
  // IMPORTANT: Don't call getUser() for these routes to avoid unnecessary Supabase calls
  if (isApiRoute || isStaticFile || isAuthPage) {
    console.log('[Middleware] Skipping route protection for:', pathname);
    return response;
  }

  // Only refresh session for protected routes (reduces Supabase API calls significantly)
  console.log('[Middleware] Calling getUser() for protected route:', pathname);
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('[Middleware] Auth result:', {
    hasUser: !!user,
    userId: user?.id,
    error: error?.message
  });

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

  return response;
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