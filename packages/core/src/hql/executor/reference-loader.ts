/**
 * HOOPERITS CMS - HQL Reference Loader
 * Batched reference loading to prevent N+1 queries
 */

import { db } from '../../db';
import type { ReferenceLoader } from './types';
import { transformContentToHQL } from './transform';

interface BatchEntry {
  id: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

/**
 * Creates a reference loader that batches multiple reference lookups
 * into a single database query, preventing N+1 query problems.
 */
export function createReferenceLoader(): ReferenceLoader {
  const batch: BatchEntry[] = [];
  let scheduled = false;
  const cache = new Map<string, unknown>();

  function scheduleBatch(): void {
    if (scheduled) return;
    scheduled = true;

    // Schedule batch execution on next microtask
    queueMicrotask(async () => {
      scheduled = false;
      if (batch.length === 0) return;

      const currentBatch = [...batch];
      batch.length = 0;

      try {
        await executeBatch(currentBatch);
      } catch (error) {
        for (const entry of currentBatch) {
          entry.reject(error instanceof Error ? error : new Error(String(error)));
        }
      }
    });
  }

  async function executeBatch(entries: BatchEntry[]): Promise<void> {
    // Get unique IDs that aren't in cache
    const uncachedIds = [...new Set(entries.map((e) => e.id).filter((id) => !cache.has(id)))];

    if (uncachedIds.length > 0) {
      // Batch load from database
      const results = await db.content.findMany({
        where: {
          id: { in: uncachedIds },
        },
        include: {
          type: { select: { id: true, name: true, label: true } },
        },
      });

      // Populate cache with transformed results
      for (const result of results) {
        cache.set(result.id, transformContentToHQL(result));
      }

      // Mark missing IDs as null in cache
      for (const id of uncachedIds) {
        if (!cache.has(id)) {
          cache.set(id, null);
        }
      }
    }

    // Resolve all entries from cache
    for (const entry of entries) {
      entry.resolve(cache.get(entry.id) ?? null);
    }
  }

  return {
    load(id: string): Promise<unknown> {
      // Check cache first
      if (cache.has(id)) {
        return Promise.resolve(cache.get(id));
      }

      // Add to batch
      return new Promise((resolve, reject) => {
        batch.push({ id, resolve, reject });
        scheduleBatch();
      });
    },

    loadMany(ids: string[]): Promise<unknown[]> {
      return Promise.all(ids.map((id) => this.load(id)));
    },

    clear(): void {
      cache.clear();
    },
  };
}
