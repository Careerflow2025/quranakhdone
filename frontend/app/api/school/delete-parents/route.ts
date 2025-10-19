import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ADMIN CLIENT with Service Role Key - BYPASSES RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { parentIds } = body;

    if (!parentIds || !Array.isArray(parentIds) || parentIds.length === 0) {
      return NextResponse.json({
        error: 'Parent IDs array is required'
      }, { status: 400 });
    }

    console.log(`🗑️ Starting deletion of ${parentIds.length} parent(s) with Service Role Key...`);

    const results = [];
    const errors = [];

    for (const parentId of parentIds) {
      try {
        console.log(`🔍 Processing parent: ${parentId}`);

        // Step 1: Get parent's user_id
        const { data: parentData, error: fetchError } = await supabaseAdmin
          .from('parents')
          .select('user_id')
          .eq('id', parentId)
          .single();

        if (fetchError) {
          console.error(`❌ Error fetching parent ${parentId}:`, fetchError);
          errors.push({
            parentId,
            error: `Failed to fetch parent: ${fetchError.message}`
          });
          continue;
        }

        if (!parentData) {
          console.error(`❌ Parent ${parentId} not found`);
          errors.push({
            parentId,
            error: 'Parent not found'
          });
          continue;
        }

        const userId = parentData.user_id;

        // Step 2: Delete parent-student links (BYPASSES RLS)
        console.log(`🔗 Deleting parent-student links for parent ${parentId}...`);
        const { error: linksError } = await supabaseAdmin
          .from('parent_students')
          .delete()
          .eq('parent_id', parentId);

        if (linksError) {
          console.error(`⚠️ Error deleting parent-student links:`, linksError);
          // Continue anyway, links might not exist
        } else {
          console.log(`✅ Parent-student links deleted`);
        }

        // Step 3: Delete from parents table (BYPASSES RLS)
        console.log(`👨‍👩‍👧‍👦 Deleting parent record ${parentId}...`);
        const { error: parentError } = await supabaseAdmin
          .from('parents')
          .delete()
          .eq('id', parentId);

        if (parentError) {
          console.error(`❌ Error deleting parent:`, parentError);
          errors.push({
            parentId,
            error: `Failed to delete parent: ${parentError.message}`
          });
          continue;
        }

        console.log(`✅ Parent record deleted`);

        // Step 4: Delete from profiles table (BYPASSES RLS)
        console.log(`📝 Deleting profile for user ${userId}...`);
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('user_id', userId);

        if (profileError) {
          console.error(`⚠️ Error deleting profile:`, profileError);
          // Continue anyway, profile might not exist
        } else {
          console.log(`✅ Profile deleted`);
        }

        // Step 5: Delete from auth.users (REQUIRES ADMIN API)
        console.log(`🔐 Deleting auth user ${userId}...`);
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
          console.error(`⚠️ Error deleting auth user:`, authError);
          // Continue anyway, user might already be deleted
        } else {
          console.log(`✅ Auth user deleted`);
        }

        console.log(`🎉 Parent ${parentId} completely deleted from all systems`);

        results.push({
          parentId,
          success: true,
          message: 'Parent deleted successfully'
        });

      } catch (error: any) {
        console.error(`💥 Error deleting parent ${parentId}:`, error);
        errors.push({
          parentId,
          error: error.message || 'Unknown error'
        });
      }
    }

    console.log(`✅ Deletion complete: ${results.length} successful, ${errors.length} errors`);

    return NextResponse.json({
      success: results.length > 0,
      results,
      errors,
      message: `Deleted ${results.length} parent(s) successfully`
    });

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Failed to delete parents' },
      { status: 500 }
    );
  }
}
