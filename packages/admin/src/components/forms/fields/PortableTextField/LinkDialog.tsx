'use client';

/**
 * HOOPERITS CMS - Link Dialog Component
 *
 * Modal dialog for inserting and editing links.
 */

import { useState, useEffect, useRef } from 'react';

interface LinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LinkData) => void;
  initialData?: LinkData | null;
}

export interface LinkData {
  href: string;
  title?: string;
  blank?: boolean;
}

export function LinkDialog({ isOpen, onClose, onSubmit, initialData }: LinkDialogProps) {
  const [href, setHref] = useState('');
  const [title, setTitle] = useState('');
  const [blank, setBlank] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setHref(initialData?.href || '');
      setTitle(initialData?.title || '');
      setBlank(initialData?.blank || false);
      setError('');
      // Focus input after a short delay (for animation)
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialData]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setError('URL is required');
      return false;
    }

    // Check for unsafe protocols
    const lowercaseUrl = url.toLowerCase().trim();
    if (lowercaseUrl.startsWith('javascript:') || lowercaseUrl.startsWith('data:')) {
      setError('URL protocol not allowed');
      return false;
    }

    // Allow relative URLs, mailto, tel, and valid http(s) URLs
    const isRelative = url.startsWith('/') || url.startsWith('#');
    const isMailto = lowercaseUrl.startsWith('mailto:');
    const isTel = lowercaseUrl.startsWith('tel:');
    const isHttp = lowercaseUrl.startsWith('http://') || lowercaseUrl.startsWith('https://');

    if (!isRelative && !isMailto && !isTel && !isHttp) {
      // Try to validate as a full URL by adding protocol
      try {
        new URL('https://' + url);
      } catch {
        setError('Invalid URL format');
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUrl(href)) {
      return;
    }

    // Auto-add https:// if no protocol specified
    let finalHref = href.trim();
    if (
      !finalHref.startsWith('http://') &&
      !finalHref.startsWith('https://') &&
      !finalHref.startsWith('/') &&
      !finalHref.startsWith('#') &&
      !finalHref.startsWith('mailto:') &&
      !finalHref.startsWith('tel:')
    ) {
      finalHref = 'https://' + finalHref;
    }

    onSubmit({
      href: finalHref,
      title: title.trim() || undefined,
      blank,
    });
    onClose();
  };

  const handleRemoveLink = () => {
    onSubmit({ href: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 id="link-dialog-title" className="text-lg font-semibold text-gray-900">
            {initialData?.href ? 'Edit Link' : 'Insert Link'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="link-href" className="block text-sm font-medium text-gray-700 mb-1">
              URL <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              id="link-href"
              value={href}
              onChange={(e) => {
                setHref(e.target.value);
                if (error) setError('');
              }}
              placeholder="https://example.com or /page"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>

          <div>
            <label htmlFor="link-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              id="link-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Link title for accessibility"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Appears as a tooltip when hovering over the link
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="link-blank"
              checked={blank}
              onChange={(e) => setBlank(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="link-blank" className="ml-2 text-sm text-gray-700">
              Open in new tab
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {initialData?.href && (
                <button
                  type="button"
                  onClick={handleRemoveLink}
                  className="text-sm text-red-600 hover:text-red-800 focus:outline-none focus:underline"
                >
                  Remove link
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {initialData?.href ? 'Update' : 'Insert'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
