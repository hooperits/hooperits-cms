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

// Portable Text Component (spec 005-rich-text-portable)
export { PortableText, defaultComponents } from './components/PortableText';
export {
  DefaultParagraph,
  DefaultHeading1,
  DefaultHeading2,
  DefaultHeading3,
  DefaultHeading4,
  DefaultHeading5,
  DefaultHeading6,
  DefaultBlockquote,
  DefaultStrong,
  DefaultEm,
  DefaultUnderline,
  DefaultStrike,
  DefaultCode,
  DefaultLink,
  DefaultBulletList,
  DefaultNumberedList,
  DefaultListItem,
  DefaultImageBlock,
  DefaultCodeBlock,
  DefaultVideoBlock,
  DefaultQuoteBlock,
} from './components/PortableText';

// Auto-save (spec 004-document-versioning)
export {
  useAutoSave,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  checkServerRecovery,
  checkAllRecovery,
} from './auto-save';
export type {
  AutoSaveConfig,
  AutoSaveState,
  RecoverableData,
} from './auto-save';

// Real-time Sync (spec 006-real-time-sync)
export {
  RealtimeClient,
  createRealtimeClient,
  RealtimeProvider,
  RealtimeContext,
  useRealtimeContext,
  useRealtime,
  useRealtimeStatus,
  useRealtimeEvent,
  useDocumentPresence,
  useSetPresence,
  useDocumentEdit,
  useDocumentChanges,
  useContentTypeChanges,
  DEFAULT_CLIENT_CONFIG,
} from './realtime';
export type {
  RealtimeEventType,
  RealtimeEvent,
  PresenceInfo,
  SubscriptionFilter,
  ConnectionStatus,
  RealtimeClientConfig,
  RealtimeContextValue,
  RealtimeProviderProps,
  RealtimeEventHandler,
  PresenceChangeHandler,
  StatusChangeHandler,
} from './realtime';
