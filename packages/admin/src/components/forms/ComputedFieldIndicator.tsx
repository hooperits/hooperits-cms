'use client';

/**
 * HOOPERITS CMS - Computed Field Indicator (Spec 007)
 *
 * Visual indicator for computed/read-only fields showing:
 * - Computed badge with calculator icon
 * - Read-only styling
 * - Loading state during recalculation
 * - Error state for computation failures
 */

import type { ReactNode } from 'react';

export interface ComputedFieldIndicatorProps {
  /** Child content (the field value display) */
  children: ReactNode;
  /** Whether the field is currently being computed */
  isComputing?: boolean;
  /** Error message if computation failed */
  error?: string;
  /** Optional custom label for the badge */
  badgeLabel?: string;
  /** Whether to show the computed badge */
  showBadge?: boolean;
}

/**
 * Wraps a field to indicate it's computed/read-only
 *
 * @example
 * ```tsx
 * <ComputedFieldIndicator isComputing={isComputing}>
 *   <div className="p-2 bg-gray-50 rounded">{computedValue}</div>
 * </ComputedFieldIndicator>
 * ```
 */
export function ComputedFieldIndicator({
  children,
  isComputing = false,
  error,
  badgeLabel = 'Computed',
  showBadge = true,
}: ComputedFieldIndicatorProps) {
  return (
    <div className="relative">
      {/* Computed Badge */}
      {showBadge && (
        <div className="absolute -top-2 right-0 z-10">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
              error
                ? 'bg-red-100 text-red-700'
                : isComputing
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            {/* Calculator icon */}
            <svg
              className={`w-3 h-3 ${isComputing ? 'animate-pulse' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            {isComputing ? 'Computing...' : error ? 'Error' : badgeLabel}
          </span>
        </div>
      )}

      {/* Field Content */}
      <div className={`${isComputing ? 'opacity-50' : ''}`}>{children}</div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export interface ComputedFieldDisplayProps {
  /** The computed value to display */
  value: unknown;
  /** Field label */
  label: string;
  /** Optional description */
  description?: string;
  /** Whether the field is currently being computed */
  isComputing?: boolean;
  /** Error message if computation failed */
  error?: string;
  /** Format function for the value */
  format?: (value: unknown) => string;
}

/**
 * Complete display component for a computed field
 * Shows the label, value, and computed indicator
 *
 * @example
 * ```tsx
 * <ComputedFieldDisplay
 *   label="Total Price"
 *   value={total}
 *   format={(v) => `$${v.toFixed(2)}`}
 *   isComputing={isComputing}
 * />
 * ```
 */
export function ComputedFieldDisplay({
  value,
  label,
  description,
  isComputing = false,
  error,
  format,
}: ComputedFieldDisplayProps) {
  const displayValue = format ? format(value) : formatDefaultValue(value);

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {description && <p className="text-sm text-gray-500">{description}</p>}

      <ComputedFieldIndicator isComputing={isComputing} error={error}>
        <div
          className={`mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700 ${
            isComputing ? 'animate-pulse' : ''
          }`}
          aria-readonly="true"
          aria-busy={isComputing}
        >
          {isComputing && value === undefined ? (
            <span className="text-gray-400">Calculating...</span>
          ) : value === undefined || value === null ? (
            <span className="text-gray-400">—</span>
          ) : (
            displayValue
          )}
        </div>
      </ComputedFieldIndicator>
    </div>
  );
}

/**
 * Default value formatter for computed fields
 */
function formatDefaultValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    // Format numbers with locale
    return value.toLocaleString();
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
