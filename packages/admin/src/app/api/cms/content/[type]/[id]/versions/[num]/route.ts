/**
 * HOOPERITS CMS - Single Version API Route
 * GET /api/cms/content/:type/:id/versions/:num - Get version
 * PATCH /api/cms/content/:type/:id/versions/:num - Update version metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleGetVersion, handleUpdateVersion } from '@hooperits/cms';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string; num: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const { id, num } = await params;

  const result = await handleGetVersion({
    params: { type: '', id, versionNumber: num },
    userId: session.user.id,
  });

  return NextResponse.json('data' in result ? result.data : result.error, { status: result.status });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string; num: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const { id, num } = await params;
  const body = await request.json();

  const result = await handleUpdateVersion(
    { params: { type: '', id, versionNumber: num }, userId: session.user.id },
    body
  );

  return NextResponse.json('data' in result ? result.data : result.error, { status: result.status });
}
