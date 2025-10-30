import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    console.log(`🔍 Looking for user with email: ${email}`);

    // Step 1: Find the user in auth.users by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json({ error: listError.message }, { status: 400 });
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: `No user found with email: ${email}`
      });
    }

    const userId = user.id;
    console.log(`✅ Found user: ${userId}`);

    // Step 2: Delete from database tables first
    console.log('🗑️  Deleting from database tables...');

    // Delete from profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.error('Profile deletion error:', profileError);
    }

    // Delete from schools (if they're a school owner)
    const { error: schoolError } = await supabaseAdmin
      .from('schools')
      .delete()
      .eq('owner_id', userId);

    if (schoolError) {
      console.error('School deletion error:', schoolError);
    }

    // Step 3: Delete from Supabase Auth (CRITICAL!)
    console.log('🔥 Deleting from Supabase Auth...');
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Auth deletion error:', authError);
      return NextResponse.json({
        error: `Failed to delete auth user: ${authError.message}`
      }, { status: 500 });
    }

    console.log('✅ User completely deleted!');

    return NextResponse.json({
      success: true,
      message: `User ${email} completely deleted from both database and auth`,
      userId,
      email
    });

  } catch (error: any) {
    console.error('Complete deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
