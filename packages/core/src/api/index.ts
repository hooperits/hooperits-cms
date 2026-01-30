/**
 * HOOPERITS CMS - API Handlers
 * Export all API handlers for use in Next.js API routes
 */

// Content API
export {
  handleListContent,
  handleGetContent,
  handleGetContentBySlug,
  handleCreateContent,
  handleUpdateContent,
  handleDeleteContent,
} from './content';

// Media API
export {
  handleListMedia,
  handleGetMedia,
  handleUploadMedia,
  handleDeleteMedia,
} from './media';

// HQL Query API
export { handleHQLQuery } from './hql';

// Publish API (spec 003-document-states)
export type { PublishRequestContext, PublishApiResponse } from './publish';
export {
  handlePublish,
  handleUnpublish,
  handleDiscardDraft,
  handleSchedule,
  handleCancelSchedule,
  handleArchive,
  handleRestore,
  handleGetHistory,
  handleGetScheduled,
} from './publish';

// Preview API (spec 003-document-states)
export type { PreviewRequestContext, PreviewApiResponse } from './preview';
export {
  handleCreatePreviewToken,
  handleRevokePreviewTokens,
  handleGetPreview,
} from './preview';

// Version API (spec 004-document-versioning)
export type { VersionRequestContext, VersionApiResponse, RetentionRequestContext } from './version';
export {
  handleListVersions,
  handleGetVersion,
  handleUpdateVersion,
  handleCompareVersions,
  handleRollbackVersion,
  handleAutoSave,
  handleGetRecoverable,
  handleListRetentionPolicies,
  handleGetRetentionPolicy,
  handleUpdateRetentionPolicy,
} from './version';
