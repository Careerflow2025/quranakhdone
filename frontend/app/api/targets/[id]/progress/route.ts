/**
 * Target Progress API
 * PATCH /api/targets/:id/progress - Update target status and completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id;
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('school_id')
      .eq('user_id', user.id)
      .single();

    const { status, progress_percentage } = await request.json();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (progress_percentage !== undefined) updateData.progress = progress_percentage;

    const { data: updatedTarget } = await supabaseAdmin
      .from('targets')
      .update(updateData)
      .eq('id', targetId)
      .eq('school_id', profile.school_id)
      .select()
      .single();

    const { data: milestones } = await supabaseAdmin
      .from('target_milestones')
      .select('*')
      .eq('target_id', targetId)
      .order('sequence_order', { ascending: true });

    return NextResponse.json({
      success: true,
      target: { ...updatedTarget, milestones: milestones || [] },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
