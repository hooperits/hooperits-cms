/**
 * HOOPERITS CMS - Base Validation Schemas
 * Reusable Zod schemas for common validations
 */

import { z } from 'zod';

// UUID validation
export const uuidSchema = z.string().uuid();

// Email validation
export const emailSchema = z.string().email().toLowerCase().trim();

// Password validation (min 8 chars, at least 1 number)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/\d/, 'Password must contain at least one number');

// Name validation
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be at most 100 characters')
  .trim();

// Slug validation (lowercase, alphanumeric, hyphens)
export const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format');

// Content status
export const contentStatusSchema = z.enum(['DRAFT', 'PUBLISHED']);

// User role
export const userRoleSchema = z.enum(['ADMIN', 'EDITOR', 'VIEWER']);

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// Sort
export const sortSchema = z.string().regex(/^-?[a-zA-Z]+$/);

// Date range
export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// Generic ID parameter
export const idParamSchema = z.object({
  id: uuidSchema,
});

// Content type parameter
export const typeParamSchema = z.object({
  type: z.string().min(1).max(100),
});

// List query parameters
export const listQuerySchema = paginationSchema.extend({
  status: contentStatusSchema.optional(),
  sort: sortSchema.optional(),
});

export type ListQueryInput = z.infer<typeof listQuerySchema>;

// Helper to create pagination response
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
