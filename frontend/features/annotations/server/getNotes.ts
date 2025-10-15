'use server';
import { createSb } from '@/lib/supabase/server';
export async function getNotes({ studentId, includeHidden=false }:{ studentId:string; includeHidden?:boolean; }){
  const sb = createSb();
  let q = sb.from('notes').select('*').eq('student_id', studentId).order('created_at',{ascending:false});
  if(!includeHidden) q = q.eq('visible_to_parent', true);
  const { data, error } = await q;
  if(error) throw new Error(error.message);
  return data;
}