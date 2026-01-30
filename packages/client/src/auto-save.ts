/**
 * HOOPERITS CMS - Auto-save Utilities
 * Debounced auto-save with localStorage crash recovery
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface AutoSaveConfig {
  /** Content ID for the document being edited */
  contentId: string;
  /** Content type name */
  contentType: string;
  /** Debounce delay in milliseconds (default: 3000) */
  debounceMs?: number;
  /** API endpoint for auto-save (default: /api/cms/content/{type}/{id}/versions) */
  endpoint?: string;
  /** Whether to enable localStorage backup (default: true) */
  enableLocalBackup?: boolean;
  /** Callback when auto-save succeeds */
  onSave?: (versionNumber: number) => void;
  /** Callback when auto-save fails */
  onError?: (error: Error) => void;
}

export interface AutoSaveState {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Whether auto-save is currently in progress */
  isSaving: boolean;
  /** Last saved version number */
  lastSavedVersion: number | null;
  /** Last save timestamp */
  lastSavedAt: Date | null;
  /** Last error if save failed */
  error: Error | null;
}

export interface RecoverableData {
  contentId: string;
  contentType: string;
  data: Record<string, unknown>;
  savedAt: Date;
  source: 'local' | 'server';
}

// =============================================================================
// LocalStorage Helpers
// =============================================================================

const STORAGE_PREFIX = 'hooperits_autosave_';

function getStorageKey(contentId: string): string {
  return `${STORAGE_PREFIX}${contentId}`;
}

/**
 * Save data to localStorage for crash recovery
 */
export function saveToLocalStorage(
  contentId: string,
  contentType: string,
  data: Record<string, unknown>
): void {
  try {
    const key = getStorageKey(contentId);
    const payload = {
      contentId,
      contentType,
      data,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

/**
 * Load recoverable data from localStorage
 */
export function loadFromLocalStorage(contentId: string): RecoverableData | null {
  try {
    const key = getStorageKey(contentId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return {
      contentId: parsed.contentId,
      contentType: parsed.contentType,
      data: parsed.data,
      savedAt: new Date(parsed.savedAt),
      source: 'local',
    };
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Clear localStorage backup for a content item
 */
export function clearLocalStorage(contentId: string): void {
  try {
    const key = getStorageKey(contentId);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
}

// =============================================================================
// Auto-save Hook
// =============================================================================

/**
 * Hook for auto-saving content changes with debounce and localStorage backup
 *
 * @example
 * ```tsx
 * const { isDirty, isSaving, triggerSave } = useAutoSave({
 *   contentId: 'abc123',
 *   contentType: 'posts',
 *   onSave: (version) => console.log('Saved version:', version),
 * });
 *
 * // Call triggerSave whenever data changes
 * useEffect(() => {
 *   triggerSave(formData);
 * }, [formData, triggerSave]);
 * ```
 */
export function useAutoSave(config: AutoSaveConfig): AutoSaveState & {
  triggerSave: (data: Record<string, unknown>) => void;
  saveNow: (data: Record<string, unknown>) => Promise<void>;
  checkRecovery: () => RecoverableData | null;
  clearRecovery: () => void;
} {
  const {
    contentId,
    contentType,
    debounceMs = 3000,
    endpoint,
    enableLocalBackup = true,
    onSave,
    onError,
  } = config;

  const [state, setState] = useState<AutoSaveState>({
    isDirty: false,
    isSaving: false,
    lastSavedVersion: null,
    lastSavedAt: null,
    error: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<Record<string, unknown> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const apiEndpoint = endpoint || `/api/cms/content/${contentType}/${contentId}/versions`;

  // Save to server
  const saveToServer = useCallback(async (data: Record<string, unknown>) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Auto-save failed: ${response.statusText}`);
      }

      const result = await response.json();

      setState((prev) => ({
        ...prev,
        isDirty: false,
        isSaving: false,
        lastSavedVersion: result.versionNumber,
        lastSavedAt: new Date(),
        error: null,
      }));

      // Clear localStorage backup on successful save
      if (enableLocalBackup) {
        clearLocalStorage(contentId);
      }

      onSave?.(result.versionNumber);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore aborted requests
      }

      const err = error instanceof Error ? error : new Error('Unknown error');
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: err,
      }));
      onError?.(err);
    }
  }, [apiEndpoint, contentId, enableLocalBackup, onSave, onError]);

  // Debounced save trigger
  const triggerSave = useCallback((data: Record<string, unknown>) => {
    pendingDataRef.current = data;
    setState((prev) => ({ ...prev, isDirty: true }));

    // Save to localStorage immediately for crash recovery
    if (enableLocalBackup) {
      saveToLocalStorage(contentId, contentType, data);
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new debounced save
    timeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        saveToServer(pendingDataRef.current);
      }
    }, debounceMs);
  }, [contentId, contentType, debounceMs, enableLocalBackup, saveToServer]);

  // Immediate save (no debounce)
  const saveNow = useCallback(async (data: Record<string, unknown>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await saveToServer(data);
  }, [saveToServer]);

  // Check for recoverable data
  const checkRecovery = useCallback((): RecoverableData | null => {
    if (!enableLocalBackup) return null;
    return loadFromLocalStorage(contentId);
  }, [contentId, enableLocalBackup]);

  // Clear recovery data
  const clearRecovery = useCallback(() => {
    clearLocalStorage(contentId);
  }, [contentId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingDataRef.current && state.isDirty && enableLocalBackup) {
        saveToLocalStorage(contentId, contentType, pendingDataRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [contentId, contentType, state.isDirty, enableLocalBackup]);

  return {
    ...state,
    triggerSave,
    saveNow,
    checkRecovery,
    clearRecovery,
  };
}

// =============================================================================
// Server-side Recovery Check
// =============================================================================

/**
 * Check for recoverable auto-save version from server
 */
export async function checkServerRecovery(
  contentType: string,
  contentId: string
): Promise<RecoverableData | null> {
  try {
    const response = await fetch(
      `/api/cms/content/${contentType}/${contentId}/versions/recover`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || !data.data) {
      return null;
    }

    return {
      contentId,
      contentType,
      data: data.data,
      savedAt: new Date(data.createdAt),
      source: 'server',
    };
  } catch {
    return null;
  }
}

/**
 * Check both localStorage and server for recoverable data
 * Returns the most recent recoverable data
 */
export async function checkAllRecovery(
  contentType: string,
  contentId: string
): Promise<RecoverableData | null> {
  const [localData, serverData] = await Promise.all([
    Promise.resolve(loadFromLocalStorage(contentId)),
    checkServerRecovery(contentType, contentId),
  ]);

  if (!localData && !serverData) {
    return null;
  }

  if (!localData) {
    return serverData;
  }

  if (!serverData) {
    return localData;
  }

  // Return the most recent
  return localData.savedAt > serverData.savedAt ? localData : serverData;
}
