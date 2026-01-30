/**
 * HOOPERITS CMS - Version Validation
 * Zod validation schemas for document version operations
 */

import { z } from 'zod';
import { uuidSchema, paginationSchema } from '../validation/base';

/**
 * Version change type enum
 */
export const versionChangeTypeSchema = z.enum([
  'MANUAL',
  'AUTO',
  'ROLLBACK',
  'PUBLISH',
  'IMPORT',
]);

export type VersionChangeType = z.infer<typeof versionChangeTypeSchema>;

/**
 * Version list query parameters
 */
export const versionListQuerySchema = paginationSchema.extend({
  changeType: versionChangeTypeSchema.optional(),
  author: uuidSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type VersionListQueryInput = z.infer<typeof versionListQuerySchema>;

/**
 * Version number parameter
 */
export const versionNumberSchema = z.coerce.number().int().positive();

/**
 * Get version parameters
 */
export const getVersionParamsSchema = z.object({
  contentId: uuidSchema,
  versionNumber: versionNumberSchema,
});

export type GetVersionParams = z.infer<typeof getVersionParamsSchema>;

/**
 * Compare versions query parameters
 */
export const compareVersionsQuerySchema = z.object({
  from: versionNumberSchema,
  to: versionNumberSchema,
}).refine((data) => data.from !== data.to, {
  message: 'Cannot compare a version with itself',
  path: ['to'],
});

export type CompareVersionsQuery = z.infer<typeof compareVersionsQuerySchema>;

/**
 * Update version metadata request
 */
export const updateVersionSchema = z.object({
  name: z.string().max(100).nullable().optional(),
  isProtected: z.boolean().optional(),
});

export type UpdateVersionInput = z.infer<typeof updateVersionSchema>;

/**
 * Auto-save request
 */
export const autoSaveSchema = z.object({
  data: z.record(z.unknown()),
});

export type AutoSaveInput = z.infer<typeof autoSaveSchema>;

/**
 * Create version input (internal use)
 */
export const createVersionSchema = z.object({
  contentId: uuidSchema,
  data: z.record(z.unknown()),
  changeType: versionChangeTypeSchema.default('MANUAL'),
  changeSummary: z.string().max(255).optional(),
  createdById: uuidSchema,
});

export type CreateVersionInput = z.infer<typeof createVersionSchema>;

/**
 * Retention policy configuration
 */
export const retentionPolicySchema = z.object({
  maxVersions: z.number().int().min(1).nullable().optional(),
  maxAgeDays: z.number().int().min(1).nullable().optional(),
  keepPublished: z.boolean().default(true),
  keepNamed: z.boolean().default(true),
});

export type RetentionPolicyInput = z.infer<typeof retentionPolicySchema>;

/**
 * Validation functions
 */
export function validateVersionListQuery(data: unknown) {
  return versionListQuerySchema.safeParse(data);
}

export function validateGetVersionParams(data: unknown) {
  return getVersionParamsSchema.safeParse(data);
}

export function validateCompareVersionsQuery(data: unknown) {
  return compareVersionsQuerySchema.safeParse(data);
}

export function validateUpdateVersion(data: unknown) {
  return updateVersionSchema.safeParse(data);
}

export function validateAutoSave(data: unknown) {
  return autoSaveSchema.safeParse(data);
}

export function validateCreateVersion(data: unknown) {
  return createVersionSchema.safeParse(data);
}

export function validateRetentionPolicy(data: unknown) {
  return retentionPolicySchema.safeParse(data);
}
