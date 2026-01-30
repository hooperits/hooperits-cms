/**
 * HOOPERITS CMS - Version Name Dialog
 * Dialog for naming and protecting versions
 */

'use client';

import { useState, useEffect } from 'react';

interface VersionSummary {
  id: string;
  versionNumber: number;
  name: string | null;
  isProtected: boolean;
}

interface Props {
  isOpen: boolean;
  version: VersionSummary | null;
  contentId: string;
  contentType: string;
  onClose: () => void;
  onSave: (name: string, isProtected: boolean) => Promise<void>;
}

export function VersionNameDialog({
  isOpen,
  version,
  contentId,
  contentType,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (version) {
      setName(version.name || '');
      setIsProtected(version.isProtected);
    }
  }, [version]);

  if (!isOpen || !version) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onSave(name.trim(), isProtected);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update version');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Name Version {version.versionNumber}
              </h3>
              <p className="text-sm text-gray-500">
                Add a name to easily identify this version
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Version Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Before redesign, Launch version"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional. Max 100 characters.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="protected"
                checked={isProtected}
                onChange={(e) => setIsProtected(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="protected" className="flex-1">
                <span className="block text-sm font-medium text-gray-700">
                  Protect this version
                </span>
                <span className="block text-xs text-gray-500">
                  Protected versions are excluded from automatic cleanup
                </span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VersionNameDialog;
