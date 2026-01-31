/**
 * HOOPERITS CMS - Serializers Module
 *
 * Exports for Portable Text serialization.
 */

// HTML Serializer
export { toHTML, escapeHtml } from './html';
export type { HTMLSerializerOptions, BlockRenderer, MarkRenderer, InlineRenderer } from './html';

// Plain Text Serializer
export { toPlainText, countWords, countCharacters, getExcerpt } from './text';
export type { PlainTextOptions, BlockTextExtractor } from './text';

// React Types
export type {
  PortableTextBlockProps,
  PortableTextMarkProps,
  PortableTextListProps,
  PortableTextListItemProps,
  PortableTextInlineProps,
  PortableTextComponents,
  PortableTextProps,
  BlockType,
  BlockStyleComponent,
  CustomBlockComponent,
  MergeComponents,
} from './react';
