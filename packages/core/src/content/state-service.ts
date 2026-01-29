/**
 * HOOPERITS CMS - Content State Service
 * High-level service for managing document state transitions
 */

import type { DocumentStatus, PublishAction } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import { db } from '../db';
import { getCache } from '../cache';
import { NotFoundError } from '../errors';
import {
  canTransition,
  validateTransition,
  hasPendingChanges,
  getValidTransitions,
  getValidActionsForStatus,
  ACTION_TO_STATUS,
  STATUS_INFO,
  type ContentForValidation,
} from './states';

/**
 * Content with state information for API responses
 */
export interface ContentWithState {
  id: string;
  typeId: string;
  type: { id: string; name: string; label: string };
  data: Record<string, unknown>;
  publishedData: Record<string, unknown> | null;
  status: DocumentStatus;
  publishedAt: Date | null;
  publishedBy: { id: string; name: string } | null;
  scheduledAt: Date | null;
  hasPendingChanges: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of a state transition
 */
export interface StateTransitionResult {
  content: ContentWithState;
  previousStatus: DocumentStatus;
  newStatus: DocumentStatus;
  action: PublishAction;
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
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
};

/**
 * Type for the Prisma select result
 */
interface ContentSelectResult {
  id: string;
  typeId: string;
  type: { id: string; name: string; label: string };
  data: JsonValue;
  publishedData: JsonValue;
  status: DocumentStatus;
  publishedAt: Date | null;
  publishedBy: { id: string; name: string } | null;
  scheduledAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transform Prisma result to ContentWithState
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
 * Get content by ID with full state information
 */
export async function getContentWithState(id: string): Promise<ContentWithState> {
  const content = await db.content.findUnique({
    where: { id },
    select: contentWithStateSelect,
  });

  if (!content) {
    throw new NotFoundError('Content', id);
  }

  return toContentWithState(content as ContentSelectResult);
}

/**
 * Check if a specific transition is allowed for a content item
 */
export async function canPerformTransition(
  contentId: string,
  targetStatus: DocumentStatus
): Promise<boolean> {
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: { status: true },
  });

  if (!content) {
    return false;
  }

  return canTransition(content.status, targetStatus);
}

/**
 * Get available actions for a content item
 */
export async function getAvailableActions(contentId: string): Promise<{
  actions: PublishAction[];
  transitions: { action: PublishAction; targetStatus: DocumentStatus }[];
}> {
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: { status: true },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  const actions = getValidActionsForStatus(content.status);
  const transitions = actions.map(action => ({
    action,
    targetStatus: ACTION_TO_STATUS[action],
  }));

  return { actions, transitions };
}

/**
 * Validate that an action can be performed
 * Returns the target status or throws StateTransitionError
 */
export async function validateAction(
  contentId: string,
  action: PublishAction
): Promise<DocumentStatus> {
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: { id: true, status: true, publishedData: true, scheduledAt: true },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  return validateTransition(content as ContentForValidation, action);
}

/**
 * Invalidate cache for content state changes
 */
export function invalidateContentCache(contentId: string, typeId: string): void {
  const cache = getCache();
  cache.invalidateByTag(`content:${contentId}`);
  cache.invalidateByTag(`type:${typeId}`);
}

// Re-export state utilities for convenience
export {
  canTransition,
  validateTransition,
  hasPendingChanges,
  getValidTransitions,
  getValidActionsForStatus,
  STATUS_INFO,
  ACTION_TO_STATUS,
  STATE_TRANSITIONS,
} from './states';

export type { ContentForValidation } from './states';
