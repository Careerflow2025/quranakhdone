import { NextRequest, NextResponse } from 'next/server';
import { loginWithRole } from '@/lib/supabase-auth-service';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await loginWithRole(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Set the auth cookie (for server-side authentication)
    const response = NextResponse.json({
      success: true,
      user: result.user,
      role: result.role,
      schoolId: result.schoolId,
      redirectPath: result.redirectPath,
      additionalData: result.additionalData
    });

    // Store session info in a secure HTTP-only cookie
    response.cookies.set('auth-token', result.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    response.cookies.set('user-role', result.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}