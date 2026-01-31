/**
 * HOOPERITS CMS - Real-Time Client Module
 * Browser client for real-time content synchronization
 */

// Types
export type {
  RealtimeEventType,
  RealtimeEvent,
  PresenceInfo,
  SubscriptionFilter,
  ConnectionStatus,
  RealtimeClientConfig,
  ClientMessage,
  ServerMessage,
  RealtimeEventHandler,
  PresenceChangeHandler,
  StatusChangeHandler,
  Unsubscribe,
} from './types';

export { DEFAULT_CLIENT_CONFIG } from './types';

// Client
export { RealtimeClient, createRealtimeClient } from './client';

// React Context
export { RealtimeProvider, RealtimeContext, useRealtimeContext } from './context';
export type { RealtimeContextValue, RealtimeProviderProps } from './context';

// React Hooks
export {
  useRealtime,
  useRealtimeStatus,
  useRealtimeEvent,
  useDocumentPresence,
  useSetPresence,
  useDocumentEdit,
  useDocumentChanges,
  useContentTypeChanges,
} from './hooks';
