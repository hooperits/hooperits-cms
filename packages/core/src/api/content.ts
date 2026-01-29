/**
 * HOOPERITS CMS - Content API Handlers
 * HTTP handlers for content endpoints
 */

import {
  listContent,
  getContentById,
  getContentBySlug,
  createContent,
  updateContent,
  deleteContent,
} from '../content/service';
import {
  validateContentInput,
  validateContentUpdate,
  validateContentListQuery,
} from '../content/validation';
import { ValidationError, formatErrorResponse } from '../errors';
import type { UserRole } from '../auth/permissions';
import { hasPermission } from '../auth/permissions';

export interface RequestContext {
  user: {
    id: string;
    role: UserRole;
  };
  params: Record<string, string>;
  query: Record<string, string | string[] | undefined>;
  body: unknown;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  status: number;
}

/**
 * List content items
 * GET /api/cms/content/:type
 */
export async function handleListContent(ctx: RequestContext): Promise<ApiResponse> {
  try {
    const { type } = ctx.params;

    // Validate query params
    const queryResult = validateContentListQuery(ctx.query);
    if (!queryResult.success) {
      throw new ValidationError(
        queryResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    // For public API, only show published content unless authenticated
    const options = {
      ...queryResult.data,
      ...(ctx.user.role === 'VIEWER' && { status: 'PUBLISHED' as const }),
    };

    const result = await listContent(type, options);

    return {
      data: result,
      status: 200,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Get single content item
 * GET /api/cms/content/:type/:id
 */
export async function handleGetContent(ctx: RequestContext): Promise<ApiResponse> {
  try {
    const { id } = ctx.params;
    const content = await getContentById(id);

    // Check if viewer can see draft content
    if (content.status === 'DRAFT' && !hasPermission(ctx.user.role, 'content:update')) {
      return {
        error: { code: 'NOT_FOUND', message: 'Content not found' },
        status: 404,
      };
    }

    return {
      data: content,
      status: 200,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Get content by slug
 * GET /api/cms/content/:type/slug/:slug
 */
export async function handleGetContentBySlug(ctx: RequestContext): Promise<ApiResponse> {
  try {
    const { type, slug } = ctx.params;
    const content = await getContentBySlug(type, slug);

    // Check if viewer can see draft content
    if (content.status === 'DRAFT' && !hasPermission(ctx.user.role, 'content:update')) {
      return {
        error: { code: 'NOT_FOUND', message: 'Content not found' },
        status: 404,
      };
    }

    return {
      data: content,
      status: 200,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Create content item
 * POST /api/cms/content/:type
 */
export async function handleCreateContent(ctx: RequestContext): Promise<ApiResponse> {
  try {
    // Check permission
    if (!hasPermission(ctx.user.role, 'content:create')) {
      return {
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        status: 403,
      };
    }

    const { type } = ctx.params;

    // Validate input
    const inputResult = validateContentInput(ctx.body);
    if (!inputResult.success) {
      throw new ValidationError(
        inputResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const content = await createContent(type, inputResult.data, ctx.user.id);

    return {
      data: content,
      status: 201,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Update content item
 * PUT /api/cms/content/:type/:id
 */
export async function handleUpdateContent(ctx: RequestContext): Promise<ApiResponse> {
  try {
    // Check permission
    if (!hasPermission(ctx.user.role, 'content:update')) {
      return {
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        status: 403,
      };
    }

    const { id } = ctx.params;

    // Validate input
    const inputResult = validateContentUpdate(ctx.body);
    if (!inputResult.success) {
      throw new ValidationError(
        inputResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const content = await updateContent(id, inputResult.data, ctx.user.id);

    return {
      data: content,
      status: 200,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Delete content item
 * DELETE /api/cms/content/:type/:id
 */
export async function handleDeleteContent(ctx: RequestContext): Promise<ApiResponse> {
  try {
    // Check permission
    if (!hasPermission(ctx.user.role, 'content:delete')) {
      return {
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        status: 403,
      };
    }

    const { id } = ctx.params;
    await deleteContent(id);

    return {
      status: 204,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}
