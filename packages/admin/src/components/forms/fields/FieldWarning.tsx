'use client';

/**
 * HOOPERITS CMS - Field Warning Component (Spec 007)
 *
 * Displays contextual warnings for form fields.
 * Warnings are non-blocking (unlike validation errors) but alert users
 * to potential issues or important information.
 */

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { DocumentContext, WarningFunction } from '@hooperits/cms';

export interface FieldWarningProps {
  /** Warning message or function that returns warning based on document state */
  warning?: string | WarningFunction;
  /** Current document data for dynamic warning evaluation */
  documentData?: DocumentContext;
  /** Field value for evaluation */
  value?: unknown;
  /** Custom CSS class */
  className?: string;
  /** Variant style */
  variant?: 'default' | 'subtle' | 'prominent';
  /** Children to render instead of warning prop */
  children?: ReactNode;
}

/**
 * Displays a warning message for a form field
 *
 * @example
 * Static warning:
 * ```tsx
 * <FieldWarning warning="This action cannot be undone" />
 * ```
 *
 * Dynamic warning:
 * ```tsx
 * <FieldWarning
 *   warning={(value, doc) => value > 100 ? 'High value - verify before saving' : undefined}
 *   value={price}
 *   documentData={formData}
 * />
 * ```
 */
export function FieldWarning({
  warning,
  documentData = {},
  value,
  className = '',
  variant = 'default',
  children,
}: FieldWarningProps) {
  // Evaluate warning message
  const warningMessage = useMemo(() => {
    if (children) return null; // Children take precedence
    if (!warning) return null;

    if (typeof warning === 'function') {
      try {
        return warning(value, documentData);
      } catch (error) {
        console.error('Error evaluating field warning:', error);
        return null;
      }
    }

    return warning;
  }, [warning, value, documentData, children]);

  // If using children, render them
  if (children) {
    return (
      <div
        className={`${getVariantClasses(variant)} ${className}`}
        role="alert"
        aria-live="polite"
      >
        <WarningIcon variant={variant} />
        <span>{children}</span>
      </div>
    );
  }

  // No warning message
  if (!warningMessage) {
    return null;
  }

  return (
    <div
      className={`${getVariantClasses(variant)} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <WarningIcon variant={variant} />
      <span>{warningMessage}</span>
    </div>
  );
}

/**
 * Get CSS classes based on variant
 */
function getVariantClasses(variant: FieldWarningProps['variant']): string {
  const base = 'flex items-start gap-2 mt-1 text-sm';

  switch (variant) {
    case 'subtle':
      return `${base} text-amber-600`;
    case 'prominent':
      return `${base} p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800`;
    default:
      return `${base} text-amber-600`;
  }
}

/**
 * Warning icon component
 */
function WarningIcon({ variant }: { variant: FieldWarningProps['variant'] }) {
  const sizeClass = variant === 'prominent' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <svg
      className={`${sizeClass} flex-shrink-0 mt-0.5`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

/**
 * Displays multiple warnings for a field
 */
export interface FieldWarningsListProps {
  /** Array of warning messages */
  warnings: string[];
  /** Variant style for all warnings */
  variant?: FieldWarningProps['variant'];
  /** Custom CSS class */
  className?: string;
}

export function FieldWarningsList({
  warnings,
  variant = 'default',
  className = '',
}: FieldWarningsListProps) {
  if (!warnings.length) {
    return null;
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {warnings.map((warning, index) => (
        <FieldWarning key={index} warning={warning} variant={variant} />
      ))}
    </div>
  );
}

/**
 * Hook for evaluating field warnings
 * Useful when you need to compute warnings at the parent level
 */
export function useFieldWarning(
  warning: string | WarningFunction | undefined,
  value: unknown,
  documentData: DocumentContext
): string | undefined {
  return useMemo(() => {
    if (!warning) return undefined;

    if (typeof warning === 'function') {
      try {
        return warning(value, documentData);
      } catch (error) {
        console.error('Error evaluating field warning:', error);
        return undefined;
      }
    }

    return warning;
  }, [warning, value, documentData]);
}
