'use client';

/**
 * HOOPERITS CMS - Field Tooltip Component (Spec 007)
 *
 * Displays contextual help as a tooltip on hover/focus.
 * Provides additional information without cluttering the UI.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface FieldTooltipProps {
  /** Tooltip content */
  content: string;
  /** Element to attach tooltip to (usually an info icon) */
  children?: ReactNode;
  /** Position of the tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Custom trigger element (if not using default info icon) */
  trigger?: ReactNode;
  /** Delay before showing tooltip (ms) */
  delay?: number;
  /** Max width of tooltip */
  maxWidth?: number;
}

/**
 * Displays a tooltip with helpful information
 *
 * @example
 * Default info icon:
 * ```tsx
 * <FieldTooltip content="This field determines the URL path" />
 * ```
 *
 * Custom trigger:
 * ```tsx
 * <FieldTooltip
 *   content="Click to learn more"
 *   trigger={<button>Help</button>}
 * />
 * ```
 */
export function FieldTooltip({
  content,
  children,
  position = 'top',
  trigger,
  delay = 200,
  maxWidth = 256,
}: FieldTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + 8;
        break;
    }

    // Keep tooltip in viewport
    const padding = 8;
    if (left < padding) left = padding;
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = triggerRect.bottom + 8; // Flip to bottom
    if (top + tooltipRect.height > window.innerHeight - padding) {
      top = triggerRect.top - tooltipRect.height - 8; // Flip to top
    }

    setCoords({ top, left });
  }, [position]);

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition);
      window.addEventListener('resize', calculatePosition);
    }

    return () => {
      window.removeEventListener('scroll', calculatePosition);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isVisible, calculatePosition]);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleFocus = () => {
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Default info icon trigger
  const defaultTrigger = (
    <button
      type="button"
      className="inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
      aria-label="More information"
    >
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
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </button>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="inline-flex items-center"
      >
        {trigger || children || defaultTrigger}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg pointer-events-none"
          style={{
            top: coords.top,
            left: coords.left,
            maxWidth,
          }}
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top'
                ? 'bottom-[-4px] left-1/2 -translate-x-1/2'
                : position === 'bottom'
                  ? 'top-[-4px] left-1/2 -translate-x-1/2'
                  : position === 'left'
                    ? 'right-[-4px] top-1/2 -translate-y-1/2'
                    : 'left-[-4px] top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </>
  );
}

/**
 * Tooltip wrapper for field labels
 * Adds an info icon next to the label text
 */
export interface FieldLabelWithTooltipProps {
  /** Label text */
  label: string;
  /** Tooltip content */
  tooltip: string;
  /** Whether field is required */
  required?: boolean;
  /** HTML for attribute */
  htmlFor?: string;
  /** Custom class name */
  className?: string;
}

export function FieldLabelWithTooltip({
  label,
  tooltip,
  required,
  htmlFor,
  className = '',
}: FieldLabelWithTooltipProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <FieldTooltip content={tooltip} />
    </div>
  );
}
