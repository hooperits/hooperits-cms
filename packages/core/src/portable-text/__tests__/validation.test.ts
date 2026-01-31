/**
 * HOOPERITS CMS - Portable Text Validation Tests
 *
 * Unit tests for validation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  validateBlock,
  validateSpan,
  validateMarkDefs,
  validateAgainstSchema,
  validateCustomBlock,
  validateAnnotation,
  validatePortableText,
  isEmptyContent,
} from '../validation';
import type {
  PortableTextContent,
  PortableTextTextBlock,
  PortableTextSpan,
  PortableTextMarkDef,
  ImageBlock,
} from '../types';
import type { PortableTextFieldOptions } from '../../schema/types';

describe('Structure Validation', () => {
  describe('validateBlock', () => {
    it('should pass for valid text block', () => {
      const block: PortableTextTextBlock = {
        _key: 'block1',
        _type: 'block',
        style: 'normal',
        children: [{ _key: 's1', _type: 'span', text: 'Hello', marks: [] }],
        markDefs: [],
      };
      const errors = validateBlock(block, 0);
      expect(errors).toHaveLength(0);
    });

    it('should fail for missing _key', () => {
      const block = {
        _type: 'block',
        style: 'normal',
        children: [{ _key: 's1', _type: 'span', text: 'Hello', marks: [] }],
        markDefs: [],
      } as unknown as PortableTextTextBlock;
      const errors = validateBlock(block, 0);
      expect(errors.some((e) => e.path.includes('_key'))).toBe(true);
    });

    it('should fail for missing _type', () => {
      const block = {
        _key: 'block1',
        style: 'normal',
        children: [{ _key: 's1', _type: 'span', text: 'Hello', marks: [] }],
        markDefs: [],
      } as unknown as PortableTextTextBlock;
      const errors = validateBlock(block, 0);
      expect(errors.some((e) => e.path.includes('_type'))).toBe(true);
    });

    it('should validate text block children', () => {
      const block: PortableTextTextBlock = {
        _key: 'block1',
        _type: 'block',
        style: 'normal',
        children: [{ _key: '', _type: 'span', text: 'Hello', marks: [] }],
        markDefs: [],
      };
      const errors = validateBlock(block, 0);
      expect(errors.some((e) => e.message.includes('valid _key'))).toBe(true);
    });

    it('should fail for text block without children array', () => {
      const block = {
        _key: 'block1',
        _type: 'block',
        style: 'normal',
        markDefs: [],
      } as unknown as PortableTextTextBlock;
      const errors = validateBlock(block, 0);
      expect(errors.some((e) => e.message.includes('children array'))).toBe(true);
    });

    it('should pass for valid custom block', () => {
      const imageBlock: ImageBlock = {
        _key: 'img1',
        _type: 'image',
        asset: { _type: 'reference', _ref: 'media-123' },
      };
      const errors = validateBlock(imageBlock, 0);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateSpan', () => {
    it('should pass for valid span', () => {
      const span: PortableTextSpan = {
        _key: 'span1',
        _type: 'span',
        text: 'Hello world',
        marks: ['strong', 'em'],
      };
      const errors = validateSpan(span, 'test.path', 'block1');
      expect(errors).toHaveLength(0);
    });

    it('should fail for missing _key', () => {
      const span = {
        _type: 'span',
        text: 'Hello',
        marks: [],
      } as unknown as PortableTextSpan;
      const errors = validateSpan(span, 'test.path', 'block1');
      expect(errors.some((e) => e.message.includes('_key'))).toBe(true);
    });

    it('should fail for wrong _type', () => {
      const span = {
        _key: 'span1',
        _type: 'text',
        text: 'Hello',
        marks: [],
      } as unknown as PortableTextSpan;
      const errors = validateSpan(span, 'test.path', 'block1');
      expect(errors.some((e) => e.message.includes('_type "span"'))).toBe(true);
    });

    it('should fail for missing text', () => {
      const span = {
        _key: 'span1',
        _type: 'span',
        marks: [],
      } as unknown as PortableTextSpan;
      const errors = validateSpan(span, 'test.path', 'block1');
      expect(errors.some((e) => e.message.includes('text string'))).toBe(true);
    });

    it('should fail for non-array marks', () => {
      const span = {
        _key: 'span1',
        _type: 'span',
        text: 'Hello',
        marks: 'strong',
      } as unknown as PortableTextSpan;
      const errors = validateSpan(span, 'test.path', 'block1');
      expect(errors.some((e) => e.message.includes('marks must be an array'))).toBe(true);
    });
  });

  describe('validateMarkDefs', () => {
    it('should pass for valid link markDef', () => {
      const markDef: PortableTextMarkDef = {
        _key: 'link1',
        _type: 'link',
        href: 'https://example.com',
      };
      const errors = validateMarkDefs(markDef, 'test.path', 'block1');
      expect(errors).toHaveLength(0);
    });

    it('should fail for missing _key', () => {
      const markDef = {
        _type: 'link',
        href: 'https://example.com',
      } as unknown as PortableTextMarkDef;
      const errors = validateMarkDefs(markDef, 'test.path', 'block1');
      expect(errors.some((e) => e.message.includes('_key'))).toBe(true);
    });

    it('should fail for missing _type', () => {
      const markDef = {
        _key: 'link1',
        href: 'https://example.com',
      } as unknown as PortableTextMarkDef;
      const errors = validateMarkDefs(markDef, 'test.path', 'block1');
      expect(errors.some((e) => e.message.includes('_type'))).toBe(true);
    });

    it('should fail for link without href', () => {
      const markDef: PortableTextMarkDef = {
        _key: 'link1',
        _type: 'link',
      } as PortableTextMarkDef;
      const errors = validateMarkDefs(markDef, 'test.path', 'block1');
      expect(errors.some((e) => e.message.includes('href'))).toBe(true);
    });

    it('should fail for javascript: URL (security)', () => {
      const markDef: PortableTextMarkDef = {
        _key: 'link1',
        _type: 'link',
        href: 'javascript:alert("xss")',
      };
      const errors = validateMarkDefs(markDef, 'test.path', 'block1');
      expect(errors.some((e) => e.message.includes('unsafe protocol'))).toBe(true);
    });

    it('should fail for data: URL (security)', () => {
      const markDef: PortableTextMarkDef = {
        _key: 'link1',
        _type: 'link',
        href: 'data:text/html,<script>alert("xss")</script>',
      };
      const errors = validateMarkDefs(markDef, 'test.path', 'block1');
      expect(errors.some((e) => e.message.includes('unsafe protocol'))).toBe(true);
    });

    it('should handle case-insensitive protocol check', () => {
      const markDef: PortableTextMarkDef = {
        _key: 'link1',
        _type: 'link',
        href: 'JAVASCRIPT:alert("xss")',
      };
      const errors = validateMarkDefs(markDef, 'test.path', 'block1');
      expect(errors.some((e) => e.message.includes('unsafe protocol'))).toBe(true);
    });
  });

  describe('Mark reference validation', () => {
    it('should fail for mark referencing non-existent markDef', () => {
      const block: PortableTextTextBlock = {
        _key: 'block1',
        _type: 'block',
        style: 'normal',
        children: [{ _key: 's1', _type: 'span', text: 'Hello', marks: ['nonexistent'] }],
        markDefs: [],
      };
      const errors = validateBlock(block, 0);
      expect(errors.some((e) => e.message.includes('non-existent markDef'))).toBe(true);
    });

    it('should pass for built-in decorators', () => {
      const block: PortableTextTextBlock = {
        _key: 'block1',
        _type: 'block',
        style: 'normal',
        children: [{ _key: 's1', _type: 'span', text: 'Hello', marks: ['strong', 'em', 'code'] }],
        markDefs: [],
      };
      const errors = validateBlock(block, 0);
      expect(errors).toHaveLength(0);
    });

    it('should pass for valid markDef reference', () => {
      const block: PortableTextTextBlock = {
        _key: 'block1',
        _type: 'block',
        style: 'normal',
        children: [{ _key: 's1', _type: 'span', text: 'Hello', marks: ['link1'] }],
        markDefs: [{ _key: 'link1', _type: 'link', href: 'https://example.com' }],
      };
      const errors = validateBlock(block, 0);
      expect(errors).toHaveLength(0);
    });
  });
});

describe('Schema-based Validation', () => {
  describe('validateAgainstSchema', () => {
    const baseOptions: PortableTextFieldOptions = {
      label: 'Content',
    };

    it('should pass for valid empty content', () => {
      const content: PortableTextContent = [];
      const result = validateAgainstSchema(content, baseOptions);
      expect(result.valid).toBe(true);
    });

    it('should fail for non-array content', () => {
      const content = 'not an array' as unknown as PortableTextContent;
      const result = validateAgainstSchema(content, baseOptions);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('array of blocks');
    });

    it('should fail when content has fewer blocks than minBlocks', () => {
      const content: PortableTextContent = [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          children: [{ _key: 's1', _type: 'span', text: 'Hello', marks: [] }],
          markDefs: [],
        },
      ];
      const result = validateAgainstSchema(content, { ...baseOptions, minBlocks: 3 });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('at least 3'))).toBe(true);
    });

    it('should fail when content exceeds maxBlocks', () => {
      const content: PortableTextContent = [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          children: [{ _key: 's1', _type: 'span', text: 'Block 1', marks: [] }],
          markDefs: [],
        },
        {
          _key: 'b2',
          _type: 'block',
          style: 'normal',
          children: [{ _key: 's2', _type: 'span', text: 'Block 2', marks: [] }],
          markDefs: [],
        },
        {
          _key: 'b3',
          _type: 'block',
          style: 'normal',
          children: [{ _key: 's3', _type: 'span', text: 'Block 3', marks: [] }],
          markDefs: [],
        },
      ];
      const result = validateAgainstSchema(content, { ...baseOptions, maxBlocks: 2 });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('more than 2'))).toBe(true);
    });

    it('should fail for disallowed block style', () => {
      const content: PortableTextContent = [
        {
          _key: 'b1',
          _type: 'block',
          style: 'h1',
          children: [{ _key: 's1', _type: 'span', text: 'Heading', marks: [] }],
          markDefs: [],
        },
      ];
      const result = validateAgainstSchema(content, {
        ...baseOptions,
        styles: ['normal', 'h2', 'h3'],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('"h1" is not allowed'))).toBe(true);
    });

    it('should fail for disallowed list type', () => {
      const content: PortableTextContent = [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          listItem: 'number',
          level: 1,
          children: [{ _key: 's1', _type: 'span', text: 'Item', marks: [] }],
          markDefs: [],
        },
      ];
      const result = validateAgainstSchema(content, {
        ...baseOptions,
        lists: ['bullet'],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('"number" is not allowed'))).toBe(true);
    });

    it('should fail for disallowed decorator', () => {
      const content: PortableTextContent = [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          children: [{ _key: 's1', _type: 'span', text: 'Underlined', marks: ['underline'] }],
          markDefs: [],
        },
      ];
      const result = validateAgainstSchema(content, {
        ...baseOptions,
        decorators: ['strong', 'em'],
      });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes('Decorator "underline" is not allowed'))
      ).toBe(true);
    });

    it('should pass for allowed decorators', () => {
      const content: PortableTextContent = [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          children: [{ _key: 's1', _type: 'span', text: 'Bold', marks: ['strong'] }],
          markDefs: [],
        },
      ];
      const result = validateAgainstSchema(content, {
        ...baseOptions,
        decorators: ['strong', 'em'],
      });
      expect(result.valid).toBe(true);
    });

    it('should fail for disallowed annotation type', () => {
      const content: PortableTextContent = [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          children: [{ _key: 's1', _type: 'span', text: 'Link', marks: ['link1'] }],
          markDefs: [{ _key: 'link1', _type: 'link', href: 'https://example.com' }],
        },
      ];
      const result = validateAgainstSchema(content, {
        ...baseOptions,
        annotations: [{ type: 'internalLink', title: 'Internal Link', fields: {} }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('"link" is not allowed'))).toBe(true);
    });
  });

  describe('validateCustomBlock', () => {
    const baseOptions: PortableTextFieldOptions = {
      label: 'Content',
    };

    it('should pass for built-in block types', () => {
      const imageBlock: ImageBlock = {
        _key: 'img1',
        _type: 'image',
        asset: { _type: 'reference', _ref: 'media-123' },
      };
      const errors = validateCustomBlock(imageBlock, 0, baseOptions);
      expect(errors).toHaveLength(0);
    });

    it('should fail for unrecognized block type without custom definition', () => {
      const customBlock = {
        _key: 'custom1',
        _type: 'callToAction',
        heading: 'Click here',
      };
      const errors = validateCustomBlock(customBlock, 0, baseOptions);
      expect(errors.some((e) => e.message.includes('"callToAction" is not allowed'))).toBe(true);
    });

    it('should pass for custom block type defined in schema', () => {
      const customBlock = {
        _key: 'custom1',
        _type: 'callToAction',
        heading: 'Click here',
      };
      const optionsWithCustom: PortableTextFieldOptions = {
        ...baseOptions,
        blocks: [
          {
            type: 'callToAction',
            title: 'Call to Action',
            fields: {
              heading: { type: 'text', options: { label: 'Heading', required: true } },
            },
          },
        ],
      };
      const errors = validateCustomBlock(customBlock, 0, optionsWithCustom);
      expect(errors.filter((e) => e.severity === 'error')).toHaveLength(0);
    });

    it('should fail for missing required field in custom block', () => {
      const customBlock = {
        _key: 'custom1',
        _type: 'callToAction',
        // missing required 'heading' field
      };
      const optionsWithCustom: PortableTextFieldOptions = {
        ...baseOptions,
        blocks: [
          {
            type: 'callToAction',
            title: 'Call to Action',
            fields: {
              heading: { type: 'text', options: { label: 'Heading', required: true } },
            },
          },
        ],
      };
      const errors = validateCustomBlock(customBlock, 0, optionsWithCustom);
      expect(errors.some((e) => e.message.includes('Required field "heading"'))).toBe(true);
    });
  });

  describe('validateAnnotation', () => {
    it('should pass for annotation with all required fields', () => {
      const markDef: PortableTextMarkDef = {
        _key: 'highlight1',
        _type: 'highlight',
        color: 'yellow',
      };
      const options: PortableTextFieldOptions = {
        label: 'Content',
        annotations: [
          {
            type: 'highlight',
            title: 'Highlight',
            fields: {
              color: { type: 'text', options: { label: 'Color', required: true } },
            },
          },
        ],
      };
      const errors = validateAnnotation(markDef, 'test.path', 'block1', options);
      expect(errors).toHaveLength(0);
    });

    it('should fail for annotation missing required field', () => {
      const markDef: PortableTextMarkDef = {
        _key: 'highlight1',
        _type: 'highlight',
        // missing required 'color' field
      };
      const options: PortableTextFieldOptions = {
        label: 'Content',
        annotations: [
          {
            type: 'highlight',
            title: 'Highlight',
            fields: {
              color: { type: 'text', options: { label: 'Color', required: true } },
            },
          },
        ],
      };
      const errors = validateAnnotation(markDef, 'test.path', 'block1', options);
      expect(errors.some((e) => e.message.includes('Required annotation field "color"'))).toBe(
        true
      );
    });

    it('should return empty array for unknown annotation type', () => {
      const markDef: PortableTextMarkDef = {
        _key: 'unknown1',
        _type: 'unknownType',
      };
      const options: PortableTextFieldOptions = {
        label: 'Content',
        annotations: [],
      };
      const errors = validateAnnotation(markDef, 'test.path', 'block1', options);
      expect(errors).toHaveLength(0);
    });
  });
});

describe('Convenience Functions', () => {
  describe('validatePortableText', () => {
    it('should pass for valid content', () => {
      const content: PortableTextContent = [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          children: [{ _key: 's1', _type: 'span', text: 'Hello', marks: [] }],
          markDefs: [],
        },
      ];
      const result = validatePortableText(content);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for non-array content', () => {
      const content = { not: 'array' } as unknown as PortableTextContent;
      const result = validatePortableText(content);
      expect(result.valid).toBe(false);
    });

    it('should validate all blocks', () => {
      const content: PortableTextContent = [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          children: [{ _key: 's1', _type: 'span', text: 'Block 1', marks: [] }],
          markDefs: [],
        },
        {
          _key: '', // invalid key
          _type: 'block',
          style: 'normal',
          children: [{ _key: 's2', _type: 'span', text: 'Block 2', marks: [] }],
          markDefs: [],
        },
      ];
      const result = validatePortableText(content);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('blocks[1]'))).toBe(true);
    });
  });

  describe('isEmptyContent', () => {
    it('should return true for empty array', () => {
      expect(isEmptyContent([])).toBe(true);
    });

    it('should return true for undefined/null', () => {
      expect(isEmptyContent(undefined as unknown as PortableTextContent)).toBe(true);
      expect(isEmptyContent(null as unknown as PortableTextContent)).toBe(true);
    });

    it('should return true for block with empty span', () => {
      const content: PortableTextContent = [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          children: [{ _key: 's1', _type: 'span', text: '', marks: [] }],
          markDefs: [],
        },
      ];
      expect(isEmptyContent(content)).toBe(true);
    });

    it('should return true for block with whitespace-only span', () => {
      const content: PortableTextContent = [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          children: [{ _key: 's1', _type: 'span', text: '   \n\t  ', marks: [] }],
          markDefs: [],
        },
      ];
      expect(isEmptyContent(content)).toBe(true);
    });

    it('should return false for block with text', () => {
      const content: PortableTextContent = [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          children: [{ _key: 's1', _type: 'span', text: 'Hello', marks: [] }],
          markDefs: [],
        },
      ];
      expect(isEmptyContent(content)).toBe(false);
    });

    it('should return false for custom blocks (image)', () => {
      const content: PortableTextContent = [
        {
          _key: 'img1',
          _type: 'image',
          asset: { _type: 'reference', _ref: 'media-123' },
        } as ImageBlock,
      ];
      expect(isEmptyContent(content)).toBe(false);
    });

    it('should return false for inline objects', () => {
      const content: PortableTextContent = [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          children: [
            { _key: 's1', _type: 'span', text: '', marks: [] },
            { _key: 'm1', _type: 'mention', reference: { _ref: 'user-1' } },
          ],
          markDefs: [],
        },
      ];
      expect(isEmptyContent(content)).toBe(false);
    });
  });
});
