/**
 * HOOPERITS CMS - Content Validation
 * Validation schemas for content operations
 */

import { z } from 'zod';
import { contentStatusSchema, slugSchema, paginationSchema, sortSchema } from '../validation/base';

/**
 * Content input validation
 */
export const contentInputSchema = z.object({
  data: z.record(z.unknown()),
  status: contentStatusSchema.optional(),
  slug: slugSchema.nullable().optional(),
});

export type ContentInputValidation = z.infer<typeof contentInputSchema>;

/**
 * Content update validation
 */
export const contentUpdateSchema = z.object({
  data: z.record(z.unknown()).optional(),
  status: contentStatusSchema.optional(),
  slug: slugSchema.nullable().optional(),
});

export type ContentUpdateValidation = z.infer<typeof contentUpdateSchema>;

/**
 * Content list query validation
 */
export const contentListQuerySchema = paginationSchema.extend({
  status: contentStatusSchema.optional(),
  sort: sortSchema.optional().default('-createdAt'),
});

export type ContentListQueryValidation = z.infer<typeof contentListQuerySchema>;

/**
 * Validate content input
 */
export function validateContentInput(data: unknown) {
  return contentInputSchema.safeParse(data);
}

/**
 * Validate content update
 */
export function validateContentUpdate(data: unknown) {
  return contentUpdateSchema.safeParse(data);
}

/**
 * Validate content list query
 */
export function validateContentListQuery(data: unknown) {
  return contentListQuerySchema.safeParse(data);
}
