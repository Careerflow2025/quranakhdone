import { NextResponse } from 'next/server';
import { createSb } from '@/lib/supabase/server';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(req: Request) {
  const sb = createSb();
  const url = new URL(req.url);
  const school_id = url.searchParams.get('school_id');
  
  if (!school_id) {
    return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
  }
  
  // Join with profiles to get teacher name and email (PRODUCTION schema)
  const { data, error } = await sb
    .from('teachers')
    .select(`
      id,
      user_id,
      bio,
      active,
      created_at,
      profile:profiles!user_id (
        display_name,
        email
      )
    `)
    .eq('school_id', school_id);
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json({ data });
}