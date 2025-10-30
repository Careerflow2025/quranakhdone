import { NextResponse } from 'next/server';
import { createSb } from '@/lib/supabase/server';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(req: Request){
  const sb = createSb();
  const url = new URL(req.url);
  const role = url.searchParams.get('role');
  const school_id = url.searchParams.get('school_id');
  
  let q = sb.from('users').select('id, first_name, last_name, email').eq('school_id', school_id);
  if(role) q = q.eq('role', role);
  
  const { data, error } = await q;
  if(error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  return NextResponse.json({ data });
}