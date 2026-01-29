'use client';

/**
 * HOOPERITS CMS - Media Gallery Component
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Media } from '@hooperits/cms';

interface MediaGalleryProps {
  items: Media[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onSelect?: (media: Media) => void;
  selectable?: boolean;
}

export function MediaGallery({ items, pagination, onSelect, selectable }: MediaGalleryProps) {
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string, filename: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    const response = await fetch(`/api/cms/media/${deleteConfirm}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      router.refresh();
    }
    setIsDeleting(false);
    setDeleteConfirm(null);
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  const getAltText = (item: Media) => {
    if (isImage(item.mimeType)) {
      return `Image: ${item.filename}`;
    }
    return `File: ${item.filename}`;
  };

  return (
    <div>
      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h2 id="delete-dialog-title" className="text-lg font-semibold mb-2">
              Delete file?
            </h2>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. The file will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" role="list">
        {items.map((item) => (
          <div
            key={item.id}
            role="listitem"
            className={`bg-white rounded-lg shadow overflow-hidden ${
              selectable ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 focus-within:ring-2 focus-within:ring-blue-500' : ''
            }`}
            onClick={() => selectable && onSelect?.(item)}
            onKeyDown={(e) => {
              if (selectable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelect?.(item);
              }
            }}
            tabIndex={selectable ? 0 : undefined}
          >
            <div className="aspect-square relative bg-gray-100">
              {isImage(item.mimeType) ? (
                <Image
                  src={item.variants?.thumbnail?.url || item.url}
                  alt={getAltText(item)}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="sr-only">{getAltText(item)}</span>
                </div>
              )}
            </div>

            <div className="p-2">
              <p className="text-xs text-gray-600 truncate" title={item.filename}>
                {item.filename}
              </p>
              <p className="text-xs text-gray-400">
                {(item.size / 1024).toFixed(1)} KB
              </p>
              {!selectable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id, item.filename);
                  }}
                  className="mt-1 text-xs text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                  aria-label={`Delete ${item.filename}`}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No media files uploaded yet.
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <nav className="mt-6 flex justify-center items-center gap-2" aria-label="Media pagination">
          {pagination.page > 1 && (
            <Link
              href={`/media?page=${pagination.page - 1}`}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Previous page"
            >
              ←
            </Link>
          )}
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <Link
                key={pageNum}
                href={`/media?page=${pageNum}`}
                className={`px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  pageNum === pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                aria-label={`Page ${pageNum}`}
                aria-current={pageNum === pagination.page ? 'page' : undefined}
              >
                {pageNum}
              </Link>
            )
          )}
          {pagination.page < pagination.totalPages && (
            <Link
              href={`/media?page=${pagination.page + 1}`}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Next page"
            >
              →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
