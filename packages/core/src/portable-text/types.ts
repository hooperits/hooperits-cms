/**
 * HOOPERITS CMS - Portable Text Types
 *
 * TypeScript interfaces for Portable Text content structure.
 * Follows the Portable Text specification with extensions for custom blocks.
 */

// =============================================================================
// Base Types
// =============================================================================

/**
 * Base interface for all block types
 */
export interface PortableTextBlockBase {
  /** Unique identifier for this block */
  _key: string;
  /** Block type - 'block' for text, or custom type name */
  _type: string;
}

/**
 * Block styles for text blocks
 */
export type PortableTextBlockStyle =
  | 'normal'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'blockquote';

/**
 * List item types
 */
export type PortableTextListType = 'bullet' | 'number';

// =============================================================================
// Mark Types
// =============================================================================

/**
 * Base interface for all mark definitions
 */
export interface PortableTextMarkDefBase {
  /** Unique key referenced in span.marks */
  _key: string;
  /** Mark type */
  _type: string;
}

/**
 * Link annotation
 */
export interface PortableTextLinkMarkDef extends PortableTextMarkDefBase {
  _type: 'link';
  /** Target URL */
  href: string;
  /** Optional link title for accessibility */
  title?: string;
  /** Open in new tab */
  blank?: boolean;
}

/**
 * Internal document reference
 */
export interface PortableTextReferenceMarkDef extends PortableTextMarkDefBase {
  _type: 'internalLink';
  /** Referenced document ID */
  reference: {
    _type: 'reference';
    _ref: string;
  };
}

/**
 * Custom annotation (comments, highlights, etc.)
 */
export interface PortableTextCustomMarkDef extends PortableTextMarkDefBase {
  _type: string;
  /** Custom fields defined by annotation schema */
  [key: string]: unknown;
}

/**
 * Union type for all mark definitions
 */
export type PortableTextMarkDef =
  | PortableTextLinkMarkDef
  | PortableTextReferenceMarkDef
  | PortableTextCustomMarkDef;

// =============================================================================
// Inline Types
// =============================================================================

/**
 * Text span with optional marks/decorators
 */
export interface PortableTextSpan {
  _key: string;
  _type: 'span';
  /** The text content */
  text: string;
  /**
   * Applied marks - can be:
   * - Decorator names: 'strong', 'em', 'underline', 'strike', 'code'
   * - Mark definition keys referencing markDefs
   */
  marks: string[];
}

/**
 * Inline object (mentions, variables, etc.)
 */
export interface PortableTextInlineObject {
  _key: string;
  _type: string;
  /** Custom fields defined by inline object schema */
  [key: string]: unknown;
}

/**
 * Union type for all inline content
 */
export type PortableTextChild = PortableTextSpan | PortableTextInlineObject;

// =============================================================================
// Built-in Block Types (T012)
// =============================================================================

/**
 * Reference to a media asset
 */
export interface PortableTextAssetReference {
  _type: 'reference';
  _ref: string;
}

/**
 * Image block
 */
export interface ImageBlock extends PortableTextBlockBase {
  _type: 'image';
  /** Reference to Media entity */
  asset: PortableTextAssetReference;
  /** Alternative text for accessibility */
  alt?: string;
  /** Optional caption */
  caption?: string;
  /** Alignment */
  alignment?: 'left' | 'center' | 'right';
}

/**
 * Code block
 */
export interface CodeBlock extends PortableTextBlockBase {
  _type: 'codeBlock';
  /** The code content */
  code: string;
  /** Programming language for syntax highlighting */
  language?: string;
  /** Optional filename to display */
  filename?: string;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Lines to highlight */
  highlightLines?: (number | [number, number])[];
}

/**
 * Video block
 */
export interface VideoBlock extends PortableTextBlockBase {
  _type: 'video';
  /** Video source type */
  source: 'upload' | 'youtube' | 'vimeo' | 'url';
  /** Reference to Media entity if uploaded */
  asset?: PortableTextAssetReference;
  /** External URL if embedded */
  url?: string;
  /** Optional caption */
  caption?: string;
}

/**
 * Quote block (extended blockquote)
 */
export interface QuoteBlock extends PortableTextBlockBase {
  _type: 'quote';
  /** Quote text (can contain inline formatting) */
  children: PortableTextChild[];
  /** Mark definitions for the quote content */
  markDefs: PortableTextMarkDef[];
  /** Attribution/source */
  attribution?: string;
  /** URL to source */
  source?: string;
}

// =============================================================================
// Text Block Types
// =============================================================================

/**
 * Standard text block (paragraphs, headings, quotes, lists)
 */
export interface PortableTextTextBlock extends PortableTextBlockBase {
  _type: 'block';
  /** Visual style: 'normal', 'h1'-'h6', 'blockquote' */
  style: PortableTextBlockStyle;
  /** List item type if this block is part of a list */
  listItem?: PortableTextListType;
  /** Nesting level for lists (1-based) */
  level?: number;
  /** Inline content (text spans and inline objects) */
  children: PortableTextChild[];
  /** Annotation definitions referenced by spans */
  markDefs: PortableTextMarkDef[];
}

/**
 * Custom block (user-defined)
 */
export interface PortableTextCustomBlock extends PortableTextBlockBase {
  _type: string;
  /** Custom fields defined by block schema */
  [key: string]: unknown;
}

// =============================================================================
// Block Union Type
// =============================================================================

/**
 * Union type for all block types
 * Includes text blocks, built-in blocks, and custom blocks
 */
export type PortableTextBlock =
  | PortableTextTextBlock
  | ImageBlock
  | CodeBlock
  | VideoBlock
  | QuoteBlock
  | PortableTextCustomBlock;

// =============================================================================
// Content Type
// =============================================================================

/**
 * Root content structure - array of blocks
 */
export type PortableTextContent = PortableTextBlock[];

// =============================================================================
// Built-in Inline Objects (T013)
// =============================================================================

/**
 * Mention inline object
 */
export interface MentionInline extends PortableTextInlineObject {
  _type: 'mention';
  /** Referenced document */
  reference: {
    _type: 'reference';
    _ref: string;
    _contentType: string;
  };
  /** Cached display name (for offline rendering) */
  displayName?: string;
}

/**
 * Variable inline object
 */
export interface VariableInline extends PortableTextInlineObject {
  _type: 'variable';
  /** Variable identifier */
  name: string;
  /** Default value if variable not resolved */
  fallback?: string;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a block is a text block
 */
export function isTextBlock(block: PortableTextBlock): block is PortableTextTextBlock {
  return block._type === 'block';
}

/**
 * Check if a child is a span
 */
export function isSpan(child: PortableTextChild): child is PortableTextSpan {
  return child._type === 'span';
}

/**
 * Check if a child is an inline object
 */
export function isInlineObject(child: PortableTextChild): child is PortableTextInlineObject {
  return child._type !== 'span';
}

/**
 * Check if a block is a list item
 */
export function isListItem(block: PortableTextBlock): boolean {
  return isTextBlock(block) && !!block.listItem;
}

/**
 * Check if a block is an image block
 */
export function isImageBlock(block: PortableTextBlock): block is ImageBlock {
  return block._type === 'image';
}

/**
 * Check if a block is a code block
 */
export function isCodeBlock(block: PortableTextBlock): block is CodeBlock {
  return block._type === 'codeBlock';
}

/**
 * Check if a block is a video block
 */
export function isVideoBlock(block: PortableTextBlock): block is VideoBlock {
  return block._type === 'video';
}

/**
 * Check if a block is a quote block
 */
export function isQuoteBlock(block: PortableTextBlock): block is QuoteBlock {
  return block._type === 'quote';
}

/**
 * Check if a mark is a link
 */
export function isLinkMark(mark: PortableTextMarkDef): mark is PortableTextLinkMarkDef {
  return mark._type === 'link';
}
