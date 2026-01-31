'use client';

/**
 * HOOPERITS CMS - Custom Block Component
 *
 * Generic node view for custom blocks defined in schema.
 * Renders form fields based on block configuration.
 */

import { useState, useCallback, useMemo } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import type { PortableTextBlockConfig, FieldDefinition } from '@hooperits/cms';

interface CustomBlockViewProps extends NodeViewProps {
  blockConfig: PortableTextBlockConfig;
}

/**
 * Create a CustomBlock view component for a specific block configuration
 */
export function createCustomBlockView(blockConfig: PortableTextBlockConfig) {
  return function CustomBlockView(props: NodeViewProps) {
    return <CustomBlockViewInner {...props} blockConfig={blockConfig} />;
  };
}

function CustomBlockViewInner({
  node,
  updateAttributes,
  selected,
  deleteNode,
  blockConfig,
}: CustomBlockViewProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get preview information from config
  const previewTitle = useMemo(() => {
    if (blockConfig.preview) {
      const selection: Record<string, unknown> = {};
      for (const [key, fieldPath] of Object.entries(blockConfig.preview.select)) {
        selection[key] = node.attrs[fieldPath] ?? '';
      }
      return blockConfig.preview.prepare(selection).title;
    }
    return blockConfig.title || blockConfig.type;
  }, [node.attrs, blockConfig]);

  const previewSubtitle = useMemo(() => {
    if (blockConfig.preview) {
      const selection: Record<string, unknown> = {};
      for (const [key, fieldPath] of Object.entries(blockConfig.preview.select)) {
        selection[key] = node.attrs[fieldPath] ?? '';
      }
      return blockConfig.preview.prepare(selection).subtitle || null;
    }
    return null;
  }, [node.attrs, blockConfig]);

  const handleFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      updateAttributes({ [fieldName]: value });
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper className="custom-block my-4">
      <div
        className={`rounded-lg overflow-hidden border ${
          selected ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2' : 'border-gray-300'
        }`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            {blockConfig.icon && (
              <span className="text-gray-500">{blockConfig.icon}</span>
            )}
            <div>
              <span className="font-medium text-gray-900 text-sm">
                {previewTitle}
              </span>
              {previewSubtitle && (
                <span className="text-gray-500 text-xs ml-2">{previewSubtitle}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteNode();
              }}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove block"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
            <ChevronIcon
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Fields */}
        {isExpanded && (
          <div className="p-4 space-y-4 bg-white">
            {Object.entries(blockConfig.fields).map(([fieldName, fieldDef]) => (
              <CustomBlockField
                key={fieldName}
                fieldName={fieldName}
                field={fieldDef}
                value={node.attrs[fieldName]}
                onChange={(value) => handleFieldChange(fieldName, value)}
              />
            ))}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

interface CustomBlockFieldProps {
  fieldName: string;
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

/**
 * Render a single field within a custom block
 */
function CustomBlockField({ fieldName, field, value, onChange }: CustomBlockFieldProps) {
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {options.description && (
            <p className="mt-1 text-xs text-gray-500">{options.description}</p>
          )}
        </div>
      );

    case 'number':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {options.label}
            {options.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            min={options.min}
            max={options.max}
            step={options.step}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            rows={4}
            placeholder={(options as { placeholder?: string }).placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {options.description && (
            <p className="mt-1 text-xs text-gray-500">{options.description}</p>
          )}
        </div>
      );

    default:
      // Fallback for unsupported field types
      return (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Unsupported field type: <code>{type}</code> for field{' '}
            <strong>{options.label}</strong>
          </p>
          <pre className="mt-2 text-xs text-gray-600 overflow-auto">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      );
  }
}

/**
 * Unknown/fallback block view for removed or unrecognized block types
 */
export function UnknownBlockView({ node, selected, deleteNode }: NodeViewProps) {
  return (
    <NodeViewWrapper className="unknown-block my-4">
      <div
        className={`rounded-lg overflow-hidden border ${
          selected ? 'border-orange-500 ring-2 ring-orange-500 ring-offset-2' : 'border-orange-300'
        }`}
      >
        <div className="flex items-center justify-between px-3 py-2 bg-orange-50 border-b border-orange-200">
          <div className="flex items-center gap-2">
            <WarningIcon className="w-5 h-5 text-orange-500" />
            <span className="font-medium text-orange-900 text-sm">
              Unknown Block: {node.type.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => deleteNode()}
            className="p-1 text-orange-400 hover:text-red-500 transition-colors"
            title="Remove block"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 bg-orange-50/50">
          <p className="text-sm text-orange-700 mb-2">
            This block type is not recognized. It may have been removed from the schema.
          </p>
          <details className="text-xs">
            <summary className="cursor-pointer text-orange-600 hover:text-orange-800">
              View raw data
            </summary>
            <pre className="mt-2 p-2 bg-white rounded border border-orange-200 overflow-auto">
              {JSON.stringify(node.attrs, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

/**
 * Get preview value from attributes using template or field reference
 */
function getPreviewValue(attrs: Record<string, unknown>, template: string): string {
  // Simple field reference (e.g., "title")
  if (!template.includes('{')) {
    return String(attrs[template] || '');
  }

  // Template with placeholders (e.g., "{{title}} - {{subtitle}}")
  return template.replace(/\{\{(\w+)\}\}/g, (_, field) => {
    const value = attrs[field];
    return value !== undefined ? String(value) : '';
  });
}

// Icons
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

export default CustomBlockViewInner;
