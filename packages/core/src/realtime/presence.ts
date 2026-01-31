/**
 * HOOPERITS CMS - Presence Manager
 * Tracks user presence on documents in real-time
 */

import type { PresenceInfo, ConnectionMeta } from './types';
import { emitPresenceEvent } from './emitter';

/**
 * Presence Manager - tracks which users are viewing/editing documents
 * Uses in-memory storage with automatic cleanup on disconnect
 */
class PresenceManager {
  /** Map of documentId -> Map of connectionId -> PresenceInfo */
  private documentPresence: Map<string, Map<string, PresenceInfo>> = new Map();

  /** Map of connectionId -> documentId (for cleanup on disconnect) */
  private connectionToDocument: Map<string, string> = new Map();

  /**
   * User joins a document
   */
  join(
    documentId: string,
    connection: ConnectionMeta,
    field?: string
  ): PresenceInfo[] {
    const now = new Date().toISOString();

    // Leave previous document if any
    const previousDocId = this.connectionToDocument.get(connection.connectionId);
    if (previousDocId && previousDocId !== documentId) {
      this.leave(connection.connectionId);
    }

    // Create presence info
    const presenceInfo: PresenceInfo = {
      userId: connection.userId,
      userName: connection.userName,
      userEmail: connection.userEmail,
      documentId,
      field,
      joinedAt: now,
      lastActiveAt: now,
    };

    // Initialize document presence map if needed
    if (!this.documentPresence.has(documentId)) {
      this.documentPresence.set(documentId, new Map());
    }

    // Add user to document
    const docPresence = this.documentPresence.get(documentId)!;
    docPresence.set(connection.connectionId, presenceInfo);

    // Track connection -> document mapping
    this.connectionToDocument.set(connection.connectionId, documentId);

    // Update connection metadata
    connection.presence = presenceInfo;

    // Emit presence event
    emitPresenceEvent('presence.joined', documentId, connection.userId, {
      userName: connection.userName,
      userEmail: connection.userEmail,
      field,
    });

    // Return all users in document
    return this.getPresence(documentId);
  }

  /**
   * User leaves a document (or disconnects)
   */
  leave(connectionId: string): PresenceInfo[] | null {
    const documentId = this.connectionToDocument.get(connectionId);
    if (!documentId) {
      return null;
    }

    const docPresence = this.documentPresence.get(documentId);
    if (!docPresence) {
      return null;
    }

    // Get user info before removing
    const presenceInfo = docPresence.get(connectionId);
    if (!presenceInfo) {
      return null;
    }

    // Remove user from document
    docPresence.delete(connectionId);

    // Remove connection mapping
    this.connectionToDocument.delete(connectionId);

    // Clean up empty document entries
    if (docPresence.size === 0) {
      this.documentPresence.delete(documentId);
    }

    // Emit presence event
    emitPresenceEvent('presence.left', documentId, presenceInfo.userId, {
      userName: presenceInfo.userName,
      userEmail: presenceInfo.userEmail,
    });

    // Return remaining users in document
    return this.getPresence(documentId);
  }

  /**
   * Update user's field focus within a document
   */
  updateField(
    connectionId: string,
    field: string | undefined
  ): PresenceInfo[] | null {
    const documentId = this.connectionToDocument.get(connectionId);
    if (!documentId) {
      return null;
    }

    const docPresence = this.documentPresence.get(documentId);
    if (!docPresence) {
      return null;
    }

    const presenceInfo = docPresence.get(connectionId);
    if (!presenceInfo) {
      return null;
    }

    // Update presence info
    presenceInfo.field = field;
    presenceInfo.lastActiveAt = new Date().toISOString();

    // Emit presence update event
    emitPresenceEvent('presence.updated', documentId, presenceInfo.userId, {
      userName: presenceInfo.userName,
      field,
    });

    return this.getPresence(documentId);
  }

  /**
   * Update last active time (called on heartbeat)
   */
  touch(connectionId: string): void {
    const documentId = this.connectionToDocument.get(connectionId);
    if (!documentId) return;

    const docPresence = this.documentPresence.get(documentId);
    if (!docPresence) return;

    const presenceInfo = docPresence.get(connectionId);
    if (!presenceInfo) return;

    presenceInfo.lastActiveAt = new Date().toISOString();
  }

  /**
   * Get all users present in a document
   */
  getPresence(documentId: string): PresenceInfo[] {
    const docPresence = this.documentPresence.get(documentId);
    if (!docPresence) {
      return [];
    }
    return Array.from(docPresence.values());
  }

  /**
   * Get presence info for a specific connection
   */
  getConnectionPresence(connectionId: string): PresenceInfo | null {
    const documentId = this.connectionToDocument.get(connectionId);
    if (!documentId) {
      return null;
    }

    const docPresence = this.documentPresence.get(documentId);
    if (!docPresence) {
      return null;
    }

    return docPresence.get(connectionId) || null;
  }

  /**
   * Check if a user (by userId) is present in a document
   */
  isUserInDocument(documentId: string, userId: string): boolean {
    const docPresence = this.documentPresence.get(documentId);
    if (!docPresence) {
      return false;
    }

    for (const presence of docPresence.values()) {
      if (presence.userId === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all documents a user is present in
   */
  getUserDocuments(userId: string): string[] {
    const documents: string[] = [];
    for (const [documentId, docPresence] of this.documentPresence) {
      for (const presence of docPresence.values()) {
        if (presence.userId === userId) {
          documents.push(documentId);
          break;
        }
      }
    }
    return documents;
  }

  /**
   * Clean up stale presence entries (older than timeout)
   */
  cleanupStale(timeoutMs: number = 60000): void {
    const now = Date.now();
    const staleConnections: string[] = [];

    for (const [connectionId, documentId] of this.connectionToDocument) {
      const docPresence = this.documentPresence.get(documentId);
      if (!docPresence) continue;

      const presence = docPresence.get(connectionId);
      if (!presence) continue;

      const lastActive = new Date(presence.lastActiveAt).getTime();
      if (now - lastActive > timeoutMs) {
        staleConnections.push(connectionId);
      }
    }

    // Remove stale connections
    for (const connectionId of staleConnections) {
      this.leave(connectionId);
    }
  }

  /**
   * Get statistics (for monitoring)
   */
  getStats(): {
    totalDocuments: number;
    totalConnections: number;
    documentBreakdown: Record<string, number>;
  } {
    const documentBreakdown: Record<string, number> = {};

    for (const [documentId, docPresence] of this.documentPresence) {
      documentBreakdown[documentId] = docPresence.size;
    }

    return {
      totalDocuments: this.documentPresence.size,
      totalConnections: this.connectionToDocument.size,
      documentBreakdown,
    };
  }

  /**
   * Clear all presence data (for testing)
   */
  clear(): void {
    this.documentPresence.clear();
    this.connectionToDocument.clear();
  }
}

/**
 * Singleton presence manager instance
 */
export const presenceManager = new PresenceManager();

// Re-export types
export type { PresenceInfo };
