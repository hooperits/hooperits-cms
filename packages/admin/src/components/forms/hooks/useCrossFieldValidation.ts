'use client';

/**
 * HOOPERITS CMS - Cross-field Validation Hook (Spec 007)
 * Manages cross-field validation state with debouncing
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { SchemaDefinition } from '@hooperits/cms';
import {
  validateDocument,
  createDebouncedValidator,
  type CrossValidationResult,
} from '@hooperits/cms';

export interface UseCrossFieldValidationOptions {
  /** Schema definition with validation function */
  schema: SchemaDefinition;
  /** Current document data */
  data: Record<string, unknown>;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Whether validation is enabled */
  enabled?: boolean;
}

export interface UseCrossFieldValidationResult {
  /** Whether document is currently valid */
  isValid: boolean;
  /** Whether validation is currently running */
  isValidating: boolean;
  /** Map of field names to error messages */
  errorsByField: Map<string, string[]>;
  /** Get errors for a specific field */
  getFieldErrors: (fieldName: string) => string[];
  /** All validation errors */
  errors: Array<{ field: string; message: string }>;
  /** Force immediate validation */
  validateNow: () => CrossValidationResult;
  /** Clear all validation errors */
  clearErrors: () => void;
}

/**
 * Hook to manage cross-field validation with debouncing
 *
 * @param options - Configuration options
 * @returns Validation state and helper functions
 */
export function useCrossFieldValidation(
  options: UseCrossFieldValidationOptions
): UseCrossFieldValidationResult {
  const { schema, data, debounceMs = 300, enabled = true } = options;

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<CrossValidationResult>({
    isValid: true,
    errors: [],
    errorsByField: new Map(),
  });

  // Track if component is mounted
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Create debounced validator
  const debouncedValidator = useMemo(
    () =>
      createDebouncedValidator(schema, {
        delay: debounceMs,
        onValidating: () => {
          if (isMountedRef.current) {
            setIsValidating(true);
          }
        },
        onValidated: (result) => {
          if (isMountedRef.current) {
            setValidationResult(result);
            setIsValidating(false);
          }
        },
      }),
    [schema, debounceMs]
  );

  // Trigger validation when data changes
  useEffect(() => {
    if (!enabled) {
      return;
    }
    debouncedValidator(data);
  }, [data, enabled, debouncedValidator]);

  // Force immediate validation
  const validateNow = useCallback((): CrossValidationResult => {
    const result = validateDocument(schema, data);
    setValidationResult(result);
    setIsValidating(false);
    return result;
  }, [schema, data]);

  // Get errors for a specific field
  const getFieldErrors = useCallback(
    (fieldName: string): string[] => {
      return validationResult.errorsByField.get(fieldName) || [];
    },
    [validationResult]
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    setValidationResult({
      isValid: true,
      errors: [],
      errorsByField: new Map(),
    });
  }, []);

  return {
    isValid: validationResult.isValid,
    isValidating,
    errorsByField: validationResult.errorsByField,
    getFieldErrors,
    errors: validationResult.errors,
    validateNow,
    clearErrors,
  };
}
