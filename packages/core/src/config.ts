/**
 * HOOPERITS CMS - Configuration
 * Centralized configuration loader with validation
 */

import { z } from 'zod';

const configSchema = z.object({
  // Database
  databaseUrl: z.string().url(),

  // Auth
  nextAuthSecret: z.string().min(32),
  nextAuthUrl: z.string().url(),

  // Media
  mediaStorage: z.enum(['filesystem', 's3']).default('filesystem'),
  mediaPath: z.string().default('./public/uploads'),
  mediaMaxSize: z.coerce.number().positive().default(10485760), // 10MB

  // S3 (optional)
  s3Bucket: z.string().optional(),
  s3Region: z.string().optional(),
  s3AccessKey: z.string().optional(),
  s3SecretKey: z.string().optional(),
  s3Endpoint: z.string().optional(),

  // Image optimization
  imageQuality: z.coerce.number().min(1).max(100).default(80),
  imageThumbnailWidth: z.coerce.number().positive().default(150),
  imageMediumWidth: z.coerce.number().positive().default(800),
  imageLargeWidth: z.coerce.number().positive().default(1600),

  // Cache
  cacheMaxEntries: z.coerce.number().positive().default(1000),
  cacheTtl: z.coerce.number().positive().default(60000),

  // Environment
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type CMSConfig = z.infer<typeof configSchema>;

let cachedConfig: CMSConfig | null = null;

export function loadConfig(): CMSConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const rawConfig = {
    databaseUrl: process.env.DATABASE_URL,
    nextAuthSecret: process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    mediaStorage: process.env.MEDIA_STORAGE,
    mediaPath: process.env.MEDIA_PATH,
    mediaMaxSize: process.env.MEDIA_MAX_SIZE,
    s3Bucket: process.env.S3_BUCKET,
    s3Region: process.env.S3_REGION,
    s3AccessKey: process.env.S3_ACCESS_KEY,
    s3SecretKey: process.env.S3_SECRET_KEY,
    s3Endpoint: process.env.S3_ENDPOINT,
    imageQuality: process.env.IMAGE_QUALITY,
    imageThumbnailWidth: process.env.IMAGE_THUMBNAIL_WIDTH,
    imageMediumWidth: process.env.IMAGE_MEDIUM_WIDTH,
    imageLargeWidth: process.env.IMAGE_LARGE_WIDTH,
    cacheMaxEntries: process.env.CACHE_MAX_ENTRIES,
    cacheTtl: process.env.CACHE_TTL,
    nodeEnv: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL,
  };

  const result = configSchema.safeParse(rawConfig);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw new Error(`Invalid configuration:\n${errors.join('\n')}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function getConfig(): CMSConfig {
  return loadConfig();
}

export function resetConfig(): void {
  cachedConfig = null;
}
