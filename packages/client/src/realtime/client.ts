/**
 * HOOPERITS CMS - Real-Time WebSocket Client
 * Browser client for real-time content synchronization
 */

import type {
  RealtimeClientConfig,
  RealtimeEvent,
  PresenceInfo,
  SubscriptionFilter,
  ConnectionStatus,
  ClientMessage,
  ServerMessage,
  RealtimeEventHandler,
  PresenceChangeHandler,
  StatusChangeHandler,
  Unsubscribe,
} from './types';
import { DEFAULT_CLIENT_CONFIG } from './types';

/**
 * Generate a unique subscription ID
 */
function generateSubscriptionId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Real-time WebSocket Client
 */
export class RealtimeClient {
  private config: Required<RealtimeClientConfig>;
  private ws: WebSocket | null = null;
  private connectionId: string | null = null;
  private _status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // Subscriptions
  private subscriptions: Map<
    string,
    { filter: SubscriptionFilter; handler: RealtimeEventHandler }
  > = new Map();

  // Presence listeners
  private presenceListeners: Map<string, Set<PresenceChangeHandler>> = new Map();
  private presenceCache: Map<string, PresenceInfo[]> = new Map();

  // Status listeners
  private statusListeners: Set<StatusChangeHandler> = new Set();

  constructor(config: RealtimeClientConfig) {
    this.config = {
      ...DEFAULT_CLIENT_CONFIG,
      ...config,
    };
  }

  /**
   * Get current connection status
   */
  get status(): ConnectionStatus {
    return this._status;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this._status === 'connected') {
        resolve();
        return;
      }

      this.setStatus('connecting');

      const url = new URL(this.config.url);
      url.searchParams.set('token', this.config.token);

      try {
        this.ws = new WebSocket(url.toString());

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as ServerMessage;
            this.handleMessage(message);

            // Resolve on welcome message
            if (message.type === 'welcome') {
              this.connectionId = message.connectionId;
              this.setStatus('connected');
              this.resubscribeAll();
              resolve();
            }
          } catch (error) {
            console.error('[RealtimeClient] Failed to parse message:', error);
          }
        };

        this.ws.onclose = (event) => {
          this.stopHeartbeat();
          this.connectionId = null;

          if (this._status !== 'disconnected') {
            if (this.config.reconnect && !event.wasClean) {
              this.attemptReconnect();
            } else {
              this.setStatus('disconnected');
            }
          }
        };

        this.ws.onerror = (error) => {
          console.error('[RealtimeClient] WebSocket error:', error);
          if (this._status === 'connecting') {
            reject(new Error('WebSocket connection failed'));
          }
        };
      } catch (error) {
        this.setStatus('disconnected');
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    this.setStatus('disconnected');
    this.stopHeartbeat();
    this.clearReconnectTimeout();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.connectionId = null;
  }

  /**
   * Subscribe to events
   */
  subscribe(
    filter: SubscriptionFilter,
    handler: RealtimeEventHandler
  ): Unsubscribe {
    const subscriptionId = generateSubscriptionId();

    this.subscriptions.set(subscriptionId, { filter, handler });

    // Send subscribe message if connected
    if (this._status === 'connected') {
      this.send({
        type: 'subscribe',
        subscriptionId,
        filter,
      });
    }

    return () => {
      this.subscriptions.delete(subscriptionId);

      if (this._status === 'connected') {
        this.send({
          type: 'unsubscribe',
          subscriptionId,
        });
      }
    };
  }

  /**
   * Set presence on a document
   */
  setPresence(info: { documentId: string; field?: string }): void {
    if (this._status !== 'connected') {
      return;
    }

    this.send({
      type: 'presence.update',
      documentId: info.documentId,
      field: info.field,
    });
  }

  /**
   * Clear presence (leave current document)
   */
  clearPresence(): void {
    if (this._status !== 'connected') {
      return;
    }

    this.send({ type: 'presence.leave' });
  }

  /**
   * Get cached presence for a document
   */
  getPresence(documentId: string): PresenceInfo[] {
    return this.presenceCache.get(documentId) || [];
  }

  /**
   * Listen to presence changes for a document
   */
  onPresenceChange(
    documentId: string,
    handler: PresenceChangeHandler
  ): Unsubscribe {
    if (!this.presenceListeners.has(documentId)) {
      this.presenceListeners.set(documentId, new Set());
    }

    this.presenceListeners.get(documentId)!.add(handler);

    // Emit current cached presence
    const cached = this.presenceCache.get(documentId);
    if (cached) {
      handler(cached);
    }

    return () => {
      this.presenceListeners.get(documentId)?.delete(handler);
    };
  }

  /**
   * Listen to connection status changes
   */
  onStatusChange(handler: StatusChangeHandler): Unsubscribe {
    this.statusListeners.add(handler);

    // Emit current status
    handler(this._status);

    return () => {
      this.statusListeners.delete(handler);
    };
  }

  // =========================================
  // Private methods
  // =========================================

  private setStatus(status: ConnectionStatus): void {
    if (this._status !== status) {
      this._status = status;
      this.notifyStatusListeners();
    }
  }

  private notifyStatusListeners(): void {
    for (const handler of this.statusListeners) {
      try {
        handler(this._status);
      } catch (error) {
        console.error('[RealtimeClient] Status handler error:', error);
      }
    }
  }

  private handleMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'event':
        this.handleEvent(message.event);
        break;

      case 'presence':
        this.handlePresence(message.documentId, message.users);
        break;

      case 'subscribed':
      case 'unsubscribed':
        // Acknowledgements - could add pending subscription tracking
        break;

      case 'pong':
        // Heartbeat response - connection is alive
        break;

      case 'error':
        console.error('[RealtimeClient] Server error:', message.code, message.message);
        break;

      case 'welcome':
        // Handled in connect()
        break;
    }
  }

  private handleEvent(event: RealtimeEvent): void {
    for (const { filter, handler } of this.subscriptions.values()) {
      if (this.matchesFilter(event, filter)) {
        try {
          handler(event);
        } catch (error) {
          console.error('[RealtimeClient] Event handler error:', error);
        }
      }
    }
  }

  private handlePresence(documentId: string, users: PresenceInfo[]): void {
    this.presenceCache.set(documentId, users);

    const listeners = this.presenceListeners.get(documentId);
    if (listeners) {
      for (const handler of listeners) {
        try {
          handler(users);
        } catch (error) {
          console.error('[RealtimeClient] Presence handler error:', error);
        }
      }
    }
  }

  private matchesFilter(event: RealtimeEvent, filter: SubscriptionFilter): boolean {
    if (filter._type && event.documentType !== filter._type) {
      return false;
    }

    if (filter.documentId && event.documentId !== filter.documentId) {
      return false;
    }

    if (filter.events && filter.events.length > 0) {
      if (!filter.events.includes(event.type)) {
        return false;
      }
    }

    return true;
  }

  private send(message: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private resubscribeAll(): void {
    for (const [subscriptionId, { filter }] of this.subscriptions) {
      this.send({
        type: 'subscribe',
        subscriptionId,
        filter,
      });
    }
  }

  private attemptReconnect(): void {
    this.setStatus('reconnecting');
    this.reconnectAttempts++;

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.config.reconnectDelayMax
    );

    console.log(
      `[RealtimeClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('[RealtimeClient] Reconnection failed:', error);
        // Will retry via onclose handler
      }
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

/**
 * Create a new realtime client
 */
export function createRealtimeClient(config: RealtimeClientConfig): RealtimeClient {
  return new RealtimeClient(config);
}
