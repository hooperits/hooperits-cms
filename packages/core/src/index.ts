/**
 * HOOPERITS CMS - Core Package
 * Main entry point for @hooperits/cms
 */

// Database
export { db, connectDatabase, disconnectDatabase } from './db';
export type { Database } from './db';

// Config
export { loadConfig, getConfig, resetConfig } from './config';
export type { CMSConfig } from './config';

// Cache
export { getCache, createCache, resetCache, CMSCache } from './cache';

// Logger
export { logger } from './logger';
export type { Logger } from './logger';

// Errors
export {
  CMSError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  StateTransitionError,
  TooManyRequestsError,
  VersionNotFoundError,
  VersionProtectedError,
  RollbackError,
  isCMSError,
  formatErrorResponse,
} from './errors';

// Rate limiting
export {
  RateLimiter,
  createRateLimiter,
  previewTokenRateLimiter,
} from './rate-limit';
export type { RateLimitConfig } from './rate-limit';

// Validation
export {
  uuidSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
  slugSchema,
  contentStatusSchema,
  userRoleSchema,
  paginationSchema,
  sortSchema,
  dateRangeSchema,
  idParamSchema,
  typeParamSchema,
  listQuerySchema,
  createPaginationMeta,
} from './validation/base';
export type { PaginationInput, ListQueryInput } from './validation/base';

// Schema module
export * from './schema';

// Auth module
export * from './auth';

// Content module
export * from './content';

// Media module
export * from './media';

// API handlers - Content
export {
  handleListContent,
  handleGetContent,
  handleGetContentBySlug,
  handleCreateContent,
  handleUpdateContent,
  handleDeleteContent,
} from './api/content';
export type { RequestContext, ApiResponse } from './api/content';

// API handlers - Media
export {
  handleListMedia,
  handleGetMedia,
  handleUploadMedia,
  handleDeleteMedia,
} from './api/media';
export type { MediaRequestContext, MediaApiResponse } from './api/media';

// API handlers - HQL
export { handleHQLQuery } from './api/hql';

// API handlers - Publish (spec 003-document-states)
export type { PublishRequestContext, PublishApiResponse } from './api/publish';
export {
  handlePublish,
  handleUnpublish,
  handleDiscardDraft,
  handleSchedule,
  handleCancelSchedule,
  handleArchive,
  handleRestore,
  handleGetHistory,
  handleGetScheduled,
} from './api/publish';

// API handlers - Preview (spec 003-document-states)
export type { PreviewRequestContext, PreviewApiResponse } from './api/preview';
export {
  handleCreatePreviewToken,
  handleRevokePreviewTokens,
  handleGetPreview,
} from './api/preview';

// API handlers - Version (spec 004-document-versioning)
export type { VersionRequestContext, VersionApiResponse, RetentionRequestContext } from './api/version';
export {
  handleListVersions,
  handleGetVersion,
  handleUpdateVersion,
  handleCompareVersions,
  handleRollbackVersion,
  handleAutoSave,
  handleGetRecoverable,
  handleListRetentionPolicies,
  handleGetRetentionPolicy,
  handleUpdateRetentionPolicy,
} from './api/version';

// HQL module (HOOPERITS Query Language)
export * from './hql';
