'use client';

/**
 * HOOPERITS CMS - Video Block Component
 *
 * Node view for video blocks with support for uploads, YouTube, Vimeo, and URLs.
 */

import { useState, useCallback, useMemo } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

type VideoSource = 'upload' | 'youtube' | 'vimeo' | 'url';

interface VideoBlockAttributes {
  source: VideoSource;
  asset?: {
    _type: 'reference';
    _ref: string;
  };
  url?: string;
  caption?: string;
}

/**
 * Extract video ID from YouTube URL
 */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/,
    /youtube\.com\/v\/([^&?\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extract video ID from Vimeo URL
 */
function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Detect video source from URL
 */
function detectSource(url: string): VideoSource {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  return 'url';
}

export function VideoBlockView({ node, updateAttributes, selected }: NodeViewProps) {
  const attrs = node.attrs as VideoBlockAttributes;
  const [isEditingUrl, setIsEditingUrl] = useState(!attrs.url && !attrs.asset);
  const [urlInput, setUrlInput] = useState(attrs.url || '');
  const [isEditingCaption, setIsEditingCaption] = useState(false);

  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) return;

    const source = detectSource(urlInput);
    updateAttributes({
      url: urlInput.trim(),
      source,
    });
    setIsEditingUrl(false);
  }, [urlInput, updateAttributes]);

  const embedUrl = useMemo(() => {
    if (!attrs.url) return null;

    switch (attrs.source) {
      case 'youtube': {
        const videoId = getYouTubeId(attrs.url);
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
      }
      case 'vimeo': {
        const videoId = getVimeoId(attrs.url);
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
      }
      case 'url':
        return attrs.url;
      default:
        return null;
    }
  }, [attrs.source, attrs.url]);

  const sourceLabel = useMemo(() => {
    switch (attrs.source) {
      case 'youtube':
        return 'YouTube';
      case 'vimeo':
        return 'Vimeo';
      case 'upload':
        return 'Uploaded';
      case 'url':
        return 'External';
      default:
        return 'Video';
    }
  }, [attrs.source]);

  return (
    <NodeViewWrapper className="video-block my-4">
      <div
        className={`relative rounded-lg overflow-hidden border ${
          selected ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2' : 'border-gray-300'
        }`}
      >
        {isEditingUrl || !embedUrl ? (
          // URL input form
          <div className="p-6 bg-gray-50">
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <VideoIcon className="w-6 h-6 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Add Video</span>
              </div>

              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUrlSubmit();
                  }
                  if (e.key === 'Escape') {
                    setIsEditingUrl(false);
                  }
                }}
                autoFocus
                placeholder="Paste YouTube, Vimeo, or video URL..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">
                  Supports YouTube, Vimeo, and direct video URLs
                </span>
                <div className="flex gap-2">
                  {attrs.url && (
                    <button
                      type="button"
                      onClick={() => setIsEditingUrl(false)}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleUrlSubmit}
                    disabled={!urlInput.trim()}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Video display
          <>
            {/* Source badge */}
            <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/60 text-white text-xs rounded">
              {sourceLabel}
            </div>

            {/* Edit button */}
            {selected && (
              <button
                type="button"
                onClick={() => {
                  setUrlInput(attrs.url || '');
                  setIsEditingUrl(true);
                }}
                className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 text-white rounded hover:bg-black/80 transition-colors"
                title="Change video"
              >
                <EditIcon className="w-4 h-4" />
              </button>
            )}

            {/* Video embed */}
            <div className="aspect-video bg-black">
              {attrs.source === 'youtube' || attrs.source === 'vimeo' ? (
                <iframe
                  src={embedUrl || undefined}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={attrs.caption || 'Embedded video'}
                />
              ) : (
                <video
                  src={embedUrl || undefined}
                  controls
                  className="w-full h-full"
                  title={attrs.caption || 'Video'}
                />
              )}
            </div>

            {/* Caption */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
              {isEditingCaption ? (
                <input
                  type="text"
                  value={attrs.caption || ''}
                  onChange={(e) => updateAttributes({ caption: e.target.value })}
                  onBlur={() => setIsEditingCaption(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      setIsEditingCaption(false);
                    }
                  }}
                  autoFocus
                  placeholder="Add a caption..."
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <p
                  onClick={() => selected && setIsEditingCaption(true)}
                  className={`text-sm text-center ${
                    attrs.caption ? 'text-gray-600' : 'text-gray-400 italic'
                  } ${selected ? 'cursor-pointer hover:text-gray-800' : ''}`}
                >
                  {attrs.caption || (selected ? 'Click to add caption' : '')}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
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

export default VideoBlockView;
