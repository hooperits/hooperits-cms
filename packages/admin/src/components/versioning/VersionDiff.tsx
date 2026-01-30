/**
 * HOOPERITS CMS - Version Diff
 * Main diff renderer component
 */

'use client';

import { DiffFieldChange } from './DiffFieldChange';
import { InlineTextDiff } from './InlineTextDiff';

interface DiffChange {
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
}

interface TextDiffSegment {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

interface DiffSummary {
  added: number;
  deleted: number;
  modified: number;
  unchanged: number;
}

interface VersionDiffData {
  changes: DiffChange[];
  textDiffs: Record<string, TextDiffSegment[]>;
  summary: DiffSummary;
}

interface Props {
  diff: VersionDiffData;
  fromVersion: number;
  toVersion: number;
}

export function VersionDiff({ diff, fromVersion, toVersion }: Props) {
  const { changes, textDiffs, summary } = diff;

  const hasChanges = changes.length > 0 || Object.keys(textDiffs).length > 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Comparing</span>
          <span className="font-semibold text-gray-900">v{fromVersion}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span className="font-semibold text-gray-900">v{toVersion}</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-600">{summary.added} added</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500" />
            <span className="text-gray-600">{summary.deleted} deleted</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-gray-600">{summary.modified} modified</span>
          </span>
        </div>
      </div>

      {!hasChanges && (
        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">No differences</p>
          <p className="text-sm">These versions have identical content</p>
        </div>
      )}

      {/* Field Changes */}
      {changes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            Field Changes
          </h3>
          {changes.map((change, idx) => (
            <DiffFieldChange key={idx} change={change} />
          ))}
        </div>
      )}

      {/* Text Diffs */}
      {Object.keys(textDiffs).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            Text Changes
          </h3>
          {Object.entries(textDiffs).map(([field, segments]) => (
            <div key={field} className="border rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-gray-100 border-b">
                <code className="text-sm font-medium text-gray-900">{field}</code>
              </div>
              <InlineTextDiff segments={segments} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VersionDiff;
