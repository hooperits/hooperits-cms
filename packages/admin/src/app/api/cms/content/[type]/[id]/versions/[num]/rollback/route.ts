/**
 * HOOPERITS CMS - Version Rollback API Route
 * POST /api/cms/content/:type/:id/versions/:num/rollback - Rollback to version
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleRollbackVersion } from '@hooperits/cms';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string; num: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const { id, num } = await params;

  const result = await handleRollbackVersion({
    params: { type: '', id, versionNumber: num },
    userId: session.user.id,
  });

  return NextResponse.json('data' in result ? result.data : result.error, { status: result.status });
}
