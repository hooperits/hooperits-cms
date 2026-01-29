/**
 * HOOPERITS CMS - Storage Types
 * Interface for storage adapters
 */

export interface StorageAdapter {
  /**
   * Upload a file to storage
   * @param file File buffer
   * @param path Destination path
   * @returns Public URL of the uploaded file
   */
  upload(file: Buffer, path: string): Promise<string>;

  /**
   * Delete a file from storage
   * @param path File path
   */
  delete(path: string): Promise<void>;

  /**
   * Get the public URL for a file
   * @param path File path
   */
  getUrl(path: string): string;

  /**
   * Check if a file exists
   * @param path File path
   */
  exists(path: string): Promise<boolean>;
}

export interface UploadOptions {
  filename: string;
  mimeType: string;
  folder?: string;
}

export interface MediaVariant {
  path: string;
  url: string;
  width: number;
  height?: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
}
