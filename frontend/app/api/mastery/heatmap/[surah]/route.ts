/**
 * Surah Heatmap API Endpoint
 * GET /api/mastery/heatmap/:surah - Get mastery heatmap for a surah
 *
 * Created: 2025-10-20
 * Purpose: Generate color-coded mastery heatmap for all ayahs in a surah
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { canViewStudentMastery } from '@/lib/validators/mastery';
import {
  GetHeatmapResponse,
  MasteryErrorResponse,
  SurahMasteryData,
  AyahMasteryEntry,
  calculateMasterySummary,
  MASTERY_CONSTANTS,
  getSurahName,
  getAyahCount,
} from '@/lib/types/mastery';

// ============================================================================
// GET /api/mastery/heatmap/:surah - Get Surah Mastery Heatmap
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { surah: string } }
) {
  try {
    const surahNumber = parseInt(params.surah);

    // Validate surah number
    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Invalid surah number. Must be between 1 and 114',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');
    const script_id = searchParams.get('script_id') || undefined;

    if (!student_id) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'student_id query parameter is required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

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

    // 4. Verify student exists and belongs to same school
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
      .select('school_id')
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

    // 5. Check permissions
    const hasPermission = canViewStudentMastery(
      {
        userId: user.id,
        userRole: profile.role,
        schoolId: profile.school_id,
      },
      {
        targetStudentId: student_id,
        targetStudentSchoolId: studentProfile.school_id,
      }
    );

    if (!hasPermission) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: "Insufficient permissions to view this student's mastery heatmap",
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Get default script if not provided
    let targetScriptId = script_id;
    if (!targetScriptId) {
      const { data: defaultScript } = await supabase
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

    // 7. Get all ayahs for this surah
    const { data: ayahs, error: ayahsError } = await supabase
      .from('quran_ayahs')
      .select('id, surah, ayah, text')
      .eq('script_id', targetScriptId)
      .eq('surah', surahNumber)
      .order('ayah', { ascending: true });

    if (ayahsError || !ayahs || ayahs.length === 0) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: `No ayahs found for surah ${surahNumber} with this script`,
          code: 'AYAH_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 8. Get mastery records for this student and surah
    const ayahIds = ayahs.map((a) => a.id);
    const { data: masteryRecords } = await supabase
      .from('ayah_mastery')
      .select('*')
      .eq('student_id', student_id)
      .eq('script_id', targetScriptId)
      .in('ayah_id', ayahIds);

    // 9. Create mastery map for quick lookup
    const masteryMap = new Map<string, any>();
    (masteryRecords || []).forEach((record) => {
      masteryMap.set(record.ayah_id, record);
    });

    // 10. Build heatmap data (all ayahs with their mastery level)
    const masteryByAyah: AyahMasteryEntry[] = ayahs.map((ayah) => {
      const masteryRecord = masteryMap.get(ayah.id);
      return {
        ayah_number: ayah.ayah,
        ayah_id: ayah.id,
        level: masteryRecord?.level || 'unknown',
        last_updated: masteryRecord?.last_updated || new Date().toISOString(),
        ayah_text: ayah.text,
      };
    });

    // 11. Calculate summary
    const summary = calculateMasterySummary(masteryByAyah);

    // 12. Get surah info
    const surahName = getSurahName(surahNumber);
    const totalAyahs = getAyahCount(surahNumber) || ayahs.length;

    // 13. Build heatmap data
    const heatmapData: SurahMasteryData = {
      surah: surahNumber,
      surah_name: surahName,
      total_ayahs: totalAyahs,
      mastery_by_ayah: masteryByAyah,
      summary,
    };

    // 14. Return success response
    return NextResponse.json<GetHeatmapResponse>(
      {
        success: true,
        data: heatmapData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/mastery/heatmap/:surah:', error);
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
