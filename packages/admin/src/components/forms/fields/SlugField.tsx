'use client';

/**
 * HOOPERITS CMS - Slug Field Component
 */

import type { SlugFieldOptions } from '@hooperits/cms';
import { generateSlug } from '@hooperits/cms';

interface SlugFieldProps {
  name: string;
  options: SlugFieldOptions;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  sourceValue?: string;
}

export function SlugField({
  name,
  options,
  value,
  onChange,
  error,
  sourceValue,
}: SlugFieldProps) {
  const handleGenerate = () => {
    if (sourceValue) {
      onChange(generateSlug(sourceValue));
    }
  };

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {options.label}
        {options.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {options.description && (
        <p className="mt-1 text-sm text-gray-500">{options.description}</p>
      )}
      <div className="mt-1 flex rounded-md shadow-sm">
        <input
          type="text"
          id={name}
          name={name}
          value={value || ''}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          maxLength={options.maxLength}
          required={options.required}
          readOnly={options.readOnly}
          className={`flex-1 block w-full px-3 py-2 border rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${options.readOnly ? 'bg-gray-100' : ''}`}
          placeholder="url-friendly-slug"
        />
        {options.from && sourceValue && (
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
          >
            Generate
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
