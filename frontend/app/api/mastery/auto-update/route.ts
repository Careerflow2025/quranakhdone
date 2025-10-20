/**
 * Auto-Update Mastery API Endpoint
 * POST /api/mastery/auto-update - Auto-update mastery based on assignment completion
 *
 * Created: 2025-10-20
 * Purpose: Automatically update ayah mastery levels when assignments are graded
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateAutoUpdateMasteryRequest,
  canAutoUpdateMastery,
} from '@/lib/validators/mastery';
import {
  UpsertMasteryResponse,
  MasteryErrorResponse,
  AyahMasteryWithDetails,
  MasteryLevel,
  getMasteryLevelFromScore,
  isMasteryImprovement,
  MASTERY_CONSTANTS,
} from '@/lib/types/mastery';
import { calculateWeightedAverage } from '@/lib/types/gradebook';

// ============================================================================
// POST /api/mastery/auto-update - Auto-Update Mastery
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

    // 4. Parse and validate request body
    const body = await request.json();
    const validation = validateAutoUpdateMasteryRequest(body);

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

    const { student_id, assignment_id, new_level } = validation.data;

    // 5. Verify student exists and belongs to same school
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

    // 6. Check permissions
    if (!canAutoUpdateMastery({ userId: user.id, userRole: profile.role, schoolId: profile.school_id }, studentProfile.school_id)) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Only teachers can auto-update mastery levels',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Verify assignment exists
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, school_id, student_id, status')
      .eq('id', assignment_id)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Assignment not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (assignment.school_id !== profile.school_id) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Assignment not found in your school',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    if (assignment.student_id !== student_id) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Assignment does not belong to this student',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // 8. Determine mastery level
    let masteryLevel: MasteryLevel;

    if (new_level) {
      // Use explicitly provided level
      masteryLevel = new_level;
    } else {
      // Calculate from assignment grades
      const { data: grades } = await supabase
        .from('grades')
        .select(`
          score,
          max_score,
          criterion:criterion_id(weight, max_score)
        `)
        .eq('assignment_id', assignment_id)
        .eq('student_id', student_id);

      if (!grades || grades.length === 0) {
        return NextResponse.json<MasteryErrorResponse>(
          {
            success: false,
            error: 'No grades found for this assignment. Cannot auto-calculate mastery level',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      // Calculate weighted average
      const gradesWithDetails = grades.map((g: any) => ({
        score: g.score,
        max_score: g.max_score,
        criterion: {
          weight: g.criterion.weight,
          max_score: g.criterion.max_score,
        },
      }));

      const weightedAverage = calculateWeightedAverage(gradesWithDetails);
      masteryLevel = getMasteryLevelFromScore(weightedAverage);
    }

    // 9. Find ayahs associated with this assignment
    // Assignments can reference ayahs via highlights
    const { data: highlights } = await supabase
      .from('highlights')
      .select('ayah_id, script_id')
      .eq('student_id', student_id);

    if (!highlights || highlights.length === 0) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'No highlights found for this assignment. Cannot determine which ayahs to update',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 10. Use default script or first found script
    const scriptId =
      highlights[0].script_id ||
      (await supabase
        .from('quran_scripts')
        .select('id')
        .eq('code', MASTERY_CONSTANTS.DEFAULT_SCRIPT)
        .single()
        .then((res) => res.data?.id));

    if (!scriptId) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'No valid script found',
          code: 'SCRIPT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 11. Get script details
    const { data: script } = await supabase
      .from('quran_scripts')
      .select('id, code, display_name')
      .eq('id', scriptId)
      .single();

    // 12. Update mastery for all unique ayahs
    const uniqueAyahIds = [...new Set(highlights.map((h) => h.ayah_id))];
    const updatedMasteries: AyahMasteryWithDetails[] = [];
    let improvementCount = 0;

    for (const ayahId of uniqueAyahIds) {
      // Check if mastery exists
      const { data: existingMastery } = await supabase
        .from('ayah_mastery')
        .select('id, level')
        .eq('student_id', student_id)
        .eq('script_id', scriptId)
        .eq('ayah_id', ayahId)
        .single();

      let updated;
      if (existingMastery) {
        // Update only if improvement
        const isImprovement = isMasteryImprovement(
          existingMastery.level as MasteryLevel,
          masteryLevel
        );

        if (isImprovement) {
          const { data: updatedMastery } = await supabase
            .from('ayah_mastery')
            .update({
              level: masteryLevel,
              last_updated: new Date().toISOString(),
            })
            .eq('id', existingMastery.id)
            .select()
            .single();

          updated = updatedMastery;
          improvementCount++;
        } else {
          updated = { ...existingMastery, student_id, script_id, ayah_id: ayahId };
        }
      } else {
        // Create new mastery record
        const { data: newMastery } = await supabase
          .from('ayah_mastery')
          .insert({
            student_id,
            script_id: scriptId,
            ayah_id: ayahId,
            level: masteryLevel,
          })
          .select()
          .single();

        updated = newMastery;
        if (masteryLevel !== 'unknown') {
          improvementCount++;
        }
      }

      // Get ayah details
      const { data: ayah } = await supabase
        .from('quran_ayahs')
        .select('id, surah, ayah, text')
        .eq('id', ayahId)
        .single();

      if (updated && ayah) {
        updatedMasteries.push({
          ...updated,
          student: {
            id: student_id,
            display_name: studentProfile.display_name || 'Unknown',
            email: studentProfile.email,
          },
          script: script
            ? {
                id: script.id,
                code: script.code,
                display_name: script.display_name,
              }
            : undefined,
          ayah: {
            id: ayah.id,
            surah: ayah.surah,
            ayah: ayah.ayah,
            text: ayah.text,
          },
        });
      }
    }

    // 13. Return success response
    return NextResponse.json<UpsertMasteryResponse>(
      {
        success: true,
        data: {
          mastery: updatedMasteries[0] || ({} as AyahMasteryWithDetails),
          improved: improvementCount > 0,
        },
        message: `Auto-updated mastery for ${updatedMasteries.length} ayah(s) to ${masteryLevel}. ${improvementCount} improvement(s) recorded`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/mastery/auto-update:', error);
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
