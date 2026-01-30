/**
 * HOOPERITS CMS - Version Preview
 * Quick preview panel for version data
 */

'use client';

import { useState, useEffect } from 'react';
import type { VersionChangeType } from '@prisma/client';

interface Version {
  id: string;
  versionNumber: number;
  data: Record<string, unknown>;
  changeType: VersionChangeType;
  changeSummary: string | null;
  name: string | null;
  isProtected: boolean;
  createdBy: { id: string; name: string };
  createdAt: Date;
  size: number;
}

interface Props {
  contentId: string;
  contentType: string;
  versionNumber: number;
  onClose: () => void;
  onRollback?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VersionPreview({
  contentId,
  contentType,
  versionNumber,
  onClose,
  onRollback,
}: Props) {
  const [version, setVersion] = useState<Version | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVersion() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/cms/content/${contentType}/${contentId}/versions/${versionNumber}`
        );
        if (!res.ok) throw new Error('Failed to fetch version');
        const data = await res.json();
        setVersion(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchVersion();
  }, [contentId, contentType, versionNumber]);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          Version {versionNumber}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {version && (
          <div className="space-y-4">
            {/* Metadata */}
            <div className="space-y-2 text-sm">
              {version.name && (
                <div>
                  <span className="text-gray-500">Name:</span>{' '}
                  <span className="font-medium">{version.name}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Author:</span>{' '}
                <span className="font-medium">{version.createdBy.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>{' '}
                <span className="font-medium">
                  {new Date(version.createdAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>{' '}
                <span className="font-medium">{version.changeType}</span>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>{' '}
                <span className="font-medium">{formatBytes(version.size)}</span>
              </div>
              {version.changeSummary && (
                <div>
                  <span className="text-gray-500">Summary:</span>{' '}
                  <span className="font-medium">{version.changeSummary}</span>
                </div>
              )}
            </div>

            {/* Data Preview */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Data</h4>
              <pre className="p-3 bg-gray-50 rounded-md text-xs overflow-auto max-h-96">
                {JSON.stringify(version.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {version && onRollback && (
        <div className="p-4 border-t">
          <button
            onClick={onRollback}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Rollback to this version
          </button>
        </div>
      )}
    </div>
  );
}

export default VersionPreview;
