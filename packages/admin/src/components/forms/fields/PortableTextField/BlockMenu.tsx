'use client';

/**
 * HOOPERITS CMS - Block Menu Component
 *
 * Slash command menu for inserting blocks (images, code, videos, etc.)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor, Range } from '@tiptap/core';
import type { PortableTextBlockConfig } from '@hooperits/cms';

export interface BlockMenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (props: { editor: Editor; range: Range }) => void;
}

interface BlockMenuProps {
  editor: Editor;
  items: BlockMenuItem[];
  command: (item: BlockMenuItem) => void;
}

export function BlockMenu({ items, command }: BlockMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    },
    [items, command]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectItem(selectedIndex);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items.length, selectedIndex, selectItem]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = menuRef.current?.children[selectedIndex] as HTMLElement;
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (items.length === 0) {
    return (
      <div className="block-menu bg-white rounded-lg shadow-lg border border-gray-200 p-3">
        <p className="text-sm text-gray-500">No matching blocks found</p>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="block-menu bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-80 overflow-y-auto"
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => selectItem(index)}
          className={`w-full flex items-start gap-3 p-3 text-left hover:bg-gray-50 transition-colors ${
            index === selectedIndex ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{item.title}</p>
            <p className="text-sm text-gray-500 truncate">{item.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// Default Block Menu Items
// =============================================================================

export function getDefaultBlockMenuItems(
  onImageInsert?: () => void,
  onVideoInsert?: () => void
): BlockMenuItem[] {
  return [
    {
      id: 'heading1',
      title: 'Heading 1',
      description: 'Large section heading',
      icon: <HeadingIcon level={1} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      id: 'heading2',
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: <HeadingIcon level={2} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      id: 'heading3',
      title: 'Heading 3',
      description: 'Small section heading',
      icon: <HeadingIcon level={3} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
      },
    },
    {
      id: 'bulletList',
      title: 'Bullet List',
      description: 'Create a simple bullet list',
      icon: <BulletListIcon />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      id: 'orderedList',
      title: 'Numbered List',
      description: 'Create a numbered list',
      icon: <OrderedListIcon />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      id: 'blockquote',
      title: 'Quote',
      description: 'Add a blockquote',
      icon: <QuoteIcon />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      id: 'codeBlock',
      title: 'Code Block',
      description: 'Add a code snippet with syntax highlighting',
      icon: <CodeIcon />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setCodeBlock().run();
      },
    },
    {
      id: 'image',
      title: 'Image',
      description: 'Upload or select an image',
      icon: <ImageIcon />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        onImageInsert?.();
      },
    },
    {
      id: 'video',
      title: 'Video',
      description: 'Embed a video from YouTube, Vimeo, or upload',
      icon: <VideoIcon />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        onVideoInsert?.();
      },
    },
    {
      id: 'horizontalRule',
      title: 'Divider',
      description: 'Add a horizontal divider',
      icon: <DividerIcon />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
  ];
}

// =============================================================================
// Icons
// =============================================================================

function HeadingIcon({ level }: { level: number }) {
  return (
    <span className="text-sm font-bold">H{level}</span>
  );
}

function BulletListIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
    </svg>
  );
}

function DividerIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 11h16v2H4z" />
    </svg>
  );
}

// Export icons for external use
export const BlockIcons = {
  HeadingIcon,
  BulletListIcon,
  OrderedListIcon,
  QuoteIcon,
  CodeIcon,
  ImageIcon,
  VideoIcon,
  DividerIcon,
};

// =============================================================================
// Custom Block Menu Items (T050)
// =============================================================================

/**
 * Create block menu items from custom block configurations
 */
export function createCustomBlockMenuItems(
  blockConfigs: PortableTextBlockConfig[]
): BlockMenuItem[] {
  return blockConfigs.map((config) => ({
    id: config.type,
    title: config.title || config.type,
    description: `Insert a ${config.title || config.type} block`,
    icon: config.icon ? (
      <CustomBlockIcon icon={config.icon} />
    ) : (
      <DefaultBlockIcon />
    ),
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: config.type,
          attrs: getDefaultAttrs(config),
        })
        .run();
    },
  }));
}

/**
 * Get default attributes for a custom block from its field definitions
 */
function getDefaultAttrs(config: PortableTextBlockConfig): Record<string, unknown> {
  const attrs: Record<string, unknown> = {
    _type: config.type,
  };

  // Iterate over fields record
  for (const [fieldName, fieldDef] of Object.entries(config.fields)) {
    if (fieldDef.options?.default !== undefined) {
      attrs[fieldName] = fieldDef.options.default;
    } else {
      // Default values by type
      switch (fieldDef.type) {
        case 'text':
        case 'richText':
        case 'slug':
          attrs[fieldName] = '';
          break;
        case 'number':
          attrs[fieldName] = 0;
          break;
        case 'boolean':
          attrs[fieldName] = false;
          break;
        default:
          attrs[fieldName] = null;
      }
    }
  }

  return attrs;
}

function CustomBlockIcon({ icon }: { icon: string }) {
  // If it's an emoji or short string, display directly
  if (icon.length <= 2) {
    return <span className="text-lg">{icon}</span>;
  }
  // Otherwise use as className (for icon fonts) or fallback
  return <span className={icon} />;
}

function DefaultBlockIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
      <path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z" />
    </svg>
  );
}

/**
 * Combine default and custom block menu items
 */
export function getAllBlockMenuItems(
  customBlocks: PortableTextBlockConfig[] = [],
  options?: {
    onImageInsert?: () => void;
    onVideoInsert?: () => void;
  }
): BlockMenuItem[] {
  const defaultItems = getDefaultBlockMenuItems(
    options?.onImageInsert,
    options?.onVideoInsert
  );
  const customItems = createCustomBlockMenuItems(customBlocks);

  // Insert custom blocks after divider but before the end
  const dividerIndex = defaultItems.findIndex((item) => item.id === 'horizontalRule');
  if (dividerIndex >= 0 && customItems.length > 0) {
    return [
      ...defaultItems.slice(0, dividerIndex),
      ...customItems,
      ...defaultItems.slice(dividerIndex),
    ];
  }

  return [...defaultItems, ...customItems];
}
