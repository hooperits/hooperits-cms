/**
 * HOOPERITS CMS - React Serializer Types
 *
 * Type definitions for rendering Portable Text in React applications.
 */

import type { ReactNode, ComponentType } from 'react';
import type {
  PortableTextContent,
  PortableTextBlock,
  PortableTextTextBlock,
  PortableTextChild,
  PortableTextMarkDef,
  ImageBlock,
  CodeBlock,
  VideoBlock,
  QuoteBlock,
} from '../types';

// =============================================================================
// Component Types
// =============================================================================

/**
 * Props passed to block components
 */
export interface PortableTextBlockProps<T = PortableTextBlock> {
  /** The block data */
  value: T;
  /** Index of this block in the content array */
  index: number;
  /** Whether this block is selected (for editor use) */
  isSelected?: boolean;
  /** Render the block's children (for text blocks) */
  renderChildren?: () => ReactNode;
}

/**
 * Props passed to mark/decorator components
 */
export interface PortableTextMarkProps {
  /** The text content */
  children: ReactNode;
  /** Mark definition (for annotations like links) */
  markDef?: PortableTextMarkDef;
  /** The mark type name */
  markType: string;
}

/**
 * Props passed to list components
 */
export interface PortableTextListProps {
  /** List type: 'bullet' or 'number' */
  type: 'bullet' | 'number';
  /** Nesting level (1-based) */
  level: number;
  /** List item children */
  children: ReactNode;
}

/**
 * Props passed to list item components
 */
export interface PortableTextListItemProps {
  /** The list item block data */
  value: PortableTextTextBlock;
  /** Index within the list */
  index: number;
  /** Nesting level (1-based) */
  level: number;
  /** Render the item's children */
  renderChildren: () => ReactNode;
}

/**
 * Props passed to inline object components
 */
export interface PortableTextInlineProps<T = PortableTextChild> {
  /** The inline object data */
  value: T;
  /** Index within the parent span array */
  index: number;
}

/**
 * Built-in block type components
 */
export interface BuiltInBlockComponents {
  /** Image block */
  image?: ComponentType<PortableTextBlockProps<ImageBlock>>;
  /** Code block */
  codeBlock?: ComponentType<PortableTextBlockProps<CodeBlock>>;
  /** Video block */
  video?: ComponentType<PortableTextBlockProps<VideoBlock>>;
  /** Quote block */
  quote?: ComponentType<PortableTextBlockProps<QuoteBlock>>;
}

/**
 * Custom block type components (string-indexed)
 */
export interface CustomBlockComponents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: ComponentType<PortableTextBlockProps<any>> | undefined;
}

/**
 * Configuration for Portable Text components
 */
export interface PortableTextComponents {
  /**
   * Block-level components by type
   */
  block?: {
    /** Paragraph style */
    normal?: ComponentType<PortableTextBlockProps<PortableTextTextBlock>>;
    /** Heading styles (h1-h6) */
    h1?: ComponentType<PortableTextBlockProps<PortableTextTextBlock>>;
    h2?: ComponentType<PortableTextBlockProps<PortableTextTextBlock>>;
    h3?: ComponentType<PortableTextBlockProps<PortableTextTextBlock>>;
    h4?: ComponentType<PortableTextBlockProps<PortableTextTextBlock>>;
    h5?: ComponentType<PortableTextBlockProps<PortableTextTextBlock>>;
    h6?: ComponentType<PortableTextBlockProps<PortableTextTextBlock>>;
    /** Blockquote style */
    blockquote?: ComponentType<PortableTextBlockProps<PortableTextTextBlock>>;
  };

  /**
   * Mark/decorator components
   */
  marks?: {
    /** Bold text */
    strong?: ComponentType<PortableTextMarkProps>;
    /** Italic text */
    em?: ComponentType<PortableTextMarkProps>;
    /** Underlined text */
    underline?: ComponentType<PortableTextMarkProps>;
    /** Strikethrough text */
    strike?: ComponentType<PortableTextMarkProps>;
    /** Inline code */
    code?: ComponentType<PortableTextMarkProps>;
    /** Link annotation */
    link?: ComponentType<PortableTextMarkProps>;
    /** Custom marks */
    [key: string]: ComponentType<PortableTextMarkProps> | undefined;
  };

  /**
   * List components
   */
  list?: {
    /** Bullet list */
    bullet?: ComponentType<PortableTextListProps>;
    /** Numbered list */
    number?: ComponentType<PortableTextListProps>;
  };

  /**
   * List item component
   */
  listItem?: ComponentType<PortableTextListItemProps>;

  /**
   * Custom block types
   */
  types?: BuiltInBlockComponents & CustomBlockComponents;

  /**
   * Inline object types
   */
  inline?: {
    /** Custom inline objects */
    [key: string]: ComponentType<PortableTextInlineProps> | undefined;
  };

  /**
   * Hardbreak component
   */
  hardBreak?: ComponentType;

  /**
   * Unknown type fallback
   */
  unknownType?: ComponentType<{ value: PortableTextBlock; type: string }>;

  /**
   * Unknown mark fallback
   */
  unknownMark?: ComponentType<{ markType: string; children: ReactNode }>;
}

/**
 * Props for the main PortableText component
 */
export interface PortableTextProps {
  /** The Portable Text content to render */
  value: PortableTextContent;
  /** Custom components to override defaults */
  components?: PortableTextComponents;
  /** Function to resolve image URLs from asset references */
  imageUrlResolver?: (ref: string) => string;
  /** Function to resolve internal references */
  referenceResolver?: (ref: string) => { href: string; title?: string };
  /** Additional className for the container */
  className?: string;
  /** Callback when a list is rendered */
  onListStart?: (type: 'bullet' | 'number', level: number) => void;
  /** Callback when a list ends */
  onListEnd?: (type: 'bullet' | 'number', level: number) => void;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Extract the block type from a block
 */
export type BlockType<T extends PortableTextBlock> = T['_type'];

/**
 * Get the component type for a specific block style
 */
export type BlockStyleComponent = ComponentType<PortableTextBlockProps<PortableTextTextBlock>>;

/**
 * Get the component type for a specific custom block type
 */
export type CustomBlockComponent<T extends PortableTextBlock = PortableTextBlock> =
  ComponentType<PortableTextBlockProps<T>>;

/**
 * Merge two component configurations
 */
export type MergeComponents<
  A extends PortableTextComponents,
  B extends PortableTextComponents
> = {
  block: A['block'] & B['block'];
  marks: A['marks'] & B['marks'];
  list: A['list'] & B['list'];
  listItem: B['listItem'] extends undefined ? A['listItem'] : B['listItem'];
  types: A['types'] & B['types'];
  inline: A['inline'] & B['inline'];
  hardBreak: B['hardBreak'] extends undefined ? A['hardBreak'] : B['hardBreak'];
  unknownType: B['unknownType'] extends undefined ? A['unknownType'] : B['unknownType'];
  unknownMark: B['unknownMark'] extends undefined ? A['unknownMark'] : B['unknownMark'];
};
