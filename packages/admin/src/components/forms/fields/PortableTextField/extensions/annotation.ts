/**
 * HOOPERITS CMS - Annotation Extension Factory
 *
 * Creates Tiptap mark extensions for custom annotations.
 */

import { Mark, mergeAttributes } from '@tiptap/core';
import type { PortableTextAnnotationConfig } from '@hooperits/cms';

// =============================================================================
// Types
// =============================================================================

export interface AnnotationExtensionOptions {
  annotationConfig: PortableTextAnnotationConfig;
  onActivate?: (markDef: Record<string, unknown>) => void;
  onDeactivate?: () => void;
}

// =============================================================================
// Extension Factory
// =============================================================================

/**
 * Create an annotation Tiptap mark extension from schema configuration
 */
export function createAnnotationExtension(options: AnnotationExtensionOptions) {
  const { annotationConfig } = options;

  return Mark.create({
    name: annotationConfig.type,

    // Annotations can span other marks (strong, em, etc.)
    spanning: true,

    // Allow overlapping annotations
    inclusive: true,

    // Exclude from input rules
    excludes: '',

    // Define attributes from schema fields
    addAttributes() {
      const attrs: Record<string, { default: unknown; parseHTML?: (el: HTMLElement) => unknown }> = {
        _key: {
          default: null,
          parseHTML: (element) => element.getAttribute('data-mark-key'),
        },
      };

      // Add fields from annotation config
      for (const [fieldName, fieldDef] of Object.entries(annotationConfig.fields)) {
        attrs[fieldName] = {
          default: fieldDef.options?.default ?? null,
          parseHTML: (element) => element.getAttribute(`data-${toKebabCase(fieldName)}`),
        };
      }

      return attrs;
    },

    parseHTML() {
      return [
        {
          tag: `span[data-annotation="${annotationConfig.type}"]`,
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      const attrs: Record<string, string> = {
        'data-annotation': annotationConfig.type,
        class: `annotation annotation-${annotationConfig.type}`,
      };

      // Add data attributes for each field
      for (const [key, value] of Object.entries(HTMLAttributes)) {
        if (key !== 'class' && value !== null && value !== undefined) {
          const kebabKey = toKebabCase(key);
          if (kebabKey === '_key') {
            attrs['data-mark-key'] = String(value);
          } else if (!kebabKey.startsWith('_')) {
            attrs[`data-${kebabKey}`] = String(value);
          }
        }
      }

      return ['span', mergeAttributes(attrs, { class: HTMLAttributes.class })];
    },

    // Note: Custom commands can be added by extending this extension
    // Use editor.chain().setMark('annotationName', attrs).run() directly
  });
}

// =============================================================================
// Built-in Annotations
// =============================================================================

/**
 * Comment annotation - for editorial comments
 */
export const CommentAnnotation = Mark.create({
  name: 'comment',

  spanning: true,
  inclusive: true,
  excludes: '',

  addAttributes() {
    return {
      _key: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-mark-key'),
      },
      text: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-comment-text') || '',
      },
      author: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-comment-author') || '',
      },
      createdAt: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-created-at'),
      },
      resolved: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-comment-resolved') === 'true',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-annotation="comment"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({
        'data-annotation': 'comment',
        'data-mark-key': HTMLAttributes._key,
        'data-comment-text': HTMLAttributes.text,
        'data-comment-author': HTMLAttributes.author,
        'data-comment-created-at': HTMLAttributes.createdAt,
        'data-comment-resolved': HTMLAttributes.resolved ? 'true' : 'false',
        class: `annotation annotation-comment ${HTMLAttributes.resolved ? 'resolved' : ''}`,
      }),
      0,
    ];
  },
});

/**
 * Highlight annotation - for text highlighting
 */
export const HighlightAnnotation = Mark.create({
  name: 'highlight',

  spanning: true,
  inclusive: true,
  excludes: '',

  addAttributes() {
    return {
      _key: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-mark-key'),
      },
      color: {
        default: 'yellow',
        parseHTML: (element) => element.getAttribute('data-highlight-color') || 'yellow',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-annotation="highlight"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const colorClasses: Record<string, string> = {
      yellow: 'bg-yellow-200',
      green: 'bg-green-200',
      blue: 'bg-blue-200',
      pink: 'bg-pink-200',
      purple: 'bg-purple-200',
    };

    const colorClass = colorClasses[HTMLAttributes.color] || colorClasses.yellow;

    return [
      'span',
      mergeAttributes({
        'data-annotation': 'highlight',
        'data-mark-key': HTMLAttributes._key,
        'data-highlight-color': HTMLAttributes.color,
        class: `annotation annotation-highlight ${colorClass}`,
      }),
      0,
    ];
  },
});

// =============================================================================
// Helpers
// =============================================================================

/**
 * Convert camelCase to kebab-case
 */
function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
