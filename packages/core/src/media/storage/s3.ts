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
  acl?: string;
}

// Type for lazy-loaded S3Client
type S3ClientType = InstanceType<typeof import('@aws-sdk/client-s3').S3Client>;

export class S3Storage implements StorageAdapter {
  private config: S3Config;
  private baseUrl: string;
  private clientPromise: Promise<S3ClientType> | null = null;

  constructor(config: S3Config) {
    this.config = config;

    // Build base URL
    if (config.endpoint) {
      this.baseUrl = `${config.endpoint}/${config.bucket}`;
    } else {
      this.baseUrl = `https://${config.bucket}.s3.${config.region}.amazonaws.com`;
    }
  }

  private async getClient(): Promise<S3ClientType> {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const { S3Client } = await import('@aws-sdk/client-s3');
        return new S3Client({
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
      })();
    }
    return this.clientPromise;
  }

  async upload(file: Buffer, filePath: string): Promise<string> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

    type ObjectCannedACL = import('@aws-sdk/client-s3').ObjectCannedACL;
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: filePath,
      Body: file,
      ...(this.config.acl && { ACL: this.config.acl as ObjectCannedACL }),
    });

    await client.send(command);

    return this.getUrl(filePath);
  }

  async delete(filePath: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

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
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

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
    acl: process.env.S3_ACL, // Optional: 'public-read', 'private', etc.
  };

  if (!config.bucket || !config.region || !config.accessKey || !config.secretKey) {
    throw new Error('Missing required S3 configuration. Check S3_BUCKET, S3_REGION, S3_ACCESS_KEY, and S3_SECRET_KEY.');
  }

  return new S3Storage(config);
}
