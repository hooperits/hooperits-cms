/**
 * HOOPERITS CMS - Portable Text Validation
 *
 * Validation utilities for Portable Text content structure and schema compliance.
 */

import type {
  PortableTextContent,
  PortableTextBlock,
  PortableTextTextBlock,
  PortableTextSpan,
  PortableTextChild,
  PortableTextMarkDef,
} from './types';
import { isTextBlock, isSpan } from './types';
import type { PortableTextFieldOptions } from '../schema/types';
import { DECORATORS } from './schema';

// =============================================================================
// Validation Result Types
// =============================================================================

export interface ValidationError {
  /** Block key where error occurred */
  blockKey?: string;
  /** Path to the error within the block */
  path: string;
  /** Error message */
  message: string;
  /** Severity level */
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  /** Whether content is valid */
  valid: boolean;
  /** List of validation errors */
  errors: ValidationError[];
}

// =============================================================================
// Structure Validation (T018)
// =============================================================================

/**
 * Validate a single block's structure
 */
export function validateBlock(
  block: PortableTextBlock,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `blocks[${index}]`;

  // Check required fields
  if (!block._key || typeof block._key !== 'string') {
    errors.push({
      blockKey: block._key,
      path: `${path}._key`,
      message: 'Block must have a valid _key string',
      severity: 'error',
    });
  }

  if (!block._type || typeof block._type !== 'string') {
    errors.push({
      blockKey: block._key,
      path: `${path}._type`,
      message: 'Block must have a valid _type string',
      severity: 'error',
    });
  }

  // Validate text blocks specifically
  if (isTextBlock(block)) {
    errors.push(...validateTextBlock(block, path));
  }

  return errors;
}

/**
 * Validate a text block's structure
 */
function validateTextBlock(
  block: PortableTextTextBlock,
  path: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check children array exists
  if (!Array.isArray(block.children)) {
    errors.push({
      blockKey: block._key,
      path: `${path}.children`,
      message: 'Text block must have a children array',
      severity: 'error',
    });
    return errors;
  }

  // Validate each child
  block.children.forEach((child, childIndex) => {
    errors.push(...validateChild(child, `${path}.children[${childIndex}]`, block._key));
  });

  // Validate markDefs if present
  if (block.markDefs) {
    if (!Array.isArray(block.markDefs)) {
      errors.push({
        blockKey: block._key,
        path: `${path}.markDefs`,
        message: 'markDefs must be an array',
        severity: 'error',
      });
    } else {
      block.markDefs.forEach((markDef, markIndex) => {
        errors.push(...validateMarkDef(markDef, `${path}.markDefs[${markIndex}]`, block._key));
      });

      // Check for mark references that don't exist in markDefs
      const markDefKeys = new Set(block.markDefs.map((m) => m._key));
      block.children.forEach((child, childIndex) => {
        if (isSpan(child)) {
          child.marks?.forEach((mark) => {
            // Skip built-in decorators
            if (!DECORATORS.includes(mark as typeof DECORATORS[number])) {
              if (!markDefKeys.has(mark)) {
                errors.push({
                  blockKey: block._key,
                  path: `${path}.children[${childIndex}].marks`,
                  message: `Mark "${mark}" references non-existent markDef`,
                  severity: 'error',
                });
              }
            }
          });
        }
      });
    }
  }

  return errors;
}

/**
 * Validate a span's structure
 */
export function validateSpan(
  span: PortableTextSpan,
  path: string,
  blockKey: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!span._key || typeof span._key !== 'string') {
    errors.push({
      blockKey,
      path: `${path}._key`,
      message: 'Span must have a valid _key string',
      severity: 'error',
    });
  }

  if (span._type !== 'span') {
    errors.push({
      blockKey,
      path: `${path}._type`,
      message: 'Span must have _type "span"',
      severity: 'error',
    });
  }

  if (typeof span.text !== 'string') {
    errors.push({
      blockKey,
      path: `${path}.text`,
      message: 'Span must have a text string',
      severity: 'error',
    });
  }

  if (span.marks && !Array.isArray(span.marks)) {
    errors.push({
      blockKey,
      path: `${path}.marks`,
      message: 'Span marks must be an array',
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Validate a child (span or inline object)
 */
function validateChild(
  child: PortableTextChild,
  path: string,
  blockKey: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!child._key || typeof child._key !== 'string') {
    errors.push({
      blockKey,
      path: `${path}._key`,
      message: 'Child must have a valid _key string',
      severity: 'error',
    });
  }

  if (!child._type || typeof child._type !== 'string') {
    errors.push({
      blockKey,
      path: `${path}._type`,
      message: 'Child must have a valid _type string',
      severity: 'error',
    });
  }

  if (isSpan(child)) {
    errors.push(...validateSpan(child, path, blockKey));
  }

  return errors;
}

/**
 * Validate mark definitions
 */
export function validateMarkDefs(
  markDef: PortableTextMarkDef,
  path: string,
  blockKey: string
): ValidationError[] {
  return validateMarkDef(markDef, path, blockKey);
}

function validateMarkDef(
  markDef: PortableTextMarkDef,
  path: string,
  blockKey: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!markDef._key || typeof markDef._key !== 'string') {
    errors.push({
      blockKey,
      path: `${path}._key`,
      message: 'MarkDef must have a valid _key string',
      severity: 'error',
    });
  }

  if (!markDef._type || typeof markDef._type !== 'string') {
    errors.push({
      blockKey,
      path: `${path}._type`,
      message: 'MarkDef must have a valid _type string',
      severity: 'error',
    });
  }

  // Validate link markDefs specifically
  if (markDef._type === 'link') {
    const linkMark = markDef as { href?: string };
    if (!linkMark.href || typeof linkMark.href !== 'string') {
      errors.push({
        blockKey,
        path: `${path}.href`,
        message: 'Link must have a valid href string',
        severity: 'error',
      });
    } else {
      // Security check: disallow javascript: and data: URLs
      const href = linkMark.href.toLowerCase().trim();
      if (href.startsWith('javascript:') || href.startsWith('data:')) {
        errors.push({
          blockKey,
          path: `${path}.href`,
          message: 'Link href contains potentially unsafe protocol',
          severity: 'error',
        });
      }
    }
  }

  return errors;
}

// =============================================================================
// Schema-based Validation (T019)
// =============================================================================

/**
 * Validate content against schema configuration
 */
export function validateAgainstSchema(
  content: PortableTextContent,
  options: PortableTextFieldOptions
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if content is an array
  if (!Array.isArray(content)) {
    return {
      valid: false,
      errors: [
        {
          path: '',
          message: 'Content must be an array of blocks',
          severity: 'error',
        },
      ],
    };
  }

  // Check block count constraints
  if (options.minBlocks && content.length < options.minBlocks) {
    errors.push({
      path: '',
      message: `Content must have at least ${options.minBlocks} blocks`,
      severity: 'error',
    });
  }

  if (options.maxBlocks && content.length > options.maxBlocks) {
    errors.push({
      path: '',
      message: `Content cannot have more than ${options.maxBlocks} blocks`,
      severity: 'error',
    });
  }

  // Validate each block
  content.forEach((block, index) => {
    // Basic structure validation
    errors.push(...validateBlock(block, index));

    // Schema-specific validation
    if (isTextBlock(block)) {
      // Validate style is allowed
      if (options.styles && !options.styles.includes(block.style)) {
        errors.push({
          blockKey: block._key,
          path: `blocks[${index}].style`,
          message: `Block style "${block.style}" is not allowed`,
          severity: 'error',
        });
      }

      // Validate list type is allowed
      if (block.listItem && options.lists && !options.lists.includes(block.listItem)) {
        errors.push({
          blockKey: block._key,
          path: `blocks[${index}].listItem`,
          message: `List type "${block.listItem}" is not allowed`,
          severity: 'error',
        });
      }

      // Validate decorators
      if (options.decorators) {
        block.children.forEach((child, childIndex) => {
          if (isSpan(child)) {
            child.marks?.forEach((mark) => {
              // Check if it's a decorator (not a markDef reference)
              if (DECORATORS.includes(mark as typeof DECORATORS[number])) {
                if (!options.decorators!.includes(mark as typeof options.decorators extends (infer T)[] ? T : never)) {
                  errors.push({
                    blockKey: block._key,
                    path: `blocks[${index}].children[${childIndex}].marks`,
                    message: `Decorator "${mark}" is not allowed`,
                    severity: 'error',
                  });
                }
              }
            });
          }
        });
      }

      // Validate annotation types
      if (block.markDefs && options.annotations) {
        const allowedAnnotationTypes = new Set(options.annotations.map((a) => a.type));
        block.markDefs.forEach((markDef, markIndex) => {
          if (!allowedAnnotationTypes.has(markDef._type)) {
            errors.push({
              blockKey: block._key,
              path: `blocks[${index}].markDefs[${markIndex}]`,
              message: `Annotation type "${markDef._type}" is not allowed`,
              severity: 'error',
            });
          }
        });
      }
    } else {
      // Custom block validation
      errors.push(...validateCustomBlock(block, index, options));
    }
  });

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Validate a custom block against schema
 */
export function validateCustomBlock(
  block: PortableTextBlock,
  index: number,
  options: PortableTextFieldOptions
): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `blocks[${index}]`;

  // Check if block type is allowed
  const allowedBlockTypes = new Set([
    'block', // Text blocks are always allowed
    'image',
    'codeBlock',
    'video',
    'quote',
    ...(options.blocks?.map((b) => b.type) || []),
  ]);

  if (!allowedBlockTypes.has(block._type)) {
    errors.push({
      blockKey: block._key,
      path: `${path}._type`,
      message: `Block type "${block._type}" is not allowed`,
      severity: 'error',
    });
  }

  // If it's a custom block, validate required fields
  const customBlockConfig = options.blocks?.find((b) => b.type === block._type);
  if (customBlockConfig) {
    Object.entries(customBlockConfig.fields).forEach(([fieldName, fieldDef]) => {
      if (fieldDef.options.required && !(fieldName in block)) {
        errors.push({
          blockKey: block._key,
          path: `${path}.${fieldName}`,
          message: `Required field "${fieldName}" is missing`,
          severity: 'error',
        });
      }
    });
  }

  return errors;
}

/**
 * Validate annotation fields against schema
 */
export function validateAnnotation(
  markDef: PortableTextMarkDef,
  path: string,
  blockKey: string,
  options: PortableTextFieldOptions
): ValidationError[] {
  const errors: ValidationError[] = [];

  const annotationConfig = options.annotations?.find((a) => a.type === markDef._type);
  if (!annotationConfig) {
    // Annotation type not found in schema, already handled elsewhere
    return errors;
  }

  // Validate required fields
  Object.entries(annotationConfig.fields).forEach(([fieldName, fieldDef]) => {
    if (fieldDef.options.required && !(fieldName in markDef)) {
      errors.push({
        blockKey,
        path: `${path}.${fieldName}`,
        message: `Required annotation field "${fieldName}" is missing`,
        severity: 'error',
      });
    }
  });

  return errors;
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Validate Portable Text content (structure only)
 */
export function validatePortableText(content: PortableTextContent): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Array.isArray(content)) {
    return {
      valid: false,
      errors: [
        {
          path: '',
          message: 'Content must be an array of blocks',
          severity: 'error',
        },
      ],
    };
  }

  content.forEach((block, index) => {
    errors.push(...validateBlock(block, index));
  });

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Check if content is empty (no blocks or only empty text blocks)
 */
export function isEmptyContent(content: PortableTextContent): boolean {
  if (!Array.isArray(content) || content.length === 0) {
    return true;
  }

  return content.every((block) => {
    if (!isTextBlock(block)) {
      return false; // Custom blocks count as content
    }
    // Check if all children have empty text
    return block.children.every((child) => {
      if (!isSpan(child)) {
        return false; // Inline objects count as content
      }
      return child.text.trim() === '';
    });
  });
}
