/**
 * HOOPERITS CMS - Reference Field
 */

import type { FieldDefinition, ReferenceFieldOptions } from '../types';

export function reference(options: ReferenceFieldOptions): FieldDefinition {
  return {
    type: 'reference',
    options: {
      required: false,
      many: false,
      ...options,
    },
  };
}
