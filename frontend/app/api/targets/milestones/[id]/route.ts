/**
 * Milestone Toggle API
 * PATCH /api/targets/milestones/:id - Toggle milestone completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const milestoneId = params.id;
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

    const { completed } = await request.json();

    const { data: updatedMilestone } = await supabaseAdmin
      .from('target_milestones')
      .update({ completed })
      .eq('id', milestoneId)
      .select()
      .single();

    if (!updatedMilestone) {
      return NextResponse.json({ success: false, error: 'Milestone not found' }, { status: 404 });
    }

    const { data: allMilestones } = await supabaseAdmin
      .from('target_milestones')
      .select('*')
      .eq('target_id', updatedMilestone.target_id);

    const totalMilestones = allMilestones?.length || 0;
    const completedMilestones = allMilestones?.filter(m => m.completed).length || 0;
    const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    await supabaseAdmin
      .from('targets')
      .update({ progress })
      .eq('id', updatedMilestone.target_id);

    return NextResponse.json({
      success: true,
      milestone: updatedMilestone,
      progress,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
