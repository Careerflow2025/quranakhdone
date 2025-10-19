import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const body = await req.json();
    const { schoolName, adminEmail, adminPassword, adminFullName } = body;

    console.log('🚀 Starting school registration...');

    // Step 1: Create auth user
    console.log('Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        display_name: adminFullName,
        role: 'school'
      }
    });

    if (authError) {
      console.error('❌ Auth creation failed:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user data returned from auth creation');
    }

    const userId = authData.user.id;
    console.log('✅ Auth user created:', userId);

    // Step 2: Create school
    console.log('Step 2: Creating school...');
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name: schoolName,
        timezone: 'Africa/Casablanca'
      } as any)
      .select()
      .single() as { data: any; error: any };

    if (schoolError || !school) {
      console.error('❌ School creation failed:', schoolError);
      // Cleanup: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw schoolError || new Error('School creation returned no data');
    }

    console.log('✅ School created:', school.id);

    // Step 3: Create profile (USING ADMIN CLIENT - bypasses RLS!)
    console.log('Step 3: Creating profile...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: userId,
        school_id: school.id,
        email: adminEmail,
        display_name: adminFullName,
        role: 'school'
      } as any);

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      // Cleanup: delete school and auth user
      await supabaseAdmin.from('schools').delete().eq('id', school.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw profileError;
    }

    console.log('✅ Profile created successfully!');
    console.log('🎉 Registration complete!');

    return NextResponse.json({
      success: true,
      message: 'School registration successful',
      userId,
      schoolId: school.id
    });

  } catch (error: any) {
    console.error('💥 Registration error:', error);

    let errorMessage = 'Registration failed';
    if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
      errorMessage = 'An account with this email already exists';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 400 }
    );
  }
}
