import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/school/settings - Fetch school settings
export async function GET(req: NextRequest) {
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

    // Get user's school_id from profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.school_id) {
      return NextResponse.json(
        { error: 'No school found for user' },
        { status: 404 }
      );
    }

    // Only owner/admin can access settings
    if (profile.role !== 'owner' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only owners and admins can access settings' },
        { status: 403 }
      );
    }

    // Fetch school info
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('*')
      .eq('id', profile.school_id)
      .single();

    if (schoolError) {
      return NextResponse.json(
        { error: 'Failed to fetch school info', details: schoolError.message },
        { status: 500 }
      );
    }

    // Fetch school_settings (may not exist yet)
    const { data: schoolSettings, error: settingsError } = await supabaseAdmin
      .from('school_settings')
      .select('*')
      .eq('school_id', profile.school_id)
      .single();

    // It's OK if school_settings doesn't exist yet
    const settings = schoolSettings?.settings || {};

    return NextResponse.json({
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
          logo_url: school.logo_url,
          timezone: school.timezone,
          created_at: school.created_at,
          updated_at: school.updated_at,
        },
        settings: {
          ...settings,
          // Provide defaults for common settings
          email: settings.email || '',
          phone: settings.phone || '',
          address: settings.address || '',
          website: settings.website || '',
          description: settings.description || '',
          academic_year_start: settings.academic_year_start || '',
          academic_year_end: settings.academic_year_end || '',
        }
      }
    });

  } catch (error: any) {
    console.error('Error in GET /api/school/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/school/settings - Update school settings
export async function PATCH(req: NextRequest) {
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

    // Get user's school_id from profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.school_id) {
      return NextResponse.json(
        { error: 'No school found for user' },
        { status: 404 }
      );
    }

    // Only owner/admin can update settings
    if (profile.role !== 'owner' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only owners and admins can update settings' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { school, settings } = body;

    // Update schools table if school data provided
    if (school) {
      const schoolUpdates: any = {};

      if (school.name !== undefined) schoolUpdates.name = school.name;
      if (school.logo_url !== undefined) schoolUpdates.logo_url = school.logo_url;
      if (school.timezone !== undefined) schoolUpdates.timezone = school.timezone;

      if (Object.keys(schoolUpdates).length > 0) {
        schoolUpdates.updated_at = new Date().toISOString();

        const { error: updateError } = await supabaseAdmin
          .from('schools')
          .update(schoolUpdates)
          .eq('id', profile.school_id);

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to update school info', details: updateError.message },
            { status: 500 }
          );
        }
      }
    }

    // Update school_settings table if settings data provided
    if (settings) {
      // Check if school_settings row exists
      const { data: existingSettings } = await supabaseAdmin
        .from('school_settings')
        .select('id')
        .eq('school_id', profile.school_id)
        .single();

      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabaseAdmin
          .from('school_settings')
          .update({
            settings: settings,
            updated_at: new Date().toISOString()
          })
          .eq('school_id', profile.school_id);

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to update settings', details: updateError.message },
            { status: 500 }
          );
        }
      } else {
        // Create new settings row
        const { error: insertError } = await supabaseAdmin
          .from('school_settings')
          .insert({
            school_id: profile.school_id,
            settings: settings
          });

        if (insertError) {
          return NextResponse.json(
            { error: 'Failed to create settings', details: insertError.message },
            { status: 500 }
          );
        }
      }
    }

    // Fetch updated data to return
    const { data: updatedSchool } = await supabaseAdmin
      .from('schools')
      .select('*')
      .eq('id', profile.school_id)
      .single();

    const { data: updatedSettings } = await supabaseAdmin
      .from('school_settings')
      .select('*')
      .eq('school_id', profile.school_id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        school: updatedSchool,
        settings: updatedSettings?.settings || {}
      }
    });

  } catch (error: any) {
    console.error('Error in PATCH /api/school/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
