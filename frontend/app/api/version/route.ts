/**
 * Version API Endpoint - Returns current API version and deployment info
 * Created: 2025-11-10
 * Purpose: Verify which version of the API is deployed
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    version: '235b858',
    description: 'Group messaging with auth debugging',
    deployed_at: new Date().toISOString(),
    api_features: [
      'Individual messages via to_user_id',
      'Group messages via message_recipients table',
      'Combined message fetching in GET /api/messages',
      'RLS policies support both individual and group messages',
      'DEBUG: Auth logging enabled for troubleshooting'
    ],
    debug_info: {
      commit: '235b858',
      previous_commit: 'fdf4e85',
      debug_mode: true,
      message: 'Check server logs for auth debug output when accessing /api/messages'
    }
  });
}
