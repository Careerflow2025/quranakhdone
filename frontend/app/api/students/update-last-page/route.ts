// API endpoint to update student's last visited page for session resumption
import { NextResponse } from 'next/server';
import { createSb } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const sb = createSb();
    const { studentId, lastPageVisited, lastSurahVisited } = await req.json();

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required' },
        { status: 400 }
      );
    }

    // Validate page number (1-604 for Mushaf pages)
    if (lastPageVisited && (lastPageVisited < 1 || lastPageVisited > 604)) {
      return NextResponse.json(
        { error: 'lastPageVisited must be between 1 and 604' },
        { status: 400 }
      );
    }

    // Validate surah number (1-114)
    if (lastSurahVisited && (lastSurahVisited < 1 || lastSurahVisited > 114)) {
      return NextResponse.json(
        { error: 'lastSurahVisited must be between 1 and 114' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      last_visited_at: new Date().toISOString()
    };

    if (lastPageVisited !== undefined) {
      updateData.last_page_visited = lastPageVisited;
    }

    if (lastSurahVisited !== undefined) {
      updateData.last_surah_visited = lastSurahVisited;
    }

    // Update student's last visited page
    const { data: updated, error: updateError } = await sb
      .from('students')
      .update(updateData)
      .eq('id', studentId)
      .select('id, last_page_visited, last_surah_visited, last_visited_at')
      .single();

    if (updateError) {
      console.error('Error updating last page:', updateError);
      return NextResponse.json(
        { error: 'Failed to update last page visited' },
        { status: 500 }
      );
    }

    console.log('✅ Updated last page for student:', studentId, {
      page: updated.last_page_visited,
      surah: updated.last_surah_visited
    });

    return NextResponse.json({
      success: true,
      data: {
        studentId: updated.id,
        lastPageVisited: updated.last_page_visited,
        lastSurahVisited: updated.last_surah_visited,
        lastVisitedAt: updated.last_visited_at
      }
    });

  } catch (err: any) {
    console.error('Error in update-last-page API:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
