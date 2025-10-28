/**
 * School Mastery API Endpoint
 * GET /api/mastery/school - Get mastery data for all students in school
 *
 * Created: 2025-10-28
 * Purpose: School admins/owners view all mastery data across the school
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  MasteryErrorResponse,
  calculateMasterySummary,
  MASTERY_CONSTANTS,
} from '@/lib/types/mastery';

// ============================================================================
// Type Definitions
// ============================================================================

interface StudentMasterySummary {
  student_id: string;
  student_name: string;
  student_email: string;
  total_ayahs_tracked: number;
  mastered_count: number;
  proficient_count: number;
  learning_count: number;
  unknown_count: number;
  overall_progress_percentage: number;
  last_updated: string;
}

interface SchoolMasteryData {
  total_students_with_mastery: number;
  total_ayahs_tracked: number;
  school_wide_summary: {
    mastered_count: number;
    proficient_count: number;
    learning_count: number;
    unknown_count: number;
    overall_progress_percentage: number;
  };
  students: StudentMasterySummary[];
  recent_updates: Array<{
    student_name: string;
    ayah_reference: string;
    level: string;
    updated_at: string;
  }>;
}

interface SchoolMasteryResponse {
  success: boolean;
  data: SchoolMasteryData;
}

// ============================================================================
// GET /api/mastery/school - Get School-wide Mastery Data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
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

    // 5. Check permissions (only school admins/owners)
    if (!['owner', 'admin'].includes(profile.role)) {
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Only school admins/owners can access school-wide mastery data',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Get query parameters
    const { searchParams } = new URL(request.url);
    const script_id = searchParams.get('script_id') || undefined;

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

    // 8. Get all students in the school
    const { data: allStudents, error: studentsError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        user_id,
        profiles:user_id (
          school_id,
          display_name,
          email
        )
      `);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch students',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }

    // 9. Filter students by school
    const schoolStudents = (allStudents || []).filter(
      (s: any) => s.profiles?.school_id === profile.school_id
    );

    // 10. Get mastery data for all school students
    const studentIds = schoolStudents.map((s: any) => s.id);

    const { data: allMasteryRecords, error: masteryError } = await supabaseAdmin
      .from('ayah_mastery')
      .select(`
        id,
        student_id,
        script_id,
        ayah_id,
        level,
        last_updated,
        ayah:ayah_id (
          id,
          surah,
          ayah,
          text
        )
      `)
      .eq('script_id', targetScriptId)
      .in('student_id', studentIds)
      .order('last_updated', { ascending: false });

    if (masteryError) {
      console.error('Error fetching mastery records:', masteryError);
      return NextResponse.json<MasteryErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch mastery data',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }

    // 11. Group mastery records by student
    const studentMasteryMap = new Map<string, any[]>();
    (allMasteryRecords || []).forEach((record: any) => {
      if (!studentMasteryMap.has(record.student_id)) {
        studentMasteryMap.set(record.student_id, []);
      }
      studentMasteryMap.get(record.student_id)!.push(record);
    });

    // 12. Calculate summary for each student
    const studentSummaries: StudentMasterySummary[] = schoolStudents
      .map((student: any) => {
        const studentRecords = studentMasteryMap.get(student.id) || [];
        const summary = calculateMasterySummary(studentRecords);

        return {
          student_id: student.id,
          student_name: student.profiles?.display_name || 'Unknown',
          student_email: student.profiles?.email || '',
          total_ayahs_tracked: studentRecords.length,
          mastered_count: summary.mastered_count,
          proficient_count: summary.proficient_count,
          learning_count: summary.learning_count,
          unknown_count: summary.unknown_count,
          overall_progress_percentage: summary.overall_progress_percentage,
          last_updated: studentRecords[0]?.last_updated || new Date().toISOString(),
        };
      })
      .filter((s: StudentMasterySummary) => s.total_ayahs_tracked > 0) // Only include students with mastery data
      .sort((a: StudentMasterySummary, b: StudentMasterySummary) =>
        b.overall_progress_percentage - a.overall_progress_percentage
      );

    // 13. Calculate school-wide summary
    const allRecordsForSummary = allMasteryRecords || [];
    const schoolWideSummary = calculateMasterySummary(allRecordsForSummary);

    // 14. Get recent updates (last 20)
    const recentUpdates = (allMasteryRecords || [])
      .slice(0, 20)
      .map((record: any) => {
        const student = schoolStudents.find((s: any) => s.id === record.student_id);
        return {
          student_name: student?.profiles?.display_name || 'Unknown',
          ayah_reference: record.ayah
            ? `${record.ayah.surah}:${record.ayah.ayah}`
            : 'Unknown',
          level: record.level,
          updated_at: record.last_updated,
        };
      });

    // 15. Build response
    const responseData: SchoolMasteryData = {
      total_students_with_mastery: studentSummaries.length,
      total_ayahs_tracked: allRecordsForSummary.length,
      school_wide_summary: {
        mastered_count: schoolWideSummary.mastered_count,
        proficient_count: schoolWideSummary.proficient_count,
        learning_count: schoolWideSummary.learning_count,
        unknown_count: schoolWideSummary.unknown_count,
        overall_progress_percentage: schoolWideSummary.overall_progress_percentage,
      },
      students: studentSummaries,
      recent_updates: recentUpdates,
    };

    // 16. Return success response
    return NextResponse.json<SchoolMasteryResponse>(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/mastery/school:', error);
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
