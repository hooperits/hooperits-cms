'use client';

/**
 * HOOPERITS CMS - Date Field Component
 */

import type { DateFieldOptions, DateTimeFieldOptions } from '@hooperits/cms';

interface DateFieldProps {
  name: string;
  options: DateFieldOptions | DateTimeFieldOptions;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  includeTime?: boolean;
}

export function DateField({
  name,
  options,
  value,
  onChange,
  error,
  includeTime = false,
}: DateFieldProps) {
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
        type={includeTime ? 'datetime-local' : 'date'}
        id={name}
        name={name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        min={options.min}
        max={options.max}
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
