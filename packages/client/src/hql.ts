/**
 * HOOPERITS CMS - HQL Client
 * Type-safe HQL query execution from frontend applications
 */

import type {
  HQLQueryOptions,
  HQLQueryResponse,
  HQLError,
} from './types';

export interface HQLClientConfig {
  apiUrl: string;
  headers?: Record<string, string>;
}

export class HQLClient {
  private apiUrl: string;
  private headers: Record<string, string>;

  constructor(config: HQLClientConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Execute an HQL query
   * @param queryString The HQL query string
   * @param params Optional parameters to substitute in the query
   * @param options Optional query execution options
   * @returns Query result with metadata
   */
  async query<T = unknown>(
    queryString: string,
    params?: Record<string, unknown>,
    options?: HQLQueryOptions
  ): Promise<HQLQueryResponse<T>> {
    const url = `${this.apiUrl}/hql`;

    const body: { query: string; params?: Record<string, unknown>; options?: HQLQueryOptions } = {
      query: queryString,
    };

    if (params) {
      body.params = params;
    }

    if (options) {
      body.options = options;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({
        error: {
          code: 'NETWORK_ERROR',
          message: `Request failed with status ${response.status}`,
        },
      }));

      const error = new Error(errorResponse.error?.message || 'Query failed') as Error & {
        code?: string;
        position?: HQLError['position'];
        details?: unknown;
      };
      error.code = errorResponse.error?.code;
      error.position = errorResponse.error?.position;
      error.details = errorResponse.error?.details;
      throw error;
    }

    return response.json();
  }

  /**
   * Execute a query and return only the data (without metadata)
   */
  async fetch<T = unknown>(
    queryString: string,
    params?: Record<string, unknown>,
    options?: HQLQueryOptions
  ): Promise<T> {
    const result = await this.query<T>(queryString, params, options);
    return result.data;
  }
}

/**
 * Create an HQL client instance
 */
export function createHQLClient(config: HQLClientConfig): HQLClient {
  return new HQLClient(config);
}

/**
 * Type helper for defining typed query functions
 *
 * @example
 * ```typescript
 * const getPosts = defineQuery('*[_type == "post"]');
 * const posts = await client.fetch(...getPosts());
 * ```
 */
export function defineQuery(
  queryString: string,
  defaultParams?: Record<string, unknown>
): (params?: Record<string, unknown>) => [string, Record<string, unknown> | undefined] {
  return (params?: Record<string, unknown>) => {
    const mergedParams = params || defaultParams
      ? { ...defaultParams, ...params }
      : undefined;
    return [queryString, mergedParams];
  };
}
