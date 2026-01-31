/**
 * HOOPERITS CMS - Portable Text Types Tests
 *
 * Unit tests for type guards and type definitions.
 */

import { describe, it, expect } from 'vitest';
import {
  isTextBlock,
  isSpan,
  isInlineObject,
  isListItem,
  isImageBlock,
  isCodeBlock,
  isVideoBlock,
  isQuoteBlock,
  isLinkMark,
  type PortableTextTextBlock,
  type PortableTextSpan,
  type PortableTextInlineObject,
  type PortableTextMarkDef,
  type ImageBlock,
  type CodeBlock,
  type VideoBlock,
  type QuoteBlock,
  type PortableTextLinkMarkDef,
} from '../types';

describe('Portable Text Type Guards', () => {
  describe('isTextBlock', () => {
    it('should return true for text blocks', () => {
      const textBlock: PortableTextTextBlock = {
        _key: 'block1',
        _type: 'block',
        style: 'normal',
        children: [],
        markDefs: [],
      };
      expect(isTextBlock(textBlock)).toBe(true);
    });

    it('should return false for custom blocks', () => {
      const imageBlock: ImageBlock = {
        _key: 'img1',
        _type: 'image',
        asset: { _type: 'reference', _ref: 'media-123' },
      };
      expect(isTextBlock(imageBlock)).toBe(false);
    });

    it('should return false for code blocks', () => {
      const codeBlock: CodeBlock = {
        _key: 'code1',
        _type: 'codeBlock',
        code: 'console.log("hello")',
      };
      expect(isTextBlock(codeBlock)).toBe(false);
    });
  });

  describe('isSpan', () => {
    it('should return true for span children', () => {
      const span: PortableTextSpan = {
        _key: 'span1',
        _type: 'span',
        text: 'Hello world',
        marks: [],
      };
      expect(isSpan(span)).toBe(true);
    });

    it('should return false for inline objects', () => {
      const mention: PortableTextInlineObject = {
        _key: 'mention1',
        _type: 'mention',
        reference: { _type: 'reference', _ref: 'user-123' },
      };
      expect(isSpan(mention)).toBe(false);
    });
  });

  describe('isInlineObject', () => {
    it('should return true for inline objects', () => {
      const mention: PortableTextInlineObject = {
        _key: 'mention1',
        _type: 'mention',
        reference: { _type: 'reference', _ref: 'user-123' },
      };
      expect(isInlineObject(mention)).toBe(true);
    });

    it('should return false for spans', () => {
      const span: PortableTextSpan = {
        _key: 'span1',
        _type: 'span',
        text: 'Hello world',
        marks: [],
      };
      expect(isInlineObject(span)).toBe(false);
    });

    it('should return true for variable inline objects', () => {
      const variable: PortableTextInlineObject = {
        _key: 'var1',
        _type: 'variable',
        name: 'userName',
        fallback: 'Guest',
      };
      expect(isInlineObject(variable)).toBe(true);
    });
  });

  describe('isListItem', () => {
    it('should return true for bullet list items', () => {
      const listItem: PortableTextTextBlock = {
        _key: 'list1',
        _type: 'block',
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        children: [{ _key: 's1', _type: 'span', text: 'Item', marks: [] }],
        markDefs: [],
      };
      expect(isListItem(listItem)).toBe(true);
    });

    it('should return true for numbered list items', () => {
      const listItem: PortableTextTextBlock = {
        _key: 'list1',
        _type: 'block',
        style: 'normal',
        listItem: 'number',
        level: 1,
        children: [{ _key: 's1', _type: 'span', text: 'Item', marks: [] }],
        markDefs: [],
      };
      expect(isListItem(listItem)).toBe(true);
    });

    it('should return false for regular text blocks', () => {
      const textBlock: PortableTextTextBlock = {
        _key: 'block1',
        _type: 'block',
        style: 'normal',
        children: [{ _key: 's1', _type: 'span', text: 'Hello', marks: [] }],
        markDefs: [],
      };
      expect(isListItem(textBlock)).toBe(false);
    });

    it('should return false for custom blocks', () => {
      const imageBlock: ImageBlock = {
        _key: 'img1',
        _type: 'image',
        asset: { _type: 'reference', _ref: 'media-123' },
      };
      expect(isListItem(imageBlock)).toBe(false);
    });
  });

  describe('isImageBlock', () => {
    it('should return true for image blocks', () => {
      const imageBlock: ImageBlock = {
        _key: 'img1',
        _type: 'image',
        asset: { _type: 'reference', _ref: 'media-123' },
        alt: 'Test image',
        caption: 'A test image',
        alignment: 'center',
      };
      expect(isImageBlock(imageBlock)).toBe(true);
    });

    it('should return false for other block types', () => {
      const textBlock: PortableTextTextBlock = {
        _key: 'block1',
        _type: 'block',
        style: 'normal',
        children: [],
        markDefs: [],
      };
      expect(isImageBlock(textBlock)).toBe(false);
    });
  });

  describe('isCodeBlock', () => {
    it('should return true for code blocks', () => {
      const codeBlock: CodeBlock = {
        _key: 'code1',
        _type: 'codeBlock',
        code: 'const x = 1;',
        language: 'typescript',
        filename: 'example.ts',
        showLineNumbers: true,
        highlightLines: [1, [3, 5]],
      };
      expect(isCodeBlock(codeBlock)).toBe(true);
    });

    it('should return false for text blocks', () => {
      const textBlock: PortableTextTextBlock = {
        _key: 'block1',
        _type: 'block',
        style: 'normal',
        children: [],
        markDefs: [],
      };
      expect(isCodeBlock(textBlock)).toBe(false);
    });
  });

  describe('isVideoBlock', () => {
    it('should return true for uploaded video blocks', () => {
      const videoBlock: VideoBlock = {
        _key: 'video1',
        _type: 'video',
        source: 'upload',
        asset: { _type: 'reference', _ref: 'media-456' },
        caption: 'Demo video',
      };
      expect(isVideoBlock(videoBlock)).toBe(true);
    });

    it('should return true for YouTube video blocks', () => {
      const videoBlock: VideoBlock = {
        _key: 'video2',
        _type: 'video',
        source: 'youtube',
        url: 'https://youtube.com/watch?v=abc123',
      };
      expect(isVideoBlock(videoBlock)).toBe(true);
    });

    it('should return false for image blocks', () => {
      const imageBlock: ImageBlock = {
        _key: 'img1',
        _type: 'image',
        asset: { _type: 'reference', _ref: 'media-123' },
      };
      expect(isVideoBlock(imageBlock)).toBe(false);
    });
  });

  describe('isQuoteBlock', () => {
    it('should return true for quote blocks', () => {
      const quoteBlock: QuoteBlock = {
        _key: 'quote1',
        _type: 'quote',
        children: [{ _key: 's1', _type: 'span', text: 'Famous quote', marks: [] }],
        markDefs: [],
        attribution: 'Famous Person',
        source: 'https://example.com',
      };
      expect(isQuoteBlock(quoteBlock)).toBe(true);
    });

    it('should return false for blockquote style text blocks', () => {
      const blockquoteBlock: PortableTextTextBlock = {
        _key: 'bq1',
        _type: 'block',
        style: 'blockquote',
        children: [{ _key: 's1', _type: 'span', text: 'A quote', marks: [] }],
        markDefs: [],
      };
      expect(isQuoteBlock(blockquoteBlock)).toBe(false);
    });
  });

  describe('isLinkMark', () => {
    it('should return true for link marks', () => {
      const linkMark: PortableTextLinkMarkDef = {
        _key: 'link1',
        _type: 'link',
        href: 'https://example.com',
        title: 'Example',
        blank: true,
      };
      expect(isLinkMark(linkMark)).toBe(true);
    });

    it('should return false for internal link marks', () => {
      const internalLinkMark: PortableTextMarkDef = {
        _key: 'ref1',
        _type: 'internalLink',
        reference: { _type: 'reference', _ref: 'doc-123' },
      };
      expect(isLinkMark(internalLinkMark)).toBe(false);
    });

    it('should return false for custom marks', () => {
      const customMark: PortableTextMarkDef = {
        _key: 'custom1',
        _type: 'highlight',
        color: 'yellow',
      };
      expect(isLinkMark(customMark)).toBe(false);
    });
  });
});

describe('Portable Text Type Structures', () => {
  describe('PortableTextTextBlock', () => {
    it('should support all block styles', () => {
      const styles = ['normal', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'] as const;

      styles.forEach((style) => {
        const block: PortableTextTextBlock = {
          _key: `block-${style}`,
          _type: 'block',
          style,
          children: [],
          markDefs: [],
        };
        expect(block.style).toBe(style);
      });
    });

    it('should support nested list levels', () => {
      const block: PortableTextTextBlock = {
        _key: 'nested-list',
        _type: 'block',
        style: 'normal',
        listItem: 'bullet',
        level: 3,
        children: [{ _key: 's1', _type: 'span', text: 'Deeply nested item', marks: [] }],
        markDefs: [],
      };
      expect(block.level).toBe(3);
    });
  });

  describe('PortableTextSpan', () => {
    it('should support multiple marks', () => {
      const span: PortableTextSpan = {
        _key: 'span1',
        _type: 'span',
        text: 'Bold and italic',
        marks: ['strong', 'em', 'link1'],
      };
      expect(span.marks).toHaveLength(3);
      expect(span.marks).toContain('strong');
      expect(span.marks).toContain('em');
      expect(span.marks).toContain('link1');
    });

    it('should support empty marks array', () => {
      const span: PortableTextSpan = {
        _key: 'span1',
        _type: 'span',
        text: 'Plain text',
        marks: [],
      };
      expect(span.marks).toHaveLength(0);
    });
  });

  describe('PortableTextMarkDef', () => {
    it('should support link with all properties', () => {
      const linkMark: PortableTextLinkMarkDef = {
        _key: 'link1',
        _type: 'link',
        href: 'https://example.com/page',
        title: 'Click here',
        blank: true,
      };
      expect(linkMark.href).toBe('https://example.com/page');
      expect(linkMark.title).toBe('Click here');
      expect(linkMark.blank).toBe(true);
    });

    it('should support link with minimal properties', () => {
      const linkMark: PortableTextLinkMarkDef = {
        _key: 'link2',
        _type: 'link',
        href: 'https://example.com',
      };
      expect(linkMark.href).toBe('https://example.com');
      expect(linkMark.title).toBeUndefined();
      expect(linkMark.blank).toBeUndefined();
    });
  });
});
