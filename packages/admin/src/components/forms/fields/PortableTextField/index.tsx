'use client';

/**
 * HOOPERITS CMS - Portable Text Field Component
 *
 * Full-featured rich text editor using Tiptap with Portable Text format.
 * Optimized for performance with debounced updates and memoized conversions.
 */

import { useCallback, useEffect, useState, useMemo, useRef, memo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import DOMPurify from 'dompurify';
import './editor.css';
import { Toolbar } from './Toolbar';
import { LinkDialog, type LinkData } from './LinkDialog';
import {
  portableTextToTiptap,
  tiptapToPortableText,
  createEmptyDocument,
  isContentEmpty,
} from '@/lib/portable-text/tiptap-config';
import type { PortableTextContent } from '@hooperits/cms';
import type { PortableTextFieldOptions } from '@hooperits/cms';

// Debounce timeout for onChange
const DEBOUNCE_MS = 150;

interface PortableTextFieldProps {
  name: string;
  options: PortableTextFieldOptions;
  value: PortableTextContent | null;
  onChange: (value: PortableTextContent) => void;
  error?: string;
}

export function PortableTextField({
  name,
  options,
  value,
  onChange,
  error,
}: PortableTextFieldProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkData, setLinkData] = useState<LinkData | null>(null);

  // Performance: Debounce onChange to reduce re-renders
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastValueRef = useRef<string>('');

  // Debounced onChange handler
  const debouncedOnChange = useCallback(
    (portableText: PortableTextContent) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Quick check: only call onChange if content actually changed
      const newValueStr = JSON.stringify(portableText);
      if (newValueStr === lastValueRef.current) {
        return;
      }

      debounceTimeoutRef.current = setTimeout(() => {
        lastValueRef.current = newValueStr;
        onChange(portableText);
      }, DEBOUNCE_MS);
    },
    [onChange]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Memoize initial content to prevent unnecessary re-renders
  const initialContent = useMemo(() => {
    return value && !isContentEmpty(value) ? portableTextToTiptap(value) : undefined;
  }, []); // Only compute once on mount

  // Initialize editor with Portable Text content converted to Tiptap format
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use custom code block in Phase 4
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: options.placeholder || 'Start writing...',
      }),
    ],
    content: initialContent,
    editable: !options.readOnly,
    // Performance: Disable transaction-based re-renders (we handle updates via onUpdate)
    shouldRerenderOnTransaction: false,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const portableText = tiptapToPortableText(json);
      debouncedOnChange(portableText);
    },
    // Keyboard shortcuts
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
        'data-testid': `portable-text-editor-${name}`,
      },
      handlePaste: (view, event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        // Get HTML content from clipboard
        const html = clipboardData.getData('text/html');

        if (html) {
          // Sanitize HTML with DOMPurify
          const sanitized = DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
              'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's',
              'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
              'ul', 'ol', 'li',
              'blockquote',
              'a', 'code', 'pre',
            ],
            ALLOWED_ATTR: ['href', 'target', 'title'],
            FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
            FORBID_ATTR: ['onclick', 'onerror', 'onload', 'style'],
          });

          if (sanitized) {
            // Let Tiptap handle the sanitized HTML
            const { state } = view;
            const { from, to } = state.selection;

            // Create a temporary element to parse sanitized HTML
            const temp = document.createElement('div');
            temp.innerHTML = sanitized;

            // Insert via editor API
            editor?.chain().focus().insertContent(temp.innerHTML).run();
            return true;
          }
        }

        // Fall back to plain text
        return false;
      },
    },
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (!editor) return;

    const currentContent = tiptapToPortableText(editor.getJSON());
    const isCurrentlyEmpty = isContentEmpty(currentContent);
    const isNewValueEmpty = !value || isContentEmpty(value);

    // Only update if content is truly different
    if (isCurrentlyEmpty && isNewValueEmpty) return;

    const currentJson = JSON.stringify(currentContent);
    const newJson = JSON.stringify(value);

    if (currentJson !== newJson) {
      const newContent = value && !isContentEmpty(value)
        ? portableTextToTiptap(value)
        : portableTextToTiptap(createEmptyDocument());

      editor.commands.setContent(newContent);
    }
  }, [value, editor]);

  // Link dialog handlers
  const handleLinkClick = useCallback(() => {
    if (!editor) return;

    // Check if there's an existing link
    const { href, title, target } = editor.getAttributes('link');

    if (href) {
      setLinkData({
        href,
        title,
        blank: target === '_blank',
      });
    } else {
      setLinkData(null);
    }

    setIsLinkDialogOpen(true);
  }, [editor]);

  const handleLinkSubmit = useCallback(
    (data: LinkData) => {
      if (!editor) return;

      if (!data.href) {
        // Remove link
        editor.chain().focus().unsetLink().run();
      } else {
        // Set or update link
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({
            href: data.href,
            target: data.blank ? '_blank' : undefined,
          })
          .run();
      }
    },
    [editor]
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleLinkClick();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [editor, handleLinkClick]);

  return (
    <div className="space-y-1">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {options.label}
        {options.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {options.description && (
        <p className="text-sm text-gray-500">{options.description}</p>
      )}

      <div
        className={`border rounded-md overflow-hidden ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${options.readOnly ? 'bg-gray-50' : 'bg-white'} focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500`}
      >
        <Toolbar
          editor={editor}
          onLinkClick={handleLinkClick}
          allowedStyles={options.styles}
          allowedDecorators={options.decorators}
          allowedLists={options.lists}
        />

        <EditorContent
          editor={editor}
          className="portable-text-editor"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <LinkDialog
        isOpen={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
        onSubmit={handleLinkSubmit}
        initialData={linkData}
      />
    </div>
  );
}

// Re-export for convenience
export { Toolbar } from './Toolbar';
export { LinkDialog, type LinkData } from './LinkDialog';
