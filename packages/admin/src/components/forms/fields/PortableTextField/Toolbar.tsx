'use client';

/**
 * HOOPERITS CMS - Portable Text Editor Toolbar
 *
 * Formatting toolbar with buttons for text styles, lists, and links.
 */

import type { Editor } from '@tiptap/core';
import { Fragment } from 'react';

interface ToolbarProps {
  editor: Editor | null;
  onLinkClick: () => void;
  allowedStyles?: string[];
  allowedDecorators?: string[];
  allowedLists?: string[];
}

interface ToolbarButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  isActive: () => boolean;
  shortcut?: string;
}

interface ToolbarGroup {
  id: string;
  buttons: ToolbarButton[];
}

export function Toolbar({
  editor,
  onLinkClick,
  allowedStyles = ['normal', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'],
  allowedDecorators = ['strong', 'em', 'underline', 'strike', 'code'],
  allowedLists = ['bullet', 'number'],
}: ToolbarProps) {
  if (!editor) return null;

  // Format decorators
  const formatButtons: ToolbarButton[] = [];

  if (allowedDecorators.includes('strong')) {
    formatButtons.push({
      id: 'bold',
      label: 'Bold',
      shortcut: 'Ctrl+B',
      icon: <BoldIcon />,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    });
  }

  if (allowedDecorators.includes('em')) {
    formatButtons.push({
      id: 'italic',
      label: 'Italic',
      shortcut: 'Ctrl+I',
      icon: <ItalicIcon />,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    });
  }

  if (allowedDecorators.includes('underline')) {
    formatButtons.push({
      id: 'underline',
      label: 'Underline',
      shortcut: 'Ctrl+U',
      icon: <UnderlineIcon />,
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline'),
    });
  }

  if (allowedDecorators.includes('strike')) {
    formatButtons.push({
      id: 'strike',
      label: 'Strikethrough',
      icon: <StrikeIcon />,
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
    });
  }

  if (allowedDecorators.includes('code')) {
    formatButtons.push({
      id: 'code',
      label: 'Code',
      icon: <CodeIcon />,
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive('code'),
    });
  }

  // Heading styles
  const styleButtons: ToolbarButton[] = [];

  if (allowedStyles.includes('normal')) {
    styleButtons.push({
      id: 'paragraph',
      label: 'Normal',
      icon: <span className="text-xs font-medium">P</span>,
      action: () => editor.chain().focus().setParagraph().run(),
      isActive: () => editor.isActive('paragraph'),
    });
  }

  (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).forEach((heading) => {
    if (allowedStyles.includes(heading)) {
      const level = parseInt(heading.replace('h', ''), 10) as 1 | 2 | 3 | 4 | 5 | 6;
      styleButtons.push({
        id: heading,
        label: `Heading ${level}`,
        icon: <span className="text-xs font-medium">H{level}</span>,
        action: () => editor.chain().focus().toggleHeading({ level }).run(),
        isActive: () => editor.isActive('heading', { level }),
      });
    }
  });

  if (allowedStyles.includes('blockquote')) {
    styleButtons.push({
      id: 'blockquote',
      label: 'Quote',
      icon: <QuoteIcon />,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote'),
    });
  }

  // List buttons
  const listButtons: ToolbarButton[] = [];

  if (allowedLists.includes('bullet')) {
    listButtons.push({
      id: 'bulletList',
      label: 'Bullet List',
      icon: <BulletListIcon />,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
    });
  }

  if (allowedLists.includes('number')) {
    listButtons.push({
      id: 'orderedList',
      label: 'Numbered List',
      icon: <OrderedListIcon />,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
    });
  }

  // Link button
  const linkButton: ToolbarButton = {
    id: 'link',
    label: 'Link',
    shortcut: 'Ctrl+K',
    icon: <LinkIcon />,
    action: onLinkClick,
    isActive: () => editor.isActive('link'),
  };

  // Build toolbar groups
  const groups: ToolbarGroup[] = [];

  if (formatButtons.length > 0) {
    groups.push({ id: 'format', buttons: formatButtons });
  }

  if (styleButtons.length > 0) {
    groups.push({ id: 'styles', buttons: styleButtons });
  }

  if (listButtons.length > 0) {
    groups.push({ id: 'lists', buttons: listButtons });
  }

  groups.push({ id: 'link', buttons: [linkButton] });

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
      {groups.map((group, index) => (
        <Fragment key={group.id}>
          {index > 0 && <div className="w-px h-6 bg-gray-300 mx-1" />}
          <div className="flex items-center gap-0.5">
            {group.buttons.map((button) => (
              <ToolbarButtonComponent key={button.id} button={button} />
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function ToolbarButtonComponent({ button }: { button: ToolbarButton }) {
  const isActive = button.isActive();
  return (
    <button
      type="button"
      onClick={button.action}
      className={`p-1.5 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors ${
        isActive ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
      }`}
      title={button.shortcut ? `${button.label} (${button.shortcut})` : button.label}
      aria-label={button.label}
      aria-pressed={isActive}
    >
      {button.icon}
    </button>
  );
}

// Icons (inline SVG for simplicity)
function BoldIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
    </svg>
  );
}

function StrikeIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  );
}
