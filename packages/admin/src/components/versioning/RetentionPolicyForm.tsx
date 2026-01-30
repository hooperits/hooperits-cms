/**
 * HOOPERITS CMS - Retention Policy Form
 * Form for configuring version retention policies
 */

'use client';

import { useState } from 'react';

interface RetentionPolicy {
  id: string;
  contentTypeId: string;
  maxVersions: number | null;
  maxAgeDays: number | null;
  keepNamedVersions: boolean;
  keepPublishVersions: boolean;
  cleanupSchedule: string;
  lastCleanupAt: Date | null;
  updatedBy: { name: string } | null;
  updatedAt: Date;
}

interface Props {
  policy: RetentionPolicy;
  contentTypeName: string;
  onSave: (policy: Partial<RetentionPolicy>) => Promise<void>;
  onCancel?: () => void;
}

export function RetentionPolicyForm({
  policy,
  contentTypeName,
  onSave,
  onCancel,
}: Props) {
  const [maxVersions, setMaxVersions] = useState<string>(
    policy.maxVersions?.toString() || ''
  );
  const [maxAgeDays, setMaxAgeDays] = useState<string>(
    policy.maxAgeDays?.toString() || ''
  );
  const [keepNamedVersions, setKeepNamedVersions] = useState(policy.keepNamedVersions);
  const [keepPublishVersions, setKeepPublishVersions] = useState(policy.keepPublishVersions);
  const [cleanupSchedule, setCleanupSchedule] = useState(policy.cleanupSchedule);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onSave({
        maxVersions: maxVersions ? parseInt(maxVersions, 10) : null,
        maxAgeDays: maxAgeDays ? parseInt(maxAgeDays, 10) : null,
        keepNamedVersions,
        keepPublishVersions,
        cleanupSchedule,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save policy');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Retention Policy for {contentTypeName}
        </h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Max Versions */}
          <div>
            <label htmlFor="maxVersions" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Versions
            </label>
            <input
              type="number"
              id="maxVersions"
              value={maxVersions}
              onChange={(e) => setMaxVersions(e.target.value)}
              placeholder="Unlimited"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Keep only the N most recent versions. Leave empty for unlimited.
            </p>
          </div>

          {/* Max Age */}
          <div>
            <label htmlFor="maxAgeDays" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Age (days)
            </label>
            <input
              type="number"
              id="maxAgeDays"
              value={maxAgeDays}
              onChange={(e) => setMaxAgeDays(e.target.value)}
              placeholder="Forever"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Delete versions older than N days. Leave empty for no limit.
            </p>
          </div>
        </div>

        {/* Cleanup Schedule */}
        <div className="mt-6">
          <label htmlFor="cleanupSchedule" className="block text-sm font-medium text-gray-700 mb-1">
            Cleanup Schedule
          </label>
          <select
            id="cleanupSchedule"
            value={cleanupSchedule}
            onChange={(e) => setCleanupSchedule(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="0 0 * * *">Daily at midnight</option>
            <option value="0 0 * * 0">Weekly on Sunday</option>
            <option value="0 0 1 * *">Monthly on the 1st</option>
            <option value="manual">Manual only</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            When to automatically clean up old versions based on the policy.
          </p>
        </div>

        {/* Protection Settings */}
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Protection Settings</h4>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="keepNamedVersions"
              checked={keepNamedVersions}
              onChange={(e) => setKeepNamedVersions(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="keepNamedVersions" className="flex-1">
              <span className="block text-sm font-medium text-gray-700">
                Keep named versions
              </span>
              <span className="block text-xs text-gray-500">
                Versions with a name will not be deleted by the cleanup policy
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="keepPublishVersions"
              checked={keepPublishVersions}
              onChange={(e) => setKeepPublishVersions(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="keepPublishVersions" className="flex-1">
              <span className="block text-sm font-medium text-gray-700">
                Keep publish versions
              </span>
              <span className="block text-xs text-gray-500">
                Versions created during publish events will not be deleted
              </span>
            </label>
          </div>
        </div>

        {/* Last Cleanup Info */}
        {policy.lastCleanupAt && (
          <div className="mt-6 p-3 bg-gray-50 rounded-md text-sm">
            <span className="text-gray-500">Last cleanup:</span>{' '}
            <span className="text-gray-900">
              {new Date(policy.lastCleanupAt).toLocaleString()}
            </span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Policy'}
        </button>
      </div>
    </form>
  );
}

export default RetentionPolicyForm;
