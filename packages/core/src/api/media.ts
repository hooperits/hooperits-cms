/**
 * HOOPERITS CMS - Media API Handlers
 * HTTP handlers for media endpoints
 */

import { listMedia, getMediaById, uploadMedia, deleteMedia } from '../media/service';
import { ValidationError, formatErrorResponse } from '../errors';
import type { UserRole } from '../auth/permissions';
import { hasPermission } from '../auth/permissions';
import { paginationSchema } from '../validation/base';
import { z } from 'zod';

export interface MediaRequestContext {
  user: {
    id: string;
    role: UserRole;
  };
  params: Record<string, string>;
  query: Record<string, string | string[] | undefined>;
  file?: {
    filename: string;
    mimeType: string;
    buffer: Buffer;
  };
}

export interface MediaApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  status: number;
}

const mediaListQuerySchema = paginationSchema.extend({
  mimeType: z.string().optional(),
});

/**
 * List media files
 * GET /api/cms/media
 */
export async function handleListMedia(ctx: MediaRequestContext): Promise<MediaApiResponse> {
  try {
    // Check permission
    if (!hasPermission(ctx.user.role, 'media:read')) {
      return {
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        status: 403,
      };
    }

    // Validate query
    const queryResult = mediaListQuerySchema.safeParse(ctx.query);
    if (!queryResult.success) {
      throw new ValidationError(
        queryResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const result = await listMedia(queryResult.data);

    return {
      data: result,
      status: 200,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Get media file
 * GET /api/cms/media/:id
 */
export async function handleGetMedia(ctx: MediaRequestContext): Promise<MediaApiResponse> {
  try {
    const { id } = ctx.params;
    const media = await getMediaById(id);

    return {
      data: media,
      status: 200,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Upload media file
 * POST /api/cms/media
 */
export async function handleUploadMedia(ctx: MediaRequestContext): Promise<MediaApiResponse> {
  try {
    // Check permission
    if (!hasPermission(ctx.user.role, 'media:create')) {
      return {
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        status: 403,
      };
    }

    if (!ctx.file) {
      return {
        error: { code: 'BAD_REQUEST', message: 'No file uploaded' },
        status: 400,
      };
    }

    const media = await uploadMedia(
      {
        filename: ctx.file.filename,
        mimeType: ctx.file.mimeType,
        buffer: ctx.file.buffer,
      },
      ctx.user.id
    );

    return {
      data: media,
      status: 201,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Delete media file
 * DELETE /api/cms/media/:id
 */
export async function handleDeleteMedia(ctx: MediaRequestContext): Promise<MediaApiResponse> {
  try {
    // Check permission
    if (!hasPermission(ctx.user.role, 'media:delete')) {
      return {
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        status: 403,
      };
    }

    const { id } = ctx.params;
    await deleteMedia(id);

    return {
      status: 204,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}
