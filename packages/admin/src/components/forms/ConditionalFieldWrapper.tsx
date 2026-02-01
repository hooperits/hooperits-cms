'use client';

/**
 * HOOPERITS CMS - Conditional Field Wrapper (Spec 007)
 * Wraps form fields to handle conditional visibility
 */

import { memo, type ReactNode } from 'react';

interface ConditionalFieldWrapperProps {
  /** Unique field name */
  fieldName: string;
  /** Whether the field is hidden */
  isHidden: boolean;
  /** The field component to render */
  children: ReactNode;
  /** Optional animation on show/hide */
  animate?: boolean;
}

/**
 * Wrapper component for conditional field visibility
 * Handles show/hide transitions and maintains DOM presence for animations
 */
export const ConditionalFieldWrapper = memo(function ConditionalFieldWrapper({
  fieldName,
  isHidden,
  children,
  animate = true,
}: ConditionalFieldWrapperProps) {
  // If hidden without animation, don't render at all
  if (isHidden && !animate) {
    return null;
  }

  // With animation, render with visibility classes
  if (isHidden) {
    return (
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out max-h-0 opacity-0"
        aria-hidden="true"
        data-field={fieldName}
        data-visibility="hidden"
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={
        animate
          ? 'transition-all duration-200 ease-in-out max-h-[1000px] opacity-100'
          : ''
      }
      data-field={fieldName}
      data-visibility="visible"
    >
      {children}
    </div>
  );
});

ConditionalFieldWrapper.displayName = 'ConditionalFieldWrapper';
