'use client';

/**
 * HOOPERITS CMS - Image Block Component
 *
 * Node view for image blocks in the editor.
 */

import { useState } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

interface ImageBlockAttributes {
  src?: string;
  alt?: string;
  caption?: string;
  alignment?: 'left' | 'center' | 'right';
  asset?: {
    _type: 'reference';
    _ref: string;
  };
}

export function ImageBlockView({ node, updateAttributes, selected }: NodeViewProps) {
  const attrs = node.attrs as ImageBlockAttributes;
  const [isEditingCaption, setIsEditingCaption] = useState(false);

  const alignmentClasses = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  };

  return (
    <NodeViewWrapper className="image-block my-4">
      <figure
        className={`relative max-w-full ${alignmentClasses[attrs.alignment || 'center']} ${
          selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
        }`}
      >
        {attrs.src ? (
          <img
            src={attrs.src}
            alt={attrs.alt || ''}
            className="max-w-full h-auto rounded-lg"
            draggable={false}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <ImagePlaceholderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No image selected</p>
              <button
                type="button"
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                onClick={() => {
                  // TODO: Open media picker
                  console.log('Open media picker');
                }}
              >
                Select image
              </button>
            </div>
          </div>
        )}

        {/* Image controls */}
        {selected && attrs.src && (
          <div className="absolute top-2 right-2 flex gap-1 bg-white rounded-lg shadow-lg p-1">
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: 'left' })}
              className={`p-1.5 rounded ${attrs.alignment === 'left' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              title="Align left"
            >
              <AlignLeftIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: 'center' })}
              className={`p-1.5 rounded ${attrs.alignment === 'center' || !attrs.alignment ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              title="Align center"
            >
              <AlignCenterIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: 'right' })}
              className={`p-1.5 rounded ${attrs.alignment === 'right' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              title="Align right"
            >
              <AlignRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Alt text input (shown when selected) */}
        {selected && attrs.src && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Alt text (for accessibility)
            </label>
            <input
              type="text"
              value={attrs.alt || ''}
              onChange={(e) => updateAttributes({ alt: e.target.value })}
              placeholder="Describe this image..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Caption */}
        {(attrs.caption || isEditingCaption || selected) && (
          <figcaption className="mt-2 text-center text-sm text-gray-600">
            {isEditingCaption ? (
              <input
                type="text"
                value={attrs.caption || ''}
                onChange={(e) => updateAttributes({ caption: e.target.value })}
                onBlur={() => setIsEditingCaption(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingCaption(false);
                  }
                }}
                autoFocus
                placeholder="Add a caption..."
                className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <span
                onClick={() => selected && setIsEditingCaption(true)}
                className={selected ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded' : ''}
              >
                {attrs.caption || (selected ? 'Click to add caption' : '')}
              </span>
            )}
          </figcaption>
        )}
      </figure>
    </NodeViewWrapper>
  );
}

// Icons
function ImagePlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function AlignLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z" />
    </svg>
  );
}

function AlignCenterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z" />
    </svg>
  );
}

function AlignRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z" />
    </svg>
  );
}

export default ImageBlockView;
