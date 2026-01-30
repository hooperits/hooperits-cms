/**
 * HOOPERITS CMS - Preview API Handlers
 * API endpoints for preview token management
 */

import { z } from 'zod';
import {
  createPreviewToken,
  validatePreviewToken,
  revokePreviewTokens,
  type PreviewContent,
} from '../content/preview';
import { isCMSError } from '../errors';
import { previewTokenRateLimiter } from '../rate-limit';

/**
 * Request context for preview token operations
 */
export interface PreviewRequestContext {
  params: {
    type: string;
    id: string;
  };
  userId: string;
  baseUrl?: string;
}

/**
 * API response format
 */
export interface PreviewApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  status: number;
}

// Validation schemas
const createTokenBodySchema = z.object({
  expiresIn: z.string().regex(/^\d+(h|d|m)$/).optional().default('24h'),
});

/**
 * Format error response
 */
function errorResponse<T = undefined>(error: unknown): PreviewApiResponse<T | undefined> {
  if (isCMSError(error)) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      status: error.statusCode,
    };
  }

  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    },
    status: 500,
  };
}

/**
 * POST /content/{type}/{id}/preview-token
 * Create a preview token
 * Rate limited: 10 tokens per hour per user
 */
export async function handleCreatePreviewToken(
  ctx: PreviewRequestContext,
  body?: unknown
): Promise<PreviewApiResponse<{ token: string; expiresAt: Date; previewUrl: string } | undefined>> {
  try {
    // Rate limiting: 10 tokens per hour per user
    previewTokenRateLimiter.check(ctx.userId);

    const parsed = createTokenBodySchema.safeParse(body || {});
    const expiresIn = parsed.success ? parsed.data.expiresIn : '24h';

    const result = await createPreviewToken(ctx.params.id, ctx.userId, {
      expiresIn,
      baseUrl: ctx.baseUrl,
    });

    return {
      data: result,
      status: 200,
    };
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * DELETE /content/{type}/{id}/preview-token
 * Revoke all preview tokens for a content item
 */
export async function handleRevokePreviewTokens(
  ctx: PreviewRequestContext
): Promise<PreviewApiResponse<{ revokedCount: number } | undefined>> {
  try {
    const result = await revokePreviewTokens(ctx.params.id);
    return {
      data: result,
      status: 200,
    };
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * GET /preview?token=xxx
 * Get preview content (public, no auth required)
 */
export async function handleGetPreview(
  query: { token?: string }
): Promise<PreviewApiResponse<PreviewContent | undefined>> {
  try {
    if (!query.token) {
      return {
        error: {
          code: 'MISSING_TOKEN',
          message: 'Preview token is required',
        },
        status: 400,
      };
    }

    const content = await validatePreviewToken(query.token);
    return {
      data: content,
      status: 200,
    };
  } catch (error) {
    return errorResponse(error);
  }
}
