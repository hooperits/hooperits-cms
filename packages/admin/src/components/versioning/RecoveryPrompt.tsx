/**
 * HOOPERITS CMS - Recovery Prompt
 * Prompt for recovering unsaved changes after crash
 */

'use client';

import { useState } from 'react';

interface RecoverableVersion {
  versionNumber: number;
  data: Record<string, unknown>;
  createdAt: Date;
  source: 'server' | 'local';
}

interface Props {
  isOpen: boolean;
  recoverable: RecoverableVersion | null;
  currentData: Record<string, unknown>;
  onRecover: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

export function RecoveryPrompt({
  isOpen,
  recoverable,
  currentData,
  onRecover,
  onDiscard,
  onClose,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !recoverable) return null;

  const handleRecover = async () => {
    setIsLoading(true);
    try {
      onRecover();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    onDiscard();
    onClose();
  };

  const timeAgo = new Date(recoverable.createdAt).toLocaleString();
  const sourceLabel = recoverable.source === 'local'
    ? 'saved locally in your browser'
    : 'saved on the server';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Icon */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Content */}
          <div className="mt-4 text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Recover Unsaved Changes?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              We found unsaved changes from <strong>{timeAgo}</strong> that were {sourceLabel}.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Would you like to recover these changes or discard them?
            </p>
          </div>

          {/* Preview */}
          <div className="mt-4">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                Preview recovered content
              </summary>
              <pre className="mt-2 p-3 bg-gray-50 rounded-md text-xs overflow-auto max-h-48">
                {JSON.stringify(recoverable.data, null, 2)}
              </pre>
            </details>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleRecover}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Recovering...' : 'Recover'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecoveryPrompt;
