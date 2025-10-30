import { NextRequest, NextResponse } from 'next/server';
import { createSchoolWithAdmin } from '@/lib/supabase-auth-service';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.schoolName || !body.schoolEmail || !body.adminEmail || !body.adminPassword || !body.adminName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (body.adminPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Create school with admin account
    const result = await createSchoolWithAdmin({
      schoolName: body.schoolName,
      schoolEmail: body.schoolEmail || body.adminEmail, // Use school email or admin email as fallback
      schoolPhone: body.schoolPhone,
      schoolAddress: body.schoolAddress,
      adminEmail: body.adminEmail,
      adminPassword: body.adminPassword,
      adminName: body.adminName,
      schoolType: body.schoolType,
      city: body.city,
      state: body.state,
      country: body.country,
      postalCode: body.postalCode,
      website: body.website,
      studentCapacity: body.studentCapacity,
      numberOfTeachers: body.numberOfTeachers ? parseInt(body.numberOfTeachers) : undefined,
      establishedYear: body.establishedYear ? parseInt(body.establishedYear) : undefined,
      schoolId: body.schoolId,
      timezone: body.timezone,
      subscriptionPlan: body.subscriptionPlan
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Verify admin was created
    if (!result.admin) {
      return NextResponse.json(
        { error: 'Admin account creation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      school: result.school,
      admin: {
        email: result.admin.email,
        name: body.adminName
      },
      message: result.message
    });
  } catch (error: any) {
    console.error('Error creating school:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create school' },
      { status: 500 }
    );
  }
}