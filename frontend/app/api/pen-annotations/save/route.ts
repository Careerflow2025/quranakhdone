import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PenAnnotationData {
  studentId: string;
  teacherId: string;
  pageNumber: number;
  scriptId: string;
  paths: {
    points: { x: number; y: number }[]; // Percentage-based coordinates (0-100)
    color: string;
    width: number;
  }[];
  containerDimensions: {
    width: number;
    height: number;
  };
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the teacher profile
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('id, school_id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacherData) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const body: PenAnnotationData = await req.json();

    // Validate student belongs to the same school
    const { data: studentData, error: studentError } = await supabase
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

    // Prepare the drawing data with percentage-based coordinates
    const drawingData = {
      version: '2.0', // New version without Fabric.js
      paths: body.paths,
      containerDimensions: body.containerDimensions,
      timestamp: new Date().toISOString()
    };

    // Check if an annotation already exists for this page
    const { data: existingAnnotation } = await supabase
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
      const { data, error } = await supabase
        .from('pen_annotations')
        .update({
          drawing_data: drawingData,
          stroke_color: body.paths[body.paths.length - 1]?.color || '#FF0000',
          stroke_width: body.paths[body.paths.length - 1]?.width || 2,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAnnotation.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new annotation
      const { data, error } = await supabase
        .from('pen_annotations')
        .insert({
          student_id: body.studentId,
          teacher_id: teacherData.id,
          school_id: teacherData.school_id,
          page_number: body.pageNumber,
          script_id: body.scriptId,
          drawing_data: drawingData,
          stroke_color: body.paths[0]?.color || '#FF0000',
          stroke_width: body.paths[0]?.width || 2
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