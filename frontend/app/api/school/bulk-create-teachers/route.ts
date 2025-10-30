import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    // Get Bearer token from Authorization header
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please login' },
        { status: 401 }
      );
    }

    // Get user profile and check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
      return NextResponse.json(
        { error: `Profile query failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    if (profile.role !== 'owner' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only school administrators can create teachers' },
        { status: 403 }
      );
    }
    const body = await req.json();
    const { teachers } = body;

    if (!Array.isArray(teachers) || teachers.length === 0) {
      return NextResponse.json(
        { error: 'Teachers array is required' },
        { status: 400 }
      );
    }

    const schoolId = profile.school_id;
    const results: Array<{ email: string; success: boolean; error?: string; data?: any }> = [];

    // Check for existing users ONCE before loop (performance optimization)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    for (const teacherData of teachers) {
      try {
        const { name, email, password, bio, classIds, subject, qualification, experience, phone, address } = teacherData;

        // Check against cached user list
        const userExists = existingUsers?.users?.find((u: any) => u.email === email);

        if (userExists) {
          results.push({ email, success: false, error: 'User already exists' });
          continue;
        }

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role: 'teacher',
            display_name: name,
            school_id: schoolId
          }
        });

        if (authError) {
          results.push({ email, success: false, error: authError.message });
          continue;
        }

        // Create profile FIRST
        const { error: profileError2 } = await supabaseAdmin
          .from('profiles')
          .upsert({
            user_id: authData.user.id,
            email: email,
            display_name: name,
            role: 'teacher',
            school_id: schoolId
          });

        if (profileError2) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          results.push({ email, success: false, error: profileError2.message });
          continue;
        }

        // Create teacher record with ALL fields
        const { data: teacher, error: teacherError } = await supabaseAdmin
          .from('teachers')
          .insert({
            user_id: authData.user.id,
            school_id: schoolId,
            bio: bio || null,
            subject: subject || null,
            qualification: qualification || null,
            experience: experience || null,
            phone: phone || null,
            address: address || null,
            active: true
          })
          .select()
          .single();

        if (teacherError) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          results.push({ email, success: false, error: teacherError.message });
          continue;
        }

        // Assign to classes if provided
        if (classIds && Array.isArray(classIds) && classIds.length > 0) {
          const classAssignments = classIds.map((classId: string) => ({
            class_id: classId,
            teacher_id: teacher.id
          }));

          await supabaseAdmin
            .from('class_teachers')
            .insert(classAssignments);
        }

        // Store credentials
        await supabaseAdmin
          .from('user_credentials')
          .insert({
            user_id: authData.user.id,
            school_id: schoolId,
            email: email,
            password: password,
            role: 'teacher'
          });

        results.push({
          email,
          success: true,
          data: { id: teacher.id, email, name }
        });

      } catch (error: any) {
        results.push({ email: teacherData.email, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: teachers.length,
        succeeded: successCount,
        failed: failureCount
      },
      results
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Failed to bulk create teachers' },
      { status: 500 }
    );
  }
}
