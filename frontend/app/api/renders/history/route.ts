import { NextResponse } from 'next/server';
import { listRenders } from '@/features/annotations/server/listRenders';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(req:Request){
  const url = new URL(req.url);
  const studentId = url.searchParams.get('studentId')!;
  const page = url.searchParams.get('page');
  try{
    const rows = await listRenders(studentId, page?parseInt(page):undefined);
    return NextResponse.json({ ok:true, rows });
  }catch(e:any){
    return NextResponse.json({ ok:false, error:e.message },{status:400});
  }
}