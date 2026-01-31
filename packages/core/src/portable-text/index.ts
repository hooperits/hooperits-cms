/**
 * HOOPERITS CMS - Portable Text Module
 *
 * Public exports for Portable Text functionality.
 */

// Types
export type {
  PortableTextContent,
  PortableTextBlock,
  PortableTextBlockBase,
  PortableTextTextBlock,
  PortableTextCustomBlock,
  PortableTextBlockStyle,
  PortableTextListType,
  PortableTextChild,
  PortableTextSpan,
  PortableTextInlineObject,
  PortableTextMarkDef,
  PortableTextMarkDefBase,
  PortableTextLinkMarkDef,
  PortableTextReferenceMarkDef,
  PortableTextCustomMarkDef,
  PortableTextAssetReference,
  ImageBlock,
  CodeBlock,
  VideoBlock,
  QuoteBlock,
  MentionInline,
  VariableInline,
} from './types';

// Type guards
export {
  isTextBlock,
  isSpan,
  isInlineObject,
  isListItem,
  isImageBlock,
  isCodeBlock,
  isVideoBlock,
  isQuoteBlock,
  isLinkMark,
} from './types';

// Utilities
export {
  generateBlockKey,
  generateSpanKey,
  generateMarkKey,
  generateInlineKey,
  generateKey,
  isValidKey,
  ensureUniqueKeys,
} from './utils';

// Schema definitions
export {
  BLOCK_STYLES,
  DEFAULT_BLOCK_STYLES,
  BLOCK_STYLE_LABELS,
  DECORATORS,
  DEFAULT_DECORATORS,
  DECORATOR_CONFIG,
  LIST_TYPES,
  DEFAULT_LIST_TYPES,
  LIST_TYPE_LABELS,
  LINK_ANNOTATION,
  IMAGE_BLOCK_DEFINITION,
  CODE_BLOCK_DEFINITION,
  VIDEO_BLOCK_DEFINITION,
  DEFAULT_BUILT_IN_BLOCKS,
} from './schema';

export type {
  BlockStyle,
  Decorator,
  ListType,
  PortableTextAnnotationDefinition,
  PortableTextBlockDefinition,
  PortableTextInlineDefinition,
} from './schema';

// Validation
export {
  validatePortableText,
  validateBlock,
  validateSpan,
  validateMarkDefs,
  validateAgainstSchema,
  validateCustomBlock,
  validateAnnotation,
  isEmptyContent,
} from './validation';

export type { ValidationError, ValidationResult } from './validation';

// Serialization
export {
  toHTML,
  escapeHtml,
  toPlainText,
  countWords,
  countCharacters,
  getExcerpt,
} from './serialize';

export type {
  HTMLSerializerOptions,
  BlockRenderer,
  MarkRenderer,
  InlineRenderer,
  PlainTextOptions,
  BlockTextExtractor,
  PortableTextBlockProps,
  PortableTextMarkProps,
  PortableTextListProps,
  PortableTextListItemProps,
  PortableTextInlineProps,
  PortableTextComponents,
  PortableTextProps,
} from './serialize';
