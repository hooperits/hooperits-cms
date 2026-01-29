/**
 * HOOPERITS CMS - Text Field
 */

import type { FieldDefinition, TextFieldOptions } from '../types';

export function text(options: TextFieldOptions): FieldDefinition {
  return {
    type: 'text',
    options: {
      required: false,
      ...options,
    },
  };
}
