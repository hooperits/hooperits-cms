'use client';

/**
 * HOOPERITS CMS - Text Field Component
 */

import type { TextFieldOptions } from '@hooperits/cms';

interface TextFieldProps {
  name: string;
  options: TextFieldOptions;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TextField({ name, options, value, onChange, error }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {options.label}
        {options.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {options.description && (
        <p className="mt-1 text-sm text-gray-500">{options.description}</p>
      )}
      <input
        type="text"
        id={name}
        name={name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={options.placeholder}
        maxLength={options.maxLength}
        minLength={options.minLength}
        required={options.required}
        readOnly={options.readOnly}
        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${options.readOnly ? 'bg-gray-100' : ''}`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
