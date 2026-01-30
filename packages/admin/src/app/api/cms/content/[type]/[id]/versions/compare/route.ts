/**
 * HOOPERITS CMS - Version Compare API Route
 * GET /api/cms/content/:type/:id/versions/compare?from=X&to=Y - Compare versions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleCompareVersions } from '@hooperits/cms';

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
  const query: Record<string, string | undefined> = {
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  };

  const result = await handleCompareVersions(
    { params: { type: '', id }, userId: session.user.id },
    query
  );

  return NextResponse.json('data' in result ? result.data : result.error, { status: result.status });
}
