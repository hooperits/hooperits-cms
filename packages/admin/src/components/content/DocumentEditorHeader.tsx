/**
 * HOOPERITS CMS - Document Editor Header
 * Client component for real-time features in document editor
 */

'use client';

import React, { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDocumentEdit } from '@hooperits/client';
import {
  PresenceAvatars,
  ConnectionStatus,
  DocumentChangedBanner,
} from '@/components/realtime';

export interface DocumentEditorHeaderProps {
  /** Document ID */
  documentId: string;
  /** Content type name */
  contentType: string;
}

/**
 * Document Editor Header with Real-time Features
 * Shows presence avatars, connection status, and change notifications
 */
export function DocumentEditorHeader({
  documentId,
  contentType,
}: DocumentEditorHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const currentUserId = session?.user?.id;

  // Track presence for this document (auto-manages join/leave)
  useDocumentEdit(documentId);

  // Handle reload when document changes
  const handleReload = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      {/* Document Changed Banner */}
      <DocumentChangedBanner
        documentId={documentId}
        currentUserId={currentUserId}
        onReload={handleReload}
        className="mb-4"
      />

      {/* Presence and Connection Status */}
      <div className="flex items-center gap-3">
        <PresenceAvatars
          documentId={documentId}
          currentUserId={currentUserId}
          size="sm"
          maxAvatars={3}
        />
        <ConnectionStatus />
      </div>
    </>
  );
}

export default DocumentEditorHeader;
