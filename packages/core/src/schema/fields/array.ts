/**
 * HOOPERITS CMS - Array Field
 */

import type { FieldDefinition, ArrayFieldOptions } from '../types';

export function array(options: ArrayFieldOptions): FieldDefinition {
  return {
    type: 'array',
    options: {
      required: false,
      ...options,
    },
  };
}
