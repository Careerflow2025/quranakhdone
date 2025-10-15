import { NextResponse } from 'next/server';
import { addNote } from '@/features/annotations/server/addNote';
export async function POST(req:Request){
  try{
    const body = await req.json();
    const note = await addNote(body);
    return NextResponse.json({ ok:true, note });
  }catch(e:any){
    return NextResponse.json({ ok:false, error:e.message },{ status:400 });
  }
}