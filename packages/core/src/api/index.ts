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
