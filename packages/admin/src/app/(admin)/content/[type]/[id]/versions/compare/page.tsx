/**
 * HOOPERITS CMS - Version Compare Page
 */

'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { VersionCompare } from '@/components/versioning';

export default function VersionComparePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const contentType = params.type as string;
  const contentId = params.id as string;
  const fromVersion = parseInt(searchParams.get('from') || '1', 10);
  const toVersion = parseInt(searchParams.get('to') || '2', 10);

  const handleRollback = async (versionNumber: number) => {
    const res = await fetch(
      `/api/cms/content/${contentType}/${contentId}/versions/${versionNumber}/rollback`,
      { method: 'POST' }
    );

    if (res.ok) {
      router.push(`/content/${contentType}/${contentId}`);
    }
  };

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
          <Link href={`/content/${contentType}/${contentId}/versions`} className="hover:text-gray-700">
            Versions
          </Link>
          <span>/</span>
          <span className="text-gray-900">Compare</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Compare v{fromVersion} → v{toVersion}
        </h1>
      </div>

      {/* Compare View */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        <VersionCompare
          contentId={contentId}
          contentType={contentType}
          fromVersion={fromVersion}
          toVersion={toVersion}
          onClose={() => router.push(`/content/${contentType}/${contentId}/versions`)}
          onRollback={handleRollback}
        />
      </div>
    </div>
  );
}
