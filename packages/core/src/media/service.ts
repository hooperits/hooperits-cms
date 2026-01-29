/**
 * HOOPERITS CMS - Media Service
 * Upload and manage media files
 */

import { randomUUID } from 'crypto';
import { db } from '../db';
import { getCache } from '../cache';
import { NotFoundError, BadRequestError } from '../errors';
import { getStorage } from './storage';
import { isImage, getImageMetadata, generateImageVariants, getVariantConfigs } from './optimizer';
import type { MediaVariant } from './storage/types';

export interface UploadInput {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface Media {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  width: number | null;
  height: number | null;
  url: string;
  variants: Record<string, MediaVariant> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  uploadedBy: { id: string; name: string };
}

export interface ListMediaOptions {
  page?: number;
  limit?: number;
  mimeType?: string;
}

export interface ListMediaResult {
  items: Media[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Upload a media file
 */
export async function uploadMedia(input: UploadInput, userId: string): Promise<Media> {
  const storage = getStorage();
  const maxSize = parseInt(process.env.MEDIA_MAX_SIZE || '10485760', 10);

  // Validate file size
  if (input.buffer.length > maxSize) {
    throw new BadRequestError(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
  }

  const id = randomUUID();
  const ext = input.filename.split('.').pop() || 'bin';
  const basePath = `${new Date().toISOString().slice(0, 7)}/${id}`;

  let width: number | null = null;
  let height: number | null = null;
  let variants: Record<string, MediaVariant> | null = null;

  // Handle images
  if (isImage(input.mimeType)) {
    const metadata = await getImageMetadata(input.buffer);
    width = metadata.width;
    height = metadata.height;

    // Generate variants
    const variantConfigs = getVariantConfigs();
    const generatedVariants = await generateImageVariants(input.buffer, id, variantConfigs);

    variants = {};

    // Upload variants
    for (const [name, variant] of generatedVariants) {
      const variantPath = `${basePath}-${name}.webp`;
      const variantUrl = await storage.upload(variant.buffer, variantPath);

      variants[name] = {
        path: variantPath,
        url: variantUrl,
        width: variant.metadata.width,
        height: variant.metadata.height,
      };
    }

    // Upload original
    const originalPath = `${basePath}-original.${ext}`;
    const originalUrl = await storage.upload(input.buffer, originalPath);
    variants.original = {
      path: originalPath,
      url: originalUrl,
      width,
      height,
    };
  }

  // Upload main file (or original for non-images)
  const mainPath = `${basePath}.${ext}`;
  await storage.upload(input.buffer, mainPath);

  // Save to database
  const media = await db.media.create({
    data: {
      id,
      filename: input.filename,
      mimeType: input.mimeType,
      size: input.buffer.length,
      path: mainPath,
      width,
      height,
      variants: variants as object,
      uploadedById: userId,
    },
    include: {
      uploadedBy: {
        select: { id: true, name: true },
      },
    },
  });

  return {
    ...media,
    url: storage.getUrl(mainPath),
    variants: media.variants as Record<string, MediaVariant> | null,
    metadata: media.metadata as Record<string, unknown> | null,
  };
}

/**
 * Get a media file by ID
 */
export async function getMediaById(id: string): Promise<Media> {
  const cache = getCache();
  const cacheKey = `media:${id}`;

  const cached = cache.get<Media>(cacheKey);
  if (cached) return cached;

  const media = await db.media.findUnique({
    where: { id },
    include: {
      uploadedBy: {
        select: { id: true, name: true },
      },
    },
  });

  if (!media) {
    throw new NotFoundError('Media', id);
  }

  const storage = getStorage();
  const result: Media = {
    ...media,
    url: storage.getUrl(media.path),
    variants: media.variants as Record<string, MediaVariant> | null,
    metadata: media.metadata as Record<string, unknown> | null,
  };

  cache.set(cacheKey, result, [`media:${id}`]);

  return result;
}

/**
 * List media files
 */
export async function listMedia(options: ListMediaOptions = {}): Promise<ListMediaResult> {
  const { page = 1, limit = 20, mimeType } = options;
  const storage = getStorage();

  const where = mimeType
    ? { mimeType: { startsWith: mimeType } }
    : {};

  const [items, total] = await Promise.all([
    db.media.findMany({
      where,
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.media.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      url: storage.getUrl(item.path),
      variants: item.variants as Record<string, MediaVariant> | null,
      metadata: item.metadata as Record<string, unknown> | null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Delete a media file
 */
export async function deleteMedia(id: string): Promise<void> {
  const media = await db.media.findUnique({
    where: { id },
  });

  if (!media) {
    throw new NotFoundError('Media', id);
  }

  const storage = getStorage();

  // Delete main file
  await storage.delete(media.path);

  // Delete variants
  if (media.variants) {
    const variants = media.variants as Record<string, MediaVariant>;
    for (const variant of Object.values(variants)) {
      await storage.delete(variant.path);
    }
  }

  // Delete from database
  await db.media.delete({
    where: { id },
  });

  // Invalidate cache
  const cache = getCache();
  cache.invalidateByTag(`media:${id}`);
}
