/**
 * HOOPERITS CMS - Content Edit Page
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getContentWithState, getContentType, getSchema } from '@hooperits/cms';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { DocumentStateIndicator } from '@/components/content/DocumentStateIndicator';
import { PublishButton } from '@/components/content/PublishButton';

interface Props {
  params: Promise<{ type: string; id: string }>;
}

export default async function ContentEditPage({ params }: Props) {
  const { type, id } = await params;

  const [contentType, content] = await Promise.all([
    getContentType(type),
    getContentWithState(id).catch(() => null),
  ]);

  if (!contentType || !content) {
    notFound();
  }

  const schema = getSchema(type);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit {contentType.label}
            </h1>
            <p className="text-sm text-gray-500">ID: {content.id}</p>
          </div>
          <div className="flex items-center gap-4">
            <DocumentStateIndicator
              status={content.status}
              hasPendingChanges={content.hasPendingChanges}
              size="lg"
            />
            <Link
              href={`/content/${type}/${id}/versions`}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </Link>
            <PublishButton
              contentId={content.id}
              contentType={type}
              status={content.status}
              hasPendingChanges={content.hasPendingChanges}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <DynamicForm
          contentTypeId={contentType.id}
          contentTypeName={type}
          schema={schema ? schema.fields : {}}
          initialData={content.data as Record<string, unknown>}
          contentId={content.id}
          initialStatus={content.status}
          initialSlug={null}
        />
      </div>
    </div>
  );
}
