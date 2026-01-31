/**
 * HOOPERITS CMS - Mention Suggestion Extension
 *
 * Implements @mention autocomplete using @tiptap/suggestion.
 */

import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionOptions, type SuggestionProps } from '@tiptap/suggestion';
import { PluginKey } from 'prosemirror-state';

// =============================================================================
// Types
// =============================================================================

export interface MentionSuggestionItem {
  id: string;
  displayName: string;
  contentType: string;
  description?: string;
}

export interface MentionSuggestionOptions {
  /**
   * Trigger character
   * @default '@'
   */
  trigger?: string;

  /**
   * Function to search for mention items
   */
  search: (query: string) => Promise<MentionSuggestionItem[]>;

  /**
   * Render the suggestion popup
   */
  render: () => {
    onStart: (props: SuggestionProps<MentionSuggestionItem>) => void;
    onUpdate: (props: SuggestionProps<MentionSuggestionItem>) => void;
    onExit: () => void;
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
  };

  /**
   * Content types to search
   */
  contentTypes?: string[];
}

// =============================================================================
// Extension
// =============================================================================

export const MentionSuggestion = Extension.create<MentionSuggestionOptions>({
  name: 'mentionSuggestion',

  addOptions() {
    return {
      trigger: '@',
      search: async () => [],
      render: () => ({
        onStart: () => {},
        onUpdate: () => {},
        onExit: () => {},
        onKeyDown: () => false,
      }),
    };
  },

  addProseMirrorPlugins() {
    const { search, render, trigger } = this.options;

    return [
      Suggestion({
        pluginKey: new PluginKey('mentionSuggestion'),
        editor: this.editor,
        char: trigger || '@',

        items: async ({ query }) => {
          return search(query);
        },

        command: ({ editor, range, props }) => {
          // Insert the mention node
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: 'mention',
              attrs: {
                _type: 'mention',
                reference: {
                  _type: 'reference',
                  _ref: props.id,
                  _contentType: props.contentType,
                },
                displayName: props.displayName,
              },
            })
            .run();
        },

        render,
      }),
    ];
  },
});

// =============================================================================
// Helper: Create search function
// =============================================================================

/**
 * Create a search function that queries the CMS API
 */
export function createMentionSearch(
  apiEndpoint: string,
  contentTypes?: string[]
): (query: string) => Promise<MentionSuggestionItem[]> {
  return async (query: string) => {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query,
        limit: '10',
      });

      if (contentTypes && contentTypes.length > 0) {
        params.set('types', contentTypes.join(','));
      }

      const response = await fetch(`${apiEndpoint}?${params}`);

      if (!response.ok) {
        console.error('Mention search failed:', response.statusText);
        return [];
      }

      const data = await response.json();

      return (data.items || []).map((item: {
        id: string;
        title?: string;
        name?: string;
        contentType: string;
        description?: string;
      }) => ({
        id: item.id,
        displayName: item.title || item.name || item.id,
        contentType: item.contentType,
        description: item.description,
      }));
    } catch (error) {
      console.error('Mention search error:', error);
      return [];
    }
  };
}
