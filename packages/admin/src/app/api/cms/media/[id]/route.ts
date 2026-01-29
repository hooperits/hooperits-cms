/**
 * HOOPERITS CMS - Media Item API Route
 * GET /api/cms/media/:id - Get media
 * DELETE /api/cms/media/:id - Delete media
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleGetMedia, handleDeleteMedia } from '@hooperits/cms';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await handleGetMedia({
    user: { id: '', role: 'VIEWER' },
    params: { id },
    query: {},
  });

  return NextResponse.json(result.data ?? result.error, { status: result.status });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const { id } = await params;

  const result = await handleDeleteMedia({
    user: session.user,
    params: { id },
    query: {},
  });

  if (result.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(result.error, { status: result.status });
}
