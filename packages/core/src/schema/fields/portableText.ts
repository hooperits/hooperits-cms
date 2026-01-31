/**
 * HOOPERITS CMS - Portable Text Field
 *
 * Schema field definition for rich text content using Portable Text format.
 */

import type { FieldDefinition, PortableTextFieldOptions } from '../types';
import {
  DEFAULT_BLOCK_STYLES,
  DEFAULT_DECORATORS,
  DEFAULT_LIST_TYPES,
  LINK_ANNOTATION,
  type BlockStyle,
  type Decorator,
  type ListType,
} from '../../portable-text/schema';

/**
 * Create a Portable Text field definition
 */
export function portableText(options: PortableTextFieldOptions): FieldDefinition {
  return {
    type: 'portableText',
    options: {
      required: false,
      styles: DEFAULT_BLOCK_STYLES as unknown as BlockStyle[],
      lists: DEFAULT_LIST_TYPES as unknown as ListType[],
      decorators: DEFAULT_DECORATORS as unknown as Decorator[],
      annotations: [
        {
          type: LINK_ANNOTATION.type,
          title: LINK_ANNOTATION.title,
          icon: LINK_ANNOTATION.icon,
          fields: LINK_ANNOTATION.fields as unknown as PortableTextFieldOptions['annotations'] extends (infer T)[] ? T extends { fields: infer F } ? F : never : never,
        },
      ],
      blocks: [],
      inlineObjects: [],
      ...options,
    },
  };
}
