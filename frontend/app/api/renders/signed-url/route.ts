import { NextResponse } from 'next/server';
import { getSignedUrl } from '@/features/annotations/server/getSignedUrl';

export async function GET(req:Request){
  const url = new URL(req.url);
  const path = url.searchParams.get('path');
  if(!path) return NextResponse.json({ ok:false, error:'Missing path' },{status:400});
  try{
    const signed = await getSignedUrl(path);
    return NextResponse.json({ ok:true, url: signed });
  }catch(e:any){
    return NextResponse.json({ ok:false, error:e.message },{status:400});
  }
}