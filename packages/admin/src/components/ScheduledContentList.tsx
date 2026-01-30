/**
 * HOOPERITS CMS - Scheduled Content List
 * Dashboard component showing upcoming scheduled publications
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ScheduledItem {
  id: string;
  type: { name: string; label: string };
  slug: string | null;
  data: Record<string, unknown>;
  scheduledAt: string;
}

interface Props {
  limit?: number;
  className?: string;
}

export function ScheduledContentList({ limit = 5, className = '' }: Props) {
  const [items, setItems] = useState<ScheduledItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScheduled = async () => {
      try {
        const response = await fetch(`/api/cms/scheduled?limit=${limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch scheduled content');
        }
        const { data } = await response.json();
        setItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };

    fetchScheduled();
  }, [limit]);

  const getTitle = (item: ScheduledItem): string => {
    // Try common title fields
    const data = item.data as Record<string, unknown>;
    return (
      (data.title as string) ||
      (data.name as string) ||
      (data.heading as string) ||
      item.slug ||
      item.id.slice(0, 8)
    );
  };

  const formatScheduledTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    // Relative time
    let relative: string;
    if (diffDays > 0) {
      relative = `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      relative = `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      relative = diffMinutes > 0 ? `in ${diffMinutes} min` : 'soon';
    }

    // Absolute time
    const absolute = date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return { relative, absolute };
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Scheduled Publications
        </h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Scheduled Publications
        </h3>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Scheduled Publications
        </h3>
        <span className="text-sm text-gray-500">
          {items.length} upcoming
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No scheduled publications
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const { relative, absolute } = formatScheduledTime(item.scheduledAt);
            return (
              <li
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/content/${item.type.name}/${item.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                  >
                    {getTitle(item)}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {item.type.label}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {relative}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {absolute}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <Link
            href="/scheduled"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all scheduled content
          </Link>
        </div>
      )}
    </div>
  );
}

export default ScheduledContentList;
