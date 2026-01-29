/**
 * HOOPERITS CMS - S3 Storage Adapter
 * Supports AWS S3 and S3-compatible services (MinIO, etc.)
 */

import type { StorageAdapter } from './types';

interface S3Config {
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
  endpoint?: string;
}

export class S3Storage implements StorageAdapter {
  private config: S3Config;
  private baseUrl: string;

  constructor(config: S3Config) {
    this.config = config;

    // Build base URL
    if (config.endpoint) {
      this.baseUrl = `${config.endpoint}/${config.bucket}`;
    } else {
      this.baseUrl = `https://${config.bucket}.s3.${config.region}.amazonaws.com`;
    }
  }

  async upload(file: Buffer, filePath: string): Promise<string> {
    // Dynamically import AWS SDK to avoid bundling when not used
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
      ...(this.config.endpoint && {
        endpoint: this.config.endpoint,
        forcePathStyle: true,
      }),
    });

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: filePath,
      Body: file,
      ACL: 'public-read',
    });

    await client.send(command);

    return this.getUrl(filePath);
  }

  async delete(filePath: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
      ...(this.config.endpoint && {
        endpoint: this.config.endpoint,
        forcePathStyle: true,
      }),
    });

    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: filePath,
    });

    await client.send(command);
  }

  getUrl(filePath: string): string {
    return `${this.baseUrl}/${filePath}`;
  }

  async exists(filePath: string): Promise<boolean> {
    const { S3Client, HeadObjectCommand } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
      ...(this.config.endpoint && {
        endpoint: this.config.endpoint,
        forcePathStyle: true,
      }),
    });

    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: filePath,
      });
      await client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}

export function createS3Storage(): S3Storage {
  const config: S3Config = {
    bucket: process.env.S3_BUCKET!,
    region: process.env.S3_REGION!,
    accessKey: process.env.S3_ACCESS_KEY!,
    secretKey: process.env.S3_SECRET_KEY!,
    endpoint: process.env.S3_ENDPOINT,
  };

  if (!config.bucket || !config.region || !config.accessKey || !config.secretKey) {
    throw new Error('Missing required S3 configuration. Check S3_BUCKET, S3_REGION, S3_ACCESS_KEY, and S3_SECRET_KEY.');
  }

  return new S3Storage(config);
}
