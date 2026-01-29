/**
 * HOOPERITS CMS - Create Content Page
 */

import { notFound } from 'next/navigation';
import { getContentType, getSchema } from '@hooperits/cms';
import { DynamicForm } from '@/components/forms/DynamicForm';

interface Props {
  params: Promise<{ type: string }>;
}

export default async function NewContentPage({ params }: Props) {
  const { type } = await params;

  const contentType = await getContentType(type);
  if (!contentType) {
    notFound();
  }

  const schema = getSchema(type);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Create {contentType.label}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <DynamicForm
          contentTypeId={contentType.id}
          contentTypeName={type}
          schema={schema ? schema.fields : {}}
          initialData={{}}
        />
      </div>
    </div>
  );
}
