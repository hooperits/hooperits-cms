/**
 * HOOPERITS CMS - Real-Time React Context
 * Context provider for realtime client
 */

'use client';

import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { RealtimeClient, createRealtimeClient } from './client';
import type { RealtimeClientConfig, ConnectionStatus } from './types';

/**
 * Context value type
 */
export interface RealtimeContextValue {
  client: RealtimeClient | null;
  status: ConnectionStatus;
  connect: () => Promise<void>;
  disconnect: () => void;
}

/**
 * Realtime context
 */
export const RealtimeContext = createContext<RealtimeContextValue | null>(null);

/**
 * Provider props
 */
export interface RealtimeProviderProps {
  children: ReactNode;
  /** WebSocket URL */
  url: string;
  /** Authentication token */
  token: string | null;
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Enable reconnection (default: true) */
  reconnect?: boolean;
  /** Initial reconnect delay in ms (default: 1000) */
  reconnectDelay?: number;
  /** Maximum reconnect delay in ms (default: 30000) */
  reconnectDelayMax?: number;
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number;
}

/**
 * Realtime Provider Component
 */
export function RealtimeProvider({
  children,
  url,
  token,
  autoConnect = true,
  reconnect = true,
  reconnectDelay = 1000,
  reconnectDelayMax = 30000,
  heartbeatInterval = 30000,
}: RealtimeProviderProps) {
  const [client, setClient] = useState<RealtimeClient | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  // Create client when token changes
  useEffect(() => {
    if (!token) {
      setClient(null);
      setStatus('disconnected');
      return;
    }

    const config: RealtimeClientConfig = {
      url,
      token,
      reconnect,
      reconnectDelay,
      reconnectDelayMax,
      heartbeatInterval,
    };

    const newClient = createRealtimeClient(config);

    // Listen to status changes
    const unsubscribe = newClient.onStatusChange(setStatus);

    setClient(newClient);

    // Auto-connect if enabled
    if (autoConnect) {
      newClient.connect().catch((error) => {
        console.error('[RealtimeProvider] Auto-connect failed:', error);
      });
    }

    return () => {
      unsubscribe();
      newClient.disconnect();
    };
  }, [url, token, autoConnect, reconnect, reconnectDelay, reconnectDelayMax, heartbeatInterval]);

  const connect = useCallback(async () => {
    if (client) {
      await client.connect();
    }
  }, [client]);

  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect();
    }
  }, [client]);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      client,
      status,
      connect,
      disconnect,
    }),
    [client, status, connect, disconnect]
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

/**
 * Hook to get context value directly
 */
export function useRealtimeContext(): RealtimeContextValue {
  const context = React.useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
}
