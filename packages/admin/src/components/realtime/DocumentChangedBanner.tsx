/**
 * HOOPERITS CMS - Document Changed Banner
 * Shows notification when document is modified externally
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDocumentChanges } from '@hooperits/client';
import type { RealtimeEvent } from '@hooperits/client';

export interface DocumentChangedBannerProps {
  /** Document ID to monitor */
  documentId: string;
  /** Current user ID (to ignore own changes) */
  currentUserId?: string;
  /** Callback when reload is requested */
  onReload?: () => void;
  /** Auto-dismiss after milliseconds (0 = never) */
  autoDismissMs?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Format event type to human-readable text
 */
function formatEventType(type: string): string {
  const typeMap: Record<string, string> = {
    'document.updated': 'updated',
    'document.published': 'published',
    'document.unpublished': 'unpublished',
    'document.deleted': 'deleted',
  };
  return typeMap[type] || 'changed';
}

/**
 * Document Changed Banner Component
 * Displays when another user modifies the document being viewed
 */
export function DocumentChangedBanner({
  documentId,
  currentUserId,
  onReload,
  autoDismissMs = 0,
  className = '',
}: DocumentChangedBannerProps) {
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Listen for document changes
  const handleDocumentChange = useCallback(
    (event: RealtimeEvent) => {
      // Ignore own changes
      if (currentUserId && event.userId === currentUserId) {
        return;
      }

      // Ignore presence events
      if (event.type.startsWith('presence.')) {
        return;
      }

      setLastEvent(event);
      setDismissed(false);
    },
    [currentUserId]
  );

  useDocumentChanges(documentId, handleDocumentChange);

  // Auto-dismiss timer
  useEffect(() => {
    if (!lastEvent || dismissed || autoDismissMs <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setDismissed(true);
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [lastEvent, dismissed, autoDismissMs]);

  // Handle reload
  const handleReload = useCallback(() => {
    setDismissed(true);
    setLastEvent(null);
    onReload?.();
  }, [onReload]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Don't render if no event or dismissed
  if (!lastEvent || dismissed) {
    return null;
  }

  const eventAction = formatEventType(lastEvent.type);
  const isDestructive = lastEvent.type === 'document.deleted';

  return (
    <div
      className={`
        ${isDestructive ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}
        border rounded-lg p-4 mb-4
        flex items-center justify-between gap-4
        animate-in slide-in-from-top-2 duration-300
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full
            flex items-center justify-center
            ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}
          `}
        >
          {isDestructive ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        {/* Message */}
        <div>
          <p
            className={`
              font-medium
              ${isDestructive ? 'text-red-800' : 'text-yellow-800'}
            `}
          >
            {isDestructive
              ? 'This document has been deleted'
              : `This document was ${eventAction} by another user`}
          </p>
          <p
            className={`
              text-sm mt-0.5
              ${isDestructive ? 'text-red-600' : 'text-yellow-600'}
            `}
          >
            {isDestructive
              ? 'Your unsaved changes may be lost'
              : 'Reload to see the latest version'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isDestructive && onReload && (
          <button
            onClick={handleReload}
            className="px-4 py-2 text-sm font-medium text-white bg-yellow-600
                       rounded-md hover:bg-yellow-700 focus:outline-none
                       focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2
                       transition-colors"
          >
            Reload
          </button>
        )}
        <button
          onClick={handleDismiss}
          className={`
            p-2 rounded-md transition-colors
            ${
              isDestructive
                ? 'text-red-400 hover:text-red-600 hover:bg-red-100'
                : 'text-yellow-400 hover:text-yellow-600 hover:bg-yellow-100'
            }
          `}
          aria-label="Dismiss"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Compact version of the banner for inline use
 */
export function DocumentChangedNotice({
  documentId,
  currentUserId,
  onReload,
  className = '',
}: Omit<DocumentChangedBannerProps, 'autoDismissMs'>) {
  const [hasChanges, setHasChanges] = useState(false);

  const handleDocumentChange = useCallback(
    (event: RealtimeEvent) => {
      if (currentUserId && event.userId === currentUserId) {
        return;
      }
      if (event.type.startsWith('presence.')) {
        return;
      }
      setHasChanges(true);
    },
    [currentUserId]
  );

  useDocumentChanges(documentId, handleDocumentChange);

  const handleReload = useCallback(() => {
    setHasChanges(false);
    onReload?.();
  }, [onReload]);

  if (!hasChanges) {
    return null;
  }

  return (
    <button
      onClick={handleReload}
      className={`
        inline-flex items-center gap-1.5 px-2 py-1
        text-xs font-medium text-yellow-700 bg-yellow-100
        rounded-full hover:bg-yellow-200 transition-colors
        ${className}
      `}
    >
      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
      New changes available
    </button>
  );
}

export default DocumentChangedBanner;
