/**
 * HOOPERITS CMS - Version Compare
 * Side-by-side version comparison view
 */

'use client';

import { useState, useEffect } from 'react';
import { VersionDiff } from './VersionDiff';

interface VersionSummary {
  id: string;
  versionNumber: number;
  changeType: string;
  changeSummary: string | null;
  name: string | null;
  createdBy: { id: string; name: string };
  createdAt: Date;
}

interface CompareResult {
  from: VersionSummary;
  to: VersionSummary;
  diff: {
    changes: Array<{
      kind: 'added' | 'deleted' | 'modified' | 'array';
      path: string[];
      field: string;
      oldValue?: unknown;
      newValue?: unknown;
      items?: Array<{
        kind: 'added' | 'deleted' | 'modified';
        index: number;
        oldValue?: unknown;
        newValue?: unknown;
      }>;
    }>;
    textDiffs: Record<string, Array<{
      type: 'equal' | 'insert' | 'delete';
      text: string;
    }>>;
    summary: {
      added: number;
      deleted: number;
      modified: number;
      unchanged: number;
    };
  };
}

interface Props {
  contentId: string;
  contentType: string;
  fromVersion: number;
  toVersion: number;
  onClose?: () => void;
  onRollback?: (versionNumber: number) => void;
}

export function VersionCompare({
  contentId,
  contentType,
  fromVersion,
  toVersion,
  onClose,
  onRollback,
}: Props) {
  const [result, setResult] = useState<CompareResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComparison() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          from: String(fromVersion),
          to: String(toVersion),
        });
        const res = await fetch(
          `/api/cms/content/${contentType}/${contentId}/versions/compare?${params}`
        );
        if (!res.ok) throw new Error('Failed to compare versions');
        const data: CompareResult = await res.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchComparison();
  }, [contentId, contentType, fromVersion, toVersion]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          Compare Versions
        </h2>
        <div className="flex items-center gap-2">
          {onRollback && result && (
            <button
              onClick={() => onRollback(fromVersion)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
            >
              Rollback to v{fromVersion}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
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

        {result && (
          <VersionDiff
            diff={result.diff}
            fromVersion={result.from.versionNumber}
            toVersion={result.to.versionNumber}
          />
        )}
      </div>
    </div>
  );
}

export default VersionCompare;
