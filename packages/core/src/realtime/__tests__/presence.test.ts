/**
 * HOOPERITS CMS - Presence Manager Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { presenceManager } from '../presence';
import { realtimeEmitter } from '../emitter';
import type { ConnectionMeta } from '../types';

function createMockConnection(id: string, userId: string, userName: string): ConnectionMeta {
  return {
    connectionId: id,
    userId,
    userName,
    userEmail: `${userName.toLowerCase().replace(' ', '')}@example.com`,
    role: 'EDITOR',
    connectedAt: new Date(),
    subscriptions: new Map(),
    presence: undefined,
  };
}

describe('PresenceManager', () => {
  beforeEach(() => {
    presenceManager.clear();
    realtimeEmitter.clear();
  });

  describe('join', () => {
    it('should add user to document presence', () => {
      const connection = createMockConnection('conn-1', 'user-1', 'John Doe');

      const users = presenceManager.join('doc-1', connection);

      expect(users).toHaveLength(1);
      expect(users[0]).toMatchObject({
        userId: 'user-1',
        userName: 'John Doe',
        documentId: 'doc-1',
      });
    });

    it('should emit presence.joined event', () => {
      const handler = vi.fn();
      realtimeEmitter.onType('presence.joined', handler);

      const connection = createMockConnection('conn-1', 'user-1', 'John Doe');
      presenceManager.join('doc-1', connection);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'presence.joined',
          documentId: 'doc-1',
          userId: 'user-1',
        })
      );
    });

    it('should track field being edited', () => {
      const connection = createMockConnection('conn-1', 'user-1', 'John Doe');

      const users = presenceManager.join('doc-1', connection, 'title');

      expect(users[0].field).toBe('title');
    });

    it('should leave previous document when joining new one', () => {
      const connection = createMockConnection('conn-1', 'user-1', 'John Doe');

      presenceManager.join('doc-1', connection);
      expect(presenceManager.getPresence('doc-1')).toHaveLength(1);

      presenceManager.join('doc-2', connection);
      expect(presenceManager.getPresence('doc-1')).toHaveLength(0);
      expect(presenceManager.getPresence('doc-2')).toHaveLength(1);
    });

    it('should allow multiple users in same document', () => {
      const conn1 = createMockConnection('conn-1', 'user-1', 'John Doe');
      const conn2 = createMockConnection('conn-2', 'user-2', 'Jane Doe');

      presenceManager.join('doc-1', conn1);
      presenceManager.join('doc-1', conn2);

      const users = presenceManager.getPresence('doc-1');
      expect(users).toHaveLength(2);
    });
  });

  describe('leave', () => {
    it('should remove user from document presence', () => {
      const connection = createMockConnection('conn-1', 'user-1', 'John Doe');
      presenceManager.join('doc-1', connection);

      const remaining = presenceManager.leave('conn-1');

      expect(remaining).toHaveLength(0);
      expect(presenceManager.getPresence('doc-1')).toHaveLength(0);
    });

    it('should emit presence.left event', () => {
      const handler = vi.fn();
      realtimeEmitter.onType('presence.left', handler);

      const connection = createMockConnection('conn-1', 'user-1', 'John Doe');
      presenceManager.join('doc-1', connection);
      presenceManager.leave('conn-1');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'presence.left',
          documentId: 'doc-1',
          userId: 'user-1',
        })
      );
    });

    it('should return null if connection not found', () => {
      const result = presenceManager.leave('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('updateField', () => {
    it('should update field being edited', () => {
      const connection = createMockConnection('conn-1', 'user-1', 'John Doe');
      presenceManager.join('doc-1', connection);

      const users = presenceManager.updateField('conn-1', 'description');

      expect(users?.[0].field).toBe('description');
    });

    it('should emit presence.updated event', () => {
      const handler = vi.fn();
      realtimeEmitter.onType('presence.updated', handler);

      const connection = createMockConnection('conn-1', 'user-1', 'John Doe');
      presenceManager.join('doc-1', connection);
      presenceManager.updateField('conn-1', 'title');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'presence.updated',
          documentId: 'doc-1',
          payload: expect.objectContaining({ field: 'title' }),
        })
      );
    });
  });

  describe('getPresence', () => {
    it('should return empty array for unknown document', () => {
      expect(presenceManager.getPresence('unknown')).toEqual([]);
    });

    it('should return all users in document', () => {
      const conn1 = createMockConnection('conn-1', 'user-1', 'John Doe');
      const conn2 = createMockConnection('conn-2', 'user-2', 'Jane Doe');

      presenceManager.join('doc-1', conn1);
      presenceManager.join('doc-1', conn2);

      const users = presenceManager.getPresence('doc-1');
      expect(users).toHaveLength(2);
      expect(users.map(u => u.userName)).toContain('John Doe');
      expect(users.map(u => u.userName)).toContain('Jane Doe');
    });
  });

  describe('isUserInDocument', () => {
    it('should return true if user is in document', () => {
      const connection = createMockConnection('conn-1', 'user-1', 'John Doe');
      presenceManager.join('doc-1', connection);

      expect(presenceManager.isUserInDocument('doc-1', 'user-1')).toBe(true);
    });

    it('should return false if user is not in document', () => {
      expect(presenceManager.isUserInDocument('doc-1', 'user-1')).toBe(false);
    });
  });

  describe('getUserDocuments', () => {
    it('should return all documents user is present in', () => {
      const conn1 = createMockConnection('conn-1', 'user-1', 'John Doe');
      const conn2 = createMockConnection('conn-2', 'user-1', 'John Doe');

      presenceManager.join('doc-1', conn1);
      presenceManager.join('doc-2', conn2);

      const docs = presenceManager.getUserDocuments('user-1');
      expect(docs).toContain('doc-1');
      expect(docs).toContain('doc-2');
    });
  });

  describe('getStats', () => {
    it('should return presence statistics', () => {
      const conn1 = createMockConnection('conn-1', 'user-1', 'John');
      const conn2 = createMockConnection('conn-2', 'user-2', 'Jane');
      const conn3 = createMockConnection('conn-3', 'user-3', 'Bob');

      presenceManager.join('doc-1', conn1);
      presenceManager.join('doc-1', conn2);
      presenceManager.join('doc-2', conn3);

      const stats = presenceManager.getStats();

      expect(stats.totalDocuments).toBe(2);
      expect(stats.totalConnections).toBe(3);
      expect(stats.documentBreakdown['doc-1']).toBe(2);
      expect(stats.documentBreakdown['doc-2']).toBe(1);
    });
  });

  describe('cleanupStale', () => {
    it('should remove stale connections', () => {
      const connection = createMockConnection('conn-1', 'user-1', 'John Doe');
      presenceManager.join('doc-1', connection);

      // Simulate stale connection by directly modifying the presence
      const presence = presenceManager.getConnectionPresence('conn-1');
      if (presence) {
        // Make it appear old
        (presence as { lastActiveAt: string }).lastActiveAt = new Date(
          Date.now() - 120000 // 2 minutes ago
        ).toISOString();
      }

      // Cleanup with 1 minute timeout
      presenceManager.cleanupStale(60000);

      expect(presenceManager.getPresence('doc-1')).toHaveLength(0);
    });
  });
});
