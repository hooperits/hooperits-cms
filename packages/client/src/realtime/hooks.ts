/**
 * HOOPERITS CMS - Real-Time React Hooks
 * React hooks for real-time content synchronization
 */

import { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeContext } from './context';
import type {
  RealtimeEvent,
  PresenceInfo,
  SubscriptionFilter,
  ConnectionStatus,
  RealtimeEventHandler,
} from './types';
import type { RealtimeClient } from './client';

/**
 * Get the realtime client from context
 */
export function useRealtime(): RealtimeClient | null {
  const context = useContext(RealtimeContext);
  return context?.client ?? null;
}

/**
 * Get the current connection status
 */
export function useRealtimeStatus(): ConnectionStatus {
  const client = useRealtime();
  const [status, setStatus] = useState<ConnectionStatus>(
    client?.status ?? 'disconnected'
  );

  useEffect(() => {
    if (!client) {
      setStatus('disconnected');
      return;
    }

    const unsubscribe = client.onStatusChange(setStatus);
    return unsubscribe;
  }, [client]);

  return status;
}

/**
 * Subscribe to realtime events
 */
export function useRealtimeEvent(
  filter: SubscriptionFilter,
  handler: RealtimeEventHandler
): void {
  const client = useRealtime();
  const handlerRef = useRef(handler);

  // Update handler ref on each render
  handlerRef.current = handler;

  useEffect(() => {
    if (!client) {
      return;
    }

    const unsubscribe = client.subscribe(filter, (event) => {
      handlerRef.current(event);
    });

    return unsubscribe;
  }, [client, JSON.stringify(filter)]);
}

/**
 * Get presence for a document
 */
export function useDocumentPresence(documentId: string | null): PresenceInfo[] {
  const client = useRealtime();
  const [users, setUsers] = useState<PresenceInfo[]>([]);

  useEffect(() => {
    if (!client || !documentId) {
      setUsers([]);
      return;
    }

    // Get initial cached presence
    setUsers(client.getPresence(documentId));

    // Subscribe to changes
    const unsubscribe = client.onPresenceChange(documentId, setUsers);
    return unsubscribe;
  }, [client, documentId]);

  return users;
}

/**
 * Set presence on a document
 */
export function useSetPresence(): {
  setPresence: (documentId: string, field?: string) => void;
  clearPresence: () => void;
} {
  const client = useRealtime();

  const setPresence = useCallback(
    (documentId: string, field?: string) => {
      client?.setPresence({ documentId, field });
    },
    [client]
  );

  const clearPresence = useCallback(() => {
    client?.clearPresence();
  }, [client]);

  return { setPresence, clearPresence };
}

/**
 * Auto-manage presence when viewing/editing a document
 */
export function useDocumentEdit(
  documentId: string | null,
  field?: string
): PresenceInfo[] {
  const client = useRealtime();
  const presence = useDocumentPresence(documentId);

  useEffect(() => {
    if (!client || !documentId) {
      return;
    }

    // Set presence when entering document
    client.setPresence({ documentId, field });

    // Clear presence when leaving
    return () => {
      client.clearPresence();
    };
  }, [client, documentId, field]);

  return presence;
}

/**
 * Subscribe to document changes with callback
 */
export function useDocumentChanges(
  documentId: string | null,
  onChanged: (event: RealtimeEvent) => void
): void {
  const handlerRef = useRef(onChanged);
  handlerRef.current = onChanged;

  useRealtimeEvent(
    documentId ? { documentId } : { documentId: '__never__' },
    (event) => {
      if (documentId && event.documentId === documentId) {
        handlerRef.current(event);
      }
    }
  );
}

/**
 * Subscribe to changes for a content type
 */
export function useContentTypeChanges(
  contentType: string | null,
  onChanged: (event: RealtimeEvent) => void
): void {
  const handlerRef = useRef(onChanged);
  handlerRef.current = onChanged;

  useRealtimeEvent(
    contentType ? { _type: contentType } : { _type: '__never__' },
    (event) => {
      if (contentType && event.documentType === contentType) {
        handlerRef.current(event);
      }
    }
  );
}
