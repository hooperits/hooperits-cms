'use client';

/**
 * HOOPERITS CMS - Code Block Component
 *
 * Node view for code blocks with syntax highlighting and language selection.
 */

import { useState, useCallback } from 'react';
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';

// Common programming languages
const LANGUAGES = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'dockerfile', label: 'Dockerfile' },
];

interface CodeBlockAttributes {
  language?: string;
  filename?: string;
}

export function CodeBlockView({ node, updateAttributes, selected, extension }: NodeViewProps) {
  const attrs = node.attrs as CodeBlockAttributes;
  const [isEditingFilename, setIsEditingFilename] = useState(false);

  const handleLanguageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateAttributes({ language: e.target.value });
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper className="code-block my-4">
      <div
        className={`relative rounded-lg overflow-hidden border ${
          selected ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2' : 'border-gray-300'
        }`}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-800 text-gray-300 text-sm">
          <div className="flex items-center gap-2">
            {/* Window dots (decorative) */}
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
            </div>

            {/* Filename */}
            {isEditingFilename ? (
              <input
                type="text"
                value={attrs.filename || ''}
                onChange={(e) => updateAttributes({ filename: e.target.value })}
                onBlur={() => setIsEditingFilename(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    setIsEditingFilename(false);
                  }
                }}
                autoFocus
                placeholder="filename.ext"
                className="bg-gray-700 text-gray-200 px-2 py-0.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <span
                onClick={() => selected && setIsEditingFilename(true)}
                className={`text-xs ${selected ? 'cursor-pointer hover:text-white' : ''}`}
              >
                {attrs.filename || (selected ? 'Click to add filename' : '')}
              </span>
            )}
          </div>

          {/* Language selector */}
          <select
            value={attrs.language || 'plaintext'}
            onChange={handleLanguageChange}
            className="bg-gray-700 text-gray-200 px-2 py-0.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            contentEditable={false}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Code content */}
        <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm font-mono">
          <code className={`language-${attrs.language || 'plaintext'}`}>
            <NodeViewContent />
          </code>
        </pre>

        {/* Copy button */}
        <button
          type="button"
          onClick={() => {
            const code = node.textContent;
            navigator.clipboard.writeText(code);
          }}
          className="absolute top-12 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          title="Copy code"
          contentEditable={false}
        >
          <CopyIcon className="w-4 h-4" />
        </button>
      </div>
    </NodeViewWrapper>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

export default CodeBlockView;
