import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const url = new URL(req.url);
    const annotationId = url.searchParams.get('id');

    if (!annotationId) {
      return NextResponse.json(
        { error: 'Missing annotation ID' },
        { status: 400 }
      );
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the teacher profile
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacherData) {
      return NextResponse.json({ error: 'Only teachers can delete annotations' }, { status: 403 });
    }

    // Delete the annotation (RLS will ensure they can only delete their own)
    const { error } = await supabase
      .from('pen_annotations')
      .delete()
      .eq('id', annotationId)
      .eq('teacher_id', teacherData.id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Annotation not found or unauthorized' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Annotation deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting pen annotation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete annotation' },
      { status: 500 }
    );
  }
}