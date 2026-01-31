/**
 * HOOPERITS CMS - Slash Commands Extension
 *
 * Tiptap extension for "/" triggered block insertion menu.
 */

import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { BlockMenu, type BlockMenuItem, getDefaultBlockMenuItems } from '../BlockMenu';

export interface SlashCommandsOptions {
  suggestion: Partial<SuggestionOptions<BlockMenuItem>>;
  items?: BlockMenuItem[];
  onImageInsert?: () => void;
  onVideoInsert?: () => void;
}

export const SlashCommands = Extension.create<SlashCommandsOptions>({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
      items: undefined,
      onImageInsert: undefined,
      onVideoInsert: undefined,
    };
  },

  addProseMirrorPlugins() {
    const { items, onImageInsert, onVideoInsert } = this.options;
    const menuItems = items || getDefaultBlockMenuItems(onImageInsert, onVideoInsert);

    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }) => {
          return menuItems.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
          );
        },
        render: () => {
          let component: ReactRenderer | null = null;
          let popup: TippyInstance[] | null = null;

          return {
            onStart: (props) => {
              component = new ReactRenderer(BlockMenu, {
                props: {
                  ...props,
                  command: (item: BlockMenuItem) => {
                    props.command(item);
                  },
                },
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                theme: 'light-border',
                maxWidth: 320,
              });
            },

            onUpdate: (props) => {
              component?.updateProps({
                ...props,
                command: (item: BlockMenuItem) => {
                  props.command(item);
                },
              });

              if (!props.clientRect) {
                return;
              }

              popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              });
            },

            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
              }

              // Let the BlockMenu handle arrow keys and enter
              if (['ArrowUp', 'ArrowDown', 'Enter'].includes(props.event.key)) {
                return true;
              }

              return false;
            },

            onExit: () => {
              popup?.[0]?.destroy();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});

export default SlashCommands;
