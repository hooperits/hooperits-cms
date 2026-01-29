/**
 * HOOPERITS CMS - Media Gallery Page
 */

import { listMedia } from '@hooperits/cms';
import { MediaGallery } from '@/components/media/MediaGallery';
import { MediaUploader } from '@/components/media/MediaUploader';

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function MediaPage({ searchParams }: Props) {
  const { page = '1' } = await searchParams;

  const result = await listMedia({
    page: parseInt(page, 10),
    limit: 24,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
        <MediaUploader />
      </div>

      <MediaGallery items={result.items} pagination={result.pagination} />
    </div>
  );
}
