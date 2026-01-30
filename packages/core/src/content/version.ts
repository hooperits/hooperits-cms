/**
 * HOOPERITS CMS - Version Service
 * Document versioning operations
 */

import { db } from '../db';
import { logger } from '../logger';
import { NotFoundError } from '../errors';
import type { VersionChangeType, Prisma } from '@prisma/client';

export interface VersionInput {
  contentId: string;
  data: Record<string, unknown>;
  changeType?: VersionChangeType;
  changeSummary?: string;
  createdById: string;
}

export interface Version {
  id: string;
  contentId: string;
  versionNumber: number;
  data: Record<string, unknown>;
  changeType: VersionChangeType;
  changeSummary: string | null;
  size: number;
  name: string | null;
  isProtected: boolean;
  createdById: string;
  createdBy: { id: string; name: string };
  createdAt: Date;
}

export interface VersionSummary {
  id: string;
  versionNumber: number;
  changeType: VersionChangeType;
  changeSummary: string | null;
  name: string | null;
  isProtected: boolean;
  createdBy: { id: string; name: string };
  createdAt: Date;
}

/**
 * Calculate the size in bytes of a JSON object.
 * Used for version size tracking and storage optimization.
 *
 * @param data - The JSON data to measure
 * @returns Size in bytes
 */
export function calculateVersionSize(data: Record<string, unknown>): number {
  return Buffer.byteLength(JSON.stringify(data), 'utf8');
}

/**
 * Get the next sequential version number for a content item.
 * Returns 1 if no versions exist.
 *
 * @param contentId - The content item ID
 * @returns The next version number
 */
export async function getNextVersionNumber(contentId: string): Promise<number> {
  const lastVersion = await db.documentVersion.findFirst({
    where: { contentId },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  });

  return lastVersion ? lastVersion.versionNumber + 1 : 1;
}

/**
 * Create a new version for a content item.
 * Stores a snapshot of the content data with metadata.
 *
 * @param input - Version creation input
 * @param input.contentId - The content item ID
 * @param input.data - The content data to snapshot
 * @param input.changeType - Type of change (MANUAL, AUTO, ROLLBACK, PUBLISH, IMPORT)
 * @param input.changeSummary - Optional description of the change
 * @param input.createdById - The user ID who created this version
 * @returns The created version with full metadata
 * @throws NotFoundError if content doesn't exist
 */
export async function createVersion(input: VersionInput): Promise<Version> {
  const { contentId, data, changeType = 'MANUAL', changeSummary, createdById } = input;

  // Verify content exists
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: { id: true },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  // Get next version number and calculate size
  const [versionNumber, size] = await Promise.all([
    getNextVersionNumber(contentId),
    Promise.resolve(calculateVersionSize(data)),
  ]);

  // Create the version
  const version = await db.documentVersion.create({
    data: {
      contentId,
      versionNumber,
      data: data as Prisma.InputJsonValue,
      changeType,
      changeSummary,
      size,
      createdById,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  logger.info(`Version created: ${contentId} v${versionNumber} (${changeType})`, {
    contentId,
    versionNumber,
    changeType,
    size,
    userId: createdById,
  });

  return {
    id: version.id,
    contentId: version.contentId,
    versionNumber: version.versionNumber,
    data: version.data as Record<string, unknown>,
    changeType: version.changeType,
    changeSummary: version.changeSummary,
    size: version.size,
    name: version.name,
    isProtected: version.isProtected,
    createdById: version.createdById,
    createdBy: version.createdBy as { id: string; name: string },
    createdAt: version.createdAt,
  };
}

/**
 * Create a version internally during content update.
 * Called automatically by the content service to preserve history.
 *
 * @param contentId - The content item ID being updated
 * @param previousData - The content data before the update
 * @param userId - The user performing the update
 * @param changeType - Type of change (defaults to MANUAL)
 * @returns The created version
 */
export async function createVersionOnUpdate(
  contentId: string,
  previousData: Record<string, unknown>,
  userId: string,
  changeType: VersionChangeType = 'MANUAL'
): Promise<Version> {
  return createVersion({
    contentId,
    data: previousData,
    changeType,
    createdById: userId,
  });
}

// =============================================================================
// USER STORY 1: Version History
// =============================================================================

export interface ListVersionsOptions {
  page?: number;
  limit?: number;
  changeType?: VersionChangeType;
  author?: string;
  from?: Date;
  to?: Date;
}

export interface ListVersionsResult {
  items: VersionSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const versionSummarySelect = {
  id: true,
  versionNumber: true,
  changeType: true,
  changeSummary: true,
  name: true,
  isProtected: true,
  createdBy: { select: { id: true, name: true } },
  createdAt: true,
} as const;

const versionFullSelect = {
  ...versionSummarySelect,
  contentId: true,
  data: true,
  size: true,
  createdById: true,
} as const;

/**
 * List versions for a content item with pagination and filtering.
 * Returns version summaries (without full data) for performance.
 *
 * @param contentId - The content item ID
 * @param options - Pagination and filtering options
 * @param options.page - Page number (default: 1)
 * @param options.limit - Items per page (default: 20)
 * @param options.changeType - Filter by change type
 * @param options.author - Filter by author user ID
 * @param options.from - Filter versions created after this date
 * @param options.to - Filter versions created before this date
 * @returns Paginated list of version summaries
 * @throws NotFoundError if content doesn't exist
 */
export async function listVersions(
  contentId: string,
  options: ListVersionsOptions = {}
): Promise<ListVersionsResult> {
  const { page = 1, limit = 20, changeType, author, from, to } = options;

  // Verify content exists
  const content = await db.content.findUnique({
    where: { id: contentId },
    select: { id: true },
  });

  if (!content) {
    throw new NotFoundError('Content', contentId);
  }

  // Build where clause
  const where: Prisma.DocumentVersionWhereInput = {
    contentId,
    ...(changeType && { changeType }),
    ...(author && { createdById: author }),
    ...(from || to) && {
      createdAt: {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      },
    },
  };

  // Execute queries
  const [items, total] = await Promise.all([
    db.documentVersion.findMany({
      where,
      select: versionSummarySelect,
      orderBy: { versionNumber: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.documentVersion.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      versionNumber: item.versionNumber,
      changeType: item.changeType,
      changeSummary: item.changeSummary,
      name: item.name,
      isProtected: item.isProtected,
      createdBy: item.createdBy as { id: string; name: string },
      createdAt: item.createdAt,
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
 * Get a single version by content ID and version number.
 * Returns the full version including data content.
 *
 * @param contentId - The content item ID
 * @param versionNumber - The version number to retrieve
 * @returns The full version with data
 * @throws NotFoundError if version doesn't exist
 */
export async function getVersion(
  contentId: string,
  versionNumber: number
): Promise<Version> {
  const version = await db.documentVersion.findUnique({
    where: {
      contentId_versionNumber: { contentId, versionNumber },
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!version) {
    throw new NotFoundError('Version', `${contentId}#${versionNumber}`);
  }

  return {
    id: version.id,
    contentId: version.contentId,
    versionNumber: version.versionNumber,
    data: version.data as Record<string, unknown>,
    changeType: version.changeType,
    changeSummary: version.changeSummary,
    size: version.size,
    name: version.name,
    isProtected: version.isProtected,
    createdById: version.createdById,
    createdBy: version.createdBy as { id: string; name: string },
    createdAt: version.createdAt,
  };
}

/**
 * Get the latest version number for a content item.
 *
 * @param contentId - The content item ID
 * @returns The highest version number, or null if no versions exist
 */
export async function getLatestVersionNumber(contentId: string): Promise<number | null> {
  const version = await db.documentVersion.findFirst({
    where: { contentId },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  });

  return version?.versionNumber ?? null;
}

// =============================================================================
// USER STORY 2: Version Diff
// =============================================================================

import { generateDiff, type VersionDiff, type DiffChange, type DiffSummary } from './version-diff';

export interface CompareVersionsResult {
  from: VersionSummary;
  to: VersionSummary;
  changes: DiffChange[];
  summary: DiffSummary;
}

/**
 * Compare two versions and generate a detailed diff.
 * Identifies added, deleted, and modified fields between versions.
 *
 * @param contentId - The content item ID
 * @param fromVersionNumber - The source version number
 * @param toVersionNumber - The target version number
 * @returns Comparison result with changes and summary
 * @throws NotFoundError if either version doesn't exist
 */
export async function compareVersions(
  contentId: string,
  fromVersionNumber: number,
  toVersionNumber: number
): Promise<CompareVersionsResult> {
  // Fetch both versions
  const [fromVersion, toVersion] = await Promise.all([
    getVersion(contentId, fromVersionNumber),
    getVersion(contentId, toVersionNumber),
  ]);

  // Generate diff
  const diff = generateDiff(fromVersion.data, toVersion.data);

  return {
    from: {
      id: fromVersion.id,
      versionNumber: fromVersion.versionNumber,
      changeType: fromVersion.changeType,
      changeSummary: fromVersion.changeSummary,
      name: fromVersion.name,
      isProtected: fromVersion.isProtected,
      createdBy: fromVersion.createdBy,
      createdAt: fromVersion.createdAt,
    },
    to: {
      id: toVersion.id,
      versionNumber: toVersion.versionNumber,
      changeType: toVersion.changeType,
      changeSummary: toVersion.changeSummary,
      name: toVersion.name,
      isProtected: toVersion.isProtected,
      createdBy: toVersion.createdBy,
      createdAt: toVersion.createdAt,
    },
    changes: diff.changes,
    summary: diff.summary,
  };
}

// =============================================================================
// USER STORY 3: Rollback
// =============================================================================

export interface RollbackResult {
  content: {
    id: string;
    data: Record<string, unknown>;
  };
  newVersion: Version;
  rolledBackFrom: VersionSummary;
}

/**
 * Rollback content to a previous version.
 * This operation:
 * 1. Saves the current state as a new version (preserving history)
 * 2. Updates content.data with the target version's data
 * 3. Creates a new ROLLBACK version for audit trail
 * 4. Sets document status to DRAFT
 *
 * @param contentId - The content item ID
 * @param targetVersionNumber - The version number to restore
 * @param userId - The user performing the rollback
 * @returns The updated content and new version number
 * @throws NotFoundError if content or version doesn't exist
 */
export async function rollbackToVersion(
  contentId: string,
  targetVersionNumber: number,
  userId: string
): Promise<RollbackResult> {
  // Get the target version to restore
  const targetVersion = await getVersion(contentId, targetVersionNumber);

  // Get current content state
  const currentContent = await db.content.findUnique({
    where: { id: contentId },
    select: { id: true, data: true },
  });

  if (!currentContent) {
    throw new NotFoundError('Content', contentId);
  }

  // Step 1: Create a version of the current state before rollback
  await createVersion({
    contentId,
    data: currentContent.data as Record<string, unknown>,
    changeType: 'MANUAL',
    changeSummary: `State before rollback to v${targetVersionNumber}`,
    createdById: userId,
  });

  // Step 2: Update content.data with target version's data
  const updatedContent = await db.content.update({
    where: { id: contentId },
    data: {
      data: targetVersion.data as Prisma.InputJsonValue,
      updatedById: userId,
      // Set status to DRAFT since we're rolling back
      status: 'DRAFT',
    },
    select: { id: true, data: true },
  });

  // Step 3: Create a ROLLBACK version
  const newVersion = await createVersion({
    contentId,
    data: targetVersion.data,
    changeType: 'ROLLBACK',
    changeSummary: `Rolled back to v${targetVersionNumber}`,
    createdById: userId,
  });

  logger.info(`Content rolled back: ${contentId} to v${targetVersionNumber}`, {
    contentId,
    targetVersionNumber,
    newVersionNumber: newVersion.versionNumber,
    userId,
  });

  return {
    content: {
      id: updatedContent.id,
      data: updatedContent.data as Record<string, unknown>,
    },
    newVersion,
    rolledBackFrom: {
      id: targetVersion.id,
      versionNumber: targetVersion.versionNumber,
      changeType: targetVersion.changeType,
      changeSummary: targetVersion.changeSummary,
      name: targetVersion.name,
      isProtected: targetVersion.isProtected,
      createdBy: targetVersion.createdBy,
      createdAt: targetVersion.createdAt,
    },
  };
}

// =============================================================================
// USER STORY 4: Auto-save Versions
// =============================================================================

export interface AutoSaveResult {
  version: VersionSummary;
  consolidated: boolean;
}

export interface RecoverableVersionResult {
  hasRecoverable: boolean;
  version: Version | null;
  currentVersion: number | null;
}

// Auto-save consolidation window (5 minutes)
const AUTO_SAVE_CONSOLIDATION_WINDOW_MS = 5 * 60 * 1000;

/**
 * Create an auto-save version with consolidation
 * Consolidates multiple auto-saves within a time window into a single version
 */
export async function autoSaveVersion(
  contentId: string,
  data: Record<string, unknown>,
  userId: string
): Promise<AutoSaveResult> {
  // Check for recent auto-save by the same user
  const recentAutoSave = await db.documentVersion.findFirst({
    where: {
      contentId,
      createdById: userId,
      changeType: 'AUTO',
      createdAt: {
        gte: new Date(Date.now() - AUTO_SAVE_CONSOLIDATION_WINDOW_MS),
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  let consolidated = false;
  let version: Version;

  if (recentAutoSave) {
    // Update the existing auto-save instead of creating a new one
    const size = calculateVersionSize(data);
    const updated = await db.documentVersion.update({
      where: { id: recentAutoSave.id },
      data: {
        data: data as Prisma.InputJsonValue,
        size,
        createdAt: new Date(), // Update timestamp
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    version = {
      id: updated.id,
      contentId: updated.contentId,
      versionNumber: updated.versionNumber,
      data: updated.data as Record<string, unknown>,
      changeType: updated.changeType,
      changeSummary: updated.changeSummary,
      size: updated.size,
      name: updated.name,
      isProtected: updated.isProtected,
      createdById: updated.createdById,
      createdBy: updated.createdBy as { id: string; name: string },
      createdAt: updated.createdAt,
    };
    consolidated = true;
  } else {
    // Create a new auto-save version
    version = await createVersion({
      contentId,
      data,
      changeType: 'AUTO',
      changeSummary: 'Auto-saved draft',
      createdById: userId,
    });
  }

  return {
    version: {
      id: version.id,
      versionNumber: version.versionNumber,
      changeType: version.changeType,
      changeSummary: version.changeSummary,
      name: version.name,
      isProtected: version.isProtected,
      createdBy: version.createdBy,
      createdAt: version.createdAt,
    },
    consolidated,
  };
}

/**
 * Get the latest auto-save for crash recovery
 * Returns the most recent auto-save if it's newer than the last manual save
 */
export async function getRecoverableVersion(
  contentId: string
): Promise<RecoverableVersionResult> {
  // Get the latest manual/publish version
  const latestManual = await db.documentVersion.findFirst({
    where: {
      contentId,
      changeType: { in: ['MANUAL', 'PUBLISH', 'ROLLBACK'] },
    },
    orderBy: { createdAt: 'desc' },
    select: { versionNumber: true, createdAt: true },
  });

  // Get the latest auto-save
  const latestAutoSave = await db.documentVersion.findFirst({
    where: {
      contentId,
      changeType: 'AUTO',
    },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  // No auto-save available
  if (!latestAutoSave) {
    return {
      hasRecoverable: false,
      version: null,
      currentVersion: latestManual?.versionNumber ?? null,
    };
  }

  // Auto-save is older than last manual save - not recoverable
  if (latestManual && latestAutoSave.createdAt <= latestManual.createdAt) {
    return {
      hasRecoverable: false,
      version: null,
      currentVersion: latestManual.versionNumber,
    };
  }

  // Auto-save is newer - recoverable
  return {
    hasRecoverable: true,
    version: {
      id: latestAutoSave.id,
      contentId: latestAutoSave.contentId,
      versionNumber: latestAutoSave.versionNumber,
      data: latestAutoSave.data as Record<string, unknown>,
      changeType: latestAutoSave.changeType,
      changeSummary: latestAutoSave.changeSummary,
      size: latestAutoSave.size,
      name: latestAutoSave.name,
      isProtected: latestAutoSave.isProtected,
      createdById: latestAutoSave.createdById,
      createdBy: latestAutoSave.createdBy as { id: string; name: string },
      createdAt: latestAutoSave.createdAt,
    },
    currentVersion: latestManual?.versionNumber ?? null,
  };
}

/**
 * Consolidate auto-saves when a manual save occurs
 * Marks previous auto-saves as superseded (delete them)
 */
export async function consolidateAutoSaves(
  contentId: string,
  beforeDate: Date
): Promise<number> {
  const result = await db.documentVersion.deleteMany({
    where: {
      contentId,
      changeType: 'AUTO',
      createdAt: { lt: beforeDate },
    },
  });

  return result.count;
}

// =============================================================================
// USER STORY 6: Named Versions
// =============================================================================

export interface UpdateVersionMetadataInput {
  name?: string | null;
  isProtected?: boolean;
}

/**
 * Update version metadata (name and protection status)
 */
export async function updateVersionMetadata(
  contentId: string,
  versionNumber: number,
  input: UpdateVersionMetadataInput
): Promise<Version> {
  // Verify version exists
  const existing = await db.documentVersion.findUnique({
    where: {
      contentId_versionNumber: { contentId, versionNumber },
    },
  });

  if (!existing) {
    throw new NotFoundError('Version', `${contentId}#${versionNumber}`);
  }

  // Update the version
  const updated = await db.documentVersion.update({
    where: {
      contentId_versionNumber: { contentId, versionNumber },
    },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.isProtected !== undefined && { isProtected: input.isProtected }),
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  return {
    id: updated.id,
    contentId: updated.contentId,
    versionNumber: updated.versionNumber,
    data: updated.data as Record<string, unknown>,
    changeType: updated.changeType,
    changeSummary: updated.changeSummary,
    size: updated.size,
    name: updated.name,
    isProtected: updated.isProtected,
    createdById: updated.createdById,
    createdBy: updated.createdBy as { id: string; name: string },
    createdAt: updated.createdAt,
  };
}
