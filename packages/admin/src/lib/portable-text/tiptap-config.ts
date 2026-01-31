/**
 * HOOPERITS CMS - Tiptap Editor Configuration
 *
 * Configuration and converters for the Tiptap-based Portable Text editor.
 */

import { Extension, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { ReactNodeViewRenderer } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import type {
  PortableTextContent,
  PortableTextBlock,
  PortableTextTextBlock,
  PortableTextSpan,
  PortableTextChild,
  PortableTextMarkDef,
  PortableTextBlockStyle,
} from '@hooperits/cms';

// Import Node View components
import { ImageBlockView } from '../../components/forms/fields/PortableTextField/blocks/ImageBlock';
import { CodeBlockView } from '../../components/forms/fields/PortableTextField/blocks/CodeBlock';
import { VideoBlockView } from '../../components/forms/fields/PortableTextField/blocks/VideoBlock';

// =============================================================================
// Custom Image Block Extension (T040)
// =============================================================================

/**
 * Custom Image block extension with React Node View
 */
export const ImageBlock = Node.create({
  name: 'image',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      asset: {
        default: null,
        parseHTML: (element) => {
          const ref = element.getAttribute('data-asset-ref');
          return ref ? { _type: 'reference', _ref: ref } : null;
        },
        renderHTML: (attributes) => {
          if (attributes.asset?._ref) {
            return { 'data-asset-ref': attributes.asset._ref };
          }
          return {};
        },
      },
      src: {
        default: null,
      },
      alt: {
        default: '',
      },
      caption: {
        default: '',
      },
      alignment: {
        default: 'center',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes, { 'data-type': 'image' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
});

// =============================================================================
// Custom Code Block Extension (T042)
// =============================================================================

/**
 * Custom Code block extension with React Node View
 */
export const CodeBlock = Node.create({
  name: 'codeBlock',

  group: 'block',

  content: 'text*',

  marks: '',

  code: true,

  defining: true,

  draggable: true,

  addAttributes() {
    return {
      language: {
        default: 'plaintext',
        parseHTML: (element) => element.getAttribute('data-language') || 'plaintext',
        renderHTML: (attributes) => ({
          'data-language': attributes.language,
        }),
      },
      filename: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-filename') || '',
        renderHTML: (attributes) => {
          if (attributes.filename) {
            return { 'data-filename': attributes.filename };
          }
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'pre',
        preserveWhitespace: 'full',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['pre', mergeAttributes(HTMLAttributes), ['code', 0]];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock(),
      // Handle Tab inside code blocks
      Tab: () => {
        if (this.editor.isActive('codeBlock')) {
          return this.editor.commands.insertContent('\t');
        }
        return false;
      },
      // Handle Shift-Tab to outdent (remove tab)
      'Shift-Tab': () => {
        if (this.editor.isActive('codeBlock')) {
          // TODO: Implement outdent
          return true;
        }
        return false;
      },
    };
  },

  addCommands() {
    return {
      setCodeBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes);
        },
      toggleCodeBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleNode(this.name, 'paragraph', attributes);
        },
    };
  },
});

// =============================================================================
// Custom Video Block Extension (T046)
// =============================================================================

/**
 * Custom Video block extension with React Node View
 */
export const VideoBlock = Node.create({
  name: 'video',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      source: {
        default: 'url',
        parseHTML: (element) => element.getAttribute('data-source') || 'url',
        renderHTML: (attributes) => ({
          'data-source': attributes.source,
        }),
      },
      asset: {
        default: null,
        parseHTML: (element) => {
          const ref = element.getAttribute('data-asset-ref');
          return ref ? { _type: 'reference', _ref: ref } : null;
        },
        renderHTML: (attributes) => {
          if (attributes.asset?._ref) {
            return { 'data-asset-ref': attributes.asset._ref };
          }
          return {};
        },
      },
      url: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-url'),
        renderHTML: (attributes) => {
          if (attributes.url) {
            return { 'data-url': attributes.url };
          }
          return {};
        },
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption') || '',
        renderHTML: (attributes) => {
          if (attributes.caption) {
            return { 'data-caption': attributes.caption };
          }
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="video"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes, { 'data-type': 'video' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoBlockView);
  },
});

// =============================================================================
// Custom Block Extension Factory (T049)
// =============================================================================

// Re-export from extensions/customBlock for convenience
export {
  createCustomBlockExtension,
  createCustomBlockExtensions,
} from '../../components/forms/fields/PortableTextField/extensions/customBlock';

export {
  createCustomBlockView,
  UnknownBlockView,
} from '../../components/forms/fields/PortableTextField/blocks/CustomBlock';

// =============================================================================
// Default Extensions (T021)
// =============================================================================

/**
 * Get default Tiptap extensions for the Portable Text editor
 */
export function getDefaultExtensions(options?: {
  placeholder?: string;
}) {
  return [
    StarterKit.configure({
      // Disable features we'll customize
      codeBlock: false, // We use custom CodeBlock extension
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 underline cursor-pointer',
      },
    }),
    Placeholder.configure({
      placeholder: options?.placeholder || 'Start writing...',
    }),
    ImageBlock,
    CodeBlock,
    VideoBlock,
  ];
}

// =============================================================================
// Portable Text to Tiptap Conversion (T022)
// =============================================================================

/**
 * Map Portable Text block styles to Tiptap node types
 */
const STYLE_TO_NODE_TYPE: Record<PortableTextBlockStyle, string> = {
  normal: 'paragraph',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  blockquote: 'blockquote',
};

/**
 * Map Portable Text decorators to Tiptap mark types
 */
const DECORATOR_TO_MARK: Record<string, string> = {
  strong: 'bold',
  em: 'italic',
  underline: 'underline',
  strike: 'strike',
  code: 'code',
};

/**
 * Convert Portable Text content to Tiptap JSON format
 */
export function portableTextToTiptap(content: PortableTextContent): JSONContent {
  if (!Array.isArray(content) || content.length === 0) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    };
  }

  const doc: JSONContent = {
    type: 'doc',
    content: [],
  };

  // Group consecutive list items
  let currentList: {
    type: 'bulletList' | 'orderedList';
    items: PortableTextTextBlock[];
    level: number;
  } | null = null;

  for (const block of content) {
    if (block._type === 'block') {
      const textBlock = block as PortableTextTextBlock;

      // Handle list items
      if (textBlock.listItem) {
        const listType = textBlock.listItem === 'bullet' ? 'bulletList' : 'orderedList';
        const level = textBlock.level || 1;

        if (!currentList || currentList.type !== listType || currentList.level !== level) {
          // Flush previous list if any
          if (currentList) {
            doc.content!.push(createListNode(currentList));
          }
          currentList = { type: listType, items: [textBlock], level };
        } else {
          currentList.items.push(textBlock);
        }
        continue;
      }

      // Flush any pending list before non-list content
      if (currentList) {
        doc.content!.push(createListNode(currentList));
        currentList = null;
      }

      // Convert regular block
      doc.content!.push(convertTextBlockToTiptap(textBlock));
    } else {
      // Flush any pending list before custom block
      if (currentList) {
        doc.content!.push(createListNode(currentList));
        currentList = null;
      }

      // Handle custom blocks (image, code, etc.)
      doc.content!.push(convertCustomBlockToTiptap(block));
    }
  }

  // Flush any remaining list
  if (currentList) {
    doc.content!.push(createListNode(currentList));
  }

  return doc;
}

/**
 * Create a Tiptap list node from grouped list items
 */
function createListNode(list: {
  type: 'bulletList' | 'orderedList';
  items: PortableTextTextBlock[];
  level: number;
}): JSONContent {
  return {
    type: list.type,
    content: list.items.map((item) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: convertChildrenToTiptap(item.children, item.markDefs),
        },
      ],
    })),
  };
}

/**
 * Convert a Portable Text text block to Tiptap node
 */
function convertTextBlockToTiptap(block: PortableTextTextBlock): JSONContent {
  const nodeType = STYLE_TO_NODE_TYPE[block.style] || 'paragraph';

  const node: JSONContent = {
    type: nodeType,
    content: convertChildrenToTiptap(block.children, block.markDefs),
  };

  // Add heading level attribute
  if (nodeType === 'heading') {
    const level = parseInt(block.style.replace('h', ''), 10);
    node.attrs = { level };
  }

  return node;
}

/**
 * Convert Portable Text children to Tiptap content
 */
function convertChildrenToTiptap(
  children: PortableTextChild[],
  markDefs: PortableTextMarkDef[]
): JSONContent[] {
  if (!children || children.length === 0) {
    return [];
  }

  const markDefMap = new Map(markDefs?.map((m) => [m._key, m]) || []);

  return children.map((child) => {
    if (child._type === 'span') {
      const span = child as PortableTextSpan;
      const textNode: JSONContent = {
        type: 'text',
        text: span.text,
      };

      // Convert marks
      if (span.marks && span.marks.length > 0) {
        textNode.marks = span.marks.map((markKey) => {
          // Check if it's a decorator
          if (DECORATOR_TO_MARK[markKey]) {
            return { type: DECORATOR_TO_MARK[markKey] };
          }

          // Check if it's a mark definition reference
          const markDef = markDefMap.get(markKey);
          if (markDef) {
            if (markDef._type === 'link') {
              return {
                type: 'link',
                attrs: {
                  href: (markDef as { href: string }).href,
                  target: (markDef as { blank?: boolean }).blank ? '_blank' : null,
                },
              };
            }
            // Custom mark type
            return {
              type: markDef._type,
              attrs: { ...markDef },
            };
          }

          return { type: markKey };
        });
      }

      return textNode;
    }

    // Handle inline objects (mentions, etc.)
    return {
      type: child._type,
      attrs: { ...child },
    };
  });
}

/**
 * Convert a custom Portable Text block to Tiptap node
 */
function convertCustomBlockToTiptap(block: PortableTextBlock): JSONContent {
  // Handle specific built-in block types
  switch (block._type) {
    case 'image':
      return {
        type: 'image',
        attrs: {
          asset: (block as { asset?: unknown }).asset,
          alt: (block as { alt?: string }).alt || '',
          caption: (block as { caption?: string }).caption || '',
          alignment: (block as { alignment?: string }).alignment || 'center',
        },
      };

    case 'codeBlock':
      return {
        type: 'codeBlock',
        attrs: {
          language: (block as { language?: string }).language || 'plaintext',
          filename: (block as { filename?: string }).filename || '',
        },
        content: [
          {
            type: 'text',
            text: (block as { code?: string }).code || '',
          },
        ],
      };

    case 'video':
      return {
        type: 'video',
        attrs: {
          source: (block as { source?: string }).source || 'url',
          asset: (block as { asset?: unknown }).asset,
          url: (block as { url?: string }).url || '',
          caption: (block as { caption?: string }).caption || '',
        },
      };

    default:
      // Generic custom block
      return {
        type: block._type,
        attrs: { ...block },
      };
  }
}

// =============================================================================
// Tiptap to Portable Text Conversion (T023)
// =============================================================================

/**
 * Map Tiptap node types to Portable Text block styles
 */
const NODE_TYPE_TO_STYLE: Record<string, PortableTextBlockStyle> = {
  paragraph: 'normal',
  heading: 'normal', // Will be overridden based on level
  blockquote: 'blockquote',
};

/**
 * Map Tiptap mark types to Portable Text decorators
 */
const MARK_TO_DECORATOR: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  underline: 'underline',
  strike: 'strike',
  code: 'code',
};

/**
 * Generate a unique key
 */
function generateKey(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Convert Tiptap JSON content to Portable Text format
 */
export function tiptapToPortableText(doc: JSONContent): PortableTextContent {
  if (!doc.content || doc.content.length === 0) {
    return [];
  }

  const blocks: PortableTextContent = [];

  for (const node of doc.content) {
    const converted = convertTiptapNodeToPortableText(node);
    if (converted) {
      if (Array.isArray(converted)) {
        blocks.push(...converted);
      } else {
        blocks.push(converted);
      }
    }
  }

  return blocks;
}

/**
 * Convert a Tiptap node to Portable Text block(s)
 */
function convertTiptapNodeToPortableText(
  node: JSONContent
): PortableTextBlock | PortableTextBlock[] | null {
  switch (node.type) {
    case 'paragraph':
    case 'heading':
    case 'blockquote':
      return convertTextNodeToPortableText(node);

    case 'bulletList':
    case 'orderedList':
      return convertListToPortableText(node);

    case 'codeBlock':
      return {
        _key: generateKey(),
        _type: 'codeBlock',
        code: node.content?.map((c) => c.text || '').join('') || '',
        language: node.attrs?.language || 'plaintext',
      };

    case 'image':
      return {
        _key: generateKey(),
        _type: 'image',
        asset: node.attrs?.asset || { _type: 'reference', _ref: '' },
        alt: node.attrs?.alt,
        caption: node.attrs?.caption,
        alignment: node.attrs?.alignment,
      };

    case 'video':
      return {
        _key: generateKey(),
        _type: 'video',
        source: node.attrs?.source || 'url',
        asset: node.attrs?.asset,
        url: node.attrs?.url,
        caption: node.attrs?.caption,
      };

    default:
      // Handle custom blocks
      if (node.attrs?._type) {
        return {
          _key: node.attrs._key || generateKey(),
          ...node.attrs,
        } as PortableTextBlock;
      }
      return null;
  }
}

/**
 * Convert a text-based Tiptap node to Portable Text block
 */
function convertTextNodeToPortableText(node: JSONContent): PortableTextTextBlock {
  const { children, markDefs } = convertTiptapContentToChildren(node.content || []);

  let style: PortableTextBlockStyle = 'normal';

  if (node.type === 'heading') {
    const level = node.attrs?.level || 1;
    style = `h${level}` as PortableTextBlockStyle;
  } else if (node.type === 'blockquote') {
    style = 'blockquote';
  }

  return {
    _key: generateKey(),
    _type: 'block',
    style,
    children,
    markDefs,
  };
}

/**
 * Convert a Tiptap list to Portable Text blocks
 */
function convertListToPortableText(node: JSONContent): PortableTextBlock[] {
  const listType = node.type === 'bulletList' ? 'bullet' : 'number';
  const blocks: PortableTextTextBlock[] = [];

  const processListItems = (items: JSONContent[], level: number) => {
    for (const item of items) {
      if (item.type === 'listItem' && item.content) {
        for (const child of item.content) {
          if (child.type === 'paragraph') {
            const { children, markDefs } = convertTiptapContentToChildren(child.content || []);
            blocks.push({
              _key: generateKey(),
              _type: 'block',
              style: 'normal',
              listItem: listType,
              level,
              children,
              markDefs,
            });
          } else if (child.type === 'bulletList' || child.type === 'orderedList') {
            // Nested list
            processListItems(child.content || [], level + 1);
          }
        }
      }
    }
  };

  processListItems(node.content || [], 1);
  return blocks;
}

/**
 * Convert Tiptap content array to Portable Text children and markDefs
 */
function convertTiptapContentToChildren(content: JSONContent[]): {
  children: PortableTextChild[];
  markDefs: PortableTextMarkDef[];
} {
  const children: PortableTextChild[] = [];
  const markDefs: PortableTextMarkDef[] = [];
  const markDefMap = new Map<string, string>(); // href -> key

  for (const node of content) {
    if (node.type === 'text') {
      const span: PortableTextSpan = {
        _key: generateKey(),
        _type: 'span',
        text: node.text || '',
        marks: [],
      };

      // Convert marks
      if (node.marks) {
        for (const mark of node.marks) {
          if (MARK_TO_DECORATOR[mark.type]) {
            span.marks.push(MARK_TO_DECORATOR[mark.type]);
          } else if (mark.type === 'link') {
            // Create or reuse link markDef
            const href = mark.attrs?.href || '';
            let markKey = markDefMap.get(href);

            if (!markKey) {
              markKey = generateKey();
              markDefMap.set(href, markKey);
              markDefs.push({
                _key: markKey,
                _type: 'link',
                href,
                blank: mark.attrs?.target === '_blank',
              } as PortableTextMarkDef);
            }

            span.marks.push(markKey);
          } else {
            // Custom mark
            const markKey = generateKey();
            markDefs.push({
              _key: markKey,
              _type: mark.type,
              ...mark.attrs,
            } as PortableTextMarkDef);
            span.marks.push(markKey);
          }
        }
      }

      children.push(span);
    } else if (node.type === 'hardBreak') {
      // Add a newline character
      children.push({
        _key: generateKey(),
        _type: 'span',
        text: '\n',
        marks: [],
      });
    } else {
      // Inline object
      children.push({
        _key: node.attrs?._key || generateKey(),
        _type: node.type,
        ...node.attrs,
      } as PortableTextChild);
    }
  }

  // Ensure at least one child
  if (children.length === 0) {
    children.push({
      _key: generateKey(),
      _type: 'span',
      text: '',
      marks: [],
    });
  }

  return { children, markDefs };
}

// =============================================================================
// Editor Helpers
// =============================================================================

/**
 * Create an empty Portable Text document
 */
export function createEmptyDocument(): PortableTextContent {
  return [
    {
      _key: generateKey(),
      _type: 'block',
      style: 'normal',
      children: [
        {
          _key: generateKey(),
          _type: 'span',
          text: '',
          marks: [],
        },
      ],
      markDefs: [],
    },
  ];
}

/**
 * Check if content is effectively empty
 */
export function isContentEmpty(content: PortableTextContent): boolean {
  if (!Array.isArray(content) || content.length === 0) {
    return true;
  }

  return content.every((block) => {
    if (block._type !== 'block') {
      return false; // Custom blocks count as content
    }

    const textBlock = block as PortableTextTextBlock;
    return textBlock.children.every((child) => {
      if (child._type !== 'span') {
        return false; // Inline objects count as content
      }
      return (child as PortableTextSpan).text.trim() === '';
    });
  });
}
