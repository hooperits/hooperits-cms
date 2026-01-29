/**
 * HOOPERITS CMS - Publish API Handlers
 * API endpoints for document state management
 */

import { z } from 'zod';
import {
  publish,
  unpublish,
  discardDraft,
  schedule,
  cancelSchedule,
  archive,
  restore,
  getPublishHistory,
  getScheduledContent,
} from '../content/publish';
import { NotFoundError, BadRequestError, StateTransitionError, isCMSError } from '../errors';
import type { ContentWithState } from '../content/state-service';

/**
 * Request context for publish operations
 */
export interface PublishRequestContext {
  params: {
    type: string;
    id: string;
  };
  userId: string;
}

/**
 * API response format
 */
export interface PublishApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  status: number;
}

// Validation schemas
const scheduleBodySchema = z.object({
  scheduledAt: z.string().datetime(),
  timezone: z.string().optional().default('UTC'),
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

const scheduledQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

/**
 * Format success response with content
 */
function successResponse(content: ContentWithState, status = 200): PublishApiResponse<ContentWithState> {
  return { data: content, status };
}

/**
 * Format error response
 */
function errorResponse<T = undefined>(error: unknown): PublishApiResponse<T | undefined> {
  if (error instanceof StateTransitionError) {
    return {
      error: {
        code: 'INVALID_STATE_TRANSITION',
        message: error.message,
        details: {
          currentStatus: error.currentStatus,
          targetStatus: error.targetStatus,
          allowedTransitions: error.allowedTransitions,
        },
      },
      status: 400,
    };
  }

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
 * POST /content/{type}/{id}/publish
 */
export async function handlePublish(
  ctx: PublishRequestContext
): Promise<PublishApiResponse<ContentWithState | undefined>> {
  try {
    const result = await publish(ctx.params.id, ctx.userId);
    return successResponse(result.content);
  } catch (error) {
    return errorResponse<ContentWithState>(error);
  }
}

/**
 * POST /content/{type}/{id}/unpublish
 */
export async function handleUnpublish(
  ctx: PublishRequestContext
): Promise<PublishApiResponse<ContentWithState | undefined>> {
  try {
    const result = await unpublish(ctx.params.id, ctx.userId);
    return successResponse(result.content);
  } catch (error) {
    return errorResponse<ContentWithState>(error);
  }
}

/**
 * POST /content/{type}/{id}/discard-draft
 */
export async function handleDiscardDraft(
  ctx: PublishRequestContext
): Promise<PublishApiResponse<ContentWithState | undefined>> {
  try {
    const content = await discardDraft(ctx.params.id);
    return successResponse(content);
  } catch (error) {
    return errorResponse<ContentWithState>(error);
  }
}

/**
 * POST /content/{type}/{id}/schedule
 */
export async function handleSchedule(
  ctx: PublishRequestContext,
  body: unknown
): Promise<PublishApiResponse<ContentWithState | undefined>> {
  try {
    const parsed = scheduleBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestError(`Invalid request body: ${parsed.error.message}`);
    }

    const scheduledAt = new Date(parsed.data.scheduledAt);
    const result = await schedule(ctx.params.id, scheduledAt, ctx.userId);
    return successResponse(result.content);
  } catch (error) {
    return errorResponse<ContentWithState>(error);
  }
}

/**
 * POST /content/{type}/{id}/cancel-schedule
 */
export async function handleCancelSchedule(
  ctx: PublishRequestContext
): Promise<PublishApiResponse<ContentWithState | undefined>> {
  try {
    const result = await cancelSchedule(ctx.params.id, ctx.userId);
    return successResponse(result.content);
  } catch (error) {
    return errorResponse<ContentWithState>(error);
  }
}

/**
 * POST /content/{type}/{id}/archive
 */
export async function handleArchive(
  ctx: PublishRequestContext
): Promise<PublishApiResponse<ContentWithState | undefined>> {
  try {
    const result = await archive(ctx.params.id, ctx.userId);
    return successResponse(result.content);
  } catch (error) {
    return errorResponse<ContentWithState>(error);
  }
}

/**
 * POST /content/{type}/{id}/restore
 */
export async function handleRestore(
  ctx: PublishRequestContext
): Promise<PublishApiResponse<ContentWithState | undefined>> {
  try {
    const result = await restore(ctx.params.id, ctx.userId);
    return successResponse(result.content);
  } catch (error) {
    return errorResponse<ContentWithState>(error);
  }
}

/**
 * GET /content/{type}/{id}/history
 */
export async function handleGetHistory(
  ctx: PublishRequestContext,
  query: Record<string, string | undefined>
): Promise<PublishApiResponse> {
  try {
    const parsed = historyQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestError(`Invalid query parameters: ${parsed.error.message}`);
    }

    const history = await getPublishHistory(ctx.params.id, {
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });

    return {
      data: {
        events: history.events,
        total: history.total,
      },
      status: 200,
    };
  } catch (error) {
    return errorResponse<ContentWithState>(error);
  }
}

/**
 * GET /scheduled
 */
export async function handleGetScheduled(
  query: Record<string, string | undefined>
): Promise<PublishApiResponse> {
  try {
    const parsed = scheduledQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestError(`Invalid query parameters: ${parsed.error.message}`);
    }

    const result = await getScheduledContent({
      from: parsed.data.from ? new Date(parsed.data.from) : undefined,
      to: parsed.data.to ? new Date(parsed.data.to) : undefined,
    });

    return {
      data: {
        items: result.items,
        total: result.total,
      },
      status: 200,
    };
  } catch (error) {
    return errorResponse<ContentWithState>(error);
  }
}
