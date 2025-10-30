import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    console.log('🔑 Password reset API called');

    // Get admin client using helper (handles service role key properly)
    const supabaseAdmin = getSupabaseAdmin();

    // Parse request body
    const body = await req.json();
    const { userId, newPassword, credentialId } = body;

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    if (!credentialId) {
      return NextResponse.json(
        { error: 'Credential ID is required' },
        { status: 400 }
      );
    }

    console.log('📝 Resetting password for user:', userId);

    // STEP 1: Update Supabase Auth password (THIS WAS MISSING)
    const { data: authUpdateData, error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (authUpdateError) {
      console.error('❌ Failed to update Auth password:', authUpdateError);
      return NextResponse.json(
        { error: 'Failed to update authentication password: ' + authUpdateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Auth password updated successfully');

    // STEP 2: Update user_credentials table (UI display)
    const { error: credentialsError } = await supabaseAdmin
      .from('user_credentials')
      .update({
        password: newPassword,
        sent_at: null // Reset sent status so they need to send new email
      })
      .eq('id', credentialId);

    if (credentialsError) {
      console.error('❌ Failed to update credentials table:', credentialsError);
      return NextResponse.json(
        { error: 'Failed to update credentials table: ' + credentialsError.message },
        { status: 500 }
      );
    }

    console.log('✅ Credentials table updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Both Auth and credentials table updated.'
    });

  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
