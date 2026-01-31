/**
 * HOOPERITS CMS - Resolve References API
 *
 * POST /api/cms/portable-text/resolve-references
 * Resolves document references within Portable Text content.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@hooperits/cms';

// =============================================================================
// Request Schema
// =============================================================================

const resolveReferencesRequestSchema = z.object({
  references: z.array(
    z.object({
      _ref: z.string(),
      _contentType: z.string().optional(),
    })
  ),
  fields: z.array(z.string()).optional(),
});

// =============================================================================
// Types
// =============================================================================

interface ResolvedReference {
  _ref: string;
  _type: string;
  id: string;
  title?: string;
  slug?: string;
  status?: string;
  data?: Record<string, unknown>;
}

// =============================================================================
// Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = resolveReferencesRequestSchema.parse(body);

    const { references, fields } = validated;

    if (references.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          resolved: [],
        },
      });
    }

    // Extract unique reference IDs
    const refIds = [...new Set(references.map((r) => r._ref))];

    // Fetch content from database
    const contents = await db.content.findMany({
      where: {
        id: { in: refIds },
      },
      select: {
        id: true,
        slug: true,
        status: true,
        typeId: true,
        type: {
          select: {
            id: true,
            name: true,
          },
        },
        data: true,
      },
    });

    // Build resolved references
    const resolved: ResolvedReference[] = contents.map((content) => {
      const data = content.data as Record<string, unknown>;

      const result: ResolvedReference = {
        _ref: content.id,
        _type: content.typeId,
        id: content.id,
        title: getTitle(data),
        slug: content.slug || undefined,
        status: content.status,
      };

      // Include requested fields if specified
      if (fields && fields.length > 0) {
        result.data = {};
        for (const field of fields) {
          if (field in data) {
            result.data[field] = data[field];
          }
        }
      }

      return result;
    });

    // Create a map of resolved references
    const resolvedMap = new Map(resolved.map((r) => [r._ref, r]));

    // Return in the same order as requested, including nulls for unresolved
    const orderedResolved = references.map((ref) => {
      const resolved = resolvedMap.get(ref._ref);
      if (!resolved) {
        return {
          _ref: ref._ref,
          _type: ref._contentType || 'unknown',
          id: ref._ref,
          resolved: false,
        };
      }
      return {
        ...resolved,
        resolved: true,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        resolved: orderedResolved,
        total: orderedResolved.length,
        found: resolved.length,
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

    console.error('Resolve references error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to resolve references',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Extract title from content data
 */
function getTitle(data: Record<string, unknown>): string | undefined {
  // Try common title fields
  const titleFields = ['title', 'name', 'headline', 'subject'];
  for (const field of titleFields) {
    if (field in data && typeof data[field] === 'string') {
      return data[field] as string;
    }
  }
  return undefined;
}
