/**
 * HOOPERITS CMS - Preview Button
 * Button to generate and share preview links for draft content
 */

'use client';

import { useState } from 'react';

interface Props {
  contentId: string;
  contentType: string;
  disabled?: boolean;
}

interface PreviewToken {
  token: string;
  expiresAt: string;
  previewUrl: string;
}

export function PreviewButton({ contentId, contentType, disabled = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/cms/content/${contentType}/${contentId}/preview-token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresIn: '24h' }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Failed to generate preview');
      }

      const { data } = await response.json();
      setPreviewData(data);
      setIsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!previewData) return;

    try {
      await navigator.clipboard.writeText(previewData.previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = previewData.previewUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openPreview = () => {
    if (previewData) {
      window.open(previewData.previewUrl, '_blank');
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={generatePreview}
        disabled={disabled || isLoading}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border
          bg-white border-gray-300 text-gray-700 hover:bg-gray-50
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        {isLoading ? 'Generating...' : 'Preview'}
      </button>

      {error && (
        <div className="absolute z-10 mt-2 w-64 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-800 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {isOpen && previewData && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-4">
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-900">Preview Link</h4>
              <p className="text-xs text-gray-500 mt-1">
                Expires{' '}
                {new Date(previewData.expiresAt).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                readOnly
                value={previewData.previewUrl}
                className="flex-1 px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-md"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={openPreview}
                className="flex-1 px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                Open Preview
              </button>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default PreviewButton;
