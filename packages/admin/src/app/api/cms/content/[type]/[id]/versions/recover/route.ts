/**
 * HOOPERITS CMS - Version Recovery API Route
 * GET /api/cms/content/:type/:id/versions/recover - Get recoverable auto-save
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleGetRecoverable } from '@hooperits/cms';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const { id } = await params;

  const result = await handleGetRecoverable({
    params: { type: '', id },
    userId: session.user.id,
  });

  return NextResponse.json('data' in result ? result.data : result.error, { status: result.status });
}
