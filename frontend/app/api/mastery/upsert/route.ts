/**
 * Mastery Upsert API Endpoint
 * POST /api/mastery/upsert - Create or update ayah mastery level
 *
 * Created: 2025-10-20
 * Purpose: Teachers update student mastery levels for specific ayahs
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateUpsertMasteryRequest,
  canUpdateMastery,
} from '@/lib/validators/mastery';
import {
  UpsertMasteryResponse,
  MasteryErrorResponse,
  AyahMasteryWithDetails,
  MasteryLevel,
  isMasteryImprovement,
} from '@/lib/types/mastery';

// ============================================================================
// POST /api/mastery/upsert - Create or Update Mastery
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Initialize Supabase client with auth
    const supabase = createClient();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 3. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Check permissions (only teachers can update mastery)
    if (
      !canUpdateMastery({
        userId: user.id,
        userRole: profile.role,
        schoolId: profile.school_id,
      })
    ) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Only teachers can update mastery levels',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 5. Parse and validate request body
    const body = await request.json();
    const validation = validateUpsertMasteryRequest(body);

    if (!validation.success) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: validation.error || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { errors: validation.errors },
        },
        { status: 400 }
      );
    }

    const { student_id, script_id, ayah_id, level } = validation.data;

    // 6. Verify student exists and belongs to same school
    const { data: student } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('id', student_id)
      .single();

    if (!student) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Student not found',
          code: 'STUDENT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('school_id, display_name, email')
      .eq('user_id', student.user_id)
      .single();

    if (!studentProfile || studentProfile.school_id !== profile.school_id) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Student not found in your school',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Verify script exists
    const { data: script, error: scriptError } = await supabase
      .from('quran_scripts')
      .select('id, code, display_name')
      .eq('id', script_id)
      .single();

    if (scriptError || !script) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Script not found',
          code: 'SCRIPT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 8. Verify ayah exists
    const { data: ayah, error: ayahError } = await supabase
      .from('quran_ayahs')
      .select('id, surah, ayah, text')
      .eq('id', ayah_id)
      .eq('script_id', script_id)
      .single();

    if (ayahError || !ayah) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Ayah not found for this script',
          code: 'AYAH_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 9. Check if mastery record already exists (upsert behavior)
    const { data: existingMastery } = await supabase
      .from('ayah_mastery')
      .select('id, level')
      .eq('student_id', student_id)
      .eq('script_id', script_id)
      .eq('ayah_id', ayah_id)
      .single();

    let previousLevel: MasteryLevel | undefined;
    let improved = false;

    if (existingMastery) {
      // Update existing mastery record
      previousLevel = existingMastery.level as MasteryLevel;
      improved = isMasteryImprovement(previousLevel, level);

      const { data: updatedMastery, error: updateError } = await supabase
        .from('ayah_mastery')
        .update({
          level,
          last_updated: new Date().toISOString(),
        })
        .eq('id', existingMastery.id)
        .select()
        .single();

      if (updateError || !updatedMastery) {
        console.error('Mastery update error:', updateError);
        return NextResponse.json<MasteryErrorResponse>(
          {
            success: false,
            error: 'Failed to update mastery level',
            code: 'DATABASE_ERROR',
            details: { updateError },
          },
          { status: 500 }
        );
      }

      // Build detailed response
      const masteryWithDetails: AyahMasteryWithDetails = {
        ...updatedMastery,
        student: {
          id: student_id,
          display_name: studentProfile.display_name || 'Unknown',
          email: studentProfile.email,
        },
        script: {
          id: script.id,
          code: script.code,
          display_name: script.display_name,
        },
        ayah: {
          id: ayah.id,
          surah: ayah.surah,
          ayah: ayah.ayah,
          text: ayah.text,
        },
      };

      return NextResponse.json<UpsertMasteryResponse>(
        {
          success: true,
          data: {
            mastery: masteryWithDetails,
            previous_level: previousLevel,
            improved,
          },
          message: improved
            ? `Mastery level improved from ${previousLevel} to ${level}`
            : `Mastery level updated to ${level}`,
        },
        { status: 200 }
      );
    } else {
      // Create new mastery record
      const { data: newMastery, error: insertError } = await supabase
        .from('ayah_mastery')
        .insert({
          student_id,
          script_id,
          ayah_id,
          level,
        })
        .select()
        .single();

      if (insertError || !newMastery) {
        console.error('Mastery creation error:', insertError);
        return NextResponse.json<MasteryErrorResponse>(
          {
            success: false,
            error: 'Failed to create mastery record',
            code: 'DATABASE_ERROR',
            details: { insertError },
          },
          { status: 500 }
        );
      }

      // Build detailed response
      const masteryWithDetails: AyahMasteryWithDetails = {
        ...newMastery,
        student: {
          id: student_id,
          display_name: studentProfile.display_name || 'Unknown',
          email: studentProfile.email,
        },
        script: {
          id: script.id,
          code: script.code,
          display_name: script.display_name,
        },
        ayah: {
          id: ayah.id,
          surah: ayah.surah,
          ayah: ayah.ayah,
          text: ayah.text,
        },
      };

      return NextResponse.json<UpsertMasteryResponse>(
        {
          success: true,
          data: {
            mastery: masteryWithDetails,
            improved: level !== 'unknown', // First time setting is improvement if not unknown
          },
          message: `Mastery level set to ${level}`,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/mastery/upsert:', error);
    return NextResponse.json<MasteryErrorResponse>(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: { error: String(error) },
      },
      { status: 500 }
    );
  }
}
