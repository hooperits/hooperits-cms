/**
 * HOOPERITS CMS Client - Types
 */

export interface Content<T = Record<string, unknown>> {
  id: string;
  type: {
    id: string;
    name: string;
    label: string;
  };
  data: T;
  status: 'DRAFT' | 'PUBLISHED';
  slug: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
  updatedBy: { id: string; name: string };
}

export interface ContentListResponse<T = Record<string, unknown>> {
  items: Content<T>[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Media {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  width: number | null;
  height: number | null;
  variants: MediaVariants | null;
}

export interface MediaVariants {
  thumbnail?: MediaVariant;
  medium?: MediaVariant;
  large?: MediaVariant;
  original?: MediaVariant;
}

export interface MediaVariant {
  url: string;
  width: number;
  height?: number;
}

export interface ContentType {
  id: string;
  name: string;
  label: string;
  labelPlural: string;
  icon: string | null;
}

export interface ListOptions {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'PUBLISHED';
  sort?: string;
}

export interface ClientConfig {
  apiUrl: string;
  headers?: Record<string, string>;
}

export interface CMSError {
  code: string;
  message: string;
  details?: unknown;
}
