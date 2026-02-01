'use client';

/**
 * HOOPERITS CMS - Field Visibility Hook (Spec 007)
 * Manages field visibility state based on document values
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { SchemaDefinition } from '@hooperits/cms';
import {
  evaluateAllFieldVisibility,
  getFieldsToReevaluate,
  type VisibilityEvaluationResult,
} from '@hooperits/cms';

export interface UseFieldVisibilityOptions {
  /** Schema definition with visibility conditions */
  schema: SchemaDefinition;
  /** Current document data */
  data: Record<string, unknown>;
  /** Callback when fields need cleanup (hidden with values) */
  onFieldsNeedCleanup?: (fieldNames: string[]) => void;
}

export interface UseFieldVisibilityResult {
  /** Map of field names to hidden state */
  hiddenFields: Map<string, boolean>;
  /** Check if a specific field is hidden */
  isFieldHidden: (fieldName: string) => boolean;
  /** Fields that became hidden and have values */
  fieldsNeedingCleanup: string[];
  /** Clear the cleanup queue */
  clearCleanupQueue: () => void;
}

/**
 * Hook to manage field visibility based on document state
 *
 * @param options - Configuration options
 * @returns Visibility state and helper functions
 */
export function useFieldVisibility(
  options: UseFieldVisibilityOptions
): UseFieldVisibilityResult {
  const { schema, data, onFieldsNeedCleanup } = options;

  // Track previous hidden state for transition detection
  const [previousHiddenState, setPreviousHiddenState] = useState<Map<string, boolean>>(
    () => new Map()
  );

  // Track fields needing cleanup
  const [fieldsNeedingCleanup, setFieldsNeedingCleanup] = useState<string[]>([]);

  // Evaluate visibility for all fields
  const visibilityResult = useMemo((): VisibilityEvaluationResult => {
    return evaluateAllFieldVisibility(schema, data, previousHiddenState);
  }, [schema, data, previousHiddenState]);

  // Update previous state and handle cleanup notifications
  useEffect(() => {
    const { hiddenFields, fieldsNeedingCleanup: newFieldsNeedingCleanup } = visibilityResult;

    // Update cleanup queue
    if (newFieldsNeedingCleanup.length > 0) {
      setFieldsNeedingCleanup((prev) => {
        const combined = [...new Set([...prev, ...newFieldsNeedingCleanup])];
        return combined;
      });
      onFieldsNeedCleanup?.(newFieldsNeedingCleanup);
    }

    // Store current state for next comparison
    setPreviousHiddenState(new Map(hiddenFields));
  }, [visibilityResult, onFieldsNeedCleanup]);

  // Check if a specific field is hidden
  const isFieldHidden = useCallback(
    (fieldName: string): boolean => {
      return visibilityResult.hiddenFields.get(fieldName) ?? false;
    },
    [visibilityResult]
  );

  // Clear the cleanup queue
  const clearCleanupQueue = useCallback(() => {
    setFieldsNeedingCleanup([]);
  }, []);

  return {
    hiddenFields: visibilityResult.hiddenFields,
    isFieldHidden,
    fieldsNeedingCleanup,
    clearCleanupQueue,
  };
}

/**
 * Hook to get fields affected by a specific field change
 * Useful for optimized re-rendering
 */
export function useVisibilityDependencies(
  schema: SchemaDefinition,
  changedField: string
): string[] {
  return useMemo(() => {
    return getFieldsToReevaluate(schema, changedField);
  }, [schema, changedField]);
}
