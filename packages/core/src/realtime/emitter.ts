/**
 * HOOPERITS CMS - Real-Time Event Emitter
 * Singleton EventEmitter for broadcasting content events
 */

import type { RealtimeEvent, RealtimeEventHandler, RealtimeEventType } from './types';

/**
 * Singleton class for emitting and subscribing to real-time events.
 * Used internally by content operations to broadcast changes.
 */
class RealtimeEmitter {
  private handlers: Set<RealtimeEventHandler> = new Set();
  private typeHandlers: Map<RealtimeEventType, Set<RealtimeEventHandler>> = new Map();

  /**
   * Subscribe to all events
   */
  on(handler: RealtimeEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Subscribe to specific event type
   */
  onType(type: RealtimeEventType, handler: RealtimeEventHandler): () => void {
    if (!this.typeHandlers.has(type)) {
      this.typeHandlers.set(type, new Set());
    }
    this.typeHandlers.get(type)!.add(handler);
    return () => this.typeHandlers.get(type)?.delete(handler);
  }

  /**
   * Unsubscribe handler from all events
   */
  off(handler: RealtimeEventHandler): void {
    this.handlers.delete(handler);
    for (const handlers of this.typeHandlers.values()) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit(event: RealtimeEvent): void {
    // Notify global handlers
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('[RealtimeEmitter] Handler error:', error);
      }
    }

    // Notify type-specific handlers
    const typeSpecificHandlers = this.typeHandlers.get(event.type);
    if (typeSpecificHandlers) {
      for (const handler of typeSpecificHandlers) {
        try {
          handler(event);
        } catch (error) {
          console.error('[RealtimeEmitter] Type handler error:', error);
        }
      }
    }
  }

  /**
   * Get subscriber count (for monitoring)
   */
  getSubscriberCount(): number {
    let count = this.handlers.size;
    for (const handlers of this.typeHandlers.values()) {
      count += handlers.size;
    }
    return count;
  }

  /**
   * Clear all subscribers (for testing)
   */
  clear(): void {
    this.handlers.clear();
    this.typeHandlers.clear();
  }
}

/**
 * Singleton instance
 */
export const realtimeEmitter = new RealtimeEmitter();

/**
 * Helper function to emit a document event
 */
export function emitDocumentEvent(
  type: Extract<RealtimeEventType, `document.${string}`>,
  documentId: string,
  documentType: string,
  userId: string,
  payload: Record<string, unknown> = {}
): void {
  realtimeEmitter.emit({
    type,
    documentId,
    documentType,
    userId,
    timestamp: new Date().toISOString(),
    payload,
  });
}

/**
 * Helper function to emit a presence event
 */
export function emitPresenceEvent(
  type: Extract<RealtimeEventType, `presence.${string}`>,
  documentId: string,
  userId: string,
  payload: Record<string, unknown> = {}
): void {
  realtimeEmitter.emit({
    type,
    documentId,
    userId,
    timestamp: new Date().toISOString(),
    payload,
  });
}

// Re-export types for convenience
export type { RealtimeEvent, RealtimeEventHandler, RealtimeEventType };
