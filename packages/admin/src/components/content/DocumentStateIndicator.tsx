/**
 * HOOPERITS CMS - Document State Indicator
 * Color-coded badge component for document status display
 */

'use client';

import type { DocumentStatus } from '@prisma/client';

interface Props {
  status: DocumentStatus;
  hasPendingChanges?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  DRAFT: {
    label: 'Draft',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  PUBLISHED: {
    label: 'Published',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
  },
  SCHEDULED: {
    label: 'Scheduled',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
  UNPUBLISHED: {
    label: 'Unpublished',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
  },
  ARCHIVED: {
    label: 'Archived',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
  },
};

const SIZE_CLASSES = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function DocumentStateIndicator({
  status,
  hasPendingChanges = false,
  showLabel = true,
  size = 'md',
}: Props) {
  const config = STATUS_CONFIG[status];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center rounded border font-medium ${config.bgColor} ${config.color} ${config.borderColor} ${sizeClass}`}
      >
        {showLabel ? config.label : status}
      </span>
      {hasPendingChanges && status === 'DRAFT' && (
        <span
          className={`inline-flex items-center rounded border font-medium bg-orange-100 text-orange-700 border-orange-300 ${sizeClass}`}
        >
          Changes Pending
        </span>
      )}
    </div>
  );
}

export default DocumentStateIndicator;
