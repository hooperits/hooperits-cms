/**
 * HOOPERITS CMS - Retention Policies API Route
 * GET /api/cms/retention-policies - List all retention policies
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleListRetentionPolicies } from '@hooperits/cms';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  // Only admins can view retention policies
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
  }

  const result = await handleListRetentionPolicies();

  return NextResponse.json('data' in result ? result.data : result.error, { status: result.status });
}
