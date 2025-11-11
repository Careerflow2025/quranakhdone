/**
 * Version API Endpoint - Returns current API version and deployment info
 * Created: 2025-11-10
 * Purpose: Verify which version of the API is deployed
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    version: '5b0557e',
    description: 'Group messaging support with updated API',
    deployed_at: new Date().toISOString(),
    api_features: [
      'Individual messages via to_user_id',
      'Group messages via message_recipients table',
      'Combined message fetching in GET /api/messages',
      'RLS policies support both individual and group messages'
    ]
  });
}
