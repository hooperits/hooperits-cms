/**
 * HOOPERITS CMS - Rate Limiter
 * Simple in-memory rate limiting for API endpoints
 */

import { TooManyRequestsError } from './errors';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter
 */
export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request is allowed
   * @param key - Unique identifier (e.g., user ID, IP address)
   * @returns true if allowed
   * @throws TooManyRequestsError if rate limit exceeded
   */
  check(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    // No entry or expired window - allow and create new entry
    if (!entry || entry.resetAt <= now) {
      this.store.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });
      return true;
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      const retryAfterMs = entry.resetAt - now;
      throw new TooManyRequestsError(
        `Rate limit exceeded. Try again in ${Math.ceil(retryAfterMs / 1000)} seconds`,
        retryAfterMs
      );
    }

    // Increment count
    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt <= now) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - entry.count);
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Stop the cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Default rate limiter for preview token generation
 * Limit: 10 tokens per hour per user
 */
export const previewTokenRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
});

/**
 * Create a custom rate limiter
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}
