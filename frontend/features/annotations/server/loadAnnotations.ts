'use server';
import { createSb } from '@/lib/supabase/server';

export async function loadAnnotations({ 
  studentId, 
  page 
}:{ 
  studentId:string; 
  page:number; 
}){
  const sb = createSb();
  const { data, error } = await sb.from('annotations')
    .select('*')
    .eq('student_id', studentId)
    .eq('page_number', page)
    .order('created_at',{ascending:false});
    
  if(error) throw new Error(error.message);
  return data;
}