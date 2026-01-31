'use client';

/**
 * HOOPERITS CMS - Rich Text Field Component
 *
 * @deprecated Use PortableTextField instead for full rich text editing support.
 * This component is maintained for backwards compatibility only.
 * Migration: Change field type from 'richText' to 'portableText' in your schema.
 *
 * Basic textarea implementation - limited functionality.
 */

import { useEffect } from 'react';
import type { RichTextFieldOptions } from '@hooperits/cms';

interface RichTextFieldProps {
  name: string;
  options: RichTextFieldOptions;
  value: string | object;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * @deprecated Use PortableTextField for rich text editing.
 * This component will be removed in a future version.
 */
export function RichTextField({ name, options, value, onChange, error }: RichTextFieldProps) {
  // Deprecation warning in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[HOOPERITS CMS] RichTextField is deprecated. Use PortableTextField instead.
Field: "${name}"
Migration: Change field type from 'richText' to 'portableText' in your content type schema.`
      );
    }
  }, [name]);

  // Handle as plain text. For full rich text editing, use PortableTextField.
  const textValue = typeof value === 'object' ? JSON.stringify(value) : (value || '');

  return (
    <div>
      {/* Deprecation notice */}
      <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-xs text-amber-700">
          <strong>Deprecated:</strong> This field uses the legacy RichTextField.
          Consider migrating to <code className="bg-amber-100 px-1 rounded">portableText</code> type for full editor support.
        </p>
      </div>

      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {options.label}
        {options.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {options.description && (
        <p className="mt-1 text-sm text-gray-500">{options.description}</p>
      )}
      <textarea
        id={name}
        name={name}
        value={textValue}
        onChange={(e) => onChange(e.target.value)}
        required={options.required}
        readOnly={options.readOnly}
        rows={8}
        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${options.readOnly ? 'bg-gray-100' : ''}`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
