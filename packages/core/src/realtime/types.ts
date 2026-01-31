/**
 * HOOPERITS CMS - Real-Time Sync Types
 * TypeScript interfaces for WebSocket communication
 */

import type { UserRole } from '../auth/permissions';

/**
 * Event types emitted by the real-time system
 */
export type RealtimeEventType =
  | 'document.created'
  | 'document.updated'
  | 'document.deleted'
  | 'document.published'
  | 'document.unpublished'
  | 'presence.joined'
  | 'presence.left'
  | 'presence.updated';

/**
 * Main event interface (as defined in spec)
 */
export interface RealtimeEvent {
  /** Event type */
  type: RealtimeEventType;
  /** Document ID (for document events) */
  documentId?: string;
  /** Document type/content type name */
  documentType?: string;
  /** User who triggered the event */
  userId: string;
  /** ISO timestamp */
  timestamp: string;
  /** Event-specific payload */
  payload: Record<string, unknown>;
}

/**
 * Presence information for a user viewing/editing a document
 */
export interface PresenceInfo {
  /** User ID */
  userId: string;
  /** User display name */
  userName: string;
  /** User email (for avatar generation) */
  userEmail?: string;
  /** Document being viewed */
  documentId: string;
  /** Field being edited (for granular presence) */
  field?: string;
  /** When user joined the document */
  joinedAt: string;
  /** Last activity timestamp */
  lastActiveAt: string;
}

/**
 * Subscription filter for event filtering
 */
export interface SubscriptionFilter {
  /** Filter by document type */
  _type?: string;
  /** Filter by specific document ID */
  documentId?: string;
  /** Filter by event types */
  events?: RealtimeEventType[];
}

/**
 * WebSocket connection metadata
 */
export interface ConnectionMeta {
  /** Unique connection ID */
  connectionId: string;
  /** User ID */
  userId: string;
  /** User display name */
  userName: string;
  /** User email */
  userEmail?: string;
  /** User role */
  role: UserRole;
  /** Connection timestamp */
  connectedAt: Date;
  /** Active subscriptions (subscriptionId -> filter) */
  subscriptions: Map<string, SubscriptionFilter>;
  /** Current presence info */
  presence?: PresenceInfo;
}

/**
 * Connection status
 */
export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

// ============================================
// Client -> Server Messages
// ============================================

export interface SubscribeMessage {
  type: 'subscribe';
  subscriptionId: string;
  filter: SubscriptionFilter;
}

export interface UnsubscribeMessage {
  type: 'unsubscribe';
  subscriptionId: string;
}

export interface PresenceUpdateMessage {
  type: 'presence.update';
  documentId: string;
  field?: string;
}

export interface PresenceLeaveMessage {
  type: 'presence.leave';
}

export interface PingMessage {
  type: 'ping';
}

export type ClientMessage =
  | SubscribeMessage
  | UnsubscribeMessage
  | PresenceUpdateMessage
  | PresenceLeaveMessage
  | PingMessage;

// ============================================
// Server -> Client Messages
// ============================================

export interface EventMessage {
  type: 'event';
  event: RealtimeEvent;
}

export interface PresenceMessage {
  type: 'presence';
  documentId: string;
  users: PresenceInfo[];
}

export interface SubscribedMessage {
  type: 'subscribed';
  subscriptionId: string;
}

export interface UnsubscribedMessage {
  type: 'unsubscribed';
  subscriptionId: string;
}

export interface ErrorMessage {
  type: 'error';
  code: string;
  message: string;
}

export interface PongMessage {
  type: 'pong';
}

export interface WelcomeMessage {
  type: 'welcome';
  connectionId: string;
}

export type ServerMessage =
  | EventMessage
  | PresenceMessage
  | SubscribedMessage
  | UnsubscribedMessage
  | ErrorMessage
  | PongMessage
  | WelcomeMessage;

// ============================================
// Configuration
// ============================================

/**
 * Real-time server configuration
 */
export interface RealtimeServerConfig {
  /** Enable real-time functionality */
  enabled: boolean;
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval: number;
  /** Connection timeout in ms (default: 60000) */
  connectionTimeout: number;
  /** Maximum connections per server (default: 500) */
  maxConnections: number;
}

/**
 * Real-time client configuration
 */
export interface RealtimeClientConfig {
  /** WebSocket URL */
  url: string;
  /** Authentication token */
  token: string;
  /** Enable auto-reconnect (default: true) */
  reconnect?: boolean;
  /** Initial reconnect delay in ms (default: 1000) */
  reconnectDelay?: number;
  /** Maximum reconnect delay in ms (default: 30000) */
  reconnectDelayMax?: number;
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: RealtimeServerConfig = {
  enabled: true,
  heartbeatInterval: 30000,
  connectionTimeout: 60000,
  maxConnections: 500,
};

export const DEFAULT_CLIENT_CONFIG = {
  reconnect: true,
  reconnectDelay: 1000,
  reconnectDelayMax: 30000,
  heartbeatInterval: 30000,
};

// ============================================
// Utility Types
// ============================================

/**
 * Event handler function type
 */
export type RealtimeEventHandler = (event: RealtimeEvent) => void;

/**
 * Presence change handler function type
 */
export type PresenceChangeHandler = (users: PresenceInfo[]) => void;

/**
 * Status change handler function type
 */
export type StatusChangeHandler = (status: ConnectionStatus) => void;

/**
 * Unsubscribe function returned by subscribe methods
 */
export type Unsubscribe = () => void;
