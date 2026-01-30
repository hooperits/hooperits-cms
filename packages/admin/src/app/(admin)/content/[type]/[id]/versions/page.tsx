/**
 * HOOPERITS CMS - Version History Page
 */

'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  VersionHistory,
  RollbackDialog,
  VersionNameDialog,
  type VersionSummary,
} from '@/components/versioning';

export default function VersionHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const contentType = params.type as string;
  const contentId = params.id as string;

  // Rollback state
  const [rollbackVersion, setRollbackVersion] = useState<VersionSummary | null>(null);
  const [isRollbackOpen, setIsRollbackOpen] = useState(false);

  // Name state
  const [nameVersion, setNameVersion] = useState<VersionSummary | null>(null);
  const [isNameOpen, setIsNameOpen] = useState(false);

  const handleRollback = useCallback((version: VersionSummary) => {
    setRollbackVersion(version);
    setIsRollbackOpen(true);
  }, []);

  const handleConfirmRollback = useCallback(async () => {
    if (!rollbackVersion) return;

    const res = await fetch(
      `/api/cms/content/${contentType}/${contentId}/versions/${rollbackVersion.versionNumber}/rollback`,
      { method: 'POST' }
    );

    if (!res.ok) {
      throw new Error('Failed to rollback');
    }

    // Refresh the page to show the new version
    router.refresh();
  }, [contentType, contentId, rollbackVersion, router]);

  const handleName = useCallback((version: VersionSummary) => {
    setNameVersion(version);
    setIsNameOpen(true);
  }, []);

  const handleSaveName = useCallback(async (name: string, isProtected: boolean) => {
    if (!nameVersion) return;

    const res = await fetch(
      `/api/cms/content/${contentType}/${contentId}/versions/${nameVersion.versionNumber}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, isProtected }),
      }
    );

    if (!res.ok) {
      throw new Error('Failed to update version');
    }

    router.refresh();
  }, [contentType, contentId, nameVersion, router]);

  const handleCompare = useCallback((from: VersionSummary, to: VersionSummary) => {
    router.push(
      `/content/${contentType}/${contentId}/versions/compare?from=${from.versionNumber}&to=${to.versionNumber}`
    );
  }, [contentType, contentId, router]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href={`/content/${contentType}`} className="hover:text-gray-700">
            {contentType}
          </Link>
          <span>/</span>
          <Link href={`/content/${contentType}/${contentId}`} className="hover:text-gray-700">
            Edit
          </Link>
          <span>/</span>
          <span className="text-gray-900">Versions</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Version History</h1>
      </div>

      {/* Version History */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        <VersionHistory
          contentId={contentId}
          contentType={contentType}
          onRollback={handleRollback}
          onName={handleName}
          onCompare={handleCompare}
        />
      </div>

      {/* Rollback Dialog */}
      <RollbackDialog
        isOpen={isRollbackOpen}
        version={rollbackVersion}
        contentId={contentId}
        contentType={contentType}
        onClose={() => setIsRollbackOpen(false)}
        onConfirm={handleConfirmRollback}
      />

      {/* Name Dialog */}
      <VersionNameDialog
        isOpen={isNameOpen}
        version={nameVersion}
        contentId={contentId}
        contentType={contentType}
        onClose={() => setIsNameOpen(false)}
        onSave={handleSaveName}
      />
    </div>
  );
}
