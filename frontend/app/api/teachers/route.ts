import { NextResponse } from 'next/server';
import { createSb } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const sb = createSb();
  const url = new URL(req.url);
  const school_id = url.searchParams.get('school_id');
  
  if (!school_id) {
    return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
  }
  
  const { data, error } = await sb
    .from('teachers')
    .select(`
      id,
      full_name,
      email,
      phone,
      qualifications,
      experience,
      created_at,
      user_id
    `)
    .eq('school_id', school_id);
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json({ data });
}