/**
 * HOOPERITS CMS - Select Field
 */

import type { FieldDefinition, SelectFieldOptions } from '../types';

export function select(options: SelectFieldOptions): FieldDefinition {
  return {
    type: 'select',
    options: {
      required: false,
      multiple: false,
      ...options,
    },
  };
}
