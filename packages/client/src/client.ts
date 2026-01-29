/**
 * HOOPERITS CMS Client
 * Type-safe client for consuming CMS content
 */

import type {
  Content,
  ContentListResponse,
  Media,
  ContentType,
  ListOptions,
  ClientConfig,
  CMSError,
} from './types';

export class CMSClient {
  private apiUrl: string;
  private headers: Record<string, string>;

  constructor(config: ClientConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        code: 'NETWORK_ERROR',
        message: `Request failed with status ${response.status}`,
      }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  /**
   * Content API
   */
  content = {
    /**
     * Get all content items of a type
     */
    getAll: async <T = Record<string, unknown>>(
      type: string,
      options: ListOptions = {}
    ): Promise<ContentListResponse<T>> => {
      const params = new URLSearchParams();
      if (options.page) params.set('page', String(options.page));
      if (options.limit) params.set('limit', String(options.limit));
      if (options.status) params.set('status', options.status);
      if (options.sort) params.set('sort', options.sort);

      const query = params.toString();
      const path = `/content/${type}${query ? `?${query}` : ''}`;

      return this.request<ContentListResponse<T>>(path);
    },

    /**
     * Get a single content item by ID
     */
    getById: async <T = Record<string, unknown>>(
      type: string,
      id: string
    ): Promise<Content<T>> => {
      return this.request<Content<T>>(`/content/${type}/${id}`);
    },

    /**
     * Get a content item by slug
     */
    getBySlug: async <T = Record<string, unknown>>(
      type: string,
      slug: string
    ): Promise<Content<T>> => {
      return this.request<Content<T>>(`/content/${type}/slug/${slug}`);
    },
  };

  /**
   * Media API
   */
  media = {
    /**
     * Get media file by ID
     */
    getById: async (id: string): Promise<Media> => {
      return this.request<Media>(`/media/${id}`);
    },
  };

  /**
   * Schema API
   */
  schema = {
    /**
     * Get all content types
     */
    getAll: async (): Promise<ContentType[]> => {
      return this.request<ContentType[]>('/schema');
    },

    /**
     * Get a content type by name
     */
    getByName: async (name: string): Promise<ContentType> => {
      return this.request<ContentType>(`/schema/${name}`);
    },
  };
}

/**
 * Create a CMS client instance
 */
export function createCMSClient(config: ClientConfig): CMSClient {
  return new CMSClient(config);
}
