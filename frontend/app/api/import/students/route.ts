import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { parseCsv } from '@/features/admin/imports/parseCsv';
import { StudentCsvRow } from '@/features/admin/imports/schemas';

interface ImportResult {
  inserted: number;
  skipped: number;
  enrolled: number;
  errors: Array<{ row: number; reason: string }>;
  credentials: Array<{ email: string; password: string; name: string; type: 'student' | 'parent' }>;
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const body = await req.formData();
    const file = body.get('file') as File | null;
    const schoolId = body.get('school_id') as string | null;

    if (!file || !schoolId) {
      return NextResponse.json({ error: 'Missing file or school_id' }, { status: 400 });
    }

    const csv = await file.text();
    const rows = parseCsv<StudentCsvRow>(csv).map(r => StudentCsvRow.parse(r));

    const results: ImportResult = {
      inserted: 0,
      skipped: 0,
      enrolled: 0,
      errors: [],
      credentials: []
    };

    // ============================================================================
    // PHASE 1: Validate all class codes exist (fail fast if any class is missing)
    // ============================================================================
    const uniqueClassCodes = [...new Set(rows.map(r => r.class_code))];
    const { data: classesData, error: classesError } = await supabaseAdmin
      .from('classes')
      .select('id, code')
      .eq('school_id', schoolId)
      .in('code', uniqueClassCodes) as { data: Array<{ id: string; code: string }> | null; error: any };

    if (classesError) {
      return NextResponse.json({ error: classesError.message }, { status: 400 });
    }

    const classMap = new Map(classesData?.map(c => [c.code, c.id]) || []);
    const missingClasses = uniqueClassCodes.filter(code => !classMap.has(code));

    if (missingClasses.length > 0) {
      return NextResponse.json({
        error: `Class codes not found: ${missingClasses.join(', ')}`
      }, { status: 400 });
    }

    // ============================================================================
    // PHASE 2: Process parents and students in optimized batches
    // ============================================================================

    // Track all unique parent emails
    const uniqueParents = new Map<string, { name: string; email: string }>();
    rows.forEach(r => {
      if (!uniqueParents.has(r.parent_email)) {
        uniqueParents.set(r.parent_email, {
          name: r.parent_name,
          email: r.parent_email
        });
      }
    });

    // Check which parents already exist in the system
    const parentEmails = Array.from(uniqueParents.keys());
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    const existingParentEmails = new Set(
      existingAuthUsers?.users?.filter(u => parentEmails.includes(u.email || '')).map(u => u.email) || []
    );

    // Create auth users for new parents (batch operation via Promise.all)
    const newParents = Array.from(uniqueParents.values()).filter(p => !existingParentEmails.has(p.email));
    const parentAuthResults = await Promise.all(
      newParents.map(async (parent) => {
        try {
          const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: parent.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              role: 'parent',
              display_name: parent.name,
              school_id: schoolId
            }
          });

          if (authError) throw authError;

          return {
            success: true,
            email: parent.email,
            userId: authData.user.id,
            password: tempPassword,
            name: parent.name
          };
        } catch (error: any) {
          return {
            success: false,
            email: parent.email,
            error: error.message
          };
        }
      })
    );

    // Get all parent user IDs (existing + newly created)
    const { data: allAuthUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    const parentEmailToUserId = new Map(
      allAuthUsers?.users
        ?.filter(u => parentEmails.includes(u.email || ''))
        .map(u => [u.email!, u.id]) || []
    );

    // Batch insert profiles for new parents
    const parentProfiles = parentAuthResults
      .filter(r => r.success)
      .map(r => ({
        user_id: r.userId!,
        email: r.email,
        display_name: newParents.find(p => p.email === r.email)!.name,
        role: 'parent' as const,
        school_id: schoolId
      }));

    if (parentProfiles.length > 0) {
      await supabaseAdmin.from('profiles').upsert(parentProfiles as any);
    }

    // Batch create parent records (ensure parents table has records)
    const { data: existingParents } = await supabaseAdmin
      .from('parents')
      .select('user_id, id')
      .in('user_id', Array.from(parentEmailToUserId.values())) as { data: Array<{ user_id: string; id: string }> | null };

    const existingParentUserIds = new Set(existingParents?.map(p => p.user_id) || []);
    const parentUserIdToParentId = new Map(existingParents?.map(p => [p.user_id, p.id]) || []);

    const newParentRecords = Array.from(parentEmailToUserId.values())
      .filter(userId => !existingParentUserIds.has(userId))
      .map(userId => ({ user_id: userId }));

    if (newParentRecords.length > 0) {
      const { data: createdParents } = await supabaseAdmin
        .from('parents')
        .insert(newParentRecords as any)
        .select('id, user_id') as { data: Array<{ id: string; user_id: string }> | null };

      createdParents?.forEach(p => {
        parentUserIdToParentId.set(p.user_id, p.id);
      });
    }

    // Save parent credentials
    results.credentials.push(...parentAuthResults
      .filter(r => r.success)
      .map(r => ({
        email: r.email,
        password: r.password!,
        name: r.name!,
        type: 'parent' as const
      }))
    );

    // ============================================================================
    // PHASE 3: Create students with batch operations
    // ============================================================================

    const studentAuthResults = await Promise.all(
      rows.map(async (r, index) => {
        try {
          const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
          const displayName = `${r.first_name} ${r.last_name}`;

          // Generate unique email for student (using index to ensure uniqueness)
          const studentEmail = `${r.first_name.toLowerCase()}.${r.last_name.toLowerCase()}.${index}@${schoolId}.student`;

          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: studentEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              role: 'student',
              display_name: displayName,
              school_id: schoolId
            }
          });

          if (authError) throw authError;

          return {
            success: true,
            userId: authData.user.id,
            email: studentEmail,
            password: tempPassword,
            displayName: displayName,
            rowIndex: index,
            csvRow: r
          };
        } catch (error: any) {
          results.errors.push({
            row: index + 1,
            reason: `Failed to create auth user: ${error.message}`
          });
          return {
            success: false,
            rowIndex: index
          };
        }
      })
    );

    const successfulStudents = studentAuthResults.filter(r => r.success);

    // Batch insert student profiles
    const studentProfiles = successfulStudents.map(s => ({
      user_id: s.userId!,
      email: s.email!,
      display_name: s.displayName!,
      role: 'student' as const,
      school_id: schoolId
    }));

    if (studentProfiles.length > 0) {
      await supabaseAdmin.from('profiles').upsert(studentProfiles as any);
    }

    // Batch insert student records
    const studentRecords = successfulStudents.map(s => {
      const csvRow = s.csvRow!;
      let dobValue = null;

      // Parse date_of_birth if provided
      if (csvRow.date_of_birth && csvRow.date_of_birth !== '') {
        dobValue = csvRow.date_of_birth;
      }

      const genderValue = (csvRow.gender === 'male' || csvRow.gender === 'female') ? csvRow.gender : null;
      const gradeValue = csvRow.grade && csvRow.grade !== '' ? csvRow.grade : null;

      return {
        user_id: s.userId!,
        school_id: schoolId,
        dob: dobValue,
        gender: genderValue,
        grade: gradeValue,
        active: true
      };
    });

    const { data: createdStudents, error: studentsError} = await supabaseAdmin
      .from('students')
      .insert(studentRecords as any)
      .select('id, user_id') as { data: Array<{ id: string; user_id: string }> | null; error: any };

    if (studentsError) {
      // Cleanup: Delete auth users if student creation fails
      await Promise.all(
        successfulStudents.map(s => supabaseAdmin.auth.admin.deleteUser(s.userId!))
      );
      return NextResponse.json({ error: studentsError.message }, { status: 400 });
    }

    results.inserted = createdStudents?.length || 0;

    // Create map of user_id to student_id
    const userIdToStudentId = new Map(createdStudents?.map(s => [s.user_id, s.id]) || []);

    // ============================================================================
    // PHASE 4: Create parent-student links and class enrollments (batch)
    // ============================================================================

    const parentStudentLinks: Array<{ parent_id: string; student_id: string }> = [];
    const classEnrollments: Array<{ class_id: string; student_id: string }> = [];

    successfulStudents.forEach(s => {
      const csvRow = s.csvRow!;
      const studentId = userIdToStudentId.get(s.userId!);
      const parentUserId = parentEmailToUserId.get(csvRow.parent_email);
      const parentId = parentUserId ? parentUserIdToParentId.get(parentUserId) : null;
      const classId = classMap.get(csvRow.class_code);

      if (studentId && parentId) {
        parentStudentLinks.push({
          parent_id: parentId,
          student_id: studentId
        });
      }

      if (studentId && classId) {
        classEnrollments.push({
          class_id: classId,
          student_id: studentId
        });
      }
    });

    // Batch insert parent-student links
    if (parentStudentLinks.length > 0) {
      await supabaseAdmin.from('parent_students').insert(parentStudentLinks as any);
    }

    // Batch insert class enrollments
    if (classEnrollments.length > 0) {
      const { error: enrollError } = await supabaseAdmin
        .from('class_enrollments')
        .insert(classEnrollments as any);

      if (!enrollError) {
        results.enrolled = classEnrollments.length;
      }
    }

    // ============================================================================
    // PHASE 5: Store credentials for school distribution
    // ============================================================================

    const credentialRecords: Array<{
      user_id: string;
      school_id: string;
      email: string;
      password: string;
      role: 'student' | 'parent';
    }> = successfulStudents.map(s => ({
      user_id: s.userId!,
      school_id: schoolId,
      email: s.email!,
      password: s.password!,
      role: 'student'
    }));

    // Add parent credentials
    parentAuthResults.filter(r => r.success).forEach(r => {
      credentialRecords.push({
        user_id: r.userId!,
        school_id: schoolId,
        email: r.email,
        password: r.password!,
        role: 'parent'
      });
    });

    if (credentialRecords.length > 0) {
      await supabaseAdmin.from('user_credentials').insert(credentialRecords as any);
    }

    // Add student credentials to results
    results.credentials.push(...successfulStudents.map(s => ({
      email: s.email!,
      password: s.password!,
      name: s.displayName!,
      type: 'student' as const
    })));

    return NextResponse.json({
      ok: true,
      summary: results
    });

  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import students' },
      { status: 500 }
    );
  }
}
