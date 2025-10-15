import { NextResponse } from 'next/server';
import { analyzeAudio } from '@/features/tajweed/server/analyzeAudio';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const { schoolId, studentId, audioPath } = body;
    if (!schoolId || !studentId || !audioPath) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: schoolId, studentId, audioPath' },
        { status: 400 }
      );
    }
    
    // Call server action to analyze audio
    const row = await analyzeAudio(body);
    
    return NextResponse.json({ ok: true, row });
  } catch (e: any) {
    console.error('[tajweed/analyze] Error:', e);
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 400 }
    );
  }
}