/**
 * HOOPERITS CMS - Single Retention Policy API Route
 * GET /api/cms/retention-policies/:typeId - Get policy
 * PUT /api/cms/retention-policies/:typeId - Update policy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleGetRetentionPolicy, handleUpdateRetentionPolicy } from '@hooperits/cms';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ typeId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  // Only admins can view retention policies
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
  }

  const { typeId } = await params;

  const result = await handleGetRetentionPolicy({
    params: { contentTypeId: typeId },
    userId: session.user.id,
  });

  return NextResponse.json('data' in result ? result.data : result.error, { status: result.status });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ typeId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  // Only admins can update retention policies
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
  }

  const { typeId } = await params;
  const body = await request.json();

  const result = await handleUpdateRetentionPolicy(
    { params: { contentTypeId: typeId }, userId: session.user.id },
    body
  );

  return NextResponse.json('data' in result ? result.data : result.error, { status: result.status });
}
