'use client';

/**
 * HOOPERITS CMS - Dynamic Form Component
 * Renders form fields based on schema definition with auto-save
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAutoSave, checkAllRecovery, type RecoverableData } from '@hooperits/client';
import { RecoveryPrompt } from '@/components/versioning';
import type { FieldDefinition, SlugFieldOptions, SchemaDefinition } from '@hooperits/cms';
import { TextField } from './fields/TextField';
import { RichTextField } from './fields/RichTextField';
import { NumberField } from './fields/NumberField';
import { BooleanField } from './fields/BooleanField';
import { DateField } from './fields/DateField';
import { SlugField } from './fields/SlugField';
import { SelectField } from './fields/SelectField';
import { PortableTextField } from './fields/PortableTextField';
import { ConditionalFieldWrapper } from './ConditionalFieldWrapper';
import { HiddenFieldCleanupDialog } from './HiddenFieldCleanupDialog';
import { FieldGroupsRenderer } from './FieldGroupsRenderer';
import { useFieldVisibility } from './hooks/useFieldVisibility';
import { useCrossFieldValidation } from './hooks/useCrossFieldValidation';
import type { PortableTextContent, PortableTextFieldOptions } from '@hooperits/cms';

/**
 * Convert legacy richText (HTML string) to basic Portable Text format
 * This allows migration from old richText fields to new portableText fields
 */
function migrateRichTextToPortableText(value: unknown): PortableTextContent | null {
  // If already Portable Text format (array of blocks), return as-is
  if (Array.isArray(value)) {
    return value as PortableTextContent;
  }

  // If it's a string (legacy HTML/text), convert to basic Portable Text
  if (typeof value === 'string' && value.trim()) {
    // Split by newlines and create paragraph blocks
    const paragraphs = value.split(/\n\n|\n/).filter((p) => p.trim());

    return paragraphs.map((text, index) => ({
      _type: 'block' as const,
      _key: `migrated-${index}`,
      style: 'normal' as const,
      markDefs: [],
      children: [
        {
          _type: 'span' as const,
          _key: `migrated-span-${index}`,
          text: text.trim(),
          marks: [],
        },
      ],
    }));
  }

  return null;
}

interface DynamicFormProps {
  contentTypeId: string;
  contentTypeName: string;
  schema: Record<string, FieldDefinition>;
  /** Full schema definition with groups, layout, validation (Spec 007) */
  schemaDefinition?: SchemaDefinition;
  initialData: Record<string, unknown>;
  contentId?: string;
  initialStatus?: 'DRAFT' | 'PUBLISHED';
  initialSlug?: string | null;
}

export function DynamicForm({
  contentTypeName,
  schema,
  schemaDefinition,
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

  // Auto-save state
  const [recoverable, setRecoverable] = useState<RecoverableData | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);

  // Hidden field cleanup state (Spec 007)
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [pendingCleanupFields, setPendingCleanupFields] = useState<string[]>([]);

  // Build a minimal SchemaDefinition for visibility evaluation if not provided
  const effectiveSchema = useMemo((): SchemaDefinition => {
    if (schemaDefinition) {
      return schemaDefinition;
    }
    // Create a minimal schema from the fields
    return {
      name: contentTypeName,
      label: contentTypeName,
      labelPlural: contentTypeName,
      fields: schema,
    };
  }, [schemaDefinition, schema, contentTypeName]);

  // Field visibility hook (Spec 007)
  const {
    isFieldHidden,
    fieldsNeedingCleanup,
    clearCleanupQueue,
  } = useFieldVisibility({
    schema: effectiveSchema,
    data,
    onFieldsNeedCleanup: (fields) => {
      if (fields.length > 0) {
        setPendingCleanupFields(fields);
        setShowCleanupDialog(true);
      }
    },
  });

  // Get field labels for cleanup dialog
  const fieldLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const [name, field] of Object.entries(schema)) {
      labels[name] = field.options.label;
    }
    return labels;
  }, [schema]);

  // Handle keeping hidden field values
  const handleKeepHiddenValues = useCallback(() => {
    clearCleanupQueue();
    setPendingCleanupFields([]);
  }, [clearCleanupQueue]);

  // Handle clearing hidden field values
  const handleClearHiddenValues = useCallback(() => {
    setData((prev) => {
      const updated = { ...prev };
      for (const fieldName of pendingCleanupFields) {
        updated[fieldName] = undefined;
      }
      return updated;
    });
    clearCleanupQueue();
    setPendingCleanupFields([]);
  }, [pendingCleanupFields, clearCleanupQueue]);

  // Cross-field validation hook (Spec 007)
  const {
    isValid: isCrossFieldValid,
    isValidating,
    getFieldErrors: getCrossFieldErrors,
    validateNow,
  } = useCrossFieldValidation({
    schema: effectiveSchema,
    data,
    debounceMs: 300,
  });

  // Combine local errors with cross-field validation errors
  const getFieldError = useCallback(
    (fieldName: string): string => {
      // Local errors take precedence
      if (errors[fieldName]) {
        return errors[fieldName];
      }
      // Then cross-field validation errors
      const crossFieldErrors = getCrossFieldErrors(fieldName);
      return crossFieldErrors.length > 0 ? crossFieldErrors[0] : '';
    },
    [errors, getCrossFieldErrors]
  );

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    return isCrossFieldValid && !isValidating && !loading;
  }, [isCrossFieldValid, isValidating, loading]);

  // Auto-save hook (only for existing content)
  const autoSave = useAutoSave({
    contentId: contentId || 'new',
    contentType: contentTypeName,
    debounceMs: 3000,
    enableLocalBackup: true,
    onError: (error) => console.warn('Auto-save failed:', error),
  });

  // Check for recovery on mount
  useEffect(() => {
    if (!contentId) return;

    checkAllRecovery(contentTypeName, contentId).then((recovered) => {
      if (recovered) {
        const isNewer = recovered.savedAt > new Date(initialData.updatedAt as string || 0);
        if (isNewer) {
          setRecoverable(recovered);
          setShowRecovery(true);
        }
      }
    });
  }, [contentId, contentTypeName, initialData]);

  // Trigger auto-save on data changes (only for existing content)
  useEffect(() => {
    if (!contentId) return;
    if (JSON.stringify(data) === JSON.stringify(initialData)) return;
    autoSave.triggerSave(data);
  }, [data, contentId, initialData, autoSave]);

  const handleRecover = useCallback(() => {
    if (recoverable) {
      setData(recoverable.data);
      setShowRecovery(false);
      autoSave.clearRecovery();
    }
  }, [recoverable, autoSave]);

  const handleDiscardRecovery = useCallback(() => {
    setShowRecovery(false);
    autoSave.clearRecovery();
  }, [autoSave]);

  const updateField = (name: string, value: unknown) => {
    setData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submitting (Spec 007)
    const validationResult = validateNow();
    if (!validationResult.isValid) {
      setSaveError('Please fix the validation errors before saving');
      return;
    }

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
            error={getFieldError(name)}
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
            error={getFieldError(name)}
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
            error={getFieldError(name)}
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
            error={getFieldError(name)}
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
            error={getFieldError(name)}
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
            error={getFieldError(name)}
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
            error={getFieldError(name)}
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
            error={getFieldError(name)}
            documentData={data}
          />
        );

      case 'portableText': {
        // Support migration from legacy richText string data to Portable Text
        const portableTextValue = migrateRichTextToPortableText(value);
        return (
          <PortableTextField
            key={name}
            name={name}
            options={field.options as PortableTextFieldOptions}
            value={portableTextValue}
            onChange={(v) => updateField(name, v)}
            error={getFieldError(name)}
          />
        );
      }

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
      {/* Recovery Prompt */}
      <RecoveryPrompt
        isOpen={showRecovery}
        recoverable={recoverable}
        currentData={data}
        onRecover={handleRecover}
        onDiscard={handleDiscardRecovery}
        onClose={() => setShowRecovery(false)}
      />

      {/* Hidden Field Cleanup Dialog (Spec 007) */}
      <HiddenFieldCleanupDialog
        isOpen={showCleanupDialog}
        fieldNames={pendingCleanupFields}
        fieldLabels={fieldLabels}
        onKeep={handleKeepHiddenValues}
        onClear={handleClearHiddenValues}
        onClose={() => setShowCleanupDialog(false)}
      />

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

      {/* Schema Fields with groups, conditional visibility, and validation (Spec 007) */}
      {effectiveSchema.groups && effectiveSchema.groups.length > 0 ? (
        <FieldGroupsRenderer
          schema={effectiveSchema}
          renderField={(name) => {
            const field = schema[name];
            if (!field) return null;
            return (
              <ConditionalFieldWrapper
                key={name}
                fieldName={name}
                isHidden={isFieldHidden(name)}
              >
                {renderField(name, field)}
              </ConditionalFieldWrapper>
            );
          }}
          fieldErrors={Object.fromEntries(
            Object.keys(schema).map((name) => [name, Boolean(getFieldError(name))])
          )}
          persistenceKey={`${contentTypeName}-groups`}
        />
      ) : (
        // No groups - render fields directly with visibility
        Object.entries(schema).map(([name, field]) => (
          <ConditionalFieldWrapper
            key={name}
            fieldName={name}
            isHidden={isFieldHidden(name)}
          >
            {renderField(name, field)}
          </ConditionalFieldWrapper>
        ))
      )}

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
        <div className="flex items-center gap-4">
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
          {/* Validation indicator (Spec 007) */}
          {isValidating && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-blue-600 rounded-full" />
              Validating...
            </span>
          )}
          {!isValidating && !isCrossFieldValid && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <span className="h-2 w-2 bg-red-500 rounded-full" />
              Validation errors
            </span>
          )}
          {/* Auto-save indicator */}
          {contentId && !isValidating && isCrossFieldValid && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              {autoSave.isSaving && (
                <>
                  <span className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                  Saving...
                </>
              )}
              {!autoSave.isSaving && autoSave.isDirty && (
                <>
                  <span className="h-2 w-2 bg-yellow-500 rounded-full" />
                  Unsaved changes
                </>
              )}
              {!autoSave.isSaving && !autoSave.isDirty && autoSave.lastSavedAt && (
                <>
                  <span className="h-2 w-2 bg-green-500 rounded-full" />
                  Saved
                </>
              )}
            </span>
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
            disabled={!canSubmit}
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
