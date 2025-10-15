import { NextResponse } from 'next/server';
import { createSb } from '@/lib/supabase/server';

export async function GET(req: Request){
  const sb = createSb();
  const url = new URL(req.url);
  const school_id = url.searchParams.get('school_id');
  
  const { data, error } = await sb.from('students').select('id, first_name, last_name').eq('school_id', school_id);
  if(error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  return NextResponse.json({ data });
}