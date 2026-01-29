/**
 * HOOPERITS CMS - Media List/Upload API Route
 * GET /api/cms/media - List media
 * POST /api/cms/media - Upload media
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleListMedia, handleUploadMedia, validateFileType, isAllowedMimeType } from '@hooperits/cms';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);

  const result = await handleListMedia({
    user: session.user,
    params: {},
    query: searchParams,
  });

  return NextResponse.json(result.data ?? result.error, { status: result.status });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'No file uploaded' } },
        { status: 400 }
      );
    }

    // Check if declared MIME type is allowed
    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'File type not allowed' } },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate actual file content matches declared MIME type
    const validatedMimeType = validateFileType(buffer, file.type);
    if (!validatedMimeType) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'File content does not match declared type' } },
        { status: 400 }
      );
    }

    const result = await handleUploadMedia({
      user: session.user,
      params: {},
      query: {},
      file: {
        filename: file.name,
        mimeType: validatedMimeType,
        buffer,
      },
    });

    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process upload' } },
      { status: 500 }
    );
  }
}
