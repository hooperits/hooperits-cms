/**
 * HOOPERITS CMS Client - React Hooks
 * Optional React integration
 */

import { useState, useEffect, useCallback } from 'react';
import type { CMSClient } from './client';
import type { Content, ContentListResponse, ListOptions } from './types';

interface UseContentListResult<T> {
  data: ContentListResponse<T> | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UseContentResult<T> {
  data: Content<T> | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch a list of content items
 */
export function useContentList<T = Record<string, unknown>>(
  client: CMSClient,
  type: string,
  options: ListOptions = {}
): UseContentListResult<T> {
  const [data, setData] = useState<ContentListResponse<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.content.getAll<T>(type, options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch content'));
    } finally {
      setLoading(false);
    }
  }, [client, type, options.page, options.limit, options.status, options.sort]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Hook to fetch a single content item by ID
 */
export function useContent<T = Record<string, unknown>>(
  client: CMSClient,
  type: string,
  id: string
): UseContentResult<T> {
  const [data, setData] = useState<Content<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);

      try {
        const result = await client.content.getById<T>(type, id);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch content'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      cancelled = true;
    };
  }, [client, type, id]);

  return { data, loading, error };
}

/**
 * Hook to fetch a content item by slug
 */
export function useContentBySlug<T = Record<string, unknown>>(
  client: CMSClient,
  type: string,
  slug: string
): UseContentResult<T> {
  const [data, setData] = useState<Content<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);

      try {
        const result = await client.content.getBySlug<T>(type, slug);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch content'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      cancelled = true;
    };
  }, [client, type, slug]);

  return { data, loading, error };
}
