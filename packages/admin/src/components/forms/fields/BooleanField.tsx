'use client';

/**
 * HOOPERITS CMS - Boolean Field Component
 */

import type { BooleanFieldOptions } from '@hooperits/cms';

interface BooleanFieldProps {
  name: string;
  options: BooleanFieldOptions;
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
}

export function BooleanField({ name, options, value, onChange, error }: BooleanFieldProps) {
  return (
    <div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={value ?? options.default ?? false}
          onChange={(e) => onChange(e.target.checked)}
          disabled={options.readOnly}
          className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
            options.readOnly ? 'opacity-50' : ''
          }`}
        />
        <label htmlFor={name} className="ml-2 block text-sm text-gray-700">
          {options.label}
          {options.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      {options.description && (
        <p className="mt-1 text-sm text-gray-500 ml-6">{options.description}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600 ml-6">{error}</p>}
    </div>
  );
}
