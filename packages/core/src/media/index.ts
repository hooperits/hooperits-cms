/**
 * HOOPERITS CMS - Media Module
 * Public API for media management
 */

// Storage
export type { StorageAdapter, UploadOptions, MediaVariant, ImageMetadata } from './storage';
export {
  getStorage,
  resetStorage,
  FilesystemStorage,
  S3Storage,
  createFilesystemStorage,
  createS3Storage,
} from './storage';

// Optimizer
export type { ImageVariantConfig, ProcessedImage } from './optimizer';
export {
  isImage,
  getImageMetadata,
  processImageVariant,
  generateImageVariants,
  getVariantConfigs,
} from './optimizer';

// Service
export type { UploadInput, Media, ListMediaOptions, ListMediaResult } from './service';
export {
  uploadMedia,
  getMediaById,
  listMedia,
  deleteMedia,
} from './service';
