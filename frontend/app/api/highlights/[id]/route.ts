import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// DELETE - Remove a highlight
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    const highlightId = params.id;

    // Verify highlight exists and belongs to same school
    const { data: highlight, error: fetchError } = await supabaseAdmin
      .from('highlights')
      .select('*')
      .eq('id', highlightId)
      .eq('school_id', profile.school_id)
      .single();

    if (fetchError || !highlight) {
      return NextResponse.json(
        { error: 'Highlight not found' },
        { status: 404 }
      );
    }

    // Delete highlight
    const { error: deleteError } = await supabaseAdmin
      .from('highlights')
      .delete()
      .eq('id', highlightId);

    if (deleteError) {
      console.error('❌ Failed to delete highlight:', deleteError);
      return NextResponse.json(
        { error: `Failed to delete highlight: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Highlight deleted:', highlightId);

    return NextResponse.json({
      success: true,
      message: 'Highlight deleted successfully'
    });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
