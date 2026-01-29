/**
 * HOOPERITS CMS - Rich Text Field
 */

import type { FieldDefinition, RichTextFieldOptions } from '../types';

export function richText(options: RichTextFieldOptions): FieldDefinition {
  return {
    type: 'richText',
    options: {
      required: false,
      allowImages: true,
      allowLinks: true,
      allowLists: true,
      allowHeadings: true,
      ...options,
    },
  };
}
