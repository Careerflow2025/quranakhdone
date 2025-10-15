'use server';
import { createSb } from '@/lib/supabase/server';
export async function listRenders(studentId: string, page?: number){
  const sb = createSb();
  let q = sb.from('annotated_renders').select('*').eq('student_id', studentId).order('created_at',{ascending:false});
  if(page) q = q.eq('page_number', page);
  const { data, error } = await q;
  if(error) throw new Error(error.message);
  return data;
}