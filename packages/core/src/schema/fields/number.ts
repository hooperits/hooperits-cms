/**
 * HOOPERITS CMS - Number Field
 */

import type { FieldDefinition, NumberFieldOptions } from '../types';

export function number(options: NumberFieldOptions): FieldDefinition {
  return {
    type: 'number',
    options: {
      required: false,
      integer: false,
      ...options,
    },
  };
}
