/**
 * HOOPERITS CMS - Dashboard Page
 */

import { db } from '@hooperits/cms';
import Link from 'next/link';

async function getStats() {
  const [contentTypes, totalContent, publishedContent, mediaCount] = await Promise.all([
    db.contentType.findMany({
      include: {
        _count: {
          select: { contents: true },
        },
      },
    }),
    db.content.count(),
    db.content.count({ where: { status: 'PUBLISHED' } }),
    db.media.count(),
  ]);

  return {
    contentTypes,
    totalContent,
    publishedContent,
    draftContent: totalContent - publishedContent,
    mediaCount,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Content" value={stats.totalContent} />
        <StatCard title="Published" value={stats.publishedContent} color="green" />
        <StatCard title="Drafts" value={stats.draftContent} color="yellow" />
        <StatCard title="Media Files" value={stats.mediaCount} color="blue" />
      </div>

      {/* Content Types */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Types</h2>
      <div className="bg-white rounded-lg shadow">
        <ul className="divide-y divide-gray-200">
          {stats.contentTypes.map((type) => (
            <li key={type.id}>
              <Link
                href={`/content/${type.name}`}
                className="block px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{type.labelPlural}</p>
                    <p className="text-sm text-gray-500">{type.name}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {type._count.contents} items
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {stats.contentTypes.length === 0 && (
            <li className="px-6 py-8 text-center text-gray-500">
              No content types registered. Define schemas in your project.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color = 'gray',
}: {
  title: string;
  value: number;
  color?: 'gray' | 'green' | 'yellow' | 'blue';
}) {
  const colors = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}
