/**
 * HOOPERITS CMS - Image Field
 */

import type { FieldDefinition, ImageFieldOptions } from '../types';

const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function image(options: ImageFieldOptions): FieldDefinition {
  return {
    type: 'image',
    options: {
      required: false,
      maxSize: DEFAULT_MAX_SIZE,
      accept: DEFAULT_IMAGE_TYPES,
      ...options,
    },
  };
}
