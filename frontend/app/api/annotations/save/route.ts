import { NextResponse } from 'next/server';
import { saveAnnotation } from '@/features/annotations/server/saveAnnotation';
import { fabric } from 'fabric';

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req:Request){
  const body = await req.json();
  try{
    // reconstruct canvas from JSON string (client sends layerJson)
    const f = new fabric.Canvas(undefined);
    await new Promise((resolve)=> f.loadFromJSON(body.layerJson, ()=>resolve(null)));
    const result = await saveAnnotation({
      schoolId: body.schoolId,
      studentId: body.studentId,
      classId: body.classId,
      page: body.page,
      toolType: body.toolType,
      canvas: f,
      userId: body.userId,
      flattenedPngDataUrl: body.flattenedPngDataUrl
    });
    return NextResponse.json({ ok:true, result });
  }catch(e:any){
    return NextResponse.json({ ok:false, error:e.message },{status:400});
  }
}