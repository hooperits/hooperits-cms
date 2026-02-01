'use client';

/**
 * HOOPERITS CMS - Dynamic Options Hook (Spec 007)
 * Manages dynamic option loading for dependent select fields
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { SelectDependency } from '@hooperits/cms';

export interface UseDynamicOptionsOptions {
  /** Dependency configuration */
  dependency?: SelectDependency;
  /** Current document data */
  data: Record<string, unknown>;
  /** Current field value */
  currentValue: string | string[] | undefined;
  /** Static options (fallback when no dependency) */
  staticOptions: Array<{ value: string; label: string }>;
  /** Callback when value should be cleared */
  onClearValue?: () => void;
}

export interface UseDynamicOptionsResult {
  /** Current options to display */
  options: Array<{ value: string; label: string }>;
  /** Whether options are loading */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Whether the current value is valid for the options */
  isValueValid: boolean;
}

// Simple cache for options
const optionsCache = new Map<string, Array<{ value: string; label: string }>>();

/**
 * Creates a cache key from dependency field and parent value
 */
function createCacheKey(fieldName: string, parentValue: unknown): string {
  return `${fieldName}:${JSON.stringify(parentValue)}`;
}

/**
 * Hook for managing dynamic options in select fields
 */
export function useDynamicOptions({
  dependency,
  data,
  currentValue,
  staticOptions,
  onClearValue,
}: UseDynamicOptionsOptions): UseDynamicOptionsResult {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>(
    staticOptions
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track previous parent value to detect changes
  const prevParentValueRef = useRef<unknown>(undefined);
  const isFirstRenderRef = useRef(true);

  // Get parent field value
  const parentValue = dependency ? data[dependency.field] : undefined;

  // Load options when parent value changes
  useEffect(() => {
    if (!dependency) {
      // No dependency - use static options
      setOptions(staticOptions);
      return;
    }

    const loadOptions = async () => {
      // Check cache first
      const cacheKey = createCacheKey(dependency.field, parentValue);
      const cached = optionsCache.get(cacheKey);
      if (cached) {
        setOptions(cached);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let newOptions: Array<{ value: string; label: string }>;

        if (dependency.endpoint) {
          // Fetch from API endpoint
          const response = await fetch(
            `${dependency.endpoint}?parentValue=${encodeURIComponent(
              JSON.stringify(parentValue)
            )}`
          );
          if (!response.ok) {
            throw new Error('Failed to load options');
          }
          newOptions = await response.json();
        } else if (dependency.getOptions) {
          // Use getOptions function
          const result = dependency.getOptions(data, parentValue);
          newOptions = result instanceof Promise ? await result : result;
        } else {
          // No way to get options - use static
          newOptions = staticOptions;
        }

        // Cache the result
        optionsCache.set(cacheKey, newOptions);
        setOptions(newOptions);
      } catch (err) {
        console.error('Error loading dynamic options:', err);
        setError(err instanceof Error ? err.message : 'Failed to load options');
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOptions();
  }, [dependency, parentValue, data, staticOptions]);

  // Handle parent value changes - clear invalid values
  useEffect(() => {
    if (!dependency || isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevParentValueRef.current = parentValue;
      return;
    }

    // Parent value changed
    if (JSON.stringify(prevParentValueRef.current) !== JSON.stringify(parentValue)) {
      prevParentValueRef.current = parentValue;

      // Check if we should clear value on change
      if (dependency.clearOnChange !== false && currentValue !== undefined) {
        // Check if current value is still valid in new options
        const valueArray = Array.isArray(currentValue) ? currentValue : [currentValue];
        const optionValues = options.map((o) => o.value);
        const hasInvalidValue = valueArray.some((v) => !optionValues.includes(v));

        if (hasInvalidValue) {
          onClearValue?.();
        }
      }
    }
  }, [dependency, parentValue, currentValue, options, onClearValue]);

  // Check if current value is valid
  const isValueValid = useMemo(() => {
    if (currentValue === undefined || currentValue === null) return true;

    const valueArray = Array.isArray(currentValue) ? currentValue : [currentValue];
    const optionValues = options.map((o) => o.value);

    return valueArray.every((v) => optionValues.includes(v));
  }, [currentValue, options]);

  return {
    options,
    isLoading,
    error,
    isValueValid,
  };
}

/**
 * Clears the options cache
 * Useful when data changes externally
 */
export function clearOptionsCache(): void {
  optionsCache.clear();
}

/**
 * Clears cache for a specific field
 */
export function clearFieldOptionsCache(fieldName: string): void {
  for (const key of optionsCache.keys()) {
    if (key.startsWith(`${fieldName}:`)) {
      optionsCache.delete(key);
    }
  }
}
