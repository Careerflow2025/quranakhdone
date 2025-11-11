/**
 * Version API Endpoint - Returns current API version and deployment info
 * Created: 2025-11-10
 * Purpose: Verify which version of the API is deployed
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    version: '3da5f19',
    description: 'FIXED: Authorization header auth for parent messages',
    deployed_at: new Date().toISOString(),
    api_features: [
      'Individual messages via to_user_id',
      'Group messages via message_recipients table',
      'Combined message fetching in GET /api/messages',
      'RLS policies support both individual and group messages',
      'AUTH FIX: Reads Bearer token from Authorization header',
      'Fallback to cookie-based auth if no header present'
    ],
    fix_details: {
      commit: '3da5f19',
      issue: 'Parents getting 401 Unauthorized',
      root_cause: 'API only read cookies, ignored Authorization header',
      solution: 'Created createClientWithAuth() to read both',
      status: 'FIXED'
    }
  });
}
