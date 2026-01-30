/**
 * HOOPERITS CMS - Content Module
 * Public API for content management
 */

// Service
export type {
  ContentInput,
  Content,
  ListContentOptions,
  ListContentResult,
  AdminListContentOptions,
  AdminContent,
  AdminListContentResult,
} from './service';

export {
  listContent,
  getContentById,
  getContentBySlug,
  createContent,
  updateContent,
  deleteContent,
  publishContent,
  unpublishContent,
  // Public API (spec 003-document-states)
  listPublishedContent,
  getPublishedContentBySlug,
  // Admin API (spec 003-document-states)
  listContentForAdmin,
} from './service';

// Validation
export type {
  ContentInputValidation,
  ContentUpdateValidation,
  ContentListQueryValidation,
} from './validation';

export {
  contentInputSchema,
  contentUpdateSchema,
  contentListQuerySchema,
  validateContentInput,
  validateContentUpdate,
  validateContentListQuery,
} from './validation';

// State Machine (spec 003-document-states)
export type { ContentForValidation } from './states';

export {
  canTransition,
  validateTransition,
  hasPendingChanges,
  getValidTransitions,
  getValidActionsForStatus,
  STATE_TRANSITIONS,
  ACTION_TO_STATUS,
  ACTION_SOURCE_STATES,
  STATUS_INFO,
} from './states';

// State Service (spec 003-document-states)
export type {
  ContentWithState,
  StateTransitionResult,
} from './state-service';

export {
  getContentWithState,
  canPerformTransition,
  getAvailableActions,
  validateAction,
  invalidateContentCache,
} from './state-service';

// Publish Operations (spec 003-document-states)
export type { PublishResult } from './publish';

export {
  publish,
  unpublish,
  discardDraft,
  schedule,
  cancelSchedule,
  archive,
  restore,
  getPublishHistory,
  getScheduledContent,
} from './publish';

// Preview Operations (spec 003-document-states)
export type { PreviewTokenResult, PreviewContent } from './preview';

export {
  createPreviewToken,
  validatePreviewToken,
  revokePreviewTokens,
  cleanupExpiredTokens,
  getPreviewTokensForContent,
} from './preview';

// Scheduler (spec 003-document-states)
export type { SchedulerConfig, ProcessResult } from './scheduler';

export {
  PublishScheduler,
  createScheduler,
  getScheduler,
  initializeScheduler,
  shutdownScheduler,
  autoInitializeScheduler,
  registerSchedulerShutdown,
} from './scheduler';

// Version Service (spec 004-document-versioning)
export type {
  VersionInput,
  Version,
  VersionSummary,
  ListVersionsOptions,
  ListVersionsResult,
  CompareVersionsResult,
  RollbackResult,
  AutoSaveResult,
  RecoverableVersionResult,
} from './version';

export {
  createVersion,
  createVersionOnUpdate,
  getNextVersionNumber,
  calculateVersionSize,
  listVersions,
  getVersion,
  getLatestVersionNumber,
  compareVersions,
  rollbackToVersion,
  autoSaveVersion,
  getRecoverableVersion,
  consolidateAutoSaves,
  updateVersionMetadata,
} from './version';

export type { UpdateVersionMetadataInput } from './version';

// Version Diff (spec 004-document-versioning)
export type {
  DiffKind,
  TextDiffSegment,
  DiffChange,
  DiffSummary,
  VersionDiff,
  FieldDiff,
} from './version-diff';

export {
  generateTextDiff,
  generateDiff,
  formatDiffForUI,
  createChangeSummary,
} from './version-diff';

// Version Retention (spec 004-document-versioning)
export type {
  RetentionPolicy,
  RetentionCleanupResult,
} from './version-retention';

export {
  DEFAULT_RETENTION_POLICY,
  getRetentionPolicy,
  updateRetentionPolicy,
  listRetentionPolicies,
  applyRetentionPolicy,
  processAllRetentionPolicies,
  RetentionScheduler,
  getRetentionScheduler,
  initializeRetentionScheduler,
  shutdownRetentionScheduler,
} from './version-retention';

// Version Validation (spec 004-document-versioning)
export type {
  VersionChangeType,
  VersionListQueryInput,
  GetVersionParams,
  CompareVersionsQuery,
  UpdateVersionInput,
  AutoSaveInput,
  CreateVersionInput,
  RetentionPolicyInput,
} from './version-validation';

export {
  versionChangeTypeSchema,
  versionListQuerySchema,
  versionNumberSchema,
  getVersionParamsSchema,
  compareVersionsQuerySchema,
  updateVersionSchema,
  autoSaveSchema,
  createVersionSchema,
  retentionPolicySchema,
  validateVersionListQuery,
  validateGetVersionParams,
  validateCompareVersionsQuery,
  validateUpdateVersion,
  validateAutoSave,
  validateCreateVersion,
  validateRetentionPolicy,
} from './version-validation';
