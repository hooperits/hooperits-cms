/**
 * HOOPERITS CMS Client
 * Type-safe SDK for consuming CMS content in frontend applications
 */

// Client
export { CMSClient, createCMSClient } from './client';

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
} from './types';

// React hooks (optional)
export { useContentList, useContent, useContentBySlug } from './hooks';
