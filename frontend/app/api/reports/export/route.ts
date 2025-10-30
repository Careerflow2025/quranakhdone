import { NextResponse } from 'next/server';
import { generateReport } from '@/features/reports/server/generateReport';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = url.searchParams.get('studentId');

  if (!studentId) {
    return NextResponse.json(
      { ok: false, error: 'Missing required parameter: studentId' },
      { status: 400 }
    );
  }

  try {
    const pdfBytes = await generateReport(studentId);

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="student-report-${studentId}-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (e: any) {
    console.error('[reports/export] Error:', e);
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}