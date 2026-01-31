'use client';

/**
 * HOOPERITS CMS - Portable Text React Component
 *
 * Renders Portable Text content as React elements.
 */

import { useMemo, Fragment, type ReactNode } from 'react';
import type {
  PortableTextContent,
  PortableTextBlock,
  PortableTextTextBlock,
  PortableTextChild,
  PortableTextSpan,
  PortableTextMarkDef,
  PortableTextComponents,
  PortableTextProps,
  ImageBlock,
} from '@hooperits/cms';
import {
  isTextBlock,
  isSpan,
  isImageBlock,
  isCodeBlock,
  isVideoBlock,
  isQuoteBlock,
} from '@hooperits/cms';
import { defaultComponents } from './defaults';

// Re-export defaults
export * from './defaults';

// =============================================================================
// Types
// =============================================================================

interface RenderContext {
  components: PortableTextComponents;
  imageUrlResolver?: (ref: string) => string;
  referenceResolver?: (ref: string) => { href: string; title?: string };
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Render Portable Text content as React elements
 */
export function PortableText({
  value,
  components = {},
  imageUrlResolver,
  referenceResolver,
  className,
}: PortableTextProps) {
  // Merge custom components with defaults
  const mergedComponents = useMemo<PortableTextComponents>(
    () => ({
      block: { ...defaultComponents.block, ...components.block },
      marks: { ...defaultComponents.marks, ...components.marks },
      list: { ...defaultComponents.list, ...components.list },
      listItem: components.listItem || defaultComponents.listItem,
      types: { ...defaultComponents.types, ...components.types },
      inline: components.inline || {},
      hardBreak: components.hardBreak,
      unknownType: components.unknownType,
      unknownMark: components.unknownMark,
    }),
    [components]
  );

  const context: RenderContext = {
    components: mergedComponents,
    imageUrlResolver,
    referenceResolver,
  };

  // Group blocks into lists and standalone blocks
  const groupedContent = useMemo(
    () => groupContentByLists(value),
    [value]
  );

  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {groupedContent.map((item, index) => {
        if (isListGroup(item)) {
          return (
            <RenderList
              key={`list-${index}`}
              listGroup={item}
              context={context}
            />
          );
        }
        return (
          <RenderBlock
            key={item._key || `block-${index}`}
            block={item}
            index={index}
            context={context}
          />
        );
      })}
    </div>
  );
}

// =============================================================================
// Block Rendering
// =============================================================================

interface RenderBlockProps {
  block: PortableTextBlock;
  index: number;
  context: RenderContext;
}

function RenderBlock({ block, index, context }: RenderBlockProps) {
  const { components, imageUrlResolver } = context;

  // Text block
  if (isTextBlock(block)) {
    const styleComponent = components.block?.[block.style];
    if (styleComponent) {
      const Component = styleComponent;
      return (
        <Component
          value={block}
          index={index}
          renderChildren={() => (
            <RenderChildren
              children={block.children}
              markDefs={block.markDefs}
              context={context}
            />
          )}
        />
      );
    }
    // Fallback to normal paragraph
    return (
      <p>
        <RenderChildren
          children={block.children}
          markDefs={block.markDefs}
          context={context}
        />
      </p>
    );
  }

  // Image block
  if (isImageBlock(block)) {
    const ImageComponent = components.types?.image;
    if (ImageComponent) {
      // Create a wrapper that passes imageUrlResolver to the component
      return (
        <ImageBlockWrapper
          Component={ImageComponent}
          value={block}
          index={index}
          imageUrlResolver={imageUrlResolver}
        />
      );
    }
  }

  // Code block
  if (isCodeBlock(block)) {
    const CodeComponent = components.types?.codeBlock;
    if (CodeComponent) {
      return <CodeComponent value={block} index={index} />;
    }
  }

  // Video block
  if (isVideoBlock(block)) {
    const VideoComponent = components.types?.video;
    if (VideoComponent) {
      return <VideoComponent value={block} index={index} />;
    }
  }

  // Quote block
  if (isQuoteBlock(block)) {
    const QuoteComponent = components.types?.quote;
    if (QuoteComponent) {
      return (
        <QuoteComponent
          value={block}
          index={index}
          renderChildren={() => (
            <RenderChildren
              children={block.children}
              markDefs={block.markDefs}
              context={context}
            />
          )}
        />
      );
    }
  }

  // Custom block type
  const CustomComponent = components.types?.[block._type];
  if (CustomComponent) {
    return <CustomComponent value={block} index={index} />;
  }

  // Unknown type fallback
  if (components.unknownType) {
    const UnknownComponent = components.unknownType;
    return <UnknownComponent value={block} type={block._type} />;
  }

  // Default: render nothing for unknown types
  return null;
}

// =============================================================================
// List Rendering
// =============================================================================

interface ListGroup {
  listType: 'bullet' | 'number';
  level: number;
  items: PortableTextTextBlock[];
}

function RenderList({
  listGroup,
  context,
}: {
  listGroup: ListGroup;
  context: RenderContext;
}) {
  const { components } = context;
  const ListComponent =
    listGroup.listType === 'bullet'
      ? components.list?.bullet
      : components.list?.number;

  const ListItemComponent = components.listItem;

  if (!ListComponent || !ListItemComponent) {
    return null;
  }

  return (
    <ListComponent type={listGroup.listType} level={listGroup.level}>
      {listGroup.items.map((item, index) => (
        <ListItemComponent
          key={item._key || `item-${index}`}
          value={item}
          index={index}
          level={listGroup.level}
          renderChildren={() => (
            <RenderChildren
              children={item.children}
              markDefs={item.markDefs}
              context={context}
            />
          )}
        />
      ))}
    </ListComponent>
  );
}

// =============================================================================
// Children Rendering
// =============================================================================

interface RenderChildrenProps {
  children: PortableTextChild[];
  markDefs: PortableTextMarkDef[];
  context: RenderContext;
}

function RenderChildren({ children, markDefs, context }: RenderChildrenProps) {
  if (!children || children.length === 0) {
    return null;
  }

  const markDefMap = new Map(markDefs.map((m) => [m._key, m]));

  return (
    <>
      {children.map((child, index) => {
        if (isSpan(child)) {
          return (
            <RenderSpan
              key={child._key || `span-${index}`}
              span={child}
              markDefMap={markDefMap}
              context={context}
            />
          );
        }

        // Inline object
        const InlineComponent = context.components.inline?.[child._type];
        if (InlineComponent) {
          return (
            <InlineComponent
              key={child._key || `inline-${index}`}
              value={child}
              index={index}
            />
          );
        }

        return null;
      })}
    </>
  );
}

// =============================================================================
// Span Rendering
// =============================================================================

interface RenderSpanProps {
  span: PortableTextSpan;
  markDefMap: Map<string, PortableTextMarkDef>;
  context: RenderContext;
}

function RenderSpan({ span, markDefMap, context }: RenderSpanProps) {
  const { components } = context;

  // Handle hard breaks (newlines)
  if (span.text === '\n') {
    if (components.hardBreak) {
      const HardBreak = components.hardBreak;
      return <HardBreak />;
    }
    return <br />;
  }

  let content: ReactNode = span.text;

  // Apply marks in reverse order (innermost first)
  const marks = span.marks || [];
  for (let i = marks.length - 1; i >= 0; i--) {
    const markKey = marks[i];
    const markDef = markDefMap.get(markKey);

    // Try decorator marks first
    const MarkComponent = components.marks?.[markKey];
    if (MarkComponent) {
      content = (
        <MarkComponent markType={markKey} markDef={markDef}>
          {content}
        </MarkComponent>
      );
      continue;
    }

    // Try mark definition type
    if (markDef) {
      const TypedMarkComponent = components.marks?.[markDef._type];
      if (TypedMarkComponent) {
        content = (
          <TypedMarkComponent markType={markDef._type} markDef={markDef}>
            {content}
          </TypedMarkComponent>
        );
        continue;
      }
    }

    // Unknown mark fallback
    if (components.unknownMark) {
      const UnknownMark = components.unknownMark;
      content = <UnknownMark markType={markKey}>{content}</UnknownMark>;
    }
  }

  return <Fragment>{content}</Fragment>;
}

// =============================================================================
// Wrapper Components
// =============================================================================

import type { ComponentType } from 'react';

interface ImageBlockWrapperProps {
  Component: ComponentType<{ value: ImageBlock; index: number; imageUrlResolver?: (ref: string) => string }>;
  value: ImageBlock;
  index: number;
  imageUrlResolver?: (ref: string) => string;
}

function ImageBlockWrapper({ Component, value, index, imageUrlResolver }: ImageBlockWrapperProps) {
  return <Component value={value} index={index} imageUrlResolver={imageUrlResolver} />;
}

// =============================================================================
// Helpers
// =============================================================================

type GroupedItem = PortableTextBlock | ListGroup;

/**
 * Type guard for ListGroup
 */
function isListGroup(item: GroupedItem): item is ListGroup {
  return 'listType' in item && 'items' in item;
}

/**
 * Group consecutive list items into list groups
 */
function groupContentByLists(content: PortableTextContent): GroupedItem[] {
  if (!Array.isArray(content) || content.length === 0) {
    return [];
  }

  const result: GroupedItem[] = [];
  let currentList: ListGroup | null = null;

  for (const block of content) {
    // Handle list items
    if (isTextBlock(block) && block.listItem) {
      const listType = block.listItem;
      const level = block.level || 1;

      if (!currentList || currentList.listType !== listType || currentList.level !== level) {
        // Start a new list
        if (currentList) {
          result.push(currentList);
        }
        currentList = { listType, level, items: [block] };
      } else {
        // Add to current list
        currentList.items.push(block);
      }
      continue;
    }

    // Non-list block: flush current list and add block
    if (currentList) {
      result.push(currentList);
      currentList = null;
    }
    result.push(block);
  }

  // Flush remaining list
  if (currentList) {
    result.push(currentList);
  }

  return result;
}
