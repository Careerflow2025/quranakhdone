import { NextResponse } from 'next/server';
import { createSb } from '@/lib/supabase/server';

export async function GET(req:Request){
  const url = new URL(req.url);
  const schoolId = url.searchParams.get('schoolId');
  if(!schoolId) return NextResponse.json({ ok:false, error:'Missing schoolId' },{status:400});
  const sb = createSb();
  const { data, error } = await sb.from('audit_log').select('*').eq('school_id', schoolId).order('created_at',{ascending:false}).limit(100);
  if(error) return NextResponse.json({ ok:false, error:error.message },{status:400});
  return NextResponse.json({ ok:true, rows:data });
}