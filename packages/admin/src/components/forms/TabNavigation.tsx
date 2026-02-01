'use client';

/**
 * HOOPERITS CMS - Tab Navigation Component (Spec 007)
 * Tab navigation for field groups with error indicators and overflow handling
 */

import { memo, useRef, useState, useEffect, useCallback } from 'react';
import type { FieldGroup } from '@hooperits/cms';

interface TabNavigationProps {
  /** Field groups to display as tabs */
  groups: FieldGroup[];
  /** Currently active tab name */
  activeTab: string;
  /** Callback when a tab is selected */
  onTabChange: (tabName: string) => void;
  /** Groups that have validation errors */
  groupsWithErrors?: string[];
}

/**
 * Tab navigation component with horizontal scrolling for overflow
 * Supports error indicators and keyboard navigation
 */
export const TabNavigation = memo(function TabNavigation({
  groups,
  activeTab,
  onTabChange,
  groupsWithErrors = [],
}: TabNavigationProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Check for overflow and update scroll indicators
  const checkOverflow = useCallback(() => {
    const container = tabsRef.current;
    if (!container) return;

    const hasOverflow = container.scrollWidth > container.clientWidth;
    const isScrolledLeft = container.scrollLeft > 0;
    const isScrolledRight =
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1;

    setShowLeftScroll(hasOverflow && isScrolledLeft);
    setShowRightScroll(hasOverflow && isScrolledRight);
  }, []);

  // Check overflow on mount and resize
  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [checkOverflow, groups.length]);

  // Handle scroll events
  const handleScroll = () => {
    checkOverflow();
  };

  // Scroll to direction
  const scrollTo = (direction: 'left' | 'right') => {
    const container = tabsRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.5;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : groups.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        newIndex = currentIndex < groups.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = groups.length - 1;
        break;
      default:
        return;
    }

    onTabChange(groups[newIndex].name);

    // Focus the new tab
    const tabButtons = tabsRef.current?.querySelectorAll('[role="tab"]');
    if (tabButtons?.[newIndex]) {
      (tabButtons[newIndex] as HTMLButtonElement).focus();
    }
  };

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="relative border-b border-gray-200">
      {/* Left scroll button */}
      {showLeftScroll && (
        <button
          type="button"
          onClick={() => scrollTo('left')}
          className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-white via-white to-transparent px-2 flex items-center"
          aria-label="Scroll tabs left"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Tabs container */}
      <div
        ref={tabsRef}
        className="flex overflow-x-auto scrollbar-hide"
        role="tablist"
        aria-label="Form sections"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {groups.map((group, index) => {
          const isActive = activeTab === group.name;
          const hasError = groupsWithErrors.includes(group.name);

          return (
            <button
              key={group.name}
              type="button"
              role="tab"
              id={`tab-${group.name}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${group.name}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(group.name)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                relative whitespace-nowrap px-4 py-3 text-sm font-medium
                border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
                ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {group.title}
              {/* Error indicator */}
              {hasError && !isActive && (
                <span
                  className="absolute top-2 right-1 w-2 h-2 bg-red-500 rounded-full"
                  aria-label="This section has validation errors"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Right scroll button */}
      {showRightScroll && (
        <button
          type="button"
          onClick={() => scrollTo('right')}
          className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-white via-white to-transparent px-2 flex items-center"
          aria-label="Scroll tabs right"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}
    </div>
  );
});

TabNavigation.displayName = 'TabNavigation';
