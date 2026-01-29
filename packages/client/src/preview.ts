/**
 * HOOPERITS CMS - Preview Mode Utilities
 * Client-side utilities for preview mode detection and management
 */

// Cookie name for storing preview state
const PREVIEW_COOKIE_NAME = 'hooperits_preview_token';

// URL parameter names
const PREVIEW_PARAM = 'preview';
const TOKEN_PARAM = 'token';

/**
 * Check if the current page is in preview mode
 * Preview mode is indicated by URL parameters or a cookie
 */
export function isPreviewMode(): boolean {
  // Check URL params
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.has(TOKEN_PARAM) || params.has(PREVIEW_PARAM)) {
      return true;
    }
  }

  // Check cookie
  if (typeof document !== 'undefined') {
    return document.cookie.includes(PREVIEW_COOKIE_NAME);
  }

  return false;
}

/**
 * Get the preview token from URL parameters or cookie
 */
export function getPreviewToken(): string | null {
  // Check URL params first
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const token = params.get(TOKEN_PARAM) || params.get(PREVIEW_PARAM);
    if (token) {
      return token;
    }
  }

  // Check cookie
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === PREVIEW_COOKIE_NAME) {
        return decodeURIComponent(value);
      }
    }
  }

  return null;
}

/**
 * Enable preview mode by storing the token in a cookie
 * This allows preview to persist across page navigations
 */
export function enablePreview(token: string, expiresAt?: Date): void {
  if (typeof document === 'undefined') return;

  const expires = expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);
  document.cookie = `${PREVIEW_COOKIE_NAME}=${encodeURIComponent(token)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Disable preview mode by removing the cookie and URL parameters
 */
export function disablePreview(): void {
  if (typeof document === 'undefined') return;

  // Remove cookie
  document.cookie = `${PREVIEW_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

  // Remove URL parameters and reload
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.delete(TOKEN_PARAM);
    url.searchParams.delete(PREVIEW_PARAM);

    // Only reload if parameters were removed
    if (url.toString() !== window.location.href) {
      window.location.href = url.toString();
    }
  }
}

/**
 * Interface for preview content returned by the API
 */
export interface PreviewContentData {
  _id: string;
  _type: string;
  _isPreview: boolean;
  _previewExpiresAt: Date;
  [key: string]: unknown;
}

/**
 * Fetch preview content using the stored or provided token
 */
export async function fetchPreviewContent(
  baseUrl: string,
  token?: string
): Promise<PreviewContentData> {
  const previewToken = token || getPreviewToken();

  if (!previewToken) {
    throw new Error('No preview token available');
  }

  const response = await fetch(`${baseUrl}/api/cms/preview?token=${previewToken}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Preview failed' } }));
    throw new Error(error.error?.message || 'Failed to fetch preview content');
  }

  const { data } = await response.json();
  return data;
}

/**
 * React hook result for preview mode
 */
export interface PreviewState {
  isPreview: boolean;
  token: string | null;
  enable: (token: string, expiresAt?: Date) => void;
  disable: () => void;
}

/**
 * Get preview state object (for non-React use cases)
 */
export function getPreviewState(): PreviewState {
  return {
    isPreview: isPreviewMode(),
    token: getPreviewToken(),
    enable: enablePreview,
    disable: disablePreview,
  };
}
