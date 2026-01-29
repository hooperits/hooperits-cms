/**
 * HOOPERITS CMS - Content List/Create API Route
 * GET /api/cms/content/:type - List content
 * POST /api/cms/content/:type - Create content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleListContent, handleCreateContent } from '@hooperits/cms';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getServerSession(authOptions);
  const { type } = await params;

  // Build query from searchParams
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);

  const result = await handleListContent({
    user: session?.user || { id: '', role: 'VIEWER' },
    params: { type },
    query: searchParams,
    body: null,
  });

  return NextResponse.json(result.data ?? result.error, { status: result.status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const { type } = await params;
  const body = await request.json();

  const result = await handleCreateContent({
    user: session.user,
    params: { type },
    query: {},
    body,
  });

  return NextResponse.json(result.data ?? result.error, { status: result.status });
}
