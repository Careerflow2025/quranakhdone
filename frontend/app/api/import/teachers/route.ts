import { NextResponse } from 'next/server';
import { createSb } from '@/lib/supabase/server';
import { parseCsv } from '@/features/admin/imports/parseCsv';
import { TeacherCsvRow } from '@/features/admin/imports/schemas';

export async function POST(req: Request){
  const sb = createSb();
  const body = await req.formData();
  const file = body.get('file') as File | null;
  const schoolId = body.get('school_id') as string | null;
  
  if(!file || !schoolId) return NextResponse.json({ error: 'Missing file or school_id' }, { status: 400 });
  
  const csv = await file.text();
  const rows = parseCsv<TeacherCsvRow>(csv).map(r=>TeacherCsvRow.parse(r));
  const results: {inserted:number; skipped:number; errors: Array<{row:number; reason:string}>} = { inserted: 0, skipped: 0, errors: [] };
  
  for(let i=0;i<rows.length;i++){
    const r = rows[i];
    const { data: existing } = await sb.from('users').select('id').eq('email', r.email).maybeSingle();
    if(existing){ results.skipped++; continue; }
    
    const { error } = await sb.from('users').insert({ 
      email: r.email, 
      first_name: r.first_name, 
      last_name: r.last_name, 
      phone: r.phone || null, 
      role: 'teacher', 
      school_id: schoolId 
    });
    
    if(error){ results.errors.push({ row: i+1, reason: error.message }); } else { results.inserted++; }
  }
  
  return NextResponse.json({ ok: true, summary: results });
}