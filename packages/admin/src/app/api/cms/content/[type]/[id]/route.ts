/**
 * HOOPERITS CMS - Content Item API Route
 * GET /api/cms/content/:type/:id - Get content
 * PUT /api/cms/content/:type/:id - Update content
 * DELETE /api/cms/content/:type/:id - Delete content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleGetContent, handleUpdateContent, handleDeleteContent } from '@hooperits/cms';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { type, id } = await params;

  const result = await handleGetContent({
    user: session?.user || { id: '', role: 'VIEWER' },
    params: { type, id },
    query: {},
    body: null,
  });

  return NextResponse.json(result.data ?? result.error, { status: result.status });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const { type, id } = await params;
  const body = await request.json();

  const result = await handleUpdateContent({
    user: session.user,
    params: { type, id },
    query: {},
    body,
  });

  return NextResponse.json(result.data ?? result.error, { status: result.status });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const { type, id } = await params;

  const result = await handleDeleteContent({
    user: session.user,
    params: { type, id },
    query: {},
    body: null,
  });

  if (result.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(result.error, { status: result.status });
}
