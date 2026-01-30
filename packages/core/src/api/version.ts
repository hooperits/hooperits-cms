/**
 * HOOPERITS CMS - Version API Handlers
 * API endpoints for document versioning
 */

import {
  listVersions,
  getVersion,
  compareVersions,
  rollbackToVersion,
  autoSaveVersion,
  getRecoverableVersion,
  updateVersionMetadata,
  type Version,
  type VersionSummary,
  type ListVersionsResult,
  type CompareVersionsResult,
  type RollbackResult,
  type AutoSaveResult,
  type RecoverableVersionResult,
} from '../content/version';
import {
  getRetentionPolicy,
  updateRetentionPolicy,
  listRetentionPolicies,
  type RetentionPolicy,
} from '../content/version-retention';
import {
  versionListQuerySchema,
  compareVersionsQuerySchema,
  updateVersionSchema,
  autoSaveSchema,
  retentionPolicySchema,
} from '../content/version-validation';
import { BadRequestError, isCMSError } from '../errors';
import type { VersionChangeType } from '@prisma/client';

/**
 * Request context for version operations
 */
export interface VersionRequestContext {
  params: {
    type: string;
    id: string;
    versionNumber?: string;
  };
  userId: string;
}

/**
 * API response format
 */
export interface VersionApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  status: number;
}

/**
 * Format error response
 */
function errorResponse<T = undefined>(error: unknown): VersionApiResponse<T | undefined> {
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
 * GET /content/{type}/{id}/versions
 * List version history for a content item
 */
export async function handleListVersions(
  ctx: VersionRequestContext,
  query: Record<string, string | undefined>
): Promise<VersionApiResponse<ListVersionsResult | undefined>> {
  try {
    const parsed = versionListQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestError(`Invalid query parameters: ${parsed.error.message}`);
    }

    const result = await listVersions(ctx.params.id, {
      page: parsed.data.page,
      limit: parsed.data.limit,
      changeType: parsed.data.changeType as VersionChangeType | undefined,
      author: parsed.data.author,
      from: parsed.data.from,
      to: parsed.data.to,
    });

    return {
      data: result,
      status: 200,
    };
  } catch (error) {
    return errorResponse<ListVersionsResult>(error);
  }
}

/**
 * GET /content/{type}/{id}/versions/{versionNumber}
 * Get a specific version by number
 */
export async function handleGetVersion(
  ctx: VersionRequestContext
): Promise<VersionApiResponse<Version | undefined>> {
  try {
    if (!ctx.params.versionNumber) {
      throw new BadRequestError('Version number is required');
    }

    const versionNumber = parseInt(ctx.params.versionNumber, 10);
    if (isNaN(versionNumber) || versionNumber < 1) {
      throw new BadRequestError('Invalid version number');
    }

    const version = await getVersion(ctx.params.id, versionNumber);

    return {
      data: version,
      status: 200,
    };
  } catch (error) {
    return errorResponse<Version>(error);
  }
}

/**
 * GET /content/{type}/{id}/versions/compare?from=X&to=Y
 * Compare two versions and get diff
 */
export async function handleCompareVersions(
  ctx: VersionRequestContext,
  query: Record<string, string | undefined>
): Promise<VersionApiResponse<CompareVersionsResult | undefined>> {
  try {
    const parsed = compareVersionsQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestError(`Invalid query parameters: ${parsed.error.message}`);
    }

    const result = await compareVersions(
      ctx.params.id,
      parsed.data.from,
      parsed.data.to
    );

    return {
      data: result,
      status: 200,
    };
  } catch (error) {
    return errorResponse<CompareVersionsResult>(error);
  }
}

/**
 * POST /content/{type}/{id}/versions/{versionNumber}/rollback
 * Rollback to a specific version
 */
export async function handleRollbackVersion(
  ctx: VersionRequestContext
): Promise<VersionApiResponse<RollbackResult | undefined>> {
  try {
    if (!ctx.params.versionNumber) {
      throw new BadRequestError('Version number is required');
    }

    const versionNumber = parseInt(ctx.params.versionNumber, 10);
    if (isNaN(versionNumber) || versionNumber < 1) {
      throw new BadRequestError('Invalid version number');
    }

    const result = await rollbackToVersion(
      ctx.params.id,
      versionNumber,
      ctx.userId
    );

    return {
      data: result,
      status: 200,
    };
  } catch (error) {
    return errorResponse<RollbackResult>(error);
  }
}

/**
 * PATCH /content/{type}/{id}/versions/{versionNumber}
 * Update version metadata (name, protection)
 */
export async function handleUpdateVersion(
  ctx: VersionRequestContext,
  body: unknown
): Promise<VersionApiResponse<Version | undefined>> {
  try {
    if (!ctx.params.versionNumber) {
      throw new BadRequestError('Version number is required');
    }

    const versionNumber = parseInt(ctx.params.versionNumber, 10);
    if (isNaN(versionNumber) || versionNumber < 1) {
      throw new BadRequestError('Invalid version number');
    }

    const parsed = updateVersionSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestError(`Invalid request body: ${parsed.error.message}`);
    }

    const version = await updateVersionMetadata(
      ctx.params.id,
      versionNumber,
      parsed.data
    );

    return {
      data: version,
      status: 200,
    };
  } catch (error) {
    return errorResponse<Version>(error);
  }
}

/**
 * POST /content/{type}/{id}/versions/auto-save
 * Create an auto-save version
 */
export async function handleAutoSave(
  ctx: VersionRequestContext,
  body: unknown
): Promise<VersionApiResponse<AutoSaveResult | undefined>> {
  try {
    const parsed = autoSaveSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestError(`Invalid request body: ${parsed.error.message}`);
    }

    const result = await autoSaveVersion(
      ctx.params.id,
      parsed.data.data as Record<string, unknown>,
      ctx.userId
    );

    return {
      data: result,
      status: 200,
    };
  } catch (error) {
    return errorResponse<AutoSaveResult>(error);
  }
}

/**
 * GET /content/{type}/{id}/versions/recover
 * Get recoverable auto-save for crash recovery
 */
export async function handleGetRecoverable(
  ctx: VersionRequestContext
): Promise<VersionApiResponse<RecoverableVersionResult | undefined>> {
  try {
    const result = await getRecoverableVersion(ctx.params.id);

    return {
      data: result,
      status: 200,
    };
  } catch (error) {
    return errorResponse<RecoverableVersionResult>(error);
  }
}

// =============================================================================
// Retention Policy Handlers
// =============================================================================

export interface RetentionRequestContext {
  params: {
    contentTypeId?: string;
  };
  userId: string;
}

/**
 * GET /retention-policies
 * List all retention policies
 */
export async function handleListRetentionPolicies(): Promise<VersionApiResponse<RetentionPolicy[] | undefined>> {
  try {
    const policies = await listRetentionPolicies();
    return {
      data: policies,
      status: 200,
    };
  } catch (error) {
    return errorResponse<RetentionPolicy[]>(error);
  }
}

/**
 * GET /retention-policies/{contentTypeId}
 * Get retention policy for a content type
 */
export async function handleGetRetentionPolicy(
  ctx: RetentionRequestContext
): Promise<VersionApiResponse<RetentionPolicy | undefined>> {
  try {
    if (!ctx.params.contentTypeId) {
      throw new BadRequestError('Content type ID is required');
    }

    const policy = await getRetentionPolicy(ctx.params.contentTypeId);
    return {
      data: policy,
      status: 200,
    };
  } catch (error) {
    return errorResponse<RetentionPolicy>(error);
  }
}

/**
 * PUT /retention-policies/{contentTypeId}
 * Update retention policy for a content type
 */
export async function handleUpdateRetentionPolicy(
  ctx: RetentionRequestContext,
  body: unknown
): Promise<VersionApiResponse<RetentionPolicy | undefined>> {
  try {
    if (!ctx.params.contentTypeId) {
      throw new BadRequestError('Content type ID is required');
    }

    const parsed = retentionPolicySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestError(`Invalid request body: ${parsed.error.message}`);
    }

    const policy = await updateRetentionPolicy(
      ctx.params.contentTypeId,
      parsed.data,
      ctx.userId
    );

    return {
      data: policy,
      status: 200,
    };
  } catch (error) {
    return errorResponse<RetentionPolicy>(error);
  }
}
