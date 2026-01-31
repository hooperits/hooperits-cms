'use client';

/**
 * HOOPERITS CMS - Mention Inline Component
 *
 * Inline node view for document mentions with reference links.
 */

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

interface MentionAttributes {
  _type: 'mention';
  reference?: {
    _type: 'reference';
    _ref: string;
    _contentType?: string;
  };
  displayName?: string;
}

export function MentionInlineView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as MentionAttributes;
  const displayName = attrs.displayName || 'Unknown';

  return (
    <NodeViewWrapper
      as="span"
      className={`mention-inline inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md text-sm font-medium cursor-pointer ${
        selected
          ? 'bg-blue-200 text-blue-900 ring-2 ring-blue-500 ring-offset-1'
          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      }`}
      data-mention-ref={attrs.reference?._ref}
      data-content-type={attrs.reference?._contentType}
    >
      <AtIcon className="w-3 h-3 mr-0.5 text-blue-600" />
      <span>{displayName}</span>
    </NodeViewWrapper>
  );
}

function AtIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
      />
    </svg>
  );
}

// =============================================================================
// Variable Inline Component
// =============================================================================

interface VariableAttributes {
  _type: 'variable';
  name?: string;
  fallback?: string;
}

export function VariableInlineView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as VariableAttributes;
  const name = attrs.name || 'variable';

  return (
    <NodeViewWrapper
      as="span"
      className={`variable-inline inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md text-sm font-mono cursor-pointer ${
        selected
          ? 'bg-purple-200 text-purple-900 ring-2 ring-purple-500 ring-offset-1'
          : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
      }`}
    >
      <span className="text-purple-500">{'{'}</span>
      <span>{name}</span>
      <span className="text-purple-500">{'}'}</span>
    </NodeViewWrapper>
  );
}

export default MentionInlineView;
