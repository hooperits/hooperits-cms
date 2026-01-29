/**
 * HOOPERITS CMS - Content Service
 * CRUD operations for content items
 */

import { db } from '../db';
import { getCache } from '../cache';
import { NotFoundError, ValidationError } from '../errors';
import { getSchema, validateContent } from '../schema';
import type { ContentStatus, Prisma } from '@prisma/client';

export interface ContentInput {
  data: Record<string, unknown>;
  status?: ContentStatus;
  slug?: string | null;
}

export interface Content {
  id: string;
  typeId: string;
  type: {
    id: string;
    name: string;
    label: string;
  };
  data: Record<string, unknown>;
  status: ContentStatus;
  slug: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; name: string };
  updatedBy: { id: string; name: string };
}

export interface ListContentOptions {
  page?: number;
  limit?: number;
  status?: ContentStatus;
  sort?: string;
}

export interface ListContentResult {
  items: Content[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const contentSelect = {
  id: true,
  typeId: true,
  type: {
    select: { id: true, name: true, label: true },
  },
  data: true,
  status: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
} satisfies Prisma.ContentSelect;

/**
 * List content items by type
 */
export async function listContent(
  typeName: string,
  options: ListContentOptions = {}
): Promise<ListContentResult> {
  const { page = 1, limit = 20, status, sort = '-createdAt' } = options;

  // Get content type
  const contentType = await db.contentType.findUnique({
    where: { name: typeName },
  });

  if (!contentType) {
    throw new NotFoundError('ContentType', typeName);
  }

  // Build where clause
  const where: Prisma.ContentWhereInput = {
    typeId: contentType.id,
    ...(status && { status }),
  };

  // Build order by
  const isDesc = sort.startsWith('-');
  const sortField = isDesc ? sort.slice(1) : sort;
  const orderBy: Prisma.ContentOrderByWithRelationInput = {
    [sortField]: isDesc ? 'desc' : 'asc',
  };

  // Execute queries
  const [items, total] = await Promise.all([
    db.content.findMany({
      where,
      select: contentSelect,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.content.count({ where }),
  ]);

  return {
    items: items as unknown as Content[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single content item by ID
 */
export async function getContentById(id: string): Promise<Content> {
  const cache = getCache();
  const cacheKey = `content:${id}`;

  // Check cache
  const cached = cache.get<Content>(cacheKey);
  if (cached) return cached;

  const content = await db.content.findUnique({
    where: { id },
    select: contentSelect,
  });

  if (!content) {
    throw new NotFoundError('Content', id);
  }

  const result = content as unknown as Content;
  cache.set(cacheKey, result, [`content:${id}`, `type:${content.typeId}`]);

  return result;
}

/**
 * Get content by slug
 */
export async function getContentBySlug(
  typeName: string,
  slug: string
): Promise<Content> {
  const cache = getCache();
  const cacheKey = `content:${typeName}:${slug}`;

  // Check cache
  const cached = cache.get<Content>(cacheKey);
  if (cached) return cached;

  const contentType = await db.contentType.findUnique({
    where: { name: typeName },
  });

  if (!contentType) {
    throw new NotFoundError('ContentType', typeName);
  }

  const content = await db.content.findFirst({
    where: {
      typeId: contentType.id,
      slug,
    },
    select: contentSelect,
  });

  if (!content) {
    throw new NotFoundError('Content', `${typeName}/${slug}`);
  }

  const result = content as unknown as Content;
  cache.set(cacheKey, result, [`content:${content.id}`, `type:${contentType.id}`]);

  return result;
}

/**
 * Create a new content item
 */
export async function createContent(
  typeName: string,
  input: ContentInput,
  userId: string
): Promise<Content> {
  // Get content type
  const contentType = await db.contentType.findUnique({
    where: { name: typeName },
  });

  if (!contentType) {
    throw new NotFoundError('ContentType', typeName);
  }

  // Validate data against schema
  const schema = getSchema(typeName);
  if (schema) {
    const validation = validateContent(schema, input.data);
    if (!validation.success) {
      throw new ValidationError(
        validation.errors.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }
  }

  const content = await db.content.create({
    data: {
      typeId: contentType.id,
      data: input.data as Prisma.InputJsonValue,
      status: input.status ?? 'DRAFT',
      slug: input.slug ?? null,
      createdById: userId,
      updatedById: userId,
    },
    select: contentSelect,
  });

  // Invalidate cache
  const cache = getCache();
  cache.invalidateByTag(`type:${contentType.id}`);

  return content as unknown as Content;
}

/**
 * Update a content item
 */
export async function updateContent(
  id: string,
  input: Partial<ContentInput>,
  userId: string
): Promise<Content> {
  // Get existing content
  const existing = await db.content.findUnique({
    where: { id },
    include: { type: true },
  });

  if (!existing) {
    throw new NotFoundError('Content', id);
  }

  // Validate data if provided
  if (input.data) {
    const schema = getSchema(existing.type.name);
    if (schema) {
      const mergedData = { ...(existing.data as object), ...input.data };
      const validation = validateContent(schema, mergedData);
      if (!validation.success) {
        throw new ValidationError(
          validation.errors.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
      }
    }
  }

  const content = await db.content.update({
    where: { id },
    data: {
      ...(input.data && { data: input.data as Prisma.InputJsonValue }),
      ...(input.status && { status: input.status }),
      ...(input.slug !== undefined && { slug: input.slug }),
      updatedById: userId,
    },
    select: contentSelect,
  });

  // Invalidate cache
  const cache = getCache();
  cache.invalidateByTag(`content:${id}`);
  cache.invalidateByTag(`type:${existing.typeId}`);

  return content as unknown as Content;
}

/**
 * Delete a content item
 */
export async function deleteContent(id: string): Promise<void> {
  const content = await db.content.findUnique({
    where: { id },
  });

  if (!content) {
    throw new NotFoundError('Content', id);
  }

  await db.content.delete({
    where: { id },
  });

  // Invalidate cache
  const cache = getCache();
  cache.invalidateByTag(`content:${id}`);
  cache.invalidateByTag(`type:${content.typeId}`);
}

/**
 * Publish content
 */
export async function publishContent(id: string, userId: string): Promise<Content> {
  return updateContent(id, { status: 'PUBLISHED' }, userId);
}

/**
 * Unpublish content
 */
export async function unpublishContent(id: string, userId: string): Promise<Content> {
  return updateContent(id, { status: 'DRAFT' }, userId);
}
