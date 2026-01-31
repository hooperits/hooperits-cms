/**
 * HOOPERITS CMS - Serializer Tests
 *
 * Unit tests for HTML and plain text serializers.
 */

import { describe, it, expect } from 'vitest';
import {
  toHTML,
  escapeHtml,
  toPlainText,
  countWords,
  countCharacters,
  getExcerpt,
} from '../serialize';
import type {
  PortableTextContent,
  PortableTextTextBlock,
  ImageBlock,
  CodeBlock,
  VideoBlock,
} from '../types';

// =============================================================================
// Helper Functions
// =============================================================================

function createTextBlock(
  text: string,
  style: PortableTextTextBlock['style'] = 'normal',
  marks: string[] = []
): PortableTextTextBlock {
  return {
    _key: 'block1',
    _type: 'block',
    style,
    children: [
      {
        _key: 'span1',
        _type: 'span',
        text,
        marks,
      },
    ],
    markDefs: [],
  };
}

function createListItem(
  text: string,
  listType: 'bullet' | 'number',
  level = 1
): PortableTextTextBlock {
  return {
    _key: `list-${Date.now()}`,
    _type: 'block',
    style: 'normal',
    listItem: listType,
    level,
    children: [
      {
        _key: 'span1',
        _type: 'span',
        text,
        marks: [],
      },
    ],
    markDefs: [],
  };
}

// =============================================================================
// HTML Serializer Tests
// =============================================================================

describe('toHTML', () => {
  describe('basic text blocks', () => {
    it('should serialize a paragraph', () => {
      const content: PortableTextContent = [createTextBlock('Hello, World!')];
      const html = toHTML(content);
      expect(html).toBe('<p>Hello, World!</p>');
    });

    it('should serialize headings', () => {
      const content: PortableTextContent = [
        createTextBlock('Heading 1', 'h1'),
        createTextBlock('Heading 2', 'h2'),
        createTextBlock('Heading 3', 'h3'),
      ];
      const html = toHTML(content);
      expect(html).toContain('<h1>Heading 1</h1>');
      expect(html).toContain('<h2>Heading 2</h2>');
      expect(html).toContain('<h3>Heading 3</h3>');
    });

    it('should serialize blockquote', () => {
      const content: PortableTextContent = [createTextBlock('A quote', 'blockquote')];
      const html = toHTML(content);
      expect(html).toBe('<blockquote>A quote</blockquote>');
    });

    it('should serialize multiple paragraphs', () => {
      const content: PortableTextContent = [
        createTextBlock('First paragraph'),
        createTextBlock('Second paragraph'),
      ];
      const html = toHTML(content);
      expect(html).toBe('<p>First paragraph</p>\n<p>Second paragraph</p>');
    });
  });

  describe('marks/decorators', () => {
    it('should serialize strong text', () => {
      const content: PortableTextContent = [
        {
          _key: 'block1',
          _type: 'block',
          style: 'normal',
          children: [
            { _key: 'span1', _type: 'span', text: 'Bold text', marks: ['strong'] },
          ],
          markDefs: [],
        },
      ];
      const html = toHTML(content);
      expect(html).toBe('<p><strong>Bold text</strong></p>');
    });

    it('should serialize italic text', () => {
      const content: PortableTextContent = [
        {
          _key: 'block1',
          _type: 'block',
          style: 'normal',
          children: [
            { _key: 'span1', _type: 'span', text: 'Italic text', marks: ['em'] },
          ],
          markDefs: [],
        },
      ];
      const html = toHTML(content);
      expect(html).toBe('<p><em>Italic text</em></p>');
    });

    it('should serialize multiple marks', () => {
      const content: PortableTextContent = [
        {
          _key: 'block1',
          _type: 'block',
          style: 'normal',
          children: [
            { _key: 'span1', _type: 'span', text: 'Bold and italic', marks: ['strong', 'em'] },
          ],
          markDefs: [],
        },
      ];
      const html = toHTML(content);
      // Marks are applied in reverse order, so strong is outermost
      expect(html).toBe('<p><strong><em>Bold and italic</em></strong></p>');
    });

    it('should serialize links', () => {
      const content: PortableTextContent = [
        {
          _key: 'block1',
          _type: 'block',
          style: 'normal',
          children: [
            { _key: 'span1', _type: 'span', text: 'Click here', marks: ['link1'] },
          ],
          markDefs: [
            { _key: 'link1', _type: 'link', href: 'https://example.com' },
          ],
        },
      ];
      const html = toHTML(content);
      expect(html).toBe('<p><a href="https://example.com">Click here</a></p>');
    });

    it('should serialize links with blank target', () => {
      const content: PortableTextContent = [
        {
          _key: 'block1',
          _type: 'block',
          style: 'normal',
          children: [
            { _key: 'span1', _type: 'span', text: 'External link', marks: ['link1'] },
          ],
          markDefs: [
            { _key: 'link1', _type: 'link', href: 'https://example.com', blank: true },
          ],
        },
      ];
      const html = toHTML(content);
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
    });
  });

  describe('lists', () => {
    it('should serialize bullet list', () => {
      const content: PortableTextContent = [
        createListItem('Item 1', 'bullet'),
        createListItem('Item 2', 'bullet'),
        createListItem('Item 3', 'bullet'),
      ];
      const html = toHTML(content);
      expect(html).toContain('<ul>');
      expect(html).toContain('</ul>');
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('<li>Item 2</li>');
      expect(html).toContain('<li>Item 3</li>');
    });

    it('should serialize numbered list', () => {
      const content: PortableTextContent = [
        createListItem('First', 'number'),
        createListItem('Second', 'number'),
      ];
      const html = toHTML(content);
      expect(html).toContain('<ol>');
      expect(html).toContain('</ol>');
    });

    it('should separate different list types', () => {
      const content: PortableTextContent = [
        createListItem('Bullet item', 'bullet'),
        createListItem('Numbered item', 'number'),
      ];
      const html = toHTML(content);
      expect(html).toContain('<ul>');
      expect(html).toContain('</ul>');
      expect(html).toContain('<ol>');
      expect(html).toContain('</ol>');
    });
  });

  describe('custom blocks', () => {
    it('should serialize image block', () => {
      const imageBlock: ImageBlock = {
        _key: 'img1',
        _type: 'image',
        asset: { _type: 'reference', _ref: 'image-123' },
        alt: 'Test image',
        caption: 'A caption',
      };
      const content: PortableTextContent = [imageBlock];
      const html = toHTML(content);
      expect(html).toContain('<figure>');
      expect(html).toContain('<img');
      expect(html).toContain('alt="Test image"');
      expect(html).toContain('<figcaption>A caption</figcaption>');
    });

    it('should use imageUrlResolver for images', () => {
      const imageBlock: ImageBlock = {
        _key: 'img1',
        _type: 'image',
        asset: { _type: 'reference', _ref: 'image-123' },
      };
      const content: PortableTextContent = [imageBlock];
      const html = toHTML(content, {
        imageUrlResolver: (ref) => `https://cdn.example.com/${ref}.jpg`,
      });
      expect(html).toContain('src="https://cdn.example.com/image-123.jpg"');
    });

    it('should serialize code block', () => {
      const codeBlock: CodeBlock = {
        _key: 'code1',
        _type: 'codeBlock',
        code: 'const x = 1;',
        language: 'javascript',
      };
      const content: PortableTextContent = [codeBlock];
      const html = toHTML(content);
      expect(html).toContain('<pre>');
      expect(html).toContain('<code class="language-javascript">');
      expect(html).toContain('const x = 1;');
    });

    it('should serialize YouTube video block', () => {
      const videoBlock: VideoBlock = {
        _key: 'video1',
        _type: 'video',
        source: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
      const content: PortableTextContent = [videoBlock];
      const html = toHTML(content);
      expect(html).toContain('<iframe');
      expect(html).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    });

    it('should serialize Vimeo video block', () => {
      const videoBlock: VideoBlock = {
        _key: 'video1',
        _type: 'video',
        source: 'vimeo',
        url: 'https://vimeo.com/123456789',
      };
      const content: PortableTextContent = [videoBlock];
      const html = toHTML(content);
      expect(html).toContain('<iframe');
      expect(html).toContain('player.vimeo.com/video/123456789');
    });
  });

  describe('HTML escaping', () => {
    it('should escape HTML entities in text', () => {
      const content: PortableTextContent = [createTextBlock('<script>alert("xss")</script>')];
      const html = toHTML(content);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape quotes in attributes', () => {
      const content: PortableTextContent = [
        {
          _key: 'block1',
          _type: 'block',
          style: 'normal',
          children: [
            { _key: 'span1', _type: 'span', text: 'Link', marks: ['link1'] },
          ],
          markDefs: [
            { _key: 'link1', _type: 'link', href: 'https://example.com?a="b"' },
          ],
        },
      ];
      const html = toHTML(content);
      expect(html).toContain('&quot;');
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      expect(toHTML([])).toBe('');
      expect(toHTML(null as unknown as PortableTextContent)).toBe('');
    });

    it('should handle empty spans', () => {
      const content: PortableTextContent = [
        {
          _key: 'block1',
          _type: 'block',
          style: 'normal',
          children: [],
          markDefs: [],
        },
      ];
      const html = toHTML(content);
      expect(html).toBe('<p></p>');
    });
  });
});

describe('escapeHtml', () => {
  it('should escape all special characters', () => {
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('>')).toBe('&gt;');
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('"')).toBe('&quot;');
    expect(escapeHtml("'")).toBe('&#39;');
  });

  it('should escape multiple characters', () => {
    expect(escapeHtml('<div class="test">')).toBe('&lt;div class=&quot;test&quot;&gt;');
  });
});

// =============================================================================
// Plain Text Serializer Tests
// =============================================================================

describe('toPlainText', () => {
  describe('basic text blocks', () => {
    it('should extract text from paragraph', () => {
      const content: PortableTextContent = [createTextBlock('Hello, World!')];
      expect(toPlainText(content)).toBe('Hello, World!');
    });

    it('should join multiple blocks', () => {
      const content: PortableTextContent = [
        createTextBlock('First paragraph'),
        createTextBlock('Second paragraph'),
      ];
      expect(toPlainText(content)).toBe('First paragraph\n\nSecond paragraph');
    });

    it('should use custom block separator', () => {
      const content: PortableTextContent = [
        createTextBlock('First'),
        createTextBlock('Second'),
      ];
      expect(toPlainText(content, { blockSeparator: ' | ' })).toBe('First | Second');
    });
  });

  describe('lists', () => {
    it('should format bullet list', () => {
      const content: PortableTextContent = [
        createListItem('Item 1', 'bullet'),
        createListItem('Item 2', 'bullet'),
      ];
      const text = toPlainText(content);
      expect(text).toContain('• Item 1');
      expect(text).toContain('• Item 2');
    });

    it('should format numbered list', () => {
      const content: PortableTextContent = [
        createListItem('First', 'number'),
        createListItem('Second', 'number'),
      ];
      const text = toPlainText(content);
      expect(text).toContain('1. First');
      expect(text).toContain('2. Second');
    });
  });

  describe('custom blocks', () => {
    it('should include image alt text by default', () => {
      const imageBlock: ImageBlock = {
        _key: 'img1',
        _type: 'image',
        asset: { _type: 'reference', _ref: 'image-123' },
        alt: 'A beautiful sunset',
      };
      const content: PortableTextContent = [imageBlock];
      const text = toPlainText(content);
      expect(text).toContain('[Image: A beautiful sunset]');
    });

    it('should exclude image alt text when disabled', () => {
      const imageBlock: ImageBlock = {
        _key: 'img1',
        _type: 'image',
        asset: { _type: 'reference', _ref: 'image-123' },
        alt: 'A beautiful sunset',
      };
      const content: PortableTextContent = [imageBlock];
      const text = toPlainText(content, { includeImageAlt: false });
      expect(text).not.toContain('A beautiful sunset');
    });

    it('should include code block content', () => {
      const codeBlock: CodeBlock = {
        _key: 'code1',
        _type: 'codeBlock',
        code: 'const x = 1;',
      };
      const content: PortableTextContent = [codeBlock];
      expect(toPlainText(content)).toBe('const x = 1;');
    });

    it('should exclude code when disabled', () => {
      const codeBlock: CodeBlock = {
        _key: 'code1',
        _type: 'codeBlock',
        code: 'const x = 1;',
      };
      const content: PortableTextContent = [codeBlock];
      expect(toPlainText(content, { includeCode: false })).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      expect(toPlainText([])).toBe('');
      expect(toPlainText(null as unknown as PortableTextContent)).toBe('');
    });
  });
});

describe('countWords', () => {
  it('should count words correctly', () => {
    const content: PortableTextContent = [createTextBlock('Hello world this is a test')];
    expect(countWords(content)).toBe(6);
  });

  it('should handle multiple blocks', () => {
    const content: PortableTextContent = [
      createTextBlock('First block'),
      createTextBlock('Second block'),
    ];
    expect(countWords(content)).toBe(4);
  });

  it('should return 0 for empty content', () => {
    expect(countWords([])).toBe(0);
  });
});

describe('countCharacters', () => {
  it('should count characters with spaces', () => {
    const content: PortableTextContent = [createTextBlock('Hello world')];
    expect(countCharacters(content, true)).toBe(11);
  });

  it('should count characters without spaces', () => {
    const content: PortableTextContent = [createTextBlock('Hello world')];
    expect(countCharacters(content, false)).toBe(10);
  });
});

describe('getExcerpt', () => {
  it('should return full text if under limit', () => {
    const content: PortableTextContent = [createTextBlock('Short text')];
    expect(getExcerpt(content, 100)).toBe('Short text');
  });

  it('should truncate at word boundary', () => {
    const content: PortableTextContent = [
      createTextBlock('This is a longer text that should be truncated at a word boundary'),
    ];
    const excerpt = getExcerpt(content, 30);
    expect(excerpt.length).toBeLessThanOrEqual(33); // 30 + '...'
    expect(excerpt).toMatch(/\.\.\.$/);
    expect(excerpt).not.toMatch(/\s\.\.\.$/); // Should not have space before ellipsis
  });

  it('should use custom suffix', () => {
    const content: PortableTextContent = [createTextBlock('A'.repeat(200))];
    const excerpt = getExcerpt(content, 50, '…');
    expect(excerpt).toMatch(/…$/);
  });
});
