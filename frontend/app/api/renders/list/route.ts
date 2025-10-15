import { NextResponse } from 'next/server';
import { createSb } from '@/lib/supabase/server';
export async function GET(req:Request){
  const url = new URL(req.url);
  const studentId = url.searchParams.get('studentId');
  if(!studentId) return NextResponse.json({ ok:false, error:'Missing studentId' },{status:400});
  const sb = createSb();
  const { data, error } = await sb.from('annotated_renders').select('*').eq('student_id', studentId).order('created_at',{ascending:false});
  if(error) return NextResponse.json({ ok:false, error:error.message },{status:400});
  return NextResponse.json({ ok:true, rows:data });
}