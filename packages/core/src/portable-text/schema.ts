/**
 * HOOPERITS CMS - Portable Text Schema Definitions
 *
 * Defines the standard block styles, decorators, and list types.
 */

import type { FieldDefinition } from '../schema/types';

// =============================================================================
// Standard Block Styles
// =============================================================================

/**
 * Available block styles
 */
export const BLOCK_STYLES = [
  'normal',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
] as const;

export type BlockStyle = (typeof BLOCK_STYLES)[number];

/**
 * Default block styles enabled in the editor
 */
export const DEFAULT_BLOCK_STYLES: BlockStyle[] = [
  'normal',
  'h1',
  'h2',
  'h3',
  'blockquote',
];

/**
 * Block style display names
 */
export const BLOCK_STYLE_LABELS: Record<BlockStyle, string> = {
  normal: 'Normal',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  blockquote: 'Quote',
};

// =============================================================================
// Text Decorators (Marks)
// =============================================================================

/**
 * Available text decorators
 */
export const DECORATORS = [
  'strong',
  'em',
  'underline',
  'strike',
  'code',
] as const;

export type Decorator = (typeof DECORATORS)[number];

/**
 * Default decorators enabled in the editor
 */
export const DEFAULT_DECORATORS: Decorator[] = [
  'strong',
  'em',
  'underline',
  'strike',
  'code',
];

/**
 * Decorator display names and keyboard shortcuts
 */
export const DECORATOR_CONFIG: Record<
  Decorator,
  { label: string; icon: string; shortcut?: string }
> = {
  strong: { label: 'Bold', icon: 'bold', shortcut: 'Ctrl+B' },
  em: { label: 'Italic', icon: 'italic', shortcut: 'Ctrl+I' },
  underline: { label: 'Underline', icon: 'underline', shortcut: 'Ctrl+U' },
  strike: { label: 'Strikethrough', icon: 'strikethrough' },
  code: { label: 'Code', icon: 'code' },
};

// =============================================================================
// List Types
// =============================================================================

/**
 * Available list types
 */
export const LIST_TYPES = ['bullet', 'number'] as const;

export type ListType = (typeof LIST_TYPES)[number];

/**
 * Default list types enabled in the editor
 */
export const DEFAULT_LIST_TYPES: ListType[] = ['bullet', 'number'];

/**
 * List type display names
 */
export const LIST_TYPE_LABELS: Record<ListType, string> = {
  bullet: 'Bulleted List',
  number: 'Numbered List',
};

// =============================================================================
// Built-in Annotations
// =============================================================================

/**
 * Link annotation definition
 */
export const LINK_ANNOTATION = {
  type: 'link',
  title: 'Link',
  icon: 'link',
  fields: {
    href: {
      type: 'text',
      options: {
        label: 'URL',
        required: true,
        placeholder: 'https://example.com',
      },
    },
    title: {
      type: 'text',
      options: {
        label: 'Title',
        description: 'Optional title for accessibility',
      },
    },
    blank: {
      type: 'boolean',
      options: {
        label: 'Open in new tab',
        defaultValue: false,
      },
    },
  },
} as const;

// =============================================================================
// Built-in Block Types
// =============================================================================

/**
 * Image block definition
 */
export const IMAGE_BLOCK_DEFINITION = {
  type: 'image',
  title: 'Image',
  icon: 'image',
  fields: {
    asset: {
      type: 'image',
      options: {
        label: 'Image',
        required: true,
      },
    },
    alt: {
      type: 'text',
      options: {
        label: 'Alternative text',
        description: 'Describe the image for accessibility',
      },
    },
    caption: {
      type: 'text',
      options: {
        label: 'Caption',
      },
    },
    alignment: {
      type: 'select',
      options: {
        label: 'Alignment',
        options: ['left', 'center', 'right'],
        defaultValue: 'center',
      },
    },
  },
};

/**
 * Code block definition
 */
export const CODE_BLOCK_DEFINITION = {
  type: 'codeBlock',
  title: 'Code',
  icon: 'code',
  fields: {
    code: {
      type: 'text',
      options: {
        label: 'Code',
        required: true,
        multiline: true,
      },
    },
    language: {
      type: 'select',
      options: {
        label: 'Language',
        options: [
          'javascript',
          'typescript',
          'python',
          'bash',
          'json',
          'html',
          'css',
          'sql',
          'markdown',
          'yaml',
          'plaintext',
        ],
        defaultValue: 'plaintext',
      },
    },
    filename: {
      type: 'text',
      options: {
        label: 'Filename',
        placeholder: 'example.ts',
      },
    },
  },
};

/**
 * Video block definition
 */
export const VIDEO_BLOCK_DEFINITION = {
  type: 'video',
  title: 'Video',
  icon: 'video',
  fields: {
    source: {
      type: 'select',
      options: {
        label: 'Source',
        options: ['upload', 'youtube', 'vimeo', 'url'],
        defaultValue: 'url',
        required: true,
      },
    },
    url: {
      type: 'text',
      options: {
        label: 'Video URL',
        placeholder: 'https://youtube.com/watch?v=...',
      },
    },
    caption: {
      type: 'text',
      options: {
        label: 'Caption',
      },
    },
  },
};

// =============================================================================
// Schema Definition Types
// =============================================================================

/**
 * Custom annotation definition
 */
export interface PortableTextAnnotationDefinition {
  type: string;
  title: string;
  icon?: string;
  fields: Record<string, FieldDefinition>;
}

/**
 * Custom block definition
 */
export interface PortableTextBlockDefinition {
  type: string;
  title: string;
  icon?: string;
  fields: Record<string, FieldDefinition>;
  preview?: {
    select: Record<string, string>;
    prepare: (selection: Record<string, unknown>) => {
      title: string;
      subtitle?: string;
    };
  };
}

/**
 * Custom inline object definition
 */
export interface PortableTextInlineDefinition {
  type: string;
  title: string;
  icon?: string;
  fields: Record<string, FieldDefinition>;
}

// =============================================================================
// Default Built-in Blocks
// =============================================================================

/**
 * Default built-in block types
 */
export const DEFAULT_BUILT_IN_BLOCKS: PortableTextBlockDefinition[] = [
  IMAGE_BLOCK_DEFINITION as unknown as PortableTextBlockDefinition,
  CODE_BLOCK_DEFINITION as unknown as PortableTextBlockDefinition,
  VIDEO_BLOCK_DEFINITION as unknown as PortableTextBlockDefinition,
];
