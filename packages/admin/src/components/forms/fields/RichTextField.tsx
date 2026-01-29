'use client';

/**
 * HOOPERITS CMS - Rich Text Field Component
 * Basic textarea implementation (ProseMirror integration in v2)
 */

import type { RichTextFieldOptions } from '@hooperits/cms';

interface RichTextFieldProps {
  name: string;
  options: RichTextFieldOptions;
  value: string | object;
  onChange: (value: string) => void;
  error?: string;
}

export function RichTextField({ name, options, value, onChange, error }: RichTextFieldProps) {
  // For now, handle as plain text. Full ProseMirror integration in v2
  const textValue = typeof value === 'object' ? JSON.stringify(value) : (value || '');

  return (
    <div>
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
