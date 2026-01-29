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
