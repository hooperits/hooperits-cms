'use client';

/**
 * HOOPERITS CMS - Number Field Component
 */

import type { NumberFieldOptions } from '@hooperits/cms';

interface NumberFieldProps {
  name: string;
  options: NumberFieldOptions;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: string;
}

export function NumberField({ name, options, value, onChange, error }: NumberFieldProps) {
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
        type="number"
        id={name}
        name={name}
        value={value ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? undefined : parseFloat(val));
        }}
        min={options.min}
        max={options.max}
        step={options.step ?? (options.integer ? 1 : 'any')}
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
