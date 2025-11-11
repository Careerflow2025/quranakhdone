/**
 * Supabase Server Client
 * Created: 2025-10-20
 * Purpose: Server-side Supabase client for API routes with cookie-based auth
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { Database } from './database.types';
import { createClient as createBrowserClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for use in Server Components and API Routes
 * Handles authentication via cookies
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client that reads auth from Authorization header
 * Used for API routes when frontend sends Bearer token
 */
export function createClientWithAuth() {
  const headersList = headers();
  const authHeader = headersList.get('authorization');

  // If Authorization header exists, use it
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  // Fall back to cookie-based auth
  return createClient();
}

/**
 * Creates a Supabase admin client with service role key
 * WARNING: This has full access and bypasses RLS. Use with extreme caution.
 * Only use when you need to perform operations that bypass RLS policies.
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookies().set({ name, value, ...options });
          } catch (error) {
            // Ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookies().set({ name, value: '', ...options });
          } catch (error) {
            // Ignore
          }
        },
      },
    }
  );
}
