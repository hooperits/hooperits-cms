/**
 * HOOPERITS CMS - Version History
 * Main component for viewing document version history
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { VersionListItem, type VersionSummary } from './VersionListItem';
import { VersionPreview } from './VersionPreview';
import type { VersionChangeType } from '@prisma/client';

interface Props {
  contentId: string;
  contentType: string;
  onRollback?: (version: VersionSummary) => void;
  onName?: (version: VersionSummary) => void;
  onCompare?: (from: VersionSummary, to: VersionSummary) => void;
}

interface ListVersionsResult {
  items: VersionSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const CHANGE_TYPES: { value: VersionChangeType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTO', label: 'Auto-save' },
  { value: 'ROLLBACK', label: 'Rollback' },
  { value: 'PUBLISH', label: 'Publish' },
  { value: 'IMPORT', label: 'Import' },
];

export function VersionHistory({
  contentId,
  contentType,
  onRollback,
  onName,
  onCompare,
}: Props) {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [changeType, setChangeType] = useState<VersionChangeType | ''>('');
  const [searchName, setSearchName] = useState('');

  // Selection state
  const [selectedVersion, setSelectedVersion] = useState<VersionSummary | null>(null);
  const [previewVersion, setPreviewVersion] = useState<number | null>(null);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareFrom, setCompareFrom] = useState<VersionSummary | null>(null);
  const [compareTo, setCompareTo] = useState<VersionSummary | null>(null);

  const fetchVersions = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
      });
      if (changeType) params.set('changeType', changeType);

      const res = await fetch(
        `/api/cms/content/${contentType}/${contentId}/versions?${params}`
      );
      if (!res.ok) throw new Error('Failed to fetch versions');

      const data: ListVersionsResult = await res.json();

      // Filter by name on client side if search is active
      let items = data.items;
      if (searchName) {
        const search = searchName.toLowerCase();
        items = items.filter(
          (v) => v.name?.toLowerCase().includes(search) ||
                 v.changeSummary?.toLowerCase().includes(search)
        );
      }

      setVersions(items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [contentId, contentType, changeType, pagination.limit, searchName]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleVersionSelect = (version: VersionSummary) => {
    if (compareMode) {
      if (!compareFrom) {
        setCompareFrom(version);
      } else if (!compareTo && version.versionNumber !== compareFrom.versionNumber) {
        setCompareTo(version);
      } else {
        // Reset and start over
        setCompareFrom(version);
        setCompareTo(null);
      }
    } else {
      setSelectedVersion(version);
    }
  };

  const handleCompare = () => {
    if (compareFrom && compareTo && onCompare) {
      onCompare(compareFrom, compareTo);
    }
  };

  const handleExitCompareMode = () => {
    setCompareMode(false);
    setCompareFrom(null);
    setCompareTo(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
          <div className="flex items-center gap-2">
            {!compareMode ? (
              <button
                onClick={() => setCompareMode(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Compare
              </button>
            ) : (
              <>
                <button
                  onClick={handleCompare}
                  disabled={!compareFrom || !compareTo}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Compare Selected
                </button>
                <button
                  onClick={handleExitCompareMode}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or summary..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={changeType}
            onChange={(e) => setChangeType(e.target.value as VersionChangeType | '')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CHANGE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {compareMode && (
          <div className="mt-3 text-sm text-gray-600">
            {!compareFrom
              ? 'Select the first version to compare'
              : !compareTo
              ? 'Select the second version to compare'
              : `Comparing v${compareFrom.versionNumber} → v${compareTo.versionNumber}`}
          </div>
        )}
      </div>

      {/* Version List */}
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {error && (
          <div className="p-4 m-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {!isLoading && !error && versions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No versions found
          </div>
        )}

        {!isLoading && !error && versions.length > 0 && (
          <div>
            {versions.map((version) => (
              <VersionListItem
                key={version.id}
                version={version}
                isSelected={selectedVersion?.id === version.id}
                isCompareSource={compareFrom?.id === version.id}
                isCompareTarget={compareTo?.id === version.id}
                onSelect={handleVersionSelect}
                onPreview={() => setPreviewVersion(version.versionNumber)}
                onRollback={onRollback ? () => onRollback(version) : undefined}
                onName={onName ? () => onName(version) : undefined}
                showActions={!compareMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} versions)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchVersions(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => fetchVersions(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Preview Panel */}
      {previewVersion !== null && (
        <VersionPreview
          contentId={contentId}
          contentType={contentType}
          versionNumber={previewVersion}
          onClose={() => setPreviewVersion(null)}
          onRollback={onRollback ? () => {
            const version = versions.find((v) => v.versionNumber === previewVersion);
            if (version) {
              onRollback(version);
              setPreviewVersion(null);
            }
          } : undefined}
        />
      )}
    </div>
  );
}

export default VersionHistory;
