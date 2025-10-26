import { NextResponse } from 'next/server';
import { createAdminSb } from '@/lib/supabase/server';

/**
 * POST /api/students/lock-script
 *
 * Permanently locks a Quran script (Qira'at version) for a student.
 * Once locked, this cannot be changed - it's a one-time selection.
 *
 * Body:
 * - studentId: UUID of the student
 * - scriptId: ID of the Quran script (e.g., 'uthmani-hafs', 'warsh', etc.)
 *
 * Note: Uses admin client to bypass RLS since teacher access is verified on frontend
 */
export async function POST(req: Request) {
  try {
    const sb = createAdminSb();

    // Parse request body
    const { studentId, scriptId } = await req.json();

    // Validate inputs
    if (!studentId || !scriptId) {
      return NextResponse.json(
        { error: 'studentId and scriptId are required' },
        { status: 400 }
      );
    }

    console.log('🔒 Locking script for student:', studentId, 'Script:', scriptId);

    // STEP 1: Verify the script exists in quran_scripts table
    const { data: scriptExists, error: scriptError } = await sb
      .from('quran_scripts')
      .select('id, code, display_name')
      .eq('code', scriptId)
      .single();

    if (scriptError || !scriptExists) {
      console.error('❌ Invalid script ID:', scriptId);
      return NextResponse.json(
        { error: `Invalid script ID: ${scriptId}` },
        { status: 400 }
      );
    }

    console.log('✅ Script exists:', scriptExists.display_name);

    // STEP 2: Check if student already has a locked script
    const { data: existingStudent, error: checkError } = await sb
      .from('students')
      .select('id, preferred_script_id')
      .eq('id', studentId)
      .single();

    if (checkError) {
      console.error('❌ Error checking student:', checkError);
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // If already locked, prevent changes
    if (existingStudent.preferred_script_id) {
      console.warn('⚠️ Attempt to change locked script for student:', studentId);
      return NextResponse.json(
        { error: 'Script is already locked and cannot be changed' },
        { status: 403 }
      );
    }

    // STEP 3: Lock the script (permanently set preferred_script_id)
    const { data: updated, error: updateError } = await sb
      .from('students')
      .update({
        preferred_script_id: scriptExists.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select('id, preferred_script_id')
      .single();

    if (updateError) {
      console.error('❌ Error updating student:', updateError);
      return NextResponse.json(
        { error: 'Failed to lock script' },
        { status: 500 }
      );
    }

    console.log('✅ Script locked successfully for student:', studentId);

    return NextResponse.json({
      success: true,
      message: 'Script locked permanently',
      data: {
        studentId: updated.id,
        preferredScriptId: updated.preferred_script_id,
        scriptName: scriptExists.display_name,
        locked: true
      }
    });

  } catch (err: any) {
    console.error('❌ Unexpected error in lock-script API:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
