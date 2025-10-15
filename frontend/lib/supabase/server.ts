import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { cache } from 'react';

export const createSb = cache(() => {
  const cookieStore = cookies();
  return createServerComponentClient({ 
    cookies: () => cookieStore 
  });
});

// For route handlers that need the admin client
import { createClient } from '@supabase/supabase-js';

export function createAdminSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}