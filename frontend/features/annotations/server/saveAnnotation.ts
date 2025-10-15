'use server';
import { createSb } from '@/lib/supabase/server';
import { serializeFabric } from '../utils/serialization';
import { fabric } from 'fabric';
import { logEvent } from '@/features/audit/logEvent';

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function saveAnnotation({ schoolId, studentId, classId, page, toolType, canvas, userId, flattenedPngDataUrl }:{ schoolId:string; studentId:string; classId?:string; page:number; toolType:string; canvas:fabric.Canvas; userId:string; flattenedPngDataUrl?:string; }){
  const sb = createSb();
  // 1. Serialize JSON
  const layerJson = serializeFabric(canvas);

  // 2. Insert DB row into annotations
  const { data: ann, error: annErr } = await sb.from('annotations').insert({
    school_id: schoolId,
    student_id: studentId,
    class_id: classId||null,
    page_number: page,
    tool_type: toolType,
    payload: layerJson,
    created_by: userId
  }).select('*').single();
  if(annErr) throw new Error(annErr.message);

  // 3. Use flattened PNG (if provided) or fallback to Fabric-only PNG
  let pngBlob: Blob;
  if(flattenedPngDataUrl) {
    pngBlob = await dataUrlToBlob(flattenedPngDataUrl);
  } else {
    // Fallback to fabric-only PNG (for backward compatibility)
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
    pngBlob = await dataUrlToBlob(dataUrl);
  }
  
  const filePath = `${studentId}/page-${page}-${Date.now()}.png`;
  const { error: upErr } = await sb.storage.from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!).upload(filePath, pngBlob, { contentType: 'image/png', upsert: true });
  if(upErr) throw new Error(upErr.message);

  // 4. Insert annotated_renders row
  const { data: render, error: rErr } = await sb.from('annotated_renders').insert({
    student_id: studentId,
    page_number: page,
    storage_path: filePath
  }).select('*').single();
  if(rErr) throw new Error(rErr.message);

  // Log the annotation save
  await logEvent({ schoolId, actorId: userId, role: 'teacher', eventKey: 'annotation.saved', entityId: ann.id, entityType: 'annotation', meta: { studentId, page, toolType } });

  return { ann, render };
}