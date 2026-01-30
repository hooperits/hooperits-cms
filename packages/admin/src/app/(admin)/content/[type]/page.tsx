/**
 * HOOPERITS CMS - Content List Page
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listContentForAdmin, getContentType } from '@hooperits/cms';
import type { DocumentStatus } from '@prisma/client';
import { DocumentStateIndicator } from '@/components/content/DocumentStateIndicator';
import { DocumentStateFilterTabs } from '@/components/content/DocumentStateFilter';

interface Props {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string; status?: string; showArchived?: string }>;
}

export default async function ContentListPage({ params, searchParams }: Props) {
  const { type } = await params;
  const { page = '1', status, showArchived } = await searchParams;

  const contentType = await getContentType(type);
  if (!contentType) {
    notFound();
  }

  const includeArchived = showArchived === 'true';
  const result = await listContentForAdmin(type, {
    page: parseInt(page, 10),
    limit: 20,
    status: status as DocumentStatus | undefined,
    includeArchived,
  });

  const currentStatus = (status as DocumentStatus) || 'ALL';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{contentType.labelPlural}</h1>
        <Link
          href={`/content/${type}/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center justify-between">
        <DocumentStateFilterTabs
          currentStatus={currentStatus}
          includeArchived={includeArchived}
          basePath={`/content/${type}`}
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={() => {}}
            className="rounded border-gray-300"
          />
          <a
            href={`/content/${type}?${status ? `status=${status}&` : ''}showArchived=${!includeArchived}`}
            className="hover:text-gray-900"
          >
            Show Archived
          </a>
        </label>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {result.items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                  {item.id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.slug || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <DocumentStateIndicator status={item.status} size="sm" />
                    {item.hasPendingChanges && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        Changes pending
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Link
                    href={`/content/${type}/${item.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No content found.{' '}
                  <Link href={`/content/${type}/new`} className="text-blue-600 hover:underline">
                    Create your first {contentType.label.toLowerCase()}
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result.pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: result.pagination.totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <Link
                key={pageNum}
                href={`/content/${type}?page=${pageNum}${status ? `&status=${status}` : ''}${includeArchived ? '&showArchived=true' : ''}`}
                className={`px-3 py-1 rounded ${
                  pageNum === result.pagination.page
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
