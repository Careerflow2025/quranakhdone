/**
 * Student Mastery API Endpoint
 * GET /api/mastery/student/:id - Get complete mastery overview for a student
 *
 * Created: 2025-10-20
 * Purpose: View student's complete mastery data with summary and progress
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { canViewStudentMastery } from '@/lib/validators/mastery';
import {
  GetStudentMasteryResponse,
  MasteryErrorResponse,
  StudentMasteryOverview,
  AyahMasteryWithDetails,
  SurahProgress,
  calculateMasterySummary,
  MASTERY_CONSTANTS,
} from '@/lib/types/mastery';

// ============================================================================
// GET /api/mastery/student/:id - Get Student Mastery Data
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const script_id = searchParams.get('script_id') || undefined;
    const surah = searchParams.get('surah')
      ? parseInt(searchParams.get('surah')!)
      : undefined;

    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get authorization header and extract token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Missing authorization header',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 3. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Invalid token',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 4. Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
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

    // 5. Verify student exists and belongs to same school
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('id', studentId)
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

    const { data: studentProfile } = await supabaseAdmin
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
    const hasPermission = canViewStudentMastery(
      {
        userId: user.id,
        userRole: profile.role,
        schoolId: profile.school_id,
      },
      {
        targetStudentId: studentId,
        targetStudentSchoolId: studentProfile.school_id,
      }
    );

    if (!hasPermission) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: "Insufficient permissions to view this student's mastery data",
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Get default script if not provided
    let targetScriptId = script_id;
    if (!targetScriptId) {
      const { data: defaultScript } = await supabaseAdmin
        .from('quran_scripts')
        .select('id')
        .eq('code', MASTERY_CONSTANTS.DEFAULT_SCRIPT)
        .single();
      targetScriptId = defaultScript?.id;
    }

    if (!targetScriptId) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'No valid script ID found',
          code: 'SCRIPT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 8. Get script details
    const { data: script } = await supabaseAdmin
      .from('quran_scripts')
      .select('id, code, display_name')
      .eq('id', targetScriptId)
      .single();

    if (!script) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Script not found',
          code: 'SCRIPT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 9. Build mastery query
    let masteryQuery = supabaseAdmin
      .from('ayah_mastery')
      .select(
        `
        *,
        ayah:ayah_id(id, surah, ayah, text)
      `
      )
      .eq('student_id', studentId)
      .eq('script_id', targetScriptId);

    // Filter by surah if specified
    if (surah) {
      // Need to filter by ayah.surah, but can't do nested filtering directly
      // Will filter after fetching
    }

    masteryQuery = masteryQuery.order('last_updated', { ascending: false });

    // 10. Execute query
    const { data: masteryRecords, error: masteryError } = await masteryQuery;

    if (masteryError) {
      console.error('Mastery fetch error:', masteryError);
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch mastery data',
          code: 'DATABASE_ERROR',
          details: { masteryError },
        },
        { status: 500 }
      );
    }

    // 11. Process mastery records
    const allMasteryRecords = (masteryRecords || []).map((record: any) => ({
      id: record.id,
      student_id: record.student_id,
      script_id: record.script_id,
      ayah_id: record.ayah_id,
      level: record.level,
      last_updated: record.last_updated,
      ayah: record.ayah
        ? {
            id: record.ayah.id,
            surah: record.ayah.surah,
            ayah: record.ayah.ayah,
            text: record.ayah.text,
          }
        : undefined,
    }));

    // Filter by surah if specified
    const filteredMasteryRecords = surah
      ? allMasteryRecords.filter((r) => r.ayah?.surah === surah)
      : allMasteryRecords;

    // 12. Calculate mastery summary
    const masterySummary = calculateMasterySummary(filteredMasteryRecords);

    // 13. Get recent updates (last 10)
    const recentUpdates: AyahMasteryWithDetails[] = filteredMasteryRecords
      .slice(0, 10)
      .map((record) => ({
        ...record,
        student: {
          id: studentId,
          display_name: studentProfile.display_name || 'Unknown',
          email: studentProfile.email,
        },
        script: {
          id: script.id,
          code: script.code,
          display_name: script.display_name,
        },
      }));

    // 14. Calculate surahs progress
    const surahsMap = new Map<number, AyahMasteryWithDetails[]>();
    filteredMasteryRecords.forEach((record) => {
      const surahNum = record.ayah?.surah;
      if (surahNum) {
        if (!surahsMap.has(surahNum)) {
          surahsMap.set(surahNum, []);
        }
        surahsMap.get(surahNum)!.push({
          ...record,
          student: {
            id: studentId,
            display_name: studentProfile.display_name || 'Unknown',
            email: studentProfile.email,
          },
          script: {
            id: script.id,
            code: script.code,
            display_name: script.display_name,
          },
        });
      }
    });

    const surahsProgress: SurahProgress[] = Array.from(surahsMap.entries())
      .map(([surahNum, records]) => {
        const summary = calculateMasterySummary(records);
        return {
          surah: surahNum,
          total_ayahs: records.length,
          mastered_count: summary.mastered_count,
          proficient_count: summary.proficient_count,
          learning_count: summary.learning_count,
          unknown_count: summary.unknown_count,
          completion_percentage: summary.overall_progress_percentage,
        };
      })
      .sort((a, b) => b.completion_percentage - a.completion_percentage);

    // 15. Build overview
    const overview: StudentMasteryOverview = {
      student_id: studentId,
      student_name: studentProfile.display_name || 'Unknown',
      script_id: script.id,
      script_code: script.code,
      total_ayahs_tracked: filteredMasteryRecords.length,
      mastery_summary: masterySummary,
      recent_updates: recentUpdates,
      surahs_progress: surahsProgress,
    };

    // 16. Return success response
    return NextResponse.json<GetStudentMasteryResponse>(
      {
        success: true,
        data: overview,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/mastery/student/:id:', error);
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
