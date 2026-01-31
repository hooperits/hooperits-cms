/**
 * HOOPERITS CMS - Portable Text Validation API
 *
 * POST /api/cms/portable-text/validate
 *
 * Validates Portable Text content against schema and structure rules.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validatePortableText,
  type PortableTextContent,
} from '@hooperits/cms';

interface ValidateRequestBody {
  content: PortableTextContent;
}

// Local type matching the portable-text validation module
interface PTValidationError {
  blockKey?: string;
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

interface PTValidationResult {
  valid: boolean;
  errors: PTValidationError[];
}

interface ValidateResponse {
  valid: boolean;
  errors: Array<{
    message: string;
    path?: string;
    blockKey?: string;
  }>;
  warnings: Array<{
    message: string;
    path?: string;
    blockKey?: string;
  }>;
  stats?: {
    blockCount: number;
    wordCount: number;
    characterCount: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<ValidateResponse>> {
  try {
    const body: ValidateRequestBody = await request.json();

    if (!body.content) {
      return NextResponse.json(
        {
          valid: false,
          errors: [{ message: 'Content is required' }],
          warnings: [],
        },
        { status: 400 }
      );
    }

    // Validate the content
    const result = validatePortableText(body.content) as PTValidationResult;

    // Separate errors and warnings by severity
    const errors = result.errors.filter((e) => e.severity === 'error');
    const warnings = result.errors.filter((e) => e.severity === 'warning');

    // Calculate stats
    const stats = calculateStats(body.content);

    return NextResponse.json({
      valid: result.valid,
      errors: errors.map((e) => ({
        message: e.message,
        path: e.path,
        blockKey: e.blockKey,
      })),
      warnings: warnings.map((w) => ({
        message: w.message,
        path: w.path,
        blockKey: w.blockKey,
      })),
      stats,
    });
  } catch (error) {
    console.error('Portable Text validation error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          valid: false,
          errors: [{ message: 'Invalid JSON in request body' }],
          warnings: [],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        valid: false,
        errors: [{ message: 'Internal server error' }],
        warnings: [],
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate content statistics
 */
function calculateStats(content: PortableTextContent): {
  blockCount: number;
  wordCount: number;
  characterCount: number;
} {
  if (!Array.isArray(content)) {
    return { blockCount: 0, wordCount: 0, characterCount: 0 };
  }

  let wordCount = 0;
  let characterCount = 0;

  for (const block of content) {
    if (block._type === 'block' && 'children' in block && Array.isArray(block.children)) {
      for (const child of block.children) {
        if (child._type === 'span' && typeof child.text === 'string') {
          characterCount += child.text.length;
          wordCount += child.text.split(/\s+/).filter((w: string) => w.length > 0).length;
        }
      }
    }
  }

  return {
    blockCount: content.length,
    wordCount,
    characterCount,
  };
}
