/**
 * HOOPERITS CMS - Publish Operations
 * Core publish/unpublish/schedule operations for document states
 */

import type { DocumentStatus, PublishAction, Prisma } from '@prisma/client';
import { db } from '../db';
import { getCache } from '../cache';
import { logger } from '../logger';
import { NotFoundError, BadRequestError } from '../errors';
import { validateTransition, hasPendingChanges } from './states';
import type { ContentWithState } from './state-service';
import { emitDocumentEvent } from '../realtime/emitter';

/**
 * Result of a publish operation
 */
export interface PublishResult {
  content: ContentWithState;
  event: {
    id: string;
    action: PublishAction;
    timestamp: Date;
  };
}

const contentWithStateSelect = {
  id: true,
  typeId: true,
  type: { select: { id: true, name: true, label: true } },
  data: true,
  publishedData: true,
  status: true,
  publishedAt: true,
  publishedBy: { select: { id: true, name: true } },
  scheduledAt: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Type for the Prisma select result
 */
interface ContentSelectResult {
  id: string;
  typeId: string;
  type: { id: string; name: string; label: string };
  data: Prisma.JsonValue;
  publishedData: Prisma.JsonValue;
  status: DocumentStatus;
  publishedAt: Date | null;
  publishedBy: { id: string; name: string } | null;
  scheduledAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a publish event for audit trail
 */
async function createPublishEvent(
  contentId: string,
  action: PublishAction,
  userId: string,
  metadata?: Record<string, unknown>
) {
  return db.publishEvent.create({
    data: {
      contentId,
      action,
      userId,
      metadata: metadata as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      action: true,
      timestamp: true,
      user: { select: { id: true, name: true } },
    },
  });
}

/**
 * Transform content to ContentWithState
 */
function toContentWithState(content: ContentSelectResult): ContentWithState {
  return {
    id: content.id,
    typeId: content.typeId,
    type: content.type,
    data: content.data as Record<string, unknown>,
    publishedData: content.publishedData as Record<string, unknown> | null,
    status: content.status,
    publishedAt: content.publishedAt,
    publishedBy: content.publishedBy,
    scheduledAt: content.scheduledAt,
    hasPendingChanges: hasPendingChanges({
      data: content.data,
      publishedData: content.publishedData,
      status: content.status,
    }),
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  };
}

/**
 * Publish content - copies draft data to publishedData
 */
export async function publish(
  contentId: string,
  userId: string
): Promise<PublishResult> {
  // Get content
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      typeId: true,
      data: true,
      status: true,
      publishedData: true,
      scheduledAt: true,
    },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  // Validate transition
  validateTransition(content, 'PUBLISH');

  // Update content - copy draft to published
  const updated = await db.content.update({
    where: { id: contentId },
    data: {
      status: 'PUBLISHED',
      publishedData: content.data as Prisma.InputJsonValue,
      publishedAt: new Date(),
      publishedById: userId,
      scheduledAt: null, // Clear any schedule
    },
    select: contentWithStateSelect,
  });

  // Create audit event
  const event = await createPublishEvent(contentId, 'PUBLISH', userId);

  // Invalidate cache
  const cache = getCache();
  cache.invalidateByTag(`content:${contentId}`);
  cache.invalidateByTag(`type:${content.typeId}`);

  logger.info('[Publish] Content published', {
    contentId,
    userId,
    previousStatus: content.status,
    newStatus: 'PUBLISHED',
  });

  // Emit real-time event
  const contentType = await db.contentType.findUnique({
    where: { id: content.typeId },
    select: { name: true },
  });
  if (contentType) {
    emitDocumentEvent('document.published', contentId, contentType.name, userId, {
      previousStatus: content.status,
    });
  }

  return {
    content: toContentWithState(updated as ContentSelectResult),
    event: {
      id: event.id,
      action: event.action,
      timestamp: event.timestamp,
    },
  };
}

/**
 * Unpublish content - removes from public API but keeps publishedData
 */
export async function unpublish(
  contentId: string,
  userId: string
): Promise<PublishResult> {
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      typeId: true,
      status: true,
      publishedData: true,
      scheduledAt: true,
    },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  validateTransition(content, 'UNPUBLISH');

  const updated = await db.content.update({
    where: { id: contentId },
    data: {
      status: 'UNPUBLISHED',
    },
    select: contentWithStateSelect,
  });

  const event = await createPublishEvent(contentId, 'UNPUBLISH', userId);

  const cache = getCache();
  cache.invalidateByTag(`content:${contentId}`);
  cache.invalidateByTag(`type:${content.typeId}`);

  logger.info('[Publish] Content unpublished', {
    contentId,
    userId,
    previousStatus: content.status,
    newStatus: 'UNPUBLISHED',
  });

  // Emit real-time event
  const contentType = await db.contentType.findUnique({
    where: { id: content.typeId },
    select: { name: true },
  });
  if (contentType) {
    emitDocumentEvent('document.unpublished', contentId, contentType.name, userId, {
      previousStatus: content.status,
    });
  }

  return {
    content: toContentWithState(updated as ContentSelectResult),
    event: {
      id: event.id,
      action: event.action,
      timestamp: event.timestamp,
    },
  };
}

/**
 * Discard draft changes - reverts draft data to published version
 */
export async function discardDraft(contentId: string): Promise<ContentWithState> {
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      typeId: true,
      status: true,
      data: true,
      publishedData: true,
    },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  // Must have published data to discard to
  if (!content.publishedData) {
    throw new BadRequestError('Cannot discard draft: no published version exists');
  }

  // Only drafts with pending changes can be discarded
  if (!hasPendingChanges({ data: content.data, publishedData: content.publishedData, status: content.status })) {
    throw new BadRequestError('No pending changes to discard');
  }

  // Revert draft to published version
  const updated = await db.content.update({
    where: { id: contentId },
    data: {
      data: content.publishedData,
      status: 'PUBLISHED', // Back to published since no pending changes
    },
    select: contentWithStateSelect,
  });

  const cache = getCache();
  cache.invalidateByTag(`content:${contentId}`);
  cache.invalidateByTag(`type:${content.typeId}`);

  logger.info('[Publish] Draft discarded', {
    contentId,
    previousStatus: content.status,
    newStatus: 'PUBLISHED',
  });

  return toContentWithState(updated as ContentSelectResult);
}

/**
 * Schedule content for future publish
 */
export async function schedule(
  contentId: string,
  scheduledAt: Date,
  userId: string
): Promise<PublishResult> {
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      typeId: true,
      status: true,
      publishedData: true,
      scheduledAt: true,
    },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  validateTransition(content, 'SCHEDULE');

  // Scheduled time must be in the future
  if (scheduledAt <= new Date()) {
    throw new BadRequestError('Scheduled time must be in the future');
  }

  const updated = await db.content.update({
    where: { id: contentId },
    data: {
      status: 'SCHEDULED',
      scheduledAt,
    },
    select: contentWithStateSelect,
  });

  const event = await createPublishEvent(contentId, 'SCHEDULE', userId, {
    scheduledAt: scheduledAt.toISOString(),
  });

  const cache = getCache();
  cache.invalidateByTag(`content:${contentId}`);
  cache.invalidateByTag(`type:${content.typeId}`);

  logger.info('[Publish] Content scheduled', {
    contentId,
    userId,
    previousStatus: content.status,
    newStatus: 'SCHEDULED',
    scheduledAt: scheduledAt.toISOString(),
  });

  return {
    content: toContentWithState(updated as ContentSelectResult),
    event: {
      id: event.id,
      action: event.action,
      timestamp: event.timestamp,
    },
  };
}

/**
 * Cancel scheduled publish
 */
export async function cancelSchedule(
  contentId: string,
  userId: string
): Promise<PublishResult> {
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      typeId: true,
      status: true,
      publishedData: true,
      scheduledAt: true,
    },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  validateTransition(content, 'CANCEL');

  const updated = await db.content.update({
    where: { id: contentId },
    data: {
      status: 'DRAFT',
      scheduledAt: null,
    },
    select: contentWithStateSelect,
  });

  const event = await createPublishEvent(contentId, 'CANCEL', userId);

  const cache = getCache();
  cache.invalidateByTag(`content:${contentId}`);
  cache.invalidateByTag(`type:${content.typeId}`);

  logger.info('[Publish] Schedule cancelled', {
    contentId,
    userId,
    previousStatus: 'SCHEDULED',
    newStatus: 'DRAFT',
  });

  return {
    content: toContentWithState(updated as ContentSelectResult),
    event: {
      id: event.id,
      action: event.action,
      timestamp: event.timestamp,
    },
  };
}

/**
 * Archive content
 */
export async function archive(
  contentId: string,
  userId: string
): Promise<PublishResult> {
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      typeId: true,
      status: true,
      publishedData: true,
      scheduledAt: true,
    },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  validateTransition(content, 'ARCHIVE');

  const updated = await db.content.update({
    where: { id: contentId },
    data: {
      status: 'ARCHIVED',
      archivedAt: new Date(),
    },
    select: contentWithStateSelect,
  });

  const event = await createPublishEvent(contentId, 'ARCHIVE', userId);

  const cache = getCache();
  cache.invalidateByTag(`content:${contentId}`);
  cache.invalidateByTag(`type:${content.typeId}`);

  logger.info('[Publish] Content archived', {
    contentId,
    userId,
    previousStatus: content.status,
    newStatus: 'ARCHIVED',
  });

  return {
    content: toContentWithState(updated as ContentSelectResult),
    event: {
      id: event.id,
      action: event.action,
      timestamp: event.timestamp,
    },
  };
}

/**
 * Restore archived content
 */
export async function restore(
  contentId: string,
  userId: string
): Promise<PublishResult> {
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      typeId: true,
      status: true,
      publishedData: true,
      scheduledAt: true,
    },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  validateTransition(content, 'RESTORE');

  const updated = await db.content.update({
    where: { id: contentId },
    data: {
      status: 'UNPUBLISHED',
      archivedAt: null,
    },
    select: contentWithStateSelect,
  });

  const event = await createPublishEvent(contentId, 'RESTORE', userId);

  const cache = getCache();
  cache.invalidateByTag(`content:${contentId}`);
  cache.invalidateByTag(`type:${content.typeId}`);

  logger.info('[Publish] Content restored', {
    contentId,
    userId,
    previousStatus: 'ARCHIVED',
    newStatus: 'UNPUBLISHED',
  });

  return {
    content: toContentWithState(updated as ContentSelectResult),
    event: {
      id: event.id,
      action: event.action,
      timestamp: event.timestamp,
    },
  };
}

/**
 * Get publish history for content
 */
export async function getPublishHistory(
  contentId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{
  events: Array<{
    id: string;
    action: PublishAction;
    user: { id: string; name: string };
    timestamp: Date;
    metadata: Record<string, unknown> | null;
  }>;
  total: number;
}> {
  const { limit = 20, offset = 0 } = options;

  // Verify content exists
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: { id: true },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  const [events, total] = await Promise.all([
    db.publishEvent.findMany({
      where: { contentId },
      select: {
        id: true,
        action: true,
        user: { select: { id: true, name: true } },
        timestamp: true,
        metadata: true,
      },
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: limit,
    }),
    db.publishEvent.count({ where: { contentId } }),
  ]);

  return {
    events: events.map((e) => ({
      ...e,
      metadata: e.metadata as Record<string, unknown> | null,
    })),
    total,
  };
}

/**
 * Get all scheduled content
 */
export async function getScheduledContent(options: {
  from?: Date;
  to?: Date;
} = {}): Promise<{
  items: Array<{
    id: string;
    type: { id: string; name: string; label: string };
    data: Record<string, unknown>;
    scheduledAt: Date;
    scheduledBy: { id: string; name: string } | null;
  }>;
  total: number;
}> {
  const { from, to } = options;

  const where: Prisma.ContentWhereInput = {
    status: 'SCHEDULED',
    scheduledAt: {
      not: null,
      ...(from && { gte: from }),
      ...(to && { lte: to }),
    },
  };

  const [items, total] = await Promise.all([
    db.content.findMany({
      where,
      select: {
        id: true,
        type: { select: { id: true, name: true, label: true } },
        data: true,
        scheduledAt: true,
        publishedBy: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    db.content.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      data: item.data as Record<string, unknown>,
      scheduledAt: item.scheduledAt!,
      scheduledBy: item.publishedBy,
    })),
    total,
  };
}
