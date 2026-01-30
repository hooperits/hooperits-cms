/**
 * HOOPERITS CMS - Version List Item
 * Individual version entry in history list
 */

'use client';

import { formatDistanceToNow } from 'date-fns';
import type { VersionChangeType } from '@prisma/client';

export interface VersionSummary {
  id: string;
  versionNumber: number;
  changeType: VersionChangeType;
  changeSummary: string | null;
  name: string | null;
  isProtected: boolean;
  createdBy: { id: string; name: string };
  createdAt: Date;
}

interface Props {
  version: VersionSummary;
  isSelected?: boolean;
  isCompareSource?: boolean;
  isCompareTarget?: boolean;
  onSelect?: (version: VersionSummary) => void;
  onPreview?: (version: VersionSummary) => void;
  onRollback?: (version: VersionSummary) => void;
  onName?: (version: VersionSummary) => void;
  showActions?: boolean;
}

const CHANGE_TYPE_CONFIG: Record<VersionChangeType, { label: string; color: string; bgColor: string }> = {
  MANUAL: { label: 'Manual', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  AUTO: { label: 'Auto-save', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  ROLLBACK: { label: 'Rollback', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  PUBLISH: { label: 'Publish', color: 'text-green-700', bgColor: 'bg-green-100' },
  IMPORT: { label: 'Import', color: 'text-orange-700', bgColor: 'bg-orange-100' },
};

export function VersionListItem({
  version,
  isSelected = false,
  isCompareSource = false,
  isCompareTarget = false,
  onSelect,
  onPreview,
  onRollback,
  onName,
  showActions = true,
}: Props) {
  const config = CHANGE_TYPE_CONFIG[version.changeType];
  const timeAgo = formatDistanceToNow(new Date(version.createdAt), { addSuffix: true });

  const selectionClass = isSelected
    ? 'ring-2 ring-blue-500 bg-blue-50'
    : isCompareSource
    ? 'ring-2 ring-green-500 bg-green-50'
    : isCompareTarget
    ? 'ring-2 ring-orange-500 bg-orange-50'
    : 'hover:bg-gray-50';

  return (
    <div
      className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${selectionClass}`}
      onClick={() => onSelect?.(version)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">
              v{version.versionNumber}
            </span>
            {version.name && (
              <span className="text-sm text-gray-600 truncate">
                "{version.name}"
              </span>
            )}
            {version.isProtected && (
              <span title="Protected version">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs rounded-full ${config.bgColor} ${config.color}`}>
              {config.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {version.changeSummary || 'No description'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {version.createdBy.name} • {timeAgo}
          </p>
        </div>

        {showActions && (
          <div className="flex items-center gap-1 ml-4">
            {onPreview && (
              <button
                onClick={(e) => { e.stopPropagation(); onPreview(version); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Preview"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
            {onName && (
              <button
                onClick={(e) => { e.stopPropagation(); onName(version); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Name version"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </button>
            )}
            {onRollback && (
              <button
                onClick={(e) => { e.stopPropagation(); onRollback(version); }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Rollback to this version"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {(isCompareSource || isCompareTarget) && (
        <div className="mt-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            isCompareSource ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'
          }`}>
            {isCompareSource ? 'Compare from' : 'Compare to'}
          </span>
        </div>
      )}
    </div>
  );
}

export default VersionListItem;
