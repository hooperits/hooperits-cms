/**
 * HOOPERITS CMS - Date and DateTime Fields
 */

import type { FieldDefinition, DateFieldOptions, DateTimeFieldOptions } from '../types';

export function date(options: DateFieldOptions): FieldDefinition {
  return {
    type: 'date',
    options: {
      required: false,
      ...options,
    },
  };
}

export function datetime(options: DateTimeFieldOptions): FieldDefinition {
  return {
    type: 'datetime',
    options: {
      required: false,
      ...options,
    },
  };
}
