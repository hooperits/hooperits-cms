/**
 * HOOPERITS CMS - Admin Realtime Provider
 * Wraps admin app with realtime WebSocket connection
 */

'use client';

import React, { useMemo, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { RealtimeProvider as BaseRealtimeProvider } from '@hooperits/client';

export interface AdminRealtimeProviderProps {
  children: ReactNode;
}

/**
 * Get the WebSocket URL based on current location
 */
function getRealtimeUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  return `${protocol}//${host}/api/realtime`;
}

/**
 * Admin Realtime Provider
 * Automatically connects to WebSocket when user is authenticated
 */
export function AdminRealtimeProvider({ children }: AdminRealtimeProviderProps) {
  const { data: session, status } = useSession();

  // Get token from session for WebSocket authentication
  // In a real implementation, we'd need to get a JWT token
  // For now, we use the session user ID as a placeholder
  const token = useMemo(() => {
    if (status !== 'authenticated' || !session?.user) {
      return null;
    }
    // TODO: Get actual JWT token from session
    // This would be the NextAuth JWT token
    return session.user.id;
  }, [session, status]);

  const url = useMemo(() => getRealtimeUrl(), []);

  // Don't render provider until we have authentication
  if (!token || !url) {
    return <>{children}</>;
  }

  return (
    <BaseRealtimeProvider
      url={url}
      token={token}
      autoConnect={true}
      reconnect={true}
      reconnectDelay={1000}
      reconnectDelayMax={30000}
    >
      {children}
    </BaseRealtimeProvider>
  );
}

export default AdminRealtimeProvider;
