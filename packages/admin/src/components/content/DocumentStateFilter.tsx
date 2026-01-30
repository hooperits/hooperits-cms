/**
 * HOOPERITS CMS - Document State Filter
 * Dropdown component for filtering content by status
 */

'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { DocumentStatus } from '@prisma/client';

interface Props {
  currentStatus?: DocumentStatus | 'ALL';
  includeArchived?: boolean;
  className?: string;
}

interface StatusOption {
  value: DocumentStatus | 'ALL';
  label: string;
  color: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'ALL', label: 'All', color: 'bg-gray-500' },
  { value: 'DRAFT', label: 'Draft', color: 'bg-gray-400' },
  { value: 'PUBLISHED', label: 'Published', color: 'bg-green-500' },
  { value: 'SCHEDULED', label: 'Scheduled', color: 'bg-blue-500' },
  { value: 'UNPUBLISHED', label: 'Unpublished', color: 'bg-yellow-500' },
  { value: 'ARCHIVED', label: 'Archived', color: 'bg-red-500' },
];

export function DocumentStateFilter({
  currentStatus = 'ALL',
  includeArchived = false,
  className = '',
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const options = includeArchived
    ? STATUS_OPTIONS
    : STATUS_OPTIONS.filter((opt) => opt.value !== 'ARCHIVED');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', value);
    }

    // Reset page when filtering
    params.delete('page');

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
        Status:
      </label>
      <select
        id="status-filter"
        value={currentStatus}
        onChange={handleChange}
        className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DocumentStateFilterTabs({
  currentStatus = 'ALL',
  includeArchived = false,
  basePath,
}: Props & { basePath: string }) {
  const options = includeArchived
    ? STATUS_OPTIONS
    : STATUS_OPTIONS.filter((opt) => opt.value !== 'ARCHIVED');

  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      {options.map((option) => {
        const isActive = currentStatus === option.value;
        const href =
          option.value === 'ALL' ? basePath : `${basePath}?status=${option.value}`;

        return (
          <a
            key={option.value}
            href={href}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full mr-1.5 ${option.color}`}
            />
            {option.label}
          </a>
        );
      })}
    </div>
  );
}

export default DocumentStateFilter;
