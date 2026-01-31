/**
 * HOOPERITS CMS - HTML Serializer
 *
 * Converts Portable Text content to HTML string.
 */

import type {
  PortableTextContent,
  PortableTextBlock,
  PortableTextTextBlock,
  PortableTextChild,
  PortableTextSpan,
  PortableTextMarkDef,
} from '../types';
import {
  isTextBlock,
  isImageBlock,
  isCodeBlock,
  isVideoBlock,
  isQuoteBlock,
  isSpan,
} from '../types';

// =============================================================================
// Types
// =============================================================================

export interface HTMLSerializerOptions {
  /**
   * Custom block renderers
   */
  blockRenderers?: Record<string, BlockRenderer>;

  /**
   * Custom mark renderers
   */
  markRenderers?: Record<string, MarkRenderer>;

  /**
   * Custom inline object renderers
   */
  inlineRenderers?: Record<string, InlineRenderer>;

  /**
   * Image URL resolver - resolves asset references to URLs
   */
  imageUrlResolver?: (ref: string) => string;

  /**
   * Whether to escape HTML entities in text
   * @default true
   */
  escapeHtml?: boolean;
}

export type BlockRenderer = (
  block: PortableTextBlock,
  children: string,
  options: HTMLSerializerOptions
) => string;

export type MarkRenderer = (
  text: string,
  markDef?: PortableTextMarkDef
) => string;

export type InlineRenderer = (
  object: PortableTextChild,
  options: HTMLSerializerOptions
) => string;

// =============================================================================
// Default Renderers
// =============================================================================

const DEFAULT_BLOCK_RENDERERS: Record<string, BlockRenderer> = {
  block: (block, children) => {
    const textBlock = block as PortableTextTextBlock;
    switch (textBlock.style) {
      case 'h1':
        return `<h1>${children}</h1>`;
      case 'h2':
        return `<h2>${children}</h2>`;
      case 'h3':
        return `<h3>${children}</h3>`;
      case 'h4':
        return `<h4>${children}</h4>`;
      case 'h5':
        return `<h5>${children}</h5>`;
      case 'h6':
        return `<h6>${children}</h6>`;
      case 'blockquote':
        return `<blockquote>${children}</blockquote>`;
      default:
        return `<p>${children}</p>`;
    }
  },

  image: (block, _, options) => {
    if (!isImageBlock(block)) return '';
    const src = options.imageUrlResolver
      ? options.imageUrlResolver(block.asset._ref)
      : block.asset._ref;
    const alt = block.alt ? ` alt="${escapeHtml(block.alt)}"` : ' alt=""';
    const figcaption = block.caption
      ? `<figcaption>${escapeHtml(block.caption)}</figcaption>`
      : '';
    return `<figure><img src="${escapeHtml(src)}"${alt} />${figcaption}</figure>`;
  },

  codeBlock: (block) => {
    if (!isCodeBlock(block)) return '';
    const lang = block.language ? ` class="language-${escapeHtml(block.language)}"` : '';
    return `<pre><code${lang}>${escapeHtml(block.code)}</code></pre>`;
  },

  video: (block) => {
    if (!isVideoBlock(block)) return '';
    const caption = block.caption
      ? `<figcaption>${escapeHtml(block.caption)}</figcaption>`
      : '';

    if (block.source === 'youtube' && block.url) {
      const videoId = extractYouTubeId(block.url);
      if (videoId) {
        return `<figure><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>${caption}</figure>`;
      }
    }

    if (block.source === 'vimeo' && block.url) {
      const videoId = extractVimeoId(block.url);
      if (videoId) {
        return `<figure><iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allowfullscreen></iframe>${caption}</figure>`;
      }
    }

    if (block.url) {
      return `<figure><video src="${escapeHtml(block.url)}" controls></video>${caption}</figure>`;
    }

    return '';
  },

  quote: (block, children) => {
    if (!isQuoteBlock(block)) return '';
    const attribution = block.attribution
      ? `<cite>${escapeHtml(block.attribution)}</cite>`
      : '';
    return `<blockquote>${children}${attribution}</blockquote>`;
  },
};

const DEFAULT_MARK_RENDERERS: Record<string, MarkRenderer> = {
  strong: (text) => `<strong>${text}</strong>`,
  em: (text) => `<em>${text}</em>`,
  underline: (text) => `<u>${text}</u>`,
  strike: (text) => `<s>${text}</s>`,
  code: (text) => `<code>${text}</code>`,
  link: (text, markDef) => {
    if (!markDef) return text;
    const href = (markDef as { href?: string }).href || '#';
    const target = (markDef as { blank?: boolean }).blank ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escapeHtml(href)}"${target}>${text}</a>`;
  },
  // Annotation marks
  comment: (text, markDef) => {
    const comment = markDef as { _key?: string; text?: string; author?: string; resolved?: boolean } | undefined;
    const key = comment?._key ? ` data-mark-key="${escapeHtml(comment._key)}"` : '';
    const resolved = comment?.resolved ? ' data-resolved="true"' : '';
    return `<span class="annotation annotation-comment"${key}${resolved}>${text}</span>`;
  },
  highlight: (text, markDef) => {
    const highlight = markDef as { _key?: string; color?: string } | undefined;
    const key = highlight?._key ? ` data-mark-key="${escapeHtml(highlight._key)}"` : '';
    const color = highlight?.color || 'yellow';
    return `<span class="annotation annotation-highlight" data-color="${escapeHtml(color)}"${key}>${text}</span>`;
  },
  internalLink: (text, markDef) => {
    const internalLink = markDef as { reference?: { _ref?: string } } | undefined;
    const ref = internalLink?.reference?._ref || '';
    return `<a class="internal-link" data-ref="${escapeHtml(ref)}">${text}</a>`;
  },
};

const DEFAULT_INLINE_RENDERERS: Record<string, InlineRenderer> = {
  mention: (object, _options) => {
    const mention = object as {
      _type: 'mention';
      reference?: { _type: string; _ref: string; _contentType?: string };
      displayName?: string;
    };
    const displayName = escapeHtml(mention.displayName || 'Unknown');
    const ref = mention.reference?._ref || '';
    // Allow reference resolver to provide href
    return `<span class="mention" data-ref="${escapeHtml(ref)}">@${displayName}</span>`;
  },

  variable: (object) => {
    const variable = object as {
      _type: 'variable';
      name?: string;
      fallback?: string;
    };
    const name = escapeHtml(variable.name || 'variable');
    const fallback = variable.fallback ? ` data-fallback="${escapeHtml(variable.fallback)}"` : '';
    return `<span class="variable" data-variable="${name}"${fallback}>{{${name}}}</span>`;
  },
};

// =============================================================================
// Serializer
// =============================================================================

/**
 * Convert Portable Text content to HTML string
 */
export function toHTML(
  content: PortableTextContent,
  options: HTMLSerializerOptions = {}
): string {
  if (!Array.isArray(content) || content.length === 0) {
    return '';
  }

  const blockRenderers = {
    ...DEFAULT_BLOCK_RENDERERS,
    ...options.blockRenderers,
  };

  const markRenderers = {
    ...DEFAULT_MARK_RENDERERS,
    ...options.markRenderers,
  };

  const inlineRenderers = {
    ...DEFAULT_INLINE_RENDERERS,
    ...options.inlineRenderers,
  };

  // Update options with merged inline renderers
  const mergedOptions: HTMLSerializerOptions = {
    ...options,
    inlineRenderers,
  };

  const result: string[] = [];
  let currentList: { type: 'bullet' | 'number'; items: string[] } | null = null;

  for (const block of content) {
    // Handle list items
    if (isTextBlock(block) && block.listItem) {
      const listType = block.listItem;
      const itemHtml = serializeChildren(block.children, block.markDefs, markRenderers, mergedOptions);

      if (!currentList || currentList.type !== listType) {
        // Flush previous list
        if (currentList) {
          result.push(wrapList(currentList));
        }
        currentList = { type: listType, items: [itemHtml] };
      } else {
        currentList.items.push(itemHtml);
      }
      continue;
    }

    // Flush any pending list
    if (currentList) {
      result.push(wrapList(currentList));
      currentList = null;
    }

    // Render block
    const blockType = block._type;
    const renderer = blockRenderers[blockType] || blockRenderers.block;

    if (isTextBlock(block)) {
      const children = serializeChildren(block.children, block.markDefs, markRenderers, mergedOptions);
      result.push(renderer(block, children, options));
    } else {
      result.push(renderer(block, '', options));
    }
  }

  // Flush remaining list
  if (currentList) {
    result.push(wrapList(currentList));
  }

  return result.join('\n');
}

/**
 * Serialize block children to HTML
 */
function serializeChildren(
  children: PortableTextChild[],
  markDefs: PortableTextMarkDef[],
  markRenderers: Record<string, MarkRenderer>,
  options: HTMLSerializerOptions
): string {
  if (!children || children.length === 0) {
    return '';
  }

  const markDefMap = new Map(markDefs.map((m) => [m._key, m]));

  return children
    .map((child) => {
      if (isSpan(child)) {
        return serializeSpan(child, markDefMap, markRenderers, options);
      }

      // Inline object
      const inlineRenderer = options.inlineRenderers?.[child._type];
      if (inlineRenderer) {
        return inlineRenderer(child, options);
      }

      return `<!-- Unknown inline: ${child._type} -->`;
    })
    .join('');
}

/**
 * Serialize a span with marks
 */
function serializeSpan(
  span: PortableTextSpan,
  markDefMap: Map<string, PortableTextMarkDef>,
  markRenderers: Record<string, MarkRenderer>,
  options: HTMLSerializerOptions
): string {
  let text = options.escapeHtml !== false ? escapeHtml(span.text) : span.text;

  // Apply marks in reverse order (innermost first)
  const marks = span.marks || [];
  for (let i = marks.length - 1; i >= 0; i--) {
    const markKey = marks[i];
    const markDef = markDefMap.get(markKey);

    // Decorator marks (strong, em, etc.)
    const renderer = markRenderers[markKey] || (markDef ? markRenderers[markDef._type] : null);

    if (renderer) {
      text = renderer(text, markDef);
    }
  }

  return text;
}

/**
 * Wrap list items in list tags
 */
function wrapList(list: { type: 'bullet' | 'number'; items: string[] }): string {
  const tag = list.type === 'bullet' ? 'ul' : 'ol';
  const items = list.items.map((item) => `<li>${item}</li>`).join('\n');
  return `<${tag}>\n${items}\n</${tag}>`;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/);
  return match ? match[1] : null;
}

/**
 * Extract Vimeo video ID from URL
 */
function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}
