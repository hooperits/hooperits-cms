/**
 * HOOPERITS CMS - Preview Banner
 * Displayed when viewing draft content via preview token
 */

'use client';

import { useEffect, useState } from 'react';

interface Props {
  expiresAt?: Date | string;
  onExit?: () => void;
  className?: string;
}

export function PreviewBanner({ expiresAt, onExit, className = '' }: Props) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!expiresAt) return;

    const expires = new Date(expiresAt);

    const updateTimeRemaining = () => {
      const now = new Date();
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      // Default: remove preview token from URL and reload
      const url = new URL(window.location.href);
      url.searchParams.delete('preview');
      url.searchParams.delete('token');
      window.location.href = url.toString();
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-900 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
          <span className="font-medium text-sm">
            Preview Mode
          </span>
          {timeRemaining && (
            <span className="text-sm opacity-80">
              Expires in {timeRemaining}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs opacity-80">
            Content may differ from published version
          </span>
          <button
            onClick={handleExit}
            className="px-3 py-1 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-md"
          >
            Exit Preview
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreviewBanner;
