'use client';

/**
 * HOOPERITS CMS - Dynamic Form Component
 * Renders form fields based on schema definition
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FieldDefinition, SlugFieldOptions } from '@hooperits/cms';
import { TextField } from './fields/TextField';
import { RichTextField } from './fields/RichTextField';
import { NumberField } from './fields/NumberField';
import { BooleanField } from './fields/BooleanField';
import { DateField } from './fields/DateField';
import { SlugField } from './fields/SlugField';
import { SelectField } from './fields/SelectField';

interface DynamicFormProps {
  contentTypeId: string;
  contentTypeName: string;
  schema: Record<string, FieldDefinition>;
  initialData: Record<string, unknown>;
  contentId?: string;
  initialStatus?: 'DRAFT' | 'PUBLISHED';
  initialSlug?: string | null;
}

export function DynamicForm({
  contentTypeName,
  schema,
  initialData,
  contentId,
  initialStatus = 'DRAFT',
  initialSlug,
}: DynamicFormProps) {
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  const [status, setStatus] = useState(initialStatus);
  const [slug, setSlug] = useState(initialSlug || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateField = (name: string, value: unknown) => {
    setData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveError('');

    try {
      const url = contentId
        ? `/api/cms/content/${contentTypeName}/${contentId}`
        : `/api/cms/content/${contentTypeName}`;

      const method = contentId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          status,
          slug: slug || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.details?.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const err of result.error.details.errors) {
            fieldErrors[err.field] = err.message;
          }
          setErrors(fieldErrors);
        } else {
          setSaveError(result.error?.message || 'Failed to save');
        }
        return;
      }

      // Navigate back to list on success
      router.push(`/content/${contentTypeName}`);
      router.refresh();
    } catch {
      setSaveError('An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (!contentId) return;
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contentId) return;

    setLoading(true);
    setShowDeleteConfirm(false);
    try {
      const response = await fetch(`/api/cms/content/${contentTypeName}/${contentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        setSaveError(result.error?.message || 'Failed to delete');
        return;
      }

      router.push(`/content/${contentTypeName}`);
      router.refresh();
    } catch {
      setSaveError('An error occurred while deleting');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (name: string, field: FieldDefinition) => {
    const value = data[name];

    switch (field.type) {
      case 'text':
        return (
          <TextField
            key={name}
            name={name}
            options={field.options}
            value={value as string}
            onChange={(v) => updateField(name, v)}
            error={errors[name]}
          />
        );

      case 'richText':
        return (
          <RichTextField
            key={name}
            name={name}
            options={field.options}
            value={value as string}
            onChange={(v) => updateField(name, v)}
            error={errors[name]}
          />
        );

      case 'number':
        return (
          <NumberField
            key={name}
            name={name}
            options={field.options}
            value={value as number}
            onChange={(v) => updateField(name, v)}
            error={errors[name]}
          />
        );

      case 'boolean':
        return (
          <BooleanField
            key={name}
            name={name}
            options={field.options}
            value={value as boolean}
            onChange={(v) => updateField(name, v)}
            error={errors[name]}
          />
        );

      case 'date':
        return (
          <DateField
            key={name}
            name={name}
            options={field.options}
            value={value as string}
            onChange={(v) => updateField(name, v)}
            error={errors[name]}
          />
        );

      case 'datetime':
        return (
          <DateField
            key={name}
            name={name}
            options={field.options}
            value={value as string}
            onChange={(v) => updateField(name, v)}
            error={errors[name]}
            includeTime
          />
        );

      case 'slug':
        return (
          <SlugField
            key={name}
            name={name}
            options={field.options}
            value={value as string}
            onChange={(v) => updateField(name, v)}
            error={errors[name]}
            sourceValue={
              (field.options as SlugFieldOptions).from
                ? (data[(field.options as SlugFieldOptions).from!] as string)
                : undefined
            }
          />
        );

      case 'select':
        return (
          <SelectField
            key={name}
            name={name}
            options={field.options}
            value={value as string}
            onChange={(v) => updateField(name, v)}
            error={errors[name]}
          />
        );

      case 'image':
      case 'file':
        // Placeholder for media picker (implemented in Phase 6)
        return (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700">
              {field.options.label}
            </label>
            <p className="text-sm text-gray-500">
              Media picker (coming soon)
            </p>
          </div>
        );

      case 'reference':
        // Placeholder for reference picker
        return (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700">
              {field.options.label}
            </label>
            <p className="text-sm text-gray-500">
              Reference picker (coming soon)
            </p>
          </div>
        );

      case 'array':
        // Placeholder for array field
        return (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700">
              {field.options.label}
            </label>
            <p className="text-sm text-gray-500">
              Array field (coming soon)
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-content-title"
        >
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h2 id="delete-content-title" className="text-lg font-semibold mb-2">
              Delete content?
            </h2>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. This content will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
            {saveError}
          </div>
        )}

      {/* Schema Fields */}
      {Object.entries(schema).map(([name, field]) => (
        <div key={name}>{renderField(name, field)}</div>
      ))}

      {/* Slug Field */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          URL Slug
        </label>
        <input
          type="text"
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="optional-url-slug"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <div className="mt-2 flex gap-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="status"
              value="DRAFT"
              checked={status === 'DRAFT'}
              onChange={() => setStatus('DRAFT')}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Draft</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="status"
              value="PUBLISHED"
              checked={status === 'PUBLISHED'}
              onChange={() => setStatus('PUBLISHED')}
              className="form-radio h-4 w-4 text-green-600"
            />
            <span className="ml-2">Published</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {contentId && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={loading}
              className="px-4 py-2 text-red-600 hover:text-red-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            >
              Delete
            </button>
          )}
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loading ? 'Saving...' : contentId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
      </form>
    </>
  );
}
