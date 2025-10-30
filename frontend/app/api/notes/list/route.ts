import { NextResponse } from 'next/server';
import { getNotes } from '@/features/annotations/server/getNotes';

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(req:Request){
  const url = new URL(req.url);
  const studentId = url.searchParams.get('studentId')!;
  const includeHidden = url.searchParams.get('all')==='1';
  try{
    const notes = await getNotes({ studentId, includeHidden });
    return NextResponse.json({ ok:true, notes });
  }catch(e:any){
    return NextResponse.json({ ok:false, error:e.message },{status:400});
  }
}