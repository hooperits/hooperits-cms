/**
 * HOOPERITS CMS - Slug Field
 */

import type { FieldDefinition, SlugFieldOptions } from '../types';

export function slug(options: SlugFieldOptions): FieldDefinition {
  return {
    type: 'slug',
    options: {
      required: false,
      maxLength: 200,
      ...options,
    },
  };
}

/**
 * Generate a slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Trim hyphens from start/end
    .substring(0, 200);
}
