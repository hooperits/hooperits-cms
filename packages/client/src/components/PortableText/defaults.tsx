'use client';

/**
 * HOOPERITS CMS - Default Portable Text Renderers
 *
 * Default React components for rendering Portable Text content.
 */

import type {
  PortableTextBlockProps,
  PortableTextMarkProps,
  PortableTextListProps,
  PortableTextListItemProps,
  ImageBlock,
  CodeBlock,
  VideoBlock,
  QuoteBlock,
} from '@hooperits/cms';

// =============================================================================
// Block Renderers
// =============================================================================

export function DefaultParagraph({
  renderChildren,
}: PortableTextBlockProps) {
  return <p className="mb-4">{renderChildren?.()}</p>;
}

export function DefaultHeading1({
  renderChildren,
}: PortableTextBlockProps) {
  return <h1 className="text-4xl font-bold mb-6 mt-8">{renderChildren?.()}</h1>;
}

export function DefaultHeading2({
  renderChildren,
}: PortableTextBlockProps) {
  return <h2 className="text-3xl font-bold mb-4 mt-6">{renderChildren?.()}</h2>;
}

export function DefaultHeading3({
  renderChildren,
}: PortableTextBlockProps) {
  return <h3 className="text-2xl font-semibold mb-3 mt-5">{renderChildren?.()}</h3>;
}

export function DefaultHeading4({
  renderChildren,
}: PortableTextBlockProps) {
  return <h4 className="text-xl font-semibold mb-2 mt-4">{renderChildren?.()}</h4>;
}

export function DefaultHeading5({
  renderChildren,
}: PortableTextBlockProps) {
  return <h5 className="text-lg font-semibold mb-2 mt-3">{renderChildren?.()}</h5>;
}

export function DefaultHeading6({
  renderChildren,
}: PortableTextBlockProps) {
  return <h6 className="text-base font-semibold mb-2 mt-3">{renderChildren?.()}</h6>;
}

export function DefaultBlockquote({
  renderChildren,
}: PortableTextBlockProps) {
  return (
    <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-700">
      {renderChildren?.()}
    </blockquote>
  );
}

// =============================================================================
// Mark Renderers
// =============================================================================

export function DefaultStrong({ children }: PortableTextMarkProps) {
  return <strong className="font-bold">{children}</strong>;
}

export function DefaultEm({ children }: PortableTextMarkProps) {
  return <em className="italic">{children}</em>;
}

export function DefaultUnderline({ children }: PortableTextMarkProps) {
  return <span className="underline">{children}</span>;
}

export function DefaultStrike({ children }: PortableTextMarkProps) {
  return <s className="line-through">{children}</s>;
}

export function DefaultCode({ children }: PortableTextMarkProps) {
  return (
    <code className="bg-gray-100 rounded px-1 py-0.5 font-mono text-sm text-pink-600">
      {children}
    </code>
  );
}

export function DefaultLink({ children, markDef }: PortableTextMarkProps) {
  const href = (markDef as { href?: string })?.href || '#';
  const blank = (markDef as { blank?: boolean })?.blank;

  return (
    <a
      href={href}
      className="text-blue-600 hover:text-blue-800 underline"
      {...(blank && { target: '_blank', rel: 'noopener noreferrer' })}
    >
      {children}
    </a>
  );
}

// =============================================================================
// Annotation Renderers
// =============================================================================

interface CommentAnnotationMarkDef {
  _key?: string;
  _type: 'comment';
  text?: string;
  author?: string;
  resolved?: boolean;
}

export function DefaultCommentAnnotation({ children, markDef }: PortableTextMarkProps) {
  const comment = markDef as CommentAnnotationMarkDef | undefined;
  const resolved = comment?.resolved ?? false;

  return (
    <span
      className={`annotation-comment relative ${
        resolved ? 'bg-green-100/50' : 'bg-yellow-100'
      } border-b-2 ${resolved ? 'border-green-300' : 'border-yellow-400'}`}
      data-annotation-type="comment"
      data-annotation-key={comment?._key}
      data-resolved={resolved ? 'true' : undefined}
      title={comment?.text || undefined}
    >
      {children}
      {!resolved && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />
      )}
    </span>
  );
}

interface HighlightAnnotationMarkDef {
  _key?: string;
  _type: 'highlight';
  color?: string;
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: 'bg-yellow-200',
  green: 'bg-green-200',
  blue: 'bg-blue-200',
  pink: 'bg-pink-200',
  purple: 'bg-purple-200',
  orange: 'bg-orange-200',
};

export function DefaultHighlightAnnotation({ children, markDef }: PortableTextMarkProps) {
  const highlight = markDef as HighlightAnnotationMarkDef | undefined;
  const color = highlight?.color || 'yellow';
  const bgClass = HIGHLIGHT_COLORS[color] || HIGHLIGHT_COLORS.yellow;

  return (
    <mark
      className={`annotation-highlight ${bgClass} rounded px-0.5`}
      data-annotation-type="highlight"
      data-annotation-key={highlight?._key}
      data-color={color}
    >
      {children}
    </mark>
  );
}

interface InternalLinkAnnotationMarkDef {
  _key?: string;
  _type: 'internalLink';
  reference?: {
    _type: string;
    _ref: string;
  };
}

interface InternalLinkResolverContext {
  resolveInternalLink?: (ref: string) => string | null;
}

export function DefaultInternalLinkAnnotation({
  children,
  markDef,
}: PortableTextMarkProps & InternalLinkResolverContext) {
  const internalLink = markDef as InternalLinkAnnotationMarkDef | undefined;
  const ref = internalLink?.reference?._ref || '';

  // Default to data attribute if no resolver is provided
  // Applications can use CSS or JS to handle navigation
  return (
    <a
      className="annotation-internal-link text-blue-600 hover:text-blue-800 underline decoration-dotted"
      data-annotation-type="internalLink"
      data-annotation-key={internalLink?._key}
      data-internal-ref={ref}
      href={`#ref:${ref}`}
    >
      {children}
    </a>
  );
}

// =============================================================================
// Inline Object Renderers
// =============================================================================

interface MentionInlineObject {
  _type: 'mention';
  _key: string;
  reference?: {
    _type: string;
    _ref: string;
  };
  displayName?: string;
}

export function DefaultMention({ value }: { value: MentionInlineObject }) {
  return (
    <span
      className="inline-mention bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium"
      data-mention-ref={value.reference?._ref}
    >
      @{value.displayName || 'Unknown'}
    </span>
  );
}

interface VariableInlineObject {
  _type: 'variable';
  _key: string;
  name?: string;
  fallback?: string;
}

export function DefaultVariable({ value }: { value: VariableInlineObject }) {
  return (
    <span
      className="inline-variable bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-sm font-mono"
      data-variable-name={value.name}
      data-variable-fallback={value.fallback}
    >
      {`{{${value.name || 'variable'}}}`}
    </span>
  );
}

// =============================================================================
// List Renderers
// =============================================================================

export function DefaultBulletList({ children }: PortableTextListProps) {
  return <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>;
}

export function DefaultNumberedList({ children }: PortableTextListProps) {
  return <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>;
}

export function DefaultListItem({ renderChildren }: PortableTextListItemProps) {
  return <li>{renderChildren()}</li>;
}

// =============================================================================
// Custom Block Renderers
// =============================================================================

interface ImageBlockRendererProps {
  value: ImageBlock;
  imageUrlResolver?: (ref: string) => string;
}

export function DefaultImageBlock({ value, imageUrlResolver }: ImageBlockRendererProps) {
  const src = imageUrlResolver
    ? imageUrlResolver(value.asset._ref)
    : value.asset._ref;

  return (
    <figure className="my-6">
      <img
        src={src}
        alt={value.alt || ''}
        className={`mx-auto max-w-full h-auto rounded-lg ${
          value.alignment === 'left'
            ? 'mr-auto ml-0'
            : value.alignment === 'right'
              ? 'ml-auto mr-0'
              : 'mx-auto'
        }`}
      />
      {value.caption && (
        <figcaption className="text-center text-sm text-gray-500 mt-2">
          {value.caption}
        </figcaption>
      )}
    </figure>
  );
}

export function DefaultCodeBlock({ value }: PortableTextBlockProps<CodeBlock>) {
  return (
    <div className="my-6">
      {value.filename && (
        <div className="bg-gray-800 text-gray-300 text-sm px-4 py-2 rounded-t-lg">
          {value.filename}
        </div>
      )}
      <pre
        className={`bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm font-mono ${
          value.filename ? 'rounded-b-lg' : 'rounded-lg'
        }`}
      >
        <code className={`language-${value.language || 'plaintext'}`}>
          {value.code}
        </code>
      </pre>
    </div>
  );
}

export function DefaultVideoBlock({ value }: PortableTextBlockProps<VideoBlock>) {
  const renderEmbed = () => {
    if (value.source === 'youtube' && value.url) {
      const videoId = extractYouTubeId(value.url);
      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            className="w-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={value.caption || 'YouTube video'}
          />
        );
      }
    }

    if (value.source === 'vimeo' && value.url) {
      const videoId = extractVimeoId(value.url);
      if (videoId) {
        return (
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            className="w-full aspect-video"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={value.caption || 'Vimeo video'}
          />
        );
      }
    }

    if (value.url) {
      return (
        <video src={value.url} controls className="w-full">
          <track kind="captions" />
        </video>
      );
    }

    return null;
  };

  return (
    <figure className="my-6">
      <div className="rounded-lg overflow-hidden">{renderEmbed()}</div>
      {value.caption && (
        <figcaption className="text-center text-sm text-gray-500 mt-2">
          {value.caption}
        </figcaption>
      )}
    </figure>
  );
}

export function DefaultQuoteBlock({ value, renderChildren }: PortableTextBlockProps<QuoteBlock>) {
  return (
    <figure className="my-6">
      <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 text-lg">
        {renderChildren?.()}
      </blockquote>
      {value.attribution && (
        <figcaption className="text-right text-sm text-gray-500 mt-2">
          — {value.attribution}
          {value.source && (
            <>, <a href={value.source} className="text-blue-600 hover:underline">source</a></>
          )}
        </figcaption>
      )}
    </figure>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/);
  return match ? match[1] : null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

// =============================================================================
// Default Components Export
// =============================================================================

export const defaultComponents = {
  block: {
    normal: DefaultParagraph,
    h1: DefaultHeading1,
    h2: DefaultHeading2,
    h3: DefaultHeading3,
    h4: DefaultHeading4,
    h5: DefaultHeading5,
    h6: DefaultHeading6,
    blockquote: DefaultBlockquote,
  },
  marks: {
    strong: DefaultStrong,
    em: DefaultEm,
    underline: DefaultUnderline,
    strike: DefaultStrike,
    code: DefaultCode,
    link: DefaultLink,
    // Annotation marks
    comment: DefaultCommentAnnotation,
    highlight: DefaultHighlightAnnotation,
    internalLink: DefaultInternalLinkAnnotation,
  },
  list: {
    bullet: DefaultBulletList,
    number: DefaultNumberedList,
  },
  listItem: DefaultListItem,
  types: {
    image: DefaultImageBlock,
    codeBlock: DefaultCodeBlock,
    video: DefaultVideoBlock,
    quote: DefaultQuoteBlock,
    // Inline objects
    mention: DefaultMention,
    variable: DefaultVariable,
  },
};
