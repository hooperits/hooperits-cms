/**
 * HOOPERITS CMS - Real-Time Emitter Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { realtimeEmitter, emitDocumentEvent, emitPresenceEvent } from '../emitter';
import type { RealtimeEvent } from '../types';

describe('RealtimeEmitter', () => {
  beforeEach(() => {
    realtimeEmitter.clear();
  });

  describe('on/off', () => {
    it('should subscribe to all events', () => {
      const handler = vi.fn();
      realtimeEmitter.on(handler);

      const event: RealtimeEvent = {
        type: 'document.created',
        documentId: 'doc-1',
        documentType: 'post',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        payload: {},
      };

      realtimeEmitter.emit(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should unsubscribe with returned function', () => {
      const handler = vi.fn();
      const unsubscribe = realtimeEmitter.on(handler);

      unsubscribe();

      realtimeEmitter.emit({
        type: 'document.created',
        documentId: 'doc-1',
        documentType: 'post',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should unsubscribe with off method', () => {
      const handler = vi.fn();
      realtimeEmitter.on(handler);

      realtimeEmitter.off(handler);

      realtimeEmitter.emit({
        type: 'document.created',
        documentId: 'doc-1',
        documentType: 'post',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('onType', () => {
    it('should subscribe to specific event type', () => {
      const handler = vi.fn();
      realtimeEmitter.onType('document.updated', handler);

      realtimeEmitter.emit({
        type: 'document.created',
        documentId: 'doc-1',
        documentType: 'post',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(handler).not.toHaveBeenCalled();

      realtimeEmitter.emit({
        type: 'document.updated',
        documentId: 'doc-1',
        documentType: 'post',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('emit', () => {
    it('should emit to both global and type handlers', () => {
      const globalHandler = vi.fn();
      const typeHandler = vi.fn();

      realtimeEmitter.on(globalHandler);
      realtimeEmitter.onType('document.published', typeHandler);

      realtimeEmitter.emit({
        type: 'document.published',
        documentId: 'doc-1',
        documentType: 'post',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(globalHandler).toHaveBeenCalledTimes(1);
      expect(typeHandler).toHaveBeenCalledTimes(1);
    });

    it('should catch and log handler errors', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      realtimeEmitter.on(errorHandler);
      realtimeEmitter.on(normalHandler);

      realtimeEmitter.emit({
        type: 'document.created',
        documentId: 'doc-1',
        documentType: 'post',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      // Both handlers called, error logged
      expect(errorHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getSubscriberCount', () => {
    it('should return total subscriber count', () => {
      expect(realtimeEmitter.getSubscriberCount()).toBe(0);

      realtimeEmitter.on(() => {});
      expect(realtimeEmitter.getSubscriberCount()).toBe(1);

      realtimeEmitter.onType('document.created', () => {});
      expect(realtimeEmitter.getSubscriberCount()).toBe(2);
    });
  });
});

describe('Helper functions', () => {
  beforeEach(() => {
    realtimeEmitter.clear();
  });

  describe('emitDocumentEvent', () => {
    it('should emit document event with correct structure', () => {
      const handler = vi.fn();
      realtimeEmitter.on(handler);

      emitDocumentEvent('document.created', 'doc-1', 'post', 'user-1', {
        slug: 'my-post',
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'document.created',
          documentId: 'doc-1',
          documentType: 'post',
          userId: 'user-1',
          payload: { slug: 'my-post' },
        })
      );

      // Should have timestamp
      expect(handler.mock.calls[0][0].timestamp).toBeDefined();
    });
  });

  describe('emitPresenceEvent', () => {
    it('should emit presence event with correct structure', () => {
      const handler = vi.fn();
      realtimeEmitter.on(handler);

      emitPresenceEvent('presence.joined', 'doc-1', 'user-1', {
        userName: 'John Doe',
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'presence.joined',
          documentId: 'doc-1',
          userId: 'user-1',
          payload: { userName: 'John Doe' },
        })
      );
    });
  });
});
