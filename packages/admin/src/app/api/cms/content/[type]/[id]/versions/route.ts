/**
 * HOOPERITS CMS - Versions API Route
 * GET /api/cms/content/:type/:id/versions - List versions
 * POST /api/cms/content/:type/:id/versions - Auto-save
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleListVersions, handleAutoSave } from '@hooperits/cms';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const query: Record<string, string | undefined> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const result = await handleListVersions(
    { params: { type: '', id }, userId: session.user.id },
    query
  );

  return NextResponse.json('data' in result ? result.data : result.error, { status: result.status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const result = await handleAutoSave(
    { params: { type: '', id }, userId: session.user.id },
    body
  );

  return NextResponse.json('data' in result ? result.data : result.error, { status: result.status });
}
