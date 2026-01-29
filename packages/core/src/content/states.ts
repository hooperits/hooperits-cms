/**
 * HOOPERITS CMS - Document State Machine
 * Manages valid state transitions for content documents
 *
 * @see specs/003-document-states/data-model.md for state diagram
 */

import type { DocumentStatus, PublishAction, Content } from '@prisma/client';
import { StateTransitionError } from '../errors';

/**
 * State transition map defining valid transitions from each status
 *
 * State transitions:
 * - DRAFT → PUBLISHED (publish), SCHEDULED (schedule)
 * - PUBLISHED → DRAFT (edit with changes), UNPUBLISHED (unpublish)
 * - SCHEDULED → DRAFT (cancel), PUBLISHED (auto-publish)
 * - UNPUBLISHED → PUBLISHED (republish), ARCHIVED (archive)
 * - ARCHIVED → UNPUBLISHED (restore)
 */
export const STATE_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  DRAFT: ['PUBLISHED', 'SCHEDULED'],
  PUBLISHED: ['DRAFT', 'UNPUBLISHED'],
  SCHEDULED: ['DRAFT', 'PUBLISHED'],
  UNPUBLISHED: ['PUBLISHED', 'ARCHIVED'],
  ARCHIVED: ['UNPUBLISHED'],
};

/**
 * Maps publish actions to their target states
 */
export const ACTION_TO_STATUS: Record<PublishAction, DocumentStatus> = {
  PUBLISH: 'PUBLISHED',
  UNPUBLISH: 'UNPUBLISHED',
  SCHEDULE: 'SCHEDULED',
  CANCEL: 'DRAFT',
  ARCHIVE: 'ARCHIVED',
  RESTORE: 'UNPUBLISHED',
};

/**
 * Maps publish actions to their required source states
 */
export const ACTION_SOURCE_STATES: Record<PublishAction, DocumentStatus[]> = {
  PUBLISH: ['DRAFT', 'SCHEDULED', 'UNPUBLISHED'],
  UNPUBLISH: ['PUBLISHED'],
  SCHEDULE: ['DRAFT'],
  CANCEL: ['SCHEDULED'],
  ARCHIVE: ['UNPUBLISHED'],
  RESTORE: ['ARCHIVED'],
};

/**
 * Check if a state transition is valid
 *
 * @param from - Current document status
 * @param to - Target document status
 * @returns true if the transition is allowed
 */
export function canTransition(from: DocumentStatus, to: DocumentStatus): boolean {
  const validTransitions = STATE_TRANSITIONS[from];
  return validTransitions?.includes(to) ?? false;
}

/**
 * Get valid transitions from a given status
 *
 * @param from - Current document status
 * @returns Array of valid target statuses
 */
export function getValidTransitions(from: DocumentStatus): DocumentStatus[] {
  return STATE_TRANSITIONS[from] ?? [];
}

/**
 * Content type for validation (subset of Prisma Content)
 */
export interface ContentForValidation {
  id: string;
  status: DocumentStatus;
  publishedData?: unknown;
  scheduledAt?: Date | null;
}

/**
 * Validate a transition and throw descriptive error if invalid
 *
 * @param content - Content to validate
 * @param action - Action to perform
 * @throws StateTransitionError if transition is invalid
 * @returns The target status for the action
 */
export function validateTransition(
  content: ContentForValidation,
  action: PublishAction
): DocumentStatus {
  const targetStatus = ACTION_TO_STATUS[action];
  const allowedSources = ACTION_SOURCE_STATES[action];

  // Check if current status allows this action
  if (!allowedSources.includes(content.status)) {
    const validActions = getValidActionsForStatus(content.status);
    throw new StateTransitionError(
      content.status,
      targetStatus,
      validActions.map(a => `${a} → ${ACTION_TO_STATUS[a]}`)
    );
  }

  // Additional validation for specific actions
  switch (action) {
    case 'PUBLISH':
      // No additional validation needed - we can publish from DRAFT, SCHEDULED, or UNPUBLISHED
      break;

    case 'UNPUBLISH':
      // Must be published
      if (content.status !== 'PUBLISHED') {
        throw new StateTransitionError(content.status, 'UNPUBLISHED', ['PUBLISHED → UNPUBLISHED']);
      }
      break;

    case 'SCHEDULE':
      // Must be draft
      if (content.status !== 'DRAFT') {
        throw new StateTransitionError(content.status, 'SCHEDULED', ['DRAFT → SCHEDULED']);
      }
      break;

    case 'CANCEL':
      // Must be scheduled
      if (content.status !== 'SCHEDULED') {
        throw new StateTransitionError(content.status, 'DRAFT', ['SCHEDULED → DRAFT (cancel)']);
      }
      break;

    case 'ARCHIVE':
      // Must be unpublished
      if (content.status !== 'UNPUBLISHED') {
        throw new StateTransitionError(content.status, 'ARCHIVED', ['UNPUBLISHED → ARCHIVED']);
      }
      break;

    case 'RESTORE':
      // Must be archived
      if (content.status !== 'ARCHIVED') {
        throw new StateTransitionError(content.status, 'UNPUBLISHED', ['ARCHIVED → UNPUBLISHED']);
      }
      break;
  }

  return targetStatus;
}

/**
 * Get valid actions for a given status
 *
 * @param status - Current document status
 * @returns Array of valid actions from this status
 */
export function getValidActionsForStatus(status: DocumentStatus): PublishAction[] {
  const actions: PublishAction[] = [];

  for (const [action, sources] of Object.entries(ACTION_SOURCE_STATES)) {
    if ((sources as DocumentStatus[]).includes(status)) {
      actions.push(action as PublishAction);
    }
  }

  return actions;
}

/**
 * Check if content has pending (unpublished) changes
 * Compares draft data with published data
 *
 * @param content - Content to check
 * @returns true if draft differs from published version
 */
export function hasPendingChanges(content: Pick<Content, 'data' | 'publishedData' | 'status'>): boolean {
  // No published version = no pending changes (it's all new)
  if (!content.publishedData) {
    return false;
  }

  // Compare JSON representations
  const draftJson = JSON.stringify(content.data);
  const publishedJson = JSON.stringify(content.publishedData);

  return draftJson !== publishedJson;
}

/**
 * Status display information for UI
 */
export const STATUS_INFO: Record<DocumentStatus, { label: string; color: string; description: string }> = {
  DRAFT: {
    label: 'Draft',
    color: 'gray',
    description: 'Content has unpublished changes',
  },
  PUBLISHED: {
    label: 'Published',
    color: 'green',
    description: 'Content is live',
  },
  SCHEDULED: {
    label: 'Scheduled',
    color: 'blue',
    description: 'Content is scheduled for future publish',
  },
  UNPUBLISHED: {
    label: 'Unpublished',
    color: 'yellow',
    description: 'Content was published but is now hidden',
  },
  ARCHIVED: {
    label: 'Archived',
    color: 'red',
    description: 'Content is archived',
  },
};
