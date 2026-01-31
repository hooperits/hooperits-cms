/**
 * HOOPERITS CMS - Plain Text Serializer
 *
 * Converts Portable Text content to plain text string.
 */

import type {
  PortableTextContent,
  PortableTextBlock,
  PortableTextChild,
} from '../types';
import {
  isTextBlock,
  isCodeBlock,
  isQuoteBlock,
  isSpan,
} from '../types';

// =============================================================================
// Types
// =============================================================================

export interface PlainTextOptions {
  /**
   * Text to join blocks with
   * @default '\n\n'
   */
  blockSeparator?: string;

  /**
   * Text to join list items with
   * @default '\n'
   */
  listSeparator?: string;

  /**
   * Whether to include code block content
   * @default true
   */
  includeCode?: boolean;

  /**
   * Whether to include image alt text
   * @default true
   */
  includeImageAlt?: boolean;

  /**
   * Whether to include captions
   * @default true
   */
  includeCaptions?: boolean;

  /**
   * Custom block text extractor
   */
  blockExtractors?: Record<string, BlockTextExtractor>;
}

export type BlockTextExtractor = (
  block: PortableTextBlock,
  options: PlainTextOptions
) => string;

// =============================================================================
// Default Extractors
// =============================================================================

const DEFAULT_BLOCK_EXTRACTORS: Record<string, BlockTextExtractor> = {
  block: (block) => {
    if (!isTextBlock(block)) return '';
    return extractChildrenText(block.children);
  },

  image: (block, options) => {
    const parts: string[] = [];
    const imgBlock = block as { alt?: string; caption?: string };

    if (options.includeImageAlt !== false && imgBlock.alt) {
      parts.push(`[Image: ${imgBlock.alt}]`);
    }
    if (options.includeCaptions !== false && imgBlock.caption) {
      parts.push(imgBlock.caption);
    }

    return parts.join(' - ');
  },

  codeBlock: (block, options) => {
    if (!isCodeBlock(block)) return '';
    if (options.includeCode === false) return '';
    return block.code;
  },

  video: (block, options) => {
    const videoBlock = block as { caption?: string };
    if (options.includeCaptions !== false && videoBlock.caption) {
      return `[Video: ${videoBlock.caption}]`;
    }
    return '[Video]';
  },

  quote: (block) => {
    if (!isQuoteBlock(block)) return '';
    const text = extractChildrenText(block.children);
    const attribution = block.attribution ? ` — ${block.attribution}` : '';
    return `"${text}"${attribution}`;
  },
};

// =============================================================================
// Serializer
// =============================================================================

/**
 * Convert Portable Text content to plain text string
 */
export function toPlainText(
  content: PortableTextContent,
  options: PlainTextOptions = {}
): string {
  if (!Array.isArray(content) || content.length === 0) {
    return '';
  }

  const blockSeparator = options.blockSeparator ?? '\n\n';
  const listSeparator = options.listSeparator ?? '\n';
  const extractors = {
    ...DEFAULT_BLOCK_EXTRACTORS,
    ...options.blockExtractors,
  };

  const result: string[] = [];
  let currentList: string[] | null = null;

  for (const block of content) {
    // Handle list items
    if (isTextBlock(block) && block.listItem) {
      const prefix = block.listItem === 'bullet' ? '• ' : `${(currentList?.length ?? 0) + 1}. `;
      const text = extractChildrenText(block.children);

      if (!currentList) {
        currentList = [];
      }
      currentList.push(`${prefix}${text}`);
      continue;
    }

    // Flush any pending list
    if (currentList) {
      result.push(currentList.join(listSeparator));
      currentList = null;
    }

    // Extract block text
    const blockType = block._type;
    const extractor = extractors[blockType] || extractors.block;
    const text = extractor(block, options);

    if (text) {
      result.push(text);
    }
  }

  // Flush remaining list
  if (currentList) {
    result.push(currentList.join(listSeparator));
  }

  return result.join(blockSeparator);
}

/**
 * Extract plain text from children array
 */
function extractChildrenText(children: PortableTextChild[]): string {
  if (!children || children.length === 0) {
    return '';
  }

  return children
    .map((child) => {
      if (isSpan(child)) {
        return child.text;
      }

      // For inline objects, try to extract displayable text
      const inlineObj = child as { displayName?: string; name?: string };
      if (inlineObj.displayName) {
        return inlineObj.displayName;
      }
      if (inlineObj.name) {
        return `[${inlineObj.name}]`;
      }

      return '';
    })
    .join('');
}

/**
 * Count words in Portable Text content
 */
export function countWords(content: PortableTextContent): number {
  const text = toPlainText(content, {
    includeCode: false,
    includeImageAlt: false,
    includeCaptions: false,
  });

  // Split by whitespace and filter empty strings
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  return words.length;
}

/**
 * Count characters in Portable Text content
 */
export function countCharacters(
  content: PortableTextContent,
  includeSpaces = true
): number {
  const text = toPlainText(content, {
    includeCode: true,
    includeImageAlt: false,
    includeCaptions: false,
  });

  if (includeSpaces) {
    return text.length;
  }

  return text.replace(/\s/g, '').length;
}

/**
 * Get an excerpt from Portable Text content
 */
export function getExcerpt(
  content: PortableTextContent,
  maxLength = 160,
  suffix = '...'
): string {
  const text = toPlainText(content, {
    blockSeparator: ' ',
    listSeparator: ' ',
    includeCode: false,
    includeImageAlt: false,
    includeCaptions: false,
  });

  if (text.length <= maxLength) {
    return text;
  }

  // Find the last space before maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.5) {
    return truncated.substring(0, lastSpace) + suffix;
  }

  return truncated + suffix;
}
