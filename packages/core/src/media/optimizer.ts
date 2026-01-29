/**
 * HOOPERITS CMS - Image Optimizer
 * Process and optimize images using Sharp
 */

import sharp from 'sharp';
import type { ImageMetadata, MediaVariant } from './storage/types';

export interface ImageVariantConfig {
  name: string;
  width: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

const DEFAULT_VARIANTS: ImageVariantConfig[] = [
  { name: 'thumbnail', width: 150, height: 150, fit: 'cover' },
  { name: 'medium', width: 800 },
  { name: 'large', width: 1600 },
];

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  const metadata = await sharp(buffer).metadata();

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
  };
}

/**
 * Check if a file is an image based on MIME type
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Allowed MIME types for uploads
 */
const ALLOWED_MIME_TYPES = new Map<string, string[]>([
  ['image/jpeg', ['\xFF\xD8\xFF']],
  ['image/png', ['\x89PNG\r\n\x1a\n']],
  ['image/gif', ['GIF87a', 'GIF89a']],
  ['image/webp', ['RIFF', 'WEBP']],
  ['image/svg+xml', ['<svg', '<?xml']],
  ['application/pdf', ['%PDF']],
]);

/**
 * Validate file type using magic bytes (file signature)
 * Returns the detected MIME type or null if invalid
 */
export function validateFileType(buffer: Buffer, declaredMimeType: string): string | null {
  const header = buffer.subarray(0, 16).toString('binary');

  // Check if declared MIME type is allowed
  const signatures = ALLOWED_MIME_TYPES.get(declaredMimeType);
  if (!signatures) {
    return null;
  }

  // For SVG, check text content (first bytes might be whitespace)
  if (declaredMimeType === 'image/svg+xml') {
    const textContent = buffer.subarray(0, 256).toString('utf8').trim().toLowerCase();
    if (textContent.startsWith('<svg') || textContent.startsWith('<?xml')) {
      return declaredMimeType;
    }
    return null;
  }

  // For WebP, need to check RIFF header and WEBP marker
  if (declaredMimeType === 'image/webp') {
    if (header.startsWith('RIFF') && buffer.subarray(8, 12).toString('binary') === 'WEBP') {
      return declaredMimeType;
    }
    return null;
  }

  // Check magic bytes for other types
  for (const sig of signatures) {
    if (header.startsWith(sig)) {
      return declaredMimeType;
    }
  }

  return null;
}

/**
 * Check if MIME type is allowed for upload
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

/**
 * Process an image into a specific variant
 */
export async function processImageVariant(
  buffer: Buffer,
  config: ImageVariantConfig,
  quality?: number
): Promise<ProcessedImage> {
  const imageQuality = quality || parseInt(process.env.IMAGE_QUALITY || '80', 10);

  let pipeline = sharp(buffer);

  // Resize
  pipeline = pipeline.resize({
    width: config.width,
    height: config.height,
    fit: config.fit || 'inside',
    withoutEnlargement: true,
  });

  // Convert to WebP for optimization
  pipeline = pipeline.webp({ quality: imageQuality });

  const processedBuffer = await pipeline.toBuffer();
  const metadata = await sharp(processedBuffer).metadata();

  return {
    buffer: processedBuffer,
    width: metadata.width || config.width,
    height: metadata.height || 0,
    format: 'webp',
  };
}

/**
 * Generate all image variants
 */
export async function generateImageVariants(
  buffer: Buffer,
  baseFilename: string,
  variants: ImageVariantConfig[] = DEFAULT_VARIANTS
): Promise<Map<string, { buffer: Buffer; metadata: Omit<ProcessedImage, 'buffer'> }>> {
  const results = new Map<string, { buffer: Buffer; metadata: Omit<ProcessedImage, 'buffer'> }>();

  for (const variant of variants) {
    const processed = await processImageVariant(buffer, variant);
    const filename = `${baseFilename}-${variant.name}.webp`;

    results.set(variant.name, {
      buffer: processed.buffer,
      metadata: {
        width: processed.width,
        height: processed.height,
        format: processed.format,
      },
    });
  }

  return results;
}

/**
 * Get variant configurations from environment
 */
export function getVariantConfigs(): ImageVariantConfig[] {
  const thumbnail = parseInt(process.env.IMAGE_THUMBNAIL_WIDTH || '150', 10);
  const medium = parseInt(process.env.IMAGE_MEDIUM_WIDTH || '800', 10);
  const large = parseInt(process.env.IMAGE_LARGE_WIDTH || '1600', 10);

  return [
    { name: 'thumbnail', width: thumbnail, height: thumbnail, fit: 'cover' },
    { name: 'medium', width: medium },
    { name: 'large', width: large },
  ];
}
