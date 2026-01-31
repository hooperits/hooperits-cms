/**
 * HOOPERITS CMS - Real-Time Authentication
 * JWT validation for WebSocket connections
 */

import type { UserRole } from '../auth/permissions';
import type { ConnectionMeta } from './types';

/**
 * Decoded JWT token structure (matches NextAuth JWT)
 */
export interface DecodedToken {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  error?: string;
}

/**
 * Token validator function type
 * This allows injection of the actual JWT validation logic
 * which depends on NextAuth secret
 */
export type TokenValidator = (token: string) => Promise<TokenValidationResult>;

/**
 * Default token validator that always fails
 * Must be replaced with actual validator in production
 */
let tokenValidator: TokenValidator = async () => ({
  valid: false,
  error: 'Token validator not configured',
});

/**
 * Configure the token validator
 * Called during server initialization with NextAuth secret
 */
export function setTokenValidator(validator: TokenValidator): void {
  tokenValidator = validator;
}

/**
 * Validate a WebSocket authentication token
 */
export async function validateRealtimeToken(
  token: string
): Promise<TokenValidationResult> {
  if (!token) {
    return { valid: false, error: 'Token is required' };
  }

  try {
    return await tokenValidator(token);
  } catch (error) {
    console.error('[RealtimeAuth] Token validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Create connection metadata from validated token
 */
export function createConnectionMeta(
  connectionId: string,
  user: NonNullable<TokenValidationResult['user']>
): ConnectionMeta {
  return {
    connectionId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: user.role,
    connectedAt: new Date(),
    subscriptions: new Map(),
    presence: undefined,
  };
}

/**
 * Generate a unique connection ID
 */
export function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Check if user has permission to subscribe to certain events
 * VIEWER role can only subscribe to published content events
 */
export function canSubscribe(
  role: UserRole,
  filter: { _type?: string; documentId?: string }
): boolean {
  // Admins and Editors can subscribe to anything
  if (role === 'ADMIN' || role === 'EDITOR') {
    return true;
  }

  // Viewers have limited subscription capabilities
  // They can subscribe but will only receive published content events
  return true;
}

/**
 * Filter event based on user role
 * Returns true if the user should receive this event
 */
export function shouldReceiveEvent(
  role: UserRole,
  eventType: string,
  payload: Record<string, unknown>
): boolean {
  // Admins and Editors receive all events
  if (role === 'ADMIN' || role === 'EDITOR') {
    return true;
  }

  // Viewers only receive published content events
  if (role === 'VIEWER') {
    // Only published/unpublished events for viewers
    if (eventType === 'document.published' || eventType === 'document.unpublished') {
      return true;
    }
    // Filter out draft-only updates for viewers
    if (eventType === 'document.updated' && payload.status === 'PUBLISHED') {
      return true;
    }
    return false;
  }

  return false;
}
