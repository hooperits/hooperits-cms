/**
 * HOOPERITS CMS - Content Edit Page
 */

import { notFound } from 'next/navigation';
import { getContentById, getContentType, getSchema } from '@hooperits/cms';
import { DynamicForm } from '@/components/forms/DynamicForm';

interface Props {
  params: Promise<{ type: string; id: string }>;
}

export default async function ContentEditPage({ params }: Props) {
  const { type, id } = await params;

  const [contentType, content] = await Promise.all([
    getContentType(type),
    getContentById(id).catch(() => null),
  ]);

  if (!contentType || !content) {
    notFound();
  }

  const schema = getSchema(type);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Edit {contentType.label}
        </h1>
        <p className="text-sm text-gray-500">ID: {content.id}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <DynamicForm
          contentTypeId={contentType.id}
          contentTypeName={type}
          schema={schema ? schema.fields : {}}
          initialData={content.data}
          contentId={content.id}
          initialStatus={content.status}
          initialSlug={content.slug}
        />
      </div>
    </div>
  );
}
