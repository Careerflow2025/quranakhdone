import { NextResponse } from 'next/server';
import { createSb } from '@/lib/supabase/server';

export async function GET(req: Request){
  const sb = createSb();
  const url = new URL(req.url);
  const schoolId = url.searchParams.get('school_id');
  
  const { data, error } = await sb.from('classes').select('*').eq('school_id', schoolId);
  if(error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  return NextResponse.json({ data });
}

export async function POST(req: Request){
  const sb = createSb();
  const body = await req.json();
  const { school_id, name, code, level, schedule } = body;
  
  const { data, error } = await sb.from('classes').insert({ school_id, name, code, level, schedule }).select('*').single();
  if(error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  return NextResponse.json({ data });
}