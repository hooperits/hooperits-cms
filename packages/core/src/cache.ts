/**
 * HOOPERITS CMS - Cache Utility
 * LRU cache with tag-based invalidation
 */

import { LRUCache } from 'lru-cache';

interface CacheOptions {
  max?: number;
  ttl?: number;
}

interface CacheEntry<T> {
  value: T;
  tags: string[];
}

const DEFAULT_OPTIONS: CacheOptions = {
  max: 1000,
  ttl: 60000, // 1 minute
};

class CMSCache {
  private cache: LRUCache<string, CacheEntry<unknown>>;
  private tagIndex: Map<string, Set<string>>;

  constructor(options: CacheOptions = {}) {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    this.cache = new LRUCache<string, CacheEntry<unknown>>({
      max: mergedOptions.max!,
      ttl: mergedOptions.ttl!,
    });

    this.tagIndex = new Map();
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    return entry?.value;
  }

  set<T>(key: string, value: T, tags: string[] = []): void {
    // Remove old entry from tag index
    this.removeFromTagIndex(key);

    // Add to cache
    this.cache.set(key, { value, tags });

    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  delete(key: string): boolean {
    this.removeFromTagIndex(key);
    return this.cache.delete(key);
  }

  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let count = 0;
    for (const key of keys) {
      if (this.cache.delete(key)) {
        count++;
      }
    }

    this.tagIndex.delete(tag);
    return count;
  }

  invalidateByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  private removeFromTagIndex(key: string): void {
    const entry = this.cache.get(key) as CacheEntry<unknown> | undefined;
    if (!entry) return;

    for (const tag of entry.tags) {
      const tagKeys = this.tagIndex.get(tag);
      if (tagKeys) {
        tagKeys.delete(key);
        if (tagKeys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }
  }
}

// Default cache instance
let defaultCache: CMSCache | null = null;

export function getCache(options?: CacheOptions): CMSCache {
  if (!defaultCache) {
    const envOptions: CacheOptions = {
      max: process.env.CACHE_MAX_ENTRIES ? parseInt(process.env.CACHE_MAX_ENTRIES, 10) : undefined,
      ttl: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL, 10) : undefined,
    };
    defaultCache = new CMSCache({ ...envOptions, ...options });
  }
  return defaultCache;
}

export function createCache(options?: CacheOptions): CMSCache {
  return new CMSCache(options);
}

export function resetCache(): void {
  defaultCache?.clear();
  defaultCache = null;
}

export { CMSCache };
