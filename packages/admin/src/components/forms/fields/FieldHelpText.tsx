'use client';

/**
 * HOOPERITS CMS - Field Help Text Component (Spec 007)
 *
 * Displays helpful text below form fields to guide users.
 * Supports static text and dynamic text based on document state.
 */

import type { ReactNode } from 'react';
import type { DocumentContext } from '@hooperits/cms';

export interface FieldHelpTextProps {
  /** Static help text string or function for dynamic text */
  helpText?: string | ((doc: DocumentContext) => string);
  /** Current document data for dynamic text evaluation */
  documentData?: DocumentContext;
  /** Custom CSS class */
  className?: string;
  /** Children to render instead of helpText */
  children?: ReactNode;
}

/**
 * Displays help text for a form field
 *
 * @example
 * Static text:
 * ```tsx
 * <FieldHelpText helpText="Enter a unique slug for the URL" />
 * ```
 *
 * Dynamic text:
 * ```tsx
 * <FieldHelpText
 *   helpText={(doc) => doc.type === 'premium' ? 'Premium pricing applies' : 'Standard pricing'}
 *   documentData={formData}
 * />
 * ```
 */
export function FieldHelpText({
  helpText,
  documentData = {},
  className = '',
  children,
}: FieldHelpTextProps) {
  // If children are provided, render them
  if (children) {
    return (
      <p className={`mt-1 text-sm text-gray-500 ${className}`}>{children}</p>
    );
  }

  // No help text
  if (!helpText) {
    return null;
  }

  // Evaluate dynamic help text
  let displayText: string;
  if (typeof helpText === 'function') {
    try {
      displayText = helpText(documentData);
    } catch (error) {
      console.error('Error evaluating dynamic help text:', error);
      return null;
    }
  } else {
    displayText = helpText;
  }

  if (!displayText) {
    return null;
  }

  return (
    <p className={`mt-1 text-sm text-gray-500 ${className}`}>{displayText}</p>
  );
}

/**
 * Inline help text variant for more compact display
 */
export function FieldHelpTextInline({
  helpText,
  documentData = {},
  className = '',
}: Omit<FieldHelpTextProps, 'children'>) {
  if (!helpText) {
    return null;
  }

  let displayText: string;
  if (typeof helpText === 'function') {
    try {
      displayText = helpText(documentData);
    } catch {
      return null;
    }
  } else {
    displayText = helpText;
  }

  if (!displayText) {
    return null;
  }

  return (
    <span
      className={`text-xs text-gray-400 ml-2 ${className}`}
      aria-label="Help"
    >
      ({displayText})
    </span>
  );
}
