/**
 * HOOPERITS CMS - File Field
 */

import type { FieldDefinition, FileFieldOptions } from '../types';

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB

export function file(options: FileFieldOptions): FieldDefinition {
  return {
    type: 'file',
    options: {
      required: false,
      maxSize: DEFAULT_MAX_SIZE,
      ...options,
    },
  };
}
