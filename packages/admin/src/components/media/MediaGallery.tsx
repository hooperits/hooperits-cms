'use client';

/**
 * HOOPERITS CMS - Media Gallery Component
 */

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    const response = await fetch(`/api/cms/media/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      router.refresh();
    }
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-lg shadow overflow-hidden ${
              selectable ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : ''
            }`}
            onClick={() => selectable && onSelect?.(item)}
          >
            <div className="aspect-square relative bg-gray-100">
              {isImage(item.mimeType) ? (
                <Image
                  src={item.variants?.thumbnail?.url || item.url}
                  alt={item.filename}
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
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
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
                    handleDelete(item.id);
                  }}
                  className="mt-1 text-xs text-red-600 hover:text-red-800"
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
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <Link
                key={pageNum}
                href={`/media?page=${pageNum}`}
                className={`px-3 py-1 rounded ${
                  pageNum === pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {pageNum}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
