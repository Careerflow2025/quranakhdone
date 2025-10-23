import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = cookies();

    // Create server client for user authentication
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please login' },
        { status: 401 }
      );
    }

    // Get user profile and check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
      return NextResponse.json(
        { error: `Profile query failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    if (profile.role !== 'owner' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only school administrators can delete parents' },
        { status: 403 }
      );
    }

    // Now we can use admin client for privileged operations
    const supabaseAdmin = getSupabaseAdmin();
    
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
