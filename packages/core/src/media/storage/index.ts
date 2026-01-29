/**
 * HOOPERITS CMS - Storage Factory
 */

export type { StorageAdapter, UploadOptions, MediaVariant, ImageMetadata } from './types';
export { FilesystemStorage, createFilesystemStorage } from './filesystem';
export { S3Storage, createS3Storage } from './s3';

import type { StorageAdapter } from './types';
import { createFilesystemStorage } from './filesystem';
import { createS3Storage } from './s3';

let storageInstance: StorageAdapter | null = null;

/**
 * Get the configured storage adapter
 */
export function getStorage(): StorageAdapter {
  if (storageInstance) {
    return storageInstance;
  }

  const storageType = process.env.MEDIA_STORAGE || 'filesystem';

  if (storageType === 's3') {
    storageInstance = createS3Storage();
  } else {
    storageInstance = createFilesystemStorage();
  }

  return storageInstance;
}

/**
 * Reset storage instance (for testing)
 */
export function resetStorage(): void {
  storageInstance = null;
}
