/**
 * HOOPERITS CMS - Publish Button
 * Dropdown button for publish, schedule, unpublish, archive actions
 */

'use client';

import { useState } from 'react';
import type { DocumentStatus } from '@prisma/client';

interface Props {
  contentId: string;
  contentType: string;
  status: DocumentStatus;
  hasPendingChanges: boolean;
  onAction?: (action: string) => void;
  disabled?: boolean;
}

interface ActionOption {
  id: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  enabled: (status: DocumentStatus, hasPendingChanges: boolean) => boolean;
}

const ACTIONS: ActionOption[] = [
  {
    id: 'publish',
    label: 'Publish',
    description: 'Make content visible to the public',
    color: 'text-green-700',
    bgColor: 'hover:bg-green-50',
    enabled: (status) => ['DRAFT', 'SCHEDULED', 'UNPUBLISHED'].includes(status),
  },
  {
    id: 'schedule',
    label: 'Schedule',
    description: 'Schedule for future publish',
    color: 'text-blue-700',
    bgColor: 'hover:bg-blue-50',
    enabled: (status) => status === 'DRAFT',
  },
  {
    id: 'discard',
    label: 'Discard Changes',
    description: 'Revert to published version',
    color: 'text-orange-700',
    bgColor: 'hover:bg-orange-50',
    enabled: (status, hasPendingChanges) => hasPendingChanges,
  },
  {
    id: 'unpublish',
    label: 'Unpublish',
    description: 'Remove from public site',
    color: 'text-yellow-700',
    bgColor: 'hover:bg-yellow-50',
    enabled: (status) => status === 'PUBLISHED',
  },
  {
    id: 'archive',
    label: 'Archive',
    description: 'Archive content',
    color: 'text-red-700',
    bgColor: 'hover:bg-red-50',
    enabled: (status) => status === 'UNPUBLISHED',
  },
  {
    id: 'restore',
    label: 'Restore',
    description: 'Restore from archive',
    color: 'text-gray-700',
    bgColor: 'hover:bg-gray-50',
    enabled: (status) => status === 'ARCHIVED',
  },
];

export function PublishButton({
  contentId,
  contentType,
  status,
  hasPendingChanges,
  onAction,
  disabled = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const availableActions = ACTIONS.filter((action) =>
    action.enabled(status, hasPendingChanges)
  );

  const primaryAction = availableActions[0];

  const handleAction = async (actionId: string) => {
    setIsLoading(true);
    setIsOpen(false);

    try {
      const endpoint = `/api/cms/content/${contentType}/${contentId}/${actionId}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Action failed');
      }

      onAction?.(actionId);
      // Refresh the page to show updated state
      window.location.reload();
    } catch (error) {
      console.error('Publish action failed:', error);
      alert(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-block text-left">
      <div className="flex">
        {/* Primary action button */}
        <button
          type="button"
          onClick={() => primaryAction && handleAction(primaryAction.id)}
          disabled={disabled || isLoading}
          className={`px-4 py-2 text-sm font-medium rounded-l-md border
            ${primaryAction?.color || 'text-gray-700'}
            ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            bg-white border-gray-300 hover:bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          {isLoading ? 'Processing...' : primaryAction?.label || 'Actions'}
        </button>

        {/* Dropdown toggle */}
        {availableActions.length > 1 && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled || isLoading}
            className={`px-2 py-2 text-sm font-medium rounded-r-md border-t border-b border-r
              bg-white border-gray-300 hover:bg-gray-50
              ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
            <div className="py-1" role="menu">
              {availableActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className={`w-full text-left px-4 py-2 text-sm ${action.color} ${action.bgColor}`}
                  role="menuitem"
                >
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PublishButton;
