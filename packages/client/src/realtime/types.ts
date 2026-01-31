/**
 * HOOPERITS CMS - Real-Time Client Types
 * TypeScript interfaces for WebSocket client
 */

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
 * Main event interface
 */
export interface RealtimeEvent {
  type: RealtimeEventType;
  documentId?: string;
  documentType?: string;
  userId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

/**
 * Presence information for a user
 */
export interface PresenceInfo {
  userId: string;
  userName: string;
  userEmail?: string;
  documentId: string;
  field?: string;
  joinedAt: string;
  lastActiveAt: string;
}

/**
 * Subscription filter
 */
export interface SubscriptionFilter {
  _type?: string;
  documentId?: string;
  events?: RealtimeEventType[];
}

/**
 * Connection status
 */
export type ConnectionStatus =
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

/**
 * Client configuration
 */
export interface RealtimeClientConfig {
  url: string;
  token: string;
  reconnect?: boolean;
  reconnectDelay?: number;
  reconnectDelayMax?: number;
  /** Maximum reconnect attempts before giving up (default: 10, 0 = infinite) */
  maxReconnectAttempts?: number;
  /** Maximum entries in presence cache (default: 20) */
  maxPresenceCacheSize?: number;
  heartbeatInterval?: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_CLIENT_CONFIG = {
  reconnect: true,
  reconnectDelay: 1000,
  reconnectDelayMax: 30000,
  maxReconnectAttempts: 10,
  maxPresenceCacheSize: 20,
  heartbeatInterval: 30000,
};

// Message types (client -> server)
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

export interface AuthenticateMessage {
  type: 'authenticate';
  token: string;
}

export type ClientMessage =
  | SubscribeMessage
  | UnsubscribeMessage
  | PresenceUpdateMessage
  | PresenceLeaveMessage
  | PingMessage
  | AuthenticateMessage;

// Message types (server -> client)
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

export interface AuthenticatedMessage {
  type: 'authenticated';
  connectionId: string;
}

export type ServerMessage =
  | EventMessage
  | PresenceMessage
  | SubscribedMessage
  | UnsubscribedMessage
  | ErrorMessage
  | PongMessage
  | WelcomeMessage
  | AuthenticatedMessage;

/**
 * Handler types
 */
export type RealtimeEventHandler = (event: RealtimeEvent) => void;
export type PresenceChangeHandler = (users: PresenceInfo[]) => void;
export type StatusChangeHandler = (status: ConnectionStatus) => void;
export type Unsubscribe = () => void;
