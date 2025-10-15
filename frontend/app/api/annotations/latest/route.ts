import { NextResponse } from 'next/server';
import { loadLatestAnnotation } from '@/features/annotations/server/loadLatestAnnotation';

export async function GET(req:Request){
  const url = new URL(req.url);
  const studentId = url.searchParams.get('studentId')!;
  const page = parseInt(url.searchParams.get('page')!);
  try{
    const ann = await loadLatestAnnotation({ studentId, page });
    return NextResponse.json({ ok:true, ann });
  }catch(e:any){
    return NextResponse.json({ ok:false, error:e.message },{ status:400 });
  }
}