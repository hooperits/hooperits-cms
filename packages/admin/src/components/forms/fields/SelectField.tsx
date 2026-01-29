'use client';

/**
 * HOOPERITS CMS - Select Field Component
 */

import type { SelectFieldOptions } from '@hooperits/cms';

interface SelectFieldProps {
  name: string;
  options: SelectFieldOptions;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  error?: string;
}

export function SelectField({ name, options, value, onChange, error }: SelectFieldProps) {
  const isMultiple = options.multiple ?? false;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {options.label}
        {options.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {options.description && (
        <p className="mt-1 text-sm text-gray-500">{options.description}</p>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => {
          if (isMultiple) {
            const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
            onChange(selected);
          } else {
            onChange(e.target.value);
          }
        }}
        multiple={isMultiple}
        required={options.required}
        disabled={options.readOnly}
        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${options.readOnly ? 'bg-gray-100' : ''}`}
      >
        {!isMultiple && !options.required && (
          <option value="">Select an option...</option>
        )}
        {options.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
