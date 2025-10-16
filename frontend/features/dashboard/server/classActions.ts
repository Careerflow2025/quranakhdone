'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Helper to create authenticated Supabase client
async function getSupabaseClient() {
  const cookieStore = cookies();
  // In production, you'd get these from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        // Add any auth headers from cookies if needed
      }
    }
  });
}

export async function createClass(classData: {
  name: string;
  code?: string;
  schedule?: any;
  room?: string;
  capacity: number;
  semester?: string;
  color: string;
  schoolId: string;
}) {
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('classes')
      .insert({
        name: classData.name,
        code: classData.code,
        schedule: classData.schedule,
        room: classData.room,
        capacity: classData.capacity,
        semester: classData.semester,
        color: classData.color,
        school_id: classData.schoolId,
        active: true,
        display_order: 0
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error creating class:', error);
    return { success: false, error: 'Failed to create class' };
  }
}

export async function updateClass(
  classId: string,
  updates: Partial<{
    name: string;
    code: string;
    schedule: any;
    room: string;
    capacity: number;
    semester: string;
    color: string;
    active: boolean;
    display_order: number;
  }>
) {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = (await supabase
      .from('classes')
      .update(updates as any)
      .eq('id', classId)
      .select()
      .single()) as { data: any; error: any };

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating class:', error);
    return { success: false, error: 'Failed to update class' };
  }
}

export async function deleteClass(classId: string) {
  try {
    const supabase = await getSupabaseClient();

    const { error } = (await supabase
      .from('classes')
      .delete()
      .eq('id', classId)) as { error: any };

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting class:', error);
    return { success: false, error: 'Failed to delete class' };
  }
}

export async function getClasses(schoolId: string) {
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        enrollments (
          student_id,
          students (*)
        )
      `)
      .eq('school_id', schoolId)
      .eq('active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    
    // Transform the data to match our frontend structure
    const classes = data?.map(cls => ({
      id: cls.id,
      name: cls.name,
      code: cls.code,
      schedule: cls.schedule,
      room: cls.room,
      capacity: cls.capacity,
      semester: cls.semester,
      color: cls.color,
      active: cls.active,
      displayOrder: cls.display_order,
      studentCount: cls.enrollments?.length || 0,
      students: cls.enrollments?.map((e: any) => e.students) || []
    }));
    
    return { success: true, data: classes };
  } catch (error) {
    console.error('Error fetching classes:', error);
    return { success: false, error: 'Failed to fetch classes' };
  }
}

export async function addStudentToClass(studentId: string, classId: string, schoolId: string) {
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        class_id: classId,
        school_id: schoolId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error adding student to class:', error);
    return { success: false, error: 'Failed to add student to class' };
  }
}

export async function removeStudentFromClass(studentId: string, classId: string) {
  try {
    const supabase = await getSupabaseClient();

    const { error } = (await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('class_id', classId)) as { error: any };

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error removing student from class:', error);
    return { success: false, error: 'Failed to remove student from class' };
  }
}

export async function importStudents(students: any[], schoolId: string, userId: string) {
  try {
    const supabase = await getSupabaseClient();
    
    // Insert into temporary import table
    const { data, error } = await supabase
      .from('imported_students_temp')
      .insert(
        students.map(student => ({
          school_id: schoolId,
          user_id: userId,
          name: student.name,
          email: student.email,
          phone: student.phone,
          parent_name: student.parentName,
          parent_email: student.parentEmail,
          parent_phone: student.parentPhone,
          assigned: false
        }))
      )
      .select();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error importing students:', error);
    return { success: false, error: 'Failed to import students' };
  }
}

export async function getImportedStudents(userId: string, schoolId: string) {
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('imported_students_temp')
      .select('*')
      .eq('user_id', userId)
      .eq('school_id', schoolId)
      .order('imported_at', { ascending: false });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching imported students:', error);
    return { success: false, error: 'Failed to fetch imported students' };
  }
}

export async function clearImportedStudents(userId: string, schoolId: string) {
  try {
    const supabase = await getSupabaseClient();

    const { error } = (await supabase
      .from('imported_students_temp')
      .delete()
      .eq('user_id', userId)
      .eq('school_id', schoolId)) as { error: any };

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error clearing imported students:', error);
    return { success: false, error: 'Failed to clear imported students' };
  }
}

export async function updateClassOrder(classIds: string[]) {
  try {
    const supabase = await getSupabaseClient();

    // Update display_order for each class
    const updates = classIds.map((id, index) =>
      supabase
        .from('classes')
        .update({ display_order: index } as any)
        .eq('id', id)
    );

    await Promise.all(updates);

    return { success: true };
  } catch (error) {
    console.error('Error updating class order:', error);
    return { success: false, error: 'Failed to update class order' };
  }
}

export async function logDashboardActivity(
  schoolId: string,
  teacherId: string,
  actionType: string,
  metadata?: any
) {
  try {
    const supabase = await getSupabaseClient();
    
    const { error } = await supabase
      .from('teacher_dashboard_analytics')
      .insert({
        school_id: schoolId,
        teacher_id: teacherId,
        action_type: actionType,
        metadata: metadata || {}
      });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false, error: 'Failed to log activity' };
  }
}