/**
 * HOOPERITS CMS - Admin Realtime Provider
 * Wraps admin app with realtime WebSocket connection
 *
 * IMPORTANT: Token Authentication
 * ================================
 * The current implementation uses a placeholder token (session.user.id).
 * For production deployment, this must be replaced with actual JWT token extraction.
 *
 * To enable proper JWT authentication:
 * 1. Configure NextAuth with JWT strategy in auth.ts:
 *    ```
 *    session: { strategy: "jwt" },
 *    callbacks: {
 *      jwt({ token, user }) {
 *        if (user) { token.id = user.id; token.role = user.role; }
 *        return token;
 *      }
 *    }
 *    ```
 * 2. Use getToken() from 'next-auth/jwt' in an API route to get the raw JWT
 * 3. Configure setTokenValidator() in the server with the same JWT secret
 *
 * The server's setTokenValidator() must be called during initialization
 * to enable token validation. See packages/core/src/realtime/auth.ts
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

  /**
   * Get authentication token for WebSocket connection.
   *
   * PLACEHOLDER IMPLEMENTATION:
   * Currently uses session.user.id which requires the server's
   * tokenValidator to be configured to accept this format.
   *
   * PRODUCTION: Replace with actual JWT token extraction.
   * Options:
   * - Use an API endpoint that returns the JWT: /api/auth/realtime-token
   * - Store JWT in session and access via session.token
   * - Use NextAuth's getToken() in a custom hook
   */
  const token = useMemo(() => {
    if (status !== 'authenticated' || !session?.user) {
      return null;
    }

    // PLACEHOLDER: Using user.id - requires matching tokenValidator on server
    // For production, extract actual JWT token here
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
