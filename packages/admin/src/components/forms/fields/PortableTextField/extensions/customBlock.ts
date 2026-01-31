/**
 * HOOPERITS CMS - Custom Block Extension Factory
 *
 * Creates dynamic Tiptap extensions for custom block types defined in schema.
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import type { PortableTextBlockConfig } from '@hooperits/cms';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>;

interface CustomBlockExtensionOptions {
  blockConfig: PortableTextBlockConfig;
  component: AnyComponent;
}

/**
 * Create a custom block Tiptap extension from schema configuration
 */
export function createCustomBlockExtension(options: CustomBlockExtensionOptions) {
  const { blockConfig, component } = options;

  return Node.create({
    name: blockConfig.type,

    group: 'block',

    atom: true,

    draggable: true,

    // Define attributes from schema fields
    addAttributes() {
      const attrs: Record<string, { default: unknown }> = {};

      // Iterate over fields record
      for (const [fieldName, fieldDef] of Object.entries(blockConfig.fields)) {
        attrs[fieldName] = {
          default: fieldDef.options?.default ?? getDefaultForType(fieldDef.type),
        };
      }

      // Always include _type for serialization
      attrs._type = {
        default: blockConfig.type,
      };

      return attrs;
    },

    parseHTML() {
      return [
        {
          tag: `div[data-block-type="${blockConfig.type}"]`,
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'div',
        mergeAttributes(HTMLAttributes, { 'data-block-type': blockConfig.type }),
      ];
    },

    addNodeView() {
      return ReactNodeViewRenderer(component);
    },
  });
}

/**
 * Get default value for a field type
 */
function getDefaultForType(type: string): unknown {
  switch (type) {
    case 'text':
    case 'richText':
    case 'slug':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'date':
    case 'datetime':
      return null;
    case 'image':
    case 'file':
    case 'reference':
      return null;
    case 'array':
      return [];
    case 'select':
      return '';
    default:
      return null;
  }
}

/**
 * Create multiple custom block extensions from an array of configurations
 */
export function createCustomBlockExtensions(
  configs: PortableTextBlockConfig[],
  componentFactory: (config: PortableTextBlockConfig) => AnyComponent
) {
  return configs.map((config) =>
    createCustomBlockExtension({
      blockConfig: config,
      component: componentFactory(config),
    })
  );
}
