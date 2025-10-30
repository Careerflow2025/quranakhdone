import { NextResponse } from 'next/server';
import { createSb } from '@/lib/supabase/server';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(req: Request){
  const sb = createSb();
  const body = await req.json();
  const { school_id, class_id, user_id } = body;
  
  const { error } = await sb.from('class_teachers').insert({ school_id, class_id, user_id });
  if(error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request){
  const sb = createSb();
  const url = new URL(req.url);
  const class_id = url.searchParams.get('class_id');
  const user_id = url.searchParams.get('user_id');

  const { error } = (await sb.from('class_teachers').delete().match({ class_id, user_id })) as { error: any };
  if(error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}