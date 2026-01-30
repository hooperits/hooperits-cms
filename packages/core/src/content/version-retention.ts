/**
 * HOOPERITS CMS - Version Retention
 * Retention policy management and version cleanup
 */

import { db } from '../db';
import { NotFoundError } from '../errors';
import type { Prisma } from '@prisma/client';

/**
 * Default retention policy values
 */
export const DEFAULT_RETENTION_POLICY = {
  maxVersions: 100,
  maxAgeDays: 365,
  keepPublished: true,
  keepNamed: true,
} as const;

/**
 * Retention policy interface
 */
export interface RetentionPolicy {
  id: string;
  contentTypeId: string;
  contentType: {
    name: string;
    label: string;
  };
  maxVersions: number | null;
  maxAgeDays: number | null;
  keepPublished: boolean;
  keepNamed: boolean;
  updatedAt: Date;
}

export interface RetentionPolicyInput {
  maxVersions?: number | null;
  maxAgeDays?: number | null;
  keepPublished?: boolean;
  keepNamed?: boolean;
}

export interface RetentionCleanupResult {
  contentId: string;
  deletedCount: number;
}

const retentionPolicySelect = {
  id: true,
  contentTypeId: true,
  contentType: {
    select: { name: true, label: true },
  },
  maxVersions: true,
  maxAgeDays: true,
  keepPublished: true,
  keepNamed: true,
  updatedAt: true,
} as const;

/**
 * Get retention policy for a content type
 * Returns default values if no policy exists
 */
export async function getRetentionPolicy(
  contentTypeId: string
): Promise<RetentionPolicy> {
  const policy = await db.retentionPolicy.findUnique({
    where: { contentTypeId },
    select: retentionPolicySelect,
  });

  if (policy) {
    return policy as RetentionPolicy;
  }

  // Get content type info for default policy
  const contentType = await db.contentType.findUnique({
    where: { id: contentTypeId },
    select: { name: true, label: true },
  });

  if (!contentType) {
    throw new NotFoundError('ContentType', contentTypeId);
  }

  // Return default policy
  return {
    id: '',
    contentTypeId,
    contentType,
    maxVersions: DEFAULT_RETENTION_POLICY.maxVersions,
    maxAgeDays: DEFAULT_RETENTION_POLICY.maxAgeDays,
    keepPublished: DEFAULT_RETENTION_POLICY.keepPublished,
    keepNamed: DEFAULT_RETENTION_POLICY.keepNamed,
    updatedAt: new Date(),
  };
}

/**
 * Update or create retention policy for a content type
 */
export async function updateRetentionPolicy(
  contentTypeId: string,
  input: RetentionPolicyInput,
  userId: string
): Promise<RetentionPolicy> {
  // Verify content type exists
  const contentType = await db.contentType.findUnique({
    where: { id: contentTypeId },
  });

  if (!contentType) {
    throw new NotFoundError('ContentType', contentTypeId);
  }

  const policy = await db.retentionPolicy.upsert({
    where: { contentTypeId },
    create: {
      contentTypeId,
      maxVersions: input.maxVersions ?? DEFAULT_RETENTION_POLICY.maxVersions,
      maxAgeDays: input.maxAgeDays ?? DEFAULT_RETENTION_POLICY.maxAgeDays,
      keepPublished: input.keepPublished ?? DEFAULT_RETENTION_POLICY.keepPublished,
      keepNamed: input.keepNamed ?? DEFAULT_RETENTION_POLICY.keepNamed,
      updatedById: userId,
    },
    update: {
      ...(input.maxVersions !== undefined && { maxVersions: input.maxVersions }),
      ...(input.maxAgeDays !== undefined && { maxAgeDays: input.maxAgeDays }),
      ...(input.keepPublished !== undefined && { keepPublished: input.keepPublished }),
      ...(input.keepNamed !== undefined && { keepNamed: input.keepNamed }),
      updatedById: userId,
    },
    select: retentionPolicySelect,
  });

  return policy as RetentionPolicy;
}

/**
 * List all retention policies
 */
export async function listRetentionPolicies(): Promise<RetentionPolicy[]> {
  const policies = await db.retentionPolicy.findMany({
    select: retentionPolicySelect,
    orderBy: { contentType: { name: 'asc' } },
  });

  return policies as RetentionPolicy[];
}

/**
 * Apply retention policy to a specific content item
 * Returns the number of versions deleted
 */
export async function applyRetentionPolicy(
  contentId: string,
  policy: RetentionPolicy
): Promise<number> {
  // Build exclusion criteria
  const excludeConditions: Prisma.DocumentVersionWhereInput[] = [];

  // Always exclude protected versions
  excludeConditions.push({ isProtected: true });

  // Exclude named versions if policy says so
  if (policy.keepNamed) {
    excludeConditions.push({ name: { not: null } });
  }

  // Exclude published versions if policy says so
  if (policy.keepPublished) {
    excludeConditions.push({ changeType: 'PUBLISH' });
  }

  // Never delete versions less than 1 hour old
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  excludeConditions.push({ createdAt: { gte: oneHourAgo } });

  let deletedCount = 0;

  // Apply max versions limit
  if (policy.maxVersions !== null) {
    // Get all versions that could be deleted (excluding protected ones)
    const versions = await db.documentVersion.findMany({
      where: {
        contentId,
        NOT: { OR: excludeConditions },
      },
      orderBy: { versionNumber: 'desc' },
      select: { id: true },
    });

    // Delete versions exceeding the limit
    if (versions.length > policy.maxVersions) {
      const versionsToDelete = versions.slice(policy.maxVersions);
      const result = await db.documentVersion.deleteMany({
        where: {
          id: { in: versionsToDelete.map((v) => v.id) },
        },
      });
      deletedCount += result.count;
    }
  }

  // Apply max age limit
  if (policy.maxAgeDays !== null) {
    const maxAge = new Date(Date.now() - policy.maxAgeDays * 24 * 60 * 60 * 1000);

    const result = await db.documentVersion.deleteMany({
      where: {
        contentId,
        createdAt: { lt: maxAge },
        NOT: { OR: excludeConditions },
      },
    });
    deletedCount += result.count;
  }

  return deletedCount;
}

/**
 * Process all retention policies across all content types
 * Used by background scheduler
 */
export async function processAllRetentionPolicies(): Promise<RetentionCleanupResult[]> {
  const results: RetentionCleanupResult[] = [];

  // Get all content types with policies
  const contentTypes = await db.contentType.findMany({
    include: {
      retentionPolicy: true,
      contents: { select: { id: true } },
    },
  });

  for (const contentType of contentTypes) {
    // Use existing policy or default
    const policy: RetentionPolicy = contentType.retentionPolicy
      ? {
          id: contentType.retentionPolicy.id,
          contentTypeId: contentType.id,
          contentType: { name: contentType.name, label: contentType.label },
          maxVersions: contentType.retentionPolicy.maxVersions,
          maxAgeDays: contentType.retentionPolicy.maxAgeDays,
          keepPublished: contentType.retentionPolicy.keepPublished,
          keepNamed: contentType.retentionPolicy.keepNamed,
          updatedAt: contentType.retentionPolicy.updatedAt,
        }
      : {
          id: '',
          contentTypeId: contentType.id,
          contentType: { name: contentType.name, label: contentType.label },
          maxVersions: DEFAULT_RETENTION_POLICY.maxVersions,
          maxAgeDays: DEFAULT_RETENTION_POLICY.maxAgeDays,
          keepPublished: DEFAULT_RETENTION_POLICY.keepPublished,
          keepNamed: DEFAULT_RETENTION_POLICY.keepNamed,
          updatedAt: new Date(),
        };

    // Apply policy to each content item
    for (const content of contentType.contents) {
      const deletedCount = await applyRetentionPolicy(content.id, policy);
      if (deletedCount > 0) {
        results.push({ contentId: content.id, deletedCount });
      }
    }
  }

  return results;
}

/**
 * Retention scheduler class
 * Runs retention cleanup on a schedule
 */
export class RetentionScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private intervalMs: number;

  constructor(intervalMs: number = 24 * 60 * 60 * 1000) { // Default: daily
    this.intervalMs = intervalMs;
  }

  start(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.intervalMs);

    // Run immediately on start
    this.runCleanup();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isActive(): boolean {
    return this.intervalId !== null;
  }

  async runCleanup(): Promise<RetentionCleanupResult[]> {
    if (this.isRunning) {
      return [];
    }

    this.isRunning = true;
    try {
      const results = await processAllRetentionPolicies();
      return results;
    } finally {
      this.isRunning = false;
    }
  }
}

// Singleton instance
let retentionScheduler: RetentionScheduler | null = null;

export function getRetentionScheduler(): RetentionScheduler {
  if (!retentionScheduler) {
    retentionScheduler = new RetentionScheduler();
  }
  return retentionScheduler;
}

export function initializeRetentionScheduler(intervalMs?: number): RetentionScheduler {
  if (retentionScheduler) {
    retentionScheduler.stop();
  }
  retentionScheduler = new RetentionScheduler(intervalMs);
  retentionScheduler.start();
  return retentionScheduler;
}

export function shutdownRetentionScheduler(): void {
  if (retentionScheduler) {
    retentionScheduler.stop();
    retentionScheduler = null;
  }
}
