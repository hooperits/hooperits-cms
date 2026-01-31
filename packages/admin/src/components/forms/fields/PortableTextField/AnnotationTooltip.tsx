'use client';

/**
 * HOOPERITS CMS - Annotation Tooltip Component
 *
 * Displays annotation details when hovering over annotated text in the editor.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';

export interface AnnotationData {
  type: string;
  key: string;
  attrs: Record<string, unknown>;
}

interface AnnotationTooltipProps {
  editor: Editor | null;
  onEdit?: (annotation: AnnotationData) => void;
  onRemove?: (annotation: AnnotationData) => void;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  annotations: AnnotationData[];
}

/**
 * Extract annotations from editor marks at current position
 */
function getAnnotationsAtPosition(editor: Editor): AnnotationData[] {
  const { state } = editor;
  const { from, to } = state.selection;
  const annotations: AnnotationData[] = [];

  // Check marks at cursor position
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.marks) {
      for (const mark of node.marks) {
        // Check if this is an annotation mark (has _key attribute)
        if (mark.attrs._key) {
          const existing = annotations.find(
            (a) => a.key === mark.attrs._key && a.type === mark.type.name
          );
          if (!existing) {
            annotations.push({
              type: mark.type.name,
              key: mark.attrs._key,
              attrs: mark.attrs,
            });
          }
        }
      }
    }
  });

  return annotations;
}

/**
 * Format annotation for display
 */
function formatAnnotation(annotation: AnnotationData): {
  label: string;
  description: string;
  color: string;
} {
  switch (annotation.type) {
    case 'comment':
      return {
        label: 'Comment',
        description: (annotation.attrs.text as string) || 'No comment text',
        color: annotation.attrs.resolved ? 'bg-green-100' : 'bg-yellow-100',
      };
    case 'highlight':
      return {
        label: 'Highlight',
        description: `Color: ${(annotation.attrs.color as string) || 'yellow'}`,
        color: `bg-${(annotation.attrs.color as string) || 'yellow'}-100`,
      };
    case 'internalLink':
      return {
        label: 'Internal Link',
        description: `Reference: ${(annotation.attrs.reference as string) || 'Unknown'}`,
        color: 'bg-blue-100',
      };
    default:
      return {
        label: annotation.type,
        description: JSON.stringify(annotation.attrs),
        color: 'bg-gray-100',
      };
  }
}

export function AnnotationTooltip({
  editor,
  onEdit,
  onRemove,
}: AnnotationTooltipProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    annotations: [],
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = useCallback(
    (x: number, y: number, annotations: AnnotationData[]) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setTooltip({ visible: true, x, y, annotations });
    },
    []
  );

  const hideTooltip = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setTooltip((prev) => ({ ...prev, visible: false }));
    }, 200);
  }, []);

  const keepTooltipVisible = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Listen for selection changes to show/hide tooltip
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const annotations = getAnnotationsAtPosition(editor);

      if (annotations.length > 0) {
        // Get cursor position for tooltip placement
        const { view } = editor;
        const { from } = view.state.selection;
        const coords = view.coordsAtPos(from);

        showTooltip(coords.left, coords.bottom + 8, annotations);
      } else {
        hideTooltip();
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, showTooltip, hideTooltip]);

  // Handle click outside to hide tooltip
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip((prev) => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!tooltip.visible || tooltip.annotations.length === 0) {
    return null;
  }

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2 max-w-sm"
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
      }}
      onMouseEnter={keepTooltipVisible}
      onMouseLeave={hideTooltip}
    >
      <div className="space-y-2">
        {tooltip.annotations.map((annotation) => {
          const { label, description, color } = formatAnnotation(annotation);

          return (
            <div
              key={`${annotation.type}-${annotation.key}`}
              className={`p-2 rounded ${color}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-700">
                  {label}
                </span>
                <div className="flex gap-1">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(annotation)}
                      className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
                      title="Edit annotation"
                    >
                      <EditIcon className="w-3 h-3" />
                    </button>
                  )}
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(annotation)}
                      className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-red-100"
                      title="Remove annotation"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {description}
              </p>

              {/* Show additional metadata for comments */}
              {annotation.type === 'comment' && Boolean(annotation.attrs.author) && (
                <p className="text-xs text-gray-500 mt-1 italic">
                  — {String(annotation.attrs.author)}
                </p>
              )}

              {/* Resolved indicator */}
              {annotation.type === 'comment' && Boolean(annotation.attrs.resolved) && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                  <CheckIcon className="w-3 h-3" />
                  Resolved
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Multiple annotations indicator */}
      {tooltip.annotations.length > 1 && (
        <p className="text-xs text-gray-500 mt-2 text-center border-t pt-2">
          {tooltip.annotations.length} annotations at this position
        </p>
      )}
    </div>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export default AnnotationTooltip;
