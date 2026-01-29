/**
 * HOOPERITS CMS - Preview Token Operations
 * Generate and validate preview tokens for draft content access
 */

import { randomBytes } from 'crypto';
import type { Prisma } from '@prisma/client';
import { db } from '../db';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../errors';

/**
 * Preview token result
 */
export interface PreviewTokenResult {
  token: string;
  expiresAt: Date;
  previewUrl: string;
}

/**
 * Preview content result
 */
export interface PreviewContent {
  _id: string;
  _type: string;
  _isPreview: boolean;
  _previewExpiresAt: Date;
  [key: string]: unknown;
}

/**
 * Default token expiration time (24 hours)
 */
const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Parse expiry string to milliseconds
 */
function parseExpiry(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)(h|d|m)$/);
  if (!match) {
    throw new BadRequestError(`Invalid expiry format: ${expiresIn}. Use format like "24h", "7d", or "30m"`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return DEFAULT_EXPIRY_MS;
  }
}

/**
 * Generate a cryptographically secure preview token
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a preview token for draft content
 */
export async function createPreviewToken(
  contentId: string,
  userId: string,
  options: { expiresIn?: string; baseUrl?: string } = {}
): Promise<PreviewTokenResult> {
  const { expiresIn = '24h', baseUrl = '' } = options;

  // Verify content exists
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: { id: true, typeId: true, type: { select: { name: true } } },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  // Generate token
  const token = generateToken();
  const expiresAt = new Date(Date.now() + parseExpiry(expiresIn));

  // Create token record
  await db.previewToken.create({
    data: {
      token,
      contentId,
      expiresAt,
      createdBy: userId,
    },
  });

  // Build preview URL
  const previewUrl = `${baseUrl}/api/cms/preview?token=${token}`;

  return {
    token,
    expiresAt,
    previewUrl,
  };
}

/**
 * Validate a preview token and return the associated content
 */
export async function validatePreviewToken(token: string): Promise<PreviewContent> {
  // Find token
  const previewToken = await db.previewToken.findUnique({
    where: { token },
    include: {
      content: {
        select: {
          id: true,
          data: true,
          type: { select: { name: true } },
        },
      },
    },
  });

  if (!previewToken) {
    throw new UnauthorizedError('Invalid preview token');
  }

  // Check expiration
  if (previewToken.expiresAt < new Date()) {
    // Clean up expired token
    await db.previewToken.delete({ where: { id: previewToken.id } });
    throw new UnauthorizedError('Preview token has expired');
  }

  // Return content with preview metadata
  const contentData = previewToken.content.data as Record<string, unknown>;
  return {
    _id: previewToken.content.id,
    _type: previewToken.content.type.name,
    _isPreview: true,
    _previewExpiresAt: previewToken.expiresAt,
    ...contentData,
  };
}

/**
 * Revoke all preview tokens for a content item
 */
export async function revokePreviewTokens(contentId: string): Promise<{ revokedCount: number }> {
  // Verify content exists
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: { id: true },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  // Delete all tokens for this content
  const result = await db.previewToken.deleteMany({
    where: { contentId },
  });

  return { revokedCount: result.count };
}

/**
 * Clean up expired preview tokens
 * Should be called periodically (e.g., every hour)
 */
export async function cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
  const result = await db.previewToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return { deletedCount: result.count };
}

/**
 * Get all active preview tokens for a content item
 */
export async function getPreviewTokensForContent(
  contentId: string
): Promise<Array<{ id: string; expiresAt: Date; createdAt: Date }>> {
  const tokens = await db.previewToken.findMany({
    where: {
      contentId,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return tokens;
}
