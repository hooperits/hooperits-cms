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
  isCMSError,
  formatErrorResponse,
} from './errors';

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
