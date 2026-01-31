/**
 * HOOPERITS CMS - Portable Text Serialize API
 *
 * POST /api/cms/portable-text/serialize
 * Converts Portable Text content to HTML or plain text.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { toHTML, toPlainText, type PortableTextContent } from '@hooperits/cms';

// =============================================================================
// Request Schema
// =============================================================================

const serializeRequestSchema = z.object({
  content: z.array(z.record(z.unknown())),
  format: z.enum(['html', 'text']).default('html'),
  options: z
    .object({
      // HTML options
      escapeHtml: z.boolean().optional(),
      // Plain text options
      blockSeparator: z.string().optional(),
      listSeparator: z.string().optional(),
      includeCode: z.boolean().optional(),
      includeImageAlt: z.boolean().optional(),
      includeCaptions: z.boolean().optional(),
    })
    .optional(),
});

// =============================================================================
// Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = serializeRequestSchema.parse(body);

    const content = validated.content as PortableTextContent;
    const { format, options } = validated;

    let result: string;

    if (format === 'html') {
      result = toHTML(content, {
        escapeHtml: options?.escapeHtml,
      });
    } else {
      result = toPlainText(content, {
        blockSeparator: options?.blockSeparator,
        listSeparator: options?.listSeparator,
        includeCode: options?.includeCode,
        includeImageAlt: options?.includeImageAlt,
        includeCaptions: options?.includeCaptions,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        format,
        output: result,
        characterCount: result.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Serialize error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to serialize content',
        },
      },
      { status: 500 }
    );
  }
}
