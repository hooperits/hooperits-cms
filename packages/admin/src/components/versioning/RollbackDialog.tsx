/**
 * HOOPERITS CMS - Rollback Dialog
 * Confirmation dialog for version rollback with preview
 */

'use client';

import { useState, useEffect } from 'react';

interface VersionSummary {
  id: string;
  versionNumber: number;
  changeType: string;
  changeSummary: string | null;
  name: string | null;
  createdBy: { id: string; name: string };
  createdAt: Date;
}

interface Props {
  isOpen: boolean;
  version: VersionSummary | null;
  contentId: string;
  contentType: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function RollbackDialog({
  isOpen,
  version,
  contentId,
  contentType,
  onClose,
  onConfirm,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (isOpen && version) {
      setIsLoadingPreview(true);
      fetch(`/api/cms/content/${contentType}/${contentId}/versions/${version.versionNumber}`)
        .then((res) => res.json())
        .then((data) => setPreviewData(data.data))
        .catch(() => setPreviewData(null))
        .finally(() => setIsLoadingPreview(false));
    }
  }, [isOpen, version, contentId, contentType]);

  if (!isOpen || !version) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Failed to rollback:', error);
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Rollback to Version {version.versionNumber}
                </h3>
                <p className="text-sm text-gray-500">
                  {version.name || version.changeSummary || 'No description'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="space-y-4">
              {/* Version Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Version Details</h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-gray-500">Created by</dt>
                  <dd className="text-gray-900">{version.createdBy.name}</dd>
                  <dt className="text-gray-500">Date</dt>
                  <dd className="text-gray-900">
                    {new Date(version.createdAt).toLocaleString()}
                  </dd>
                  <dt className="text-gray-500">Type</dt>
                  <dd className="text-gray-900">{version.changeType}</dd>
                </dl>
              </div>

              {/* Preview */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Content Preview</h4>
                {isLoadingPreview ? (
                  <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                ) : previewData ? (
                  <pre className="p-3 bg-gray-50 rounded-lg text-xs overflow-auto max-h-48">
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
                    Unable to load preview
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">This action will:</p>
                  <ul className="mt-1 text-yellow-700 list-disc list-inside">
                    <li>Save the current content as a new version</li>
                    <li>Restore the document to version {version.versionNumber}</li>
                    <li>Create a new "ROLLBACK" entry in the version history</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Rolling back...' : 'Confirm Rollback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RollbackDialog;
