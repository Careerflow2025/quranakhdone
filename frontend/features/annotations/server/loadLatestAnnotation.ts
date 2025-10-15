'use server';
import { createSb } from '@/lib/supabase/server';

export async function loadLatestAnnotation({ studentId, page }:{ studentId:string; page:number; }){
  const sb = createSb();
  const { data, error } = await sb
    .from('annotations')
    .select('id, payload, created_at')
    .eq('student_id', studentId)
    .eq('page_number', page)
    .order('created_at', { ascending:false })
    .limit(1);
  if(error) throw new Error(error.message);
  if(!data || data.length===0) return null;
  return data[0];
}