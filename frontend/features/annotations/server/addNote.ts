'use server';
import { createSb } from '@/lib/supabase/server';
import { logEvent } from '@/features/audit/logEvent';

export async function addNote({ schoolId, studentId, classId, authorId, text, visibleToParent }:{ schoolId:string; studentId:string; classId?:string; authorId:string; text:string; visibleToParent:boolean; }){
  const sb = createSb();
  const { data, error } = await sb.from('notes').insert({ school_id: schoolId, student_id: studentId, class_id: classId||null, author_id: authorId, text, visible_to_parent: visibleToParent }).select('*').single();
  if(error) throw new Error(error.message);
  
  // Log the note addition
  await logEvent({ schoolId, actorId: authorId, role: 'teacher', eventKey: 'note.added', entityId: data.id, entityType: 'note', meta: { studentId, visibleToParent } });
  
  return data;
}