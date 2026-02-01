'use client';

/**
 * HOOPERITS CMS - Collapsible Group Component (Spec 007)
 * Accordion-style collapsible group for field organization
 */

import { memo, useState, type ReactNode } from 'react';
import type { FieldGroup } from '@hooperits/cms';

interface CollapsibleGroupProps {
  /** Group definition */
  group: FieldGroup;
  /** Whether the group is initially collapsed */
  defaultCollapsed?: boolean;
  /** Whether this group has validation errors */
  hasError?: boolean;
  /** Child fields to render */
  children: ReactNode;
  /** Callback when collapsed state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
}

/**
 * Collapsible group component for accordion layout
 */
export const CollapsibleGroup = memo(function CollapsibleGroup({
  group,
  defaultCollapsed,
  hasError = false,
  children,
  onCollapsedChange,
}: CollapsibleGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(
    defaultCollapsed ?? group.collapsed ?? false
  );

  const canCollapse = group.collapsible ?? false;

  const toggleCollapsed = () => {
    if (!canCollapse) return;

    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapsedChange?.(newState);
  };

  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden"
      data-group={group.name}
    >
      {/* Header */}
      <div
        className={`
          flex items-center justify-between px-4 py-3 bg-gray-50
          ${canCollapse ? 'cursor-pointer hover:bg-gray-100' : ''}
          ${hasError ? 'border-l-4 border-l-red-500' : ''}
        `}
        onClick={canCollapse ? toggleCollapsed : undefined}
        onKeyDown={
          canCollapse
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleCollapsed();
                }
              }
            : undefined
        }
        role={canCollapse ? 'button' : undefined}
        tabIndex={canCollapse ? 0 : undefined}
        aria-expanded={canCollapse ? !isCollapsed : undefined}
        aria-controls={`group-content-${group.name}`}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">{group.title}</h3>
          {hasError && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              Errors
            </span>
          )}
        </div>

        {canCollapse && (
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isCollapsed ? '' : 'rotate-180'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </div>

      {/* Description */}
      {group.description && !isCollapsed && (
        <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border-t border-gray-100">
          {group.description}
        </div>
      )}

      {/* Content */}
      <div
        id={`group-content-${group.name}`}
        className={`
          transition-all duration-200 ease-in-out overflow-hidden
          ${isCollapsed ? 'max-h-0' : 'max-h-[5000px]'}
        `}
        aria-hidden={isCollapsed}
      >
        <div className="p-4 space-y-4">{children}</div>
      </div>
    </div>
  );
});

CollapsibleGroup.displayName = 'CollapsibleGroup';
