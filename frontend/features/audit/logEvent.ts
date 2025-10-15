'use server';
import { createSb } from '@/lib/supabase/server';

export async function logEvent({ schoolId, actorId, role, eventKey, entityId, entityType, meta }:{ schoolId:string; actorId?:string; role?:string; eventKey:string; entityId?:string; entityType?:string; meta?:any; }){
  const sb = createSb();
  await sb.from('audit_log').insert({ school_id: schoolId, actor_id: actorId, role, event_key: eventKey, entity_id: entityId||null, entity_type: entityType||null, meta });
}