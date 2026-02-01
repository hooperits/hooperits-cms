'use client';

/**
 * HOOPERITS CMS - useComputedFields Hook (Spec 007)
 *
 * Manages computed field values in real-time based on document changes.
 * Automatically recalculates dependent computed fields when source fields change.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SchemaDefinition, DocumentContext } from '@hooperits/cms';
import {
  calculateComputedFields,
  getComputedFields,
  getFieldsToRecalculate,
  isComputedField,
} from '@hooperits/cms';

export interface ComputedFieldsState {
  /** Map of computed field names to their calculated values */
  values: Map<string, unknown>;
  /** Map of field names to computation errors */
  errors: Map<string, string>;
  /** Whether any computation is currently running */
  isComputing: boolean;
}

export interface UseComputedFieldsOptions {
  /** Schema definition containing computed fields */
  schema: SchemaDefinition;
  /** Current document data */
  documentData: DocumentContext;
  /** Callback when computed values change */
  onComputedChange?: (values: Map<string, unknown>) => void;
  /** Debounce delay in ms (default: 100) */
  debounceMs?: number;
  /** Whether to enable computation (default: true) */
  enabled?: boolean;
}

export interface UseComputedFieldsResult {
  /** Current computed values */
  computedValues: Map<string, unknown>;
  /** Computation errors by field */
  errors: Map<string, string>;
  /** Whether computation is in progress */
  isComputing: boolean;
  /** Get computed value for a specific field */
  getComputedValue: (fieldName: string) => unknown;
  /** Check if a field is computed */
  isFieldComputed: (fieldName: string) => boolean;
  /** Check if a field has a computation error */
  hasError: (fieldName: string) => boolean;
  /** Get error message for a field */
  getError: (fieldName: string) => string | undefined;
  /** Force recalculation of all computed fields */
  recalculateAll: () => void;
  /** Recalculate fields affected by a specific field change */
  recalculateFor: (changedField: string) => void;
  /** Set of all computed field names */
  computedFieldNames: Set<string>;
}

/**
 * Hook for managing computed fields in forms
 *
 * @param options - Hook configuration
 * @returns Computed fields state and utilities
 *
 * @example
 * ```tsx
 * const { computedValues, isFieldComputed, getComputedValue } = useComputedFields({
 *   schema,
 *   documentData: formData,
 *   onComputedChange: (values) => {
 *     // Merge computed values into form state
 *     setFormData(prev => ({ ...prev, ...Object.fromEntries(values) }));
 *   },
 * });
 * ```
 */
export function useComputedFields(
  options: UseComputedFieldsOptions
): UseComputedFieldsResult {
  const {
    schema,
    documentData,
    onComputedChange,
    debounceMs = 100,
    enabled = true,
  } = options;

  const [state, setState] = useState<ComputedFieldsState>({
    values: new Map(),
    errors: new Map(),
    isComputing: false,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousDataRef = useRef<DocumentContext | null>(null);
  const onComputedChangeRef = useRef(onComputedChange);

  // Keep callback ref updated
  useEffect(() => {
    onComputedChangeRef.current = onComputedChange;
  }, [onComputedChange]);

  // Get all computed field names
  const computedFieldNames = useMemo(() => {
    const fields = getComputedFields(schema);
    return new Set(fields.map(([name]) => name));
  }, [schema]);

  // Check if a field is computed
  const isFieldComputed = useCallback(
    (fieldName: string): boolean => {
      return computedFieldNames.has(fieldName);
    },
    [computedFieldNames]
  );

  // Calculate all computed fields
  const calculateAll = useCallback(() => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, isComputing: true }));

    try {
      const result = calculateComputedFields(schema, documentData);

      setState({
        values: result.computedValues,
        errors: result.errors,
        isComputing: false,
      });

      // Notify of changes
      if (result.computedValues.size > 0) {
        onComputedChangeRef.current?.(result.computedValues);
      }
    } catch (error) {
      console.error('Error calculating computed fields:', error);
      setState((prev) => ({ ...prev, isComputing: false }));
    }
  }, [schema, documentData, enabled]);

  // Debounced calculation triggered by document changes
  useEffect(() => {
    if (!enabled || computedFieldNames.size === 0) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set computing state immediately
    setState((prev) => ({ ...prev, isComputing: true }));

    // Debounce the actual calculation
    timeoutRef.current = setTimeout(() => {
      calculateAll();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [documentData, calculateAll, enabled, computedFieldNames.size, debounceMs]);

  // Initial calculation on mount
  useEffect(() => {
    if (enabled && computedFieldNames.size > 0) {
      calculateAll();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get computed value for a field
  const getComputedValue = useCallback(
    (fieldName: string): unknown => {
      return state.values.get(fieldName);
    },
    [state.values]
  );

  // Check if field has error
  const hasError = useCallback(
    (fieldName: string): boolean => {
      return state.errors.has(fieldName);
    },
    [state.errors]
  );

  // Get error message
  const getError = useCallback(
    (fieldName: string): string | undefined => {
      return state.errors.get(fieldName);
    },
    [state.errors]
  );

  // Force recalculation of all fields
  const recalculateAll = useCallback(() => {
    calculateAll();
  }, [calculateAll]);

  // Recalculate fields affected by a specific change
  const recalculateFor = useCallback(
    (changedField: string) => {
      if (!enabled) return;

      const fieldsToRecalc = getFieldsToRecalculate(schema, changedField);
      if (fieldsToRecalc.length === 0) return;

      // For now, recalculate all (optimization can come later)
      calculateAll();
    },
    [schema, calculateAll, enabled]
  );

  return {
    computedValues: state.values,
    errors: state.errors,
    isComputing: state.isComputing,
    getComputedValue,
    isFieldComputed,
    hasError,
    getError,
    recalculateAll,
    recalculateFor,
    computedFieldNames,
  };
}

/**
 * Utility function to merge computed values into document data
 * Useful for form submission preparation
 */
export function mergeComputedValues(
  documentData: DocumentContext,
  computedValues: Map<string, unknown>
): DocumentContext {
  const merged = { ...documentData };
  for (const [key, value] of computedValues) {
    merged[key] = value;
  }
  return merged;
}
