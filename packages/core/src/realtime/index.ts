/**
 * HOOPERITS CMS - Real-Time Sync Module
 * WebSocket-based real-time content synchronization
 */

// Types
export type {
  RealtimeEventType,
  RealtimeEvent,
  PresenceInfo,
  SubscriptionFilter,
  ConnectionMeta,
  ConnectionStatus,
  ClientMessage,
  ServerMessage,
  RealtimeServerConfig,
  RealtimeClientConfig,
  RealtimeEventHandler,
  PresenceChangeHandler,
  StatusChangeHandler,
  Unsubscribe,
} from './types';

export { DEFAULT_CONFIG, DEFAULT_CLIENT_CONFIG } from './types';

// Event Emitter
export {
  realtimeEmitter,
  emitDocumentEvent,
  emitPresenceEvent,
} from './emitter';

// Authentication
export {
  setTokenValidator,
  validateRealtimeToken,
  createConnectionMeta,
  generateConnectionId,
  canSubscribe,
  shouldReceiveEvent,
} from './auth';
export type { DecodedToken, TokenValidationResult, TokenValidator } from './auth';

// Presence Manager
export { presenceManager } from './presence';

// WebSocket Server
export {
  RealtimeServer,
  getRealtimeServer,
  initializeRealtimeServer,
} from './server';
