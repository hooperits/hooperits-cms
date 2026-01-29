/**
 * HOOPERITS CMS - Boolean Field
 */

import type { FieldDefinition, BooleanFieldOptions } from '../types';

export function boolean(options: BooleanFieldOptions): FieldDefinition {
  return {
    type: 'boolean',
    options: {
      required: false,
      default: false,
      ...options,
    },
  };
}
