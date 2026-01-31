/**
 * HOOPERITS CMS - Inline Object Extension Factory
 *
 * Creates Tiptap extensions for inline objects (mentions, variables, etc.)
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import type { PortableTextInlineConfig } from '@hooperits/cms';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>;

interface InlineObjectExtensionOptions {
  inlineConfig: PortableTextInlineConfig;
  component: AnyComponent;
}

/**
 * Create an inline object Tiptap extension from schema configuration
 */
export function createInlineObjectExtension(options: InlineObjectExtensionOptions) {
  const { inlineConfig, component } = options;

  return Node.create({
    name: inlineConfig.type,

    group: 'inline',

    inline: true,

    atom: true,

    selectable: true,

    draggable: false,

    // Define attributes from schema fields
    addAttributes() {
      const attrs: Record<string, { default: unknown }> = {};

      for (const [fieldName, fieldDef] of Object.entries(inlineConfig.fields)) {
        attrs[fieldName] = {
          default: fieldDef.options?.default ?? null,
        };
      }

      // Always include _type for serialization
      attrs._type = {
        default: inlineConfig.type,
      };

      return attrs;
    },

    parseHTML() {
      return [
        {
          tag: `span[data-inline-type="${inlineConfig.type}"]`,
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          'data-inline-type': inlineConfig.type,
          class: 'inline-object',
        }),
      ];
    },

    addNodeView() {
      return ReactNodeViewRenderer(component);
    },
  });
}

/**
 * Built-in Mention inline object extension
 */
export const MentionExtension = Node.create({
  name: 'mention',

  group: 'inline',

  inline: true,

  atom: true,

  selectable: true,

  addAttributes() {
    return {
      _type: {
        default: 'mention',
      },
      reference: {
        default: null,
        parseHTML: (element) => {
          const ref = element.getAttribute('data-ref');
          const type = element.getAttribute('data-content-type');
          return ref ? { _type: 'reference', _ref: ref, _contentType: type } : null;
        },
        renderHTML: (attributes) => {
          if (attributes.reference?._ref) {
            return {
              'data-ref': attributes.reference._ref,
              'data-content-type': attributes.reference._contentType || '',
            };
          }
          return {};
        },
      },
      displayName: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-display-name') || '',
        renderHTML: (attributes) => ({
          'data-display-name': attributes.displayName || '',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-inline-type="mention"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-inline-type': 'mention',
        class: 'mention',
      }),
      `@${node.attrs.displayName || 'Unknown'}`,
    ];
  },
});

/**
 * Built-in Variable inline object extension
 */
export const VariableExtension = Node.create({
  name: 'variable',

  group: 'inline',

  inline: true,

  atom: true,

  selectable: true,

  addAttributes() {
    return {
      _type: {
        default: 'variable',
      },
      name: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-variable-name') || '',
        renderHTML: (attributes) => ({
          'data-variable-name': attributes.name || '',
        }),
      },
      fallback: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-fallback') || '',
        renderHTML: (attributes) => {
          if (attributes.fallback) {
            return { 'data-fallback': attributes.fallback };
          }
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-inline-type="variable"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-inline-type': 'variable',
        class: 'variable',
      }),
      `{{${node.attrs.name || 'variable'}}}`,
    ];
  },
});
