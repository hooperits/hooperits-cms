/**
 * HOOPERITS CMS - Real-Time WebSocket Server
 * WebSocket server for real-time content synchronization
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server as HTTPServer } from 'http';
import type {
  ConnectionMeta,
  ClientMessage,
  ServerMessage,
  RealtimeEvent,
  SubscriptionFilter,
  RealtimeServerConfig,
} from './types';
import { DEFAULT_CONFIG, ClientMessageSchema } from './types';
import {
  validateRealtimeToken,
  createConnectionMeta,
  generateConnectionId,
  shouldReceiveEvent,
  canSubscribe,
} from './auth';
import { realtimeEmitter } from './emitter';
import { presenceManager } from './presence';

/**
 * Extended WebSocket with connection metadata
 */
interface ExtendedWebSocket extends WebSocket {
  connectionMeta?: ConnectionMeta;
  isAlive?: boolean;
  isAuthenticated?: boolean;
  authTimeout?: NodeJS.Timeout;
}

/**
 * Real-Time WebSocket Server
 */
export class RealtimeServer {
  private wss: WebSocketServer | null = null;
  private connections: Map<string, ExtendedWebSocket> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private config: RealtimeServerConfig;
  private eventUnsubscribe: (() => void) | null = null;

  constructor(config: Partial<RealtimeServerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the WebSocket server
   */
  initialize(server: HTTPServer): void {
    if (!this.config.enabled) {
      console.log('[RealtimeServer] Real-time sync is disabled');
      return;
    }

    this.wss = new WebSocketServer({
      server,
      path: '/api/realtime',
      // Accept all connections - authentication happens via first message
      verifyClient: (info, callback) => {
        // Check max connections early
        if (this.connections.size >= this.config.maxConnections) {
          callback(false, 503, 'Server at capacity');
          return;
        }
        callback(true);
      },
    });

    this.wss.on('connection', this.handleConnection.bind(this));

    // Subscribe to realtime events
    this.eventUnsubscribe = realtimeEmitter.on(this.broadcastEvent.bind(this));

    // Start heartbeat
    this.startHeartbeat();

    // Start presence cleanup
    this.startCleanup();

    console.log('[RealtimeServer] WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(
    ws: ExtendedWebSocket,
    _req: IncomingMessage
  ): void {
    // Generate connection ID
    const connectionId = generateConnectionId();

    ws.isAlive = true;
    ws.isAuthenticated = false;

    // Set authentication timeout - must authenticate within timeout period
    ws.authTimeout = setTimeout(() => {
      if (!ws.isAuthenticated) {
        this.sendMessage(ws, {
          type: 'error',
          code: 'AUTH_TIMEOUT',
          message: 'Authentication timeout',
        });
        ws.close(4001, 'Authentication timeout');
      }
    }, this.config.authenticationTimeout);

    // Set up message handling
    ws.on('message', (data) => {
      this.handleMessage(ws, connectionId, data.toString());
    });

    // Set up pong handling for heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle close
    ws.on('close', () => {
      if (ws.authTimeout) {
        clearTimeout(ws.authTimeout);
      }
      if (ws.isAuthenticated) {
        this.handleDisconnect(connectionId);
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`[RealtimeServer] Connection error (${connectionId}):`, error);
      if (ws.authTimeout) {
        clearTimeout(ws.authTimeout);
      }
      if (ws.isAuthenticated) {
        this.handleDisconnect(connectionId);
      }
    });

    console.log(`[RealtimeServer] Client pending authentication: ${connectionId}`);
  }

  /**
   * Handle incoming message from client
   */
  private handleMessage(ws: ExtendedWebSocket, connectionId: string, data: string): void {
    let rawMessage: unknown;
    try {
      rawMessage = JSON.parse(data);
    } catch {
      this.sendMessage(ws, {
        type: 'error',
        code: 'INVALID_MESSAGE',
        message: 'Invalid JSON',
      });
      return;
    }

    // Validate message with Zod schema
    const parseResult = ClientMessageSchema.safeParse(rawMessage);
    if (!parseResult.success) {
      this.sendMessage(ws, {
        type: 'error',
        code: 'INVALID_MESSAGE',
        message: `Invalid message: ${parseResult.error.issues[0]?.message || 'validation failed'}`,
      });
      return;
    }

    const message = parseResult.data;

    // Handle authentication first (before any other messages)
    if (!ws.isAuthenticated) {
      if (message.type !== 'authenticate') {
        this.sendMessage(ws, {
          type: 'error',
          code: 'NOT_AUTHENTICATED',
          message: 'Must authenticate first',
        });
        return;
      }

      this.handleAuthenticate(ws, connectionId, message.token);
      return;
    }

    const meta = ws.connectionMeta;
    if (!meta) {
      return;
    }

    switch (message.type) {
      case 'authenticate':
        // Already authenticated
        this.sendMessage(ws, {
          type: 'error',
          code: 'ALREADY_AUTHENTICATED',
          message: 'Already authenticated',
        });
        break;

      case 'subscribe':
        this.handleSubscribe(ws, meta, message.subscriptionId, message.filter);
        break;

      case 'unsubscribe':
        this.handleUnsubscribe(ws, meta, message.subscriptionId);
        break;

      case 'presence.update':
        this.handlePresenceUpdate(ws, meta, message.documentId, message.field);
        break;

      case 'presence.leave':
        this.handlePresenceLeave(meta);
        break;

      case 'ping':
        this.sendMessage(ws, { type: 'pong' });
        break;

      default: {
        const exhaustiveCheck: never = message;
        this.sendMessage(ws, {
          type: 'error',
          code: 'UNKNOWN_MESSAGE',
          message: `Unknown message type: ${(exhaustiveCheck as { type?: string }).type}`,
        });
      }
    }
  }

  /**
   * Handle authentication message
   */
  private async handleAuthenticate(
    ws: ExtendedWebSocket,
    connectionId: string,
    token: string
  ): Promise<void> {
    const result = await validateRealtimeToken(token);

    if (!result.valid || !result.user) {
      this.sendMessage(ws, {
        type: 'error',
        code: 'AUTH_FAILED',
        message: result.error || 'Authentication failed',
      });
      ws.close(4002, 'Authentication failed');
      return;
    }

    // Clear auth timeout
    if (ws.authTimeout) {
      clearTimeout(ws.authTimeout);
      ws.authTimeout = undefined;
    }

    // Create connection metadata
    const connectionMeta = createConnectionMeta(connectionId, result.user);
    ws.connectionMeta = connectionMeta;
    ws.isAuthenticated = true;

    // Store connection
    this.connections.set(connectionId, ws);

    // Send authenticated message
    this.sendMessage(ws, {
      type: 'authenticated',
      connectionId,
    });

    console.log(
      `[RealtimeServer] Client authenticated: ${connectionId} (user: ${result.user.name})`
    );
  }

  /**
   * Handle subscription request
   */
  private handleSubscribe(
    ws: ExtendedWebSocket,
    meta: ConnectionMeta,
    subscriptionId: string,
    filter: SubscriptionFilter
  ): void {
    // Rate limiting: check max subscriptions per connection
    if (meta.subscriptions.size >= this.config.maxSubscriptionsPerConnection) {
      this.sendMessage(ws, {
        type: 'error',
        code: 'SUBSCRIPTION_LIMIT',
        message: `Maximum subscriptions (${this.config.maxSubscriptionsPerConnection}) reached`,
      });
      return;
    }

    // Check permissions based on role
    if (!canSubscribe(meta.role, filter)) {
      this.sendMessage(ws, {
        type: 'error',
        code: 'SUBSCRIPTION_FORBIDDEN',
        message: 'Not allowed to subscribe to this filter',
      });
      return;
    }

    meta.subscriptions.set(subscriptionId, filter);

    this.sendMessage(ws, {
      type: 'subscribed',
      subscriptionId,
    });

    console.log(
      `[RealtimeServer] Subscription added: ${subscriptionId} (user: ${meta.userName})`
    );
  }

  /**
   * Handle unsubscribe request
   */
  private handleUnsubscribe(
    ws: ExtendedWebSocket,
    meta: ConnectionMeta,
    subscriptionId: string
  ): void {
    meta.subscriptions.delete(subscriptionId);

    this.sendMessage(ws, {
      type: 'unsubscribed',
      subscriptionId,
    });
  }

  /**
   * Handle presence update
   */
  private handlePresenceUpdate(
    ws: ExtendedWebSocket,
    meta: ConnectionMeta,
    documentId: string,
    field?: string
  ): void {
    const users = presenceManager.join(documentId, meta, field);

    // Send presence update to all users in document
    this.broadcastToDocument(documentId, {
      type: 'presence',
      documentId,
      users,
    });
  }

  /**
   * Handle presence leave
   */
  private handlePresenceLeave(meta: ConnectionMeta): void {
    const documentId = presenceManager.getConnectionPresence(meta.connectionId)?.documentId;
    const users = presenceManager.leave(meta.connectionId);

    if (documentId && users) {
      this.broadcastToDocument(documentId, {
        type: 'presence',
        documentId,
        users,
      });
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(connectionId: string): void {
    const ws = this.connections.get(connectionId);
    if (!ws) return;

    const meta = ws.connectionMeta;

    // Clean up presence
    if (meta) {
      const presence = presenceManager.getConnectionPresence(connectionId);
      if (presence) {
        const users = presenceManager.leave(connectionId);
        if (users) {
          this.broadcastToDocument(presence.documentId, {
            type: 'presence',
            documentId: presence.documentId,
            users,
          });
        }
      }
    }

    // Remove connection
    this.connections.delete(connectionId);

    console.log(`[RealtimeServer] Client disconnected: ${connectionId}`);
  }

  /**
   * Broadcast event to all matching subscribers
   */
  private broadcastEvent(event: RealtimeEvent): void {
    for (const [connectionId, ws] of this.connections) {
      const meta = ws.connectionMeta;
      if (!meta) continue;

      // Check if any subscription matches this event
      let matches = false;
      for (const filter of meta.subscriptions.values()) {
        if (this.matchesFilter(event, filter)) {
          matches = true;
          break;
        }
      }

      if (!matches) continue;

      // Check role-based filtering
      if (!shouldReceiveEvent(meta.role, event.type, event.payload)) {
        continue;
      }

      // Send event
      this.sendMessage(ws, {
        type: 'event',
        event,
      });
    }
  }

  /**
   * Broadcast message to all users in a document
   */
  private broadcastToDocument(documentId: string, message: ServerMessage): void {
    for (const ws of this.connections.values()) {
      const meta = ws.connectionMeta;
      if (!meta) continue;

      // Check if user is viewing this document
      if (presenceManager.isUserInDocument(documentId, meta.userId)) {
        this.sendMessage(ws, message);
      }
    }
  }

  /**
   * Check if event matches subscription filter
   */
  private matchesFilter(event: RealtimeEvent, filter: SubscriptionFilter): boolean {
    // Filter by document type
    if (filter._type && event.documentType !== filter._type) {
      return false;
    }

    // Filter by document ID
    if (filter.documentId && event.documentId !== filter.documentId) {
      return false;
    }

    // Filter by event types
    if (filter.events && filter.events.length > 0) {
      if (!filter.events.includes(event.type)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Send message to a WebSocket connection
   */
  private sendMessage(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [connectionId, ws] of this.connections) {
        if (ws.isAlive === false) {
          console.log(`[RealtimeServer] Terminating inactive connection: ${connectionId}`);
          ws.terminate();
          this.handleDisconnect(connectionId);
          continue;
        }

        ws.isAlive = false;
        ws.ping();

        // Update presence activity
        presenceManager.touch(connectionId);
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Start presence cleanup interval
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      presenceManager.cleanupStale(this.config.connectionTimeout);
    }, this.config.connectionTimeout);
  }

  /**
   * Get server statistics
   */
  getStats(): {
    connections: number;
    maxConnections: number;
    presence: ReturnType<typeof presenceManager.getStats>;
  } {
    return {
      connections: this.connections.size,
      maxConnections: this.config.maxConnections,
      presence: presenceManager.getStats(),
    };
  }

  /**
   * Shutdown the server
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.eventUnsubscribe) {
      this.eventUnsubscribe();
      this.eventUnsubscribe = null;
    }

    // Close all connections
    for (const ws of this.connections.values()) {
      ws.close(1001, 'Server shutdown');
    }
    this.connections.clear();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    // Clear presence
    presenceManager.clear();

    console.log('[RealtimeServer] Server shutdown complete');
  }
}

/**
 * Singleton server instance
 */
let realtimeServer: RealtimeServer | null = null;

/**
 * Get or create the realtime server instance
 */
export function getRealtimeServer(
  config?: Partial<RealtimeServerConfig>
): RealtimeServer {
  if (!realtimeServer) {
    realtimeServer = new RealtimeServer(config);
  }
  return realtimeServer;
}

/**
 * Initialize the realtime server with an HTTP server
 */
export function initializeRealtimeServer(
  httpServer: HTTPServer,
  config?: Partial<RealtimeServerConfig>
): RealtimeServer {
  const server = getRealtimeServer(config);
  server.initialize(httpServer);
  return server;
}
