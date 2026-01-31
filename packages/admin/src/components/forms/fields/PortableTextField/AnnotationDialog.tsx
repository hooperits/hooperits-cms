'use client';

/**
 * HOOPERITS CMS - Annotation Dialog Component
 *
 * Modal dialog for creating and editing annotations with configurable fields.
 */

import { useState, useEffect, useCallback } from 'react';
import type { PortableTextAnnotationConfig, FieldDefinition } from '@hooperits/cms';

// =============================================================================
// Types
// =============================================================================

export interface AnnotationData {
  _type: string;
  _key: string;
  [key: string]: unknown;
}

interface AnnotationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AnnotationData) => void;
  onRemove?: () => void;
  annotationConfig: PortableTextAnnotationConfig;
  initialData?: Partial<AnnotationData>;
  selectedText?: string;
}

// =============================================================================
// Component
// =============================================================================

export function AnnotationDialog({
  isOpen,
  onClose,
  onSave,
  onRemove,
  annotationConfig,
  initialData,
  selectedText,
}: AnnotationDialogProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const isEditing = !!initialData?._key;

  // Initialize form data from config defaults and initial data
  useEffect(() => {
    if (isOpen) {
      const defaults: Record<string, unknown> = {};
      for (const [fieldName, fieldDef] of Object.entries(annotationConfig.fields)) {
        defaults[fieldName] = initialData?.[fieldName] ?? fieldDef.options?.default ?? '';
      }
      setFormData(defaults);
    }
  }, [isOpen, annotationConfig, initialData]);

  const handleFieldChange = useCallback((fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const data: AnnotationData = {
        _type: annotationConfig.type,
        _key: initialData?._key || generateKey(),
        ...formData,
      };
      onSave(data);
      onClose();
    },
    [annotationConfig.type, formData, initialData, onSave, onClose]
  );

  const handleRemove = useCallback(() => {
    onRemove?.();
    onClose();
  }, [onRemove, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Edit' : 'Add'} {annotationConfig.title || annotationConfig.type}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Selected text preview */}
        {selectedText && (
          <div className="px-4 py-2 bg-gray-50 border-b">
            <p className="text-sm text-gray-500">Selected text:</p>
            <p className="text-sm text-gray-700 italic truncate">&quot;{selectedText}&quot;</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-4 space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(annotationConfig.fields).map(([fieldName, fieldDef]) => (
              <AnnotationField
                key={fieldName}
                fieldName={fieldName}
                field={fieldDef}
                value={formData[fieldName]}
                onChange={(value) => handleFieldChange(fieldName, value)}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 rounded-b-lg">
            <div>
              {isEditing && onRemove && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove annotation
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isEditing ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// Field Component
// =============================================================================

interface AnnotationFieldProps {
  fieldName: string;
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

function AnnotationField({ fieldName, field, value, onChange }: AnnotationFieldProps) {
  const { type, options } = field;

  switch (type) {
    case 'text':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {options.label}
            {options.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={options.placeholder}
            required={options.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {options.description && (
            <p className="mt-1 text-xs text-gray-500">{options.description}</p>
          )}
        </div>
      );

    case 'richText':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {options.label}
            {options.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={(options as { placeholder?: string }).placeholder}
            required={options.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {options.description && (
            <p className="mt-1 text-xs text-gray-500">{options.description}</p>
          )}
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">
            {options.label}
          </label>
          {options.description && (
            <span className="text-xs text-gray-500">({options.description})</span>
          )}
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {options.label}
            {options.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            required={options.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {options.options?.map((opt: { value: string; label: string }) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {options.description && (
            <p className="mt-1 text-xs text-gray-500">{options.description}</p>
          )}
        </div>
      );

    default:
      return (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            Unsupported field type: <code>{type}</code>
          </p>
        </div>
      );
  }
}

// =============================================================================
// Icons
// =============================================================================

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function generateKey(): string {
  return Math.random().toString(36).substring(2, 10);
}

export default AnnotationDialog;
