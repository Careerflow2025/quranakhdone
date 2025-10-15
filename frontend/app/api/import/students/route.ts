import { NextResponse } from 'next/server';
import { createSb } from '@/lib/supabase/server';
import { parseCsv } from '@/features/admin/imports/parseCsv';
import { StudentCsvRow } from '@/features/admin/imports/schemas';

export async function POST(req: Request){
  const sb = createSb();
  const body = await req.formData();
  const file = body.get('file') as File | null;
  const schoolId = body.get('school_id') as string | null;
  
  if(!file || !schoolId) return NextResponse.json({ error: 'Missing file or school_id' }, { status: 400 });
  
  const csv = await file.text();
  const rows = parseCsv<StudentCsvRow>(csv).map(r=>StudentCsvRow.parse(r));
  const results = { inserted: 0, skipped: 0, enrolled: 0, errors: [] as Array<{row:number; reason:string}> };
  
  for(let i=0;i<rows.length;i++){
    const r = rows[i];
    
    // ensure class exists by code
    const { data: klass } = await sb.from('classes').select('id').eq('code', r.class_code).eq('school_id', schoolId).maybeSingle();
    if(!klass){ results.errors.push({ row: i+1, reason: `Class code not found: ${r.class_code}` }); continue; }
    
    // upsert parent user (parent_email)
    const { data: parentExisting } = await sb.from('users').select('id').eq('email', r.parent_email).maybeSingle();
    let parentId = parentExisting?.id;
    if(!parentId){
      const { data: ins, error: pErr } = await sb.from('users').insert({ 
        email: r.parent_email, 
        first_name: r.parent_name.split(' ')[0], 
        last_name: r.parent_name.split(' ').slice(1).join(' ') || 'Parent', 
        role: 'parent', 
        school_id: schoolId 
      }).select('id').single();
      if(pErr){ results.errors.push({ row: i+1, reason: pErr.message }); continue; }
      parentId = ins.id;
    }
    
    // insert student
    const { data: sExists } = await sb.from('students').select('id').match({ first_name: r.first_name, last_name: r.last_name, school_id: schoolId }).maybeSingle();
    let studentId = sExists?.id;
    if(!studentId){
      const { data: sIns, error: sErr } = await sb.from('students').insert({ 
        first_name: r.first_name, 
        last_name: r.last_name, 
        school_id: schoolId, 
        parent_user_id: parentId, 
        date_of_birth: r.date_of_birth || null 
      }).select('id').single();
      if(sErr){ results.errors.push({ row: i+1, reason: sErr.message }); continue; }
      studentId = sIns.id;
      results.inserted++;
    } else {
      results.skipped++;
    }
    
    // enroll
    const { error: eErr } = await sb.from('enrollments').insert({ school_id: schoolId, class_id: klass.id, student_id: studentId });
    if(!eErr) results.enrolled++;
  }
  
  return NextResponse.json({ ok: true, summary: results });
}