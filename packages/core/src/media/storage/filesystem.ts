/**
 * HOOPERITS CMS - Filesystem Storage Adapter
 */

import fs from 'fs/promises';
import path from 'path';
import type { StorageAdapter } from './types';

export class FilesystemStorage implements StorageAdapter {
  private basePath: string;
  private baseUrl: string;

  constructor(basePath: string, baseUrl: string = '/uploads') {
    this.basePath = basePath;
    this.baseUrl = baseUrl;
  }

  async upload(file: Buffer, filePath: string): Promise<string> {
    const fullPath = path.join(this.basePath, filePath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, file);

    return this.getUrl(filePath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);

    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getUrl(filePath: string): string {
    return `${this.baseUrl}/${filePath}`.replace(/\/+/g, '/');
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, filePath);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

export function createFilesystemStorage(basePath?: string): FilesystemStorage {
  const storagePath = basePath || process.env.MEDIA_PATH || './public/uploads';
  return new FilesystemStorage(storagePath);
}
