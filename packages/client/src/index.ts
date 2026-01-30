/**
 * HOOPERITS CMS Client
 * Type-safe SDK for consuming CMS content in frontend applications
 */

// Client
export { CMSClient, createCMSClient } from './client';

// HQL Client (standalone)
export { HQLClient, createHQLClient, defineQuery } from './hql';

// Types
export type {
  Content,
  ContentListResponse,
  Pagination,
  Media,
  MediaVariants,
  MediaVariant,
  ContentType,
  ListOptions,
  ClientConfig,
  CMSError,
  // HQL Types
  HQLQueryOptions,
  HQLQueryResponse,
  HQLQueryMeta,
  HQLError,
  HQLErrorCode,
} from './types';

// React hooks (optional)
export { useContentList, useContent, useContentBySlug } from './hooks';

// Preview Mode (spec 003-document-states)
export {
  isPreviewMode,
  getPreviewToken,
  enablePreview,
  disablePreview,
  fetchPreviewContent,
  getPreviewState,
} from './preview';
export type { PreviewContentData, PreviewState } from './preview';

// Components
export { PreviewBanner } from './components/PreviewBanner';
