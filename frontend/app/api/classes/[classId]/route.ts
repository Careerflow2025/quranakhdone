import { NextResponse } from 'next/server';
import { createSb } from '@/lib/supabase/server';

export async function PATCH(req: Request, { params }: { params: { classId: string }}){
  const sb = createSb();
  const body = await req.json();
  const { name, code, level, schedule } = body;

  const { data, error } = (await sb.from('classes').update({ name, code, level, schedule } as any).eq('id', params.classId).select('*').single()) as { data: any; error: any };
  if(error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, { params }: { params: { classId: string }}){
  const sb = createSb();
  const { error } = (await sb.from('classes').delete().eq('id', params.classId)) as { error: any };
  if(error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}