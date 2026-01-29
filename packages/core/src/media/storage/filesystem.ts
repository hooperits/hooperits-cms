/**
 * HOOPERITS CMS - Filesystem Storage Adapter
 */

import fs from 'fs/promises';
import path from 'path';
import type { StorageAdapter } from './types';

export class FilesystemStorage implements StorageAdapter {
  private basePath: string;
  private baseUrl: string;
  private resolvedBasePath: string;

  constructor(basePath: string, baseUrl: string = '/uploads') {
    this.basePath = basePath;
    this.baseUrl = baseUrl;
    this.resolvedBasePath = path.resolve(basePath);
  }

  private validatePath(filePath: string): string {
    const fullPath = path.resolve(this.basePath, filePath);
    if (!fullPath.startsWith(this.resolvedBasePath)) {
      throw new Error('Invalid file path: path traversal detected');
    }
    return fullPath;
  }

  async upload(file: Buffer, filePath: string): Promise<string> {
    const fullPath = this.validatePath(filePath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, file);

    return this.getUrl(filePath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = this.validatePath(filePath);

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
    const fullPath = this.validatePath(filePath);

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
