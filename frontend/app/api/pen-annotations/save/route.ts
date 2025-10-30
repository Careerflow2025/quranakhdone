import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PenAnnotationData {
  studentId: string;
  teacherId: string;
  pageNumber: number;
  scriptId: string;
  drawingData: any; // react-sketch-canvas exported JSON format
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get Bearer token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Get the teacher profile
    const { data: teacherData, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('id, school_id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacherData) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const body: PenAnnotationData = await req.json();

    // Validate student belongs to the same school
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('students')
      .select('school_id')
      .eq('id', body.studentId)
      .single();

    if (studentError || !studentData) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (studentData.school_id !== teacherData.school_id) {
      return NextResponse.json({ error: 'Student not in your school' }, { status: 403 });
    }

    // Store react-sketch-canvas exported data directly
    const drawingData = body.drawingData;

    // Check if an annotation already exists for this page
    const { data: existingAnnotation } = await supabaseAdmin
      .from('pen_annotations')
      .select('id')
      .eq('student_id', body.studentId)
      .eq('teacher_id', teacherData.id)
      .eq('page_number', body.pageNumber)
      .eq('script_id', body.scriptId)
      .single();

    let result;
    if (existingAnnotation) {
      // Update existing annotation
      const { data, error } = await supabaseAdmin
        .from('pen_annotations')
        .update({
          drawing_data: drawingData,
          stroke_color: '#FF0000', // Default color (not used by react-sketch-canvas)
          stroke_width: 2, // Default width (not used by react-sketch-canvas)
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAnnotation.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new annotation
      const { data, error } = await supabaseAdmin
        .from('pen_annotations')
        .insert({
          student_id: body.studentId,
          teacher_id: teacherData.id,
          school_id: teacherData.school_id,
          page_number: body.pageNumber,
          script_id: body.scriptId,
          drawing_data: drawingData,
          stroke_color: '#FF0000', // Default color (not used by react-sketch-canvas)
          stroke_width: 2 // Default width (not used by react-sketch-canvas)
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log('Pen annotation saved successfully:', result.id);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error saving pen annotation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save annotation' },
      { status: 500 }
    );
  }
}