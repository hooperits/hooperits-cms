/**
 * HOOPERITS CMS - Annotation Utilities
 *
 * Utilities for handling overlapping annotations and annotation management.
 */

import type { Editor } from '@tiptap/core';
import type { Mark, MarkType } from '@tiptap/pm/model';

export interface AnnotationRange {
  type: string;
  key: string;
  from: number;
  to: number;
  attrs: Record<string, unknown>;
}

export interface AnnotationGroup {
  position: { from: number; to: number };
  annotations: AnnotationRange[];
}

/**
 * Get all annotations in the document
 */
export function getAllAnnotations(editor: Editor): AnnotationRange[] {
  const annotations: AnnotationRange[] = [];
  const { doc } = editor.state;

  doc.descendants((node, pos) => {
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.attrs._key) {
          annotations.push({
            type: mark.type.name,
            key: mark.attrs._key,
            from: pos,
            to: pos + node.nodeSize,
            attrs: mark.attrs,
          });
        }
      }
    }
  });

  return annotations;
}

/**
 * Get annotations at a specific position
 */
export function getAnnotationsAtPos(
  editor: Editor,
  pos: number
): AnnotationRange[] {
  const allAnnotations = getAllAnnotations(editor);
  return allAnnotations.filter((a) => a.from <= pos && a.to >= pos);
}

/**
 * Find overlapping annotation groups
 * Returns groups where multiple annotations overlap
 */
export function findOverlappingAnnotations(
  editor: Editor
): AnnotationGroup[] {
  const annotations = getAllAnnotations(editor);
  const groups: AnnotationGroup[] = [];

  // Sort annotations by start position
  const sorted = [...annotations].sort((a, b) => a.from - b.from);

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const overlapping: AnnotationRange[] = [current];

    // Find all annotations that overlap with current
    for (let j = i + 1; j < sorted.length; j++) {
      const other = sorted[j];

      // Check if they overlap
      if (other.from < current.to) {
        overlapping.push(other);
      } else {
        break;
      }
    }

    // If there are overlapping annotations, create a group
    if (overlapping.length > 1) {
      // Calculate the overlapping region
      const from = Math.max(...overlapping.map((a) => a.from));
      const to = Math.min(...overlapping.map((a) => a.to));

      if (from < to) {
        // Check if this group already exists
        const exists = groups.some(
          (g) =>
            g.position.from === from &&
            g.position.to === to &&
            g.annotations.length === overlapping.length
        );

        if (!exists) {
          groups.push({
            position: { from, to },
            annotations: overlapping,
          });
        }
      }
    }
  }

  return groups;
}

/**
 * Get annotation marks from selection
 */
export function getAnnotationMarksFromSelection(
  editor: Editor
): Map<string, Mark> {
  const marks = new Map<string, Mark>();
  const { state } = editor;
  const { from, to } = state.selection;

  state.doc.nodesBetween(from, to, (node) => {
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.attrs._key) {
          marks.set(mark.attrs._key, mark);
        }
      }
    }
  });

  return marks;
}

/**
 * Remove annotation by key
 */
export function removeAnnotationByKey(editor: Editor, key: string): boolean {
  const { state } = editor;
  const { doc, tr } = state;
  let found = false;

  doc.descendants((node, pos) => {
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.attrs._key === key) {
          tr.removeMark(pos, pos + node.nodeSize, mark.type);
          found = true;
        }
      }
    }
  });

  if (found) {
    editor.view.dispatch(tr);
  }

  return found;
}

/**
 * Update annotation attributes by key
 */
export function updateAnnotationByKey(
  editor: Editor,
  key: string,
  attrs: Record<string, unknown>
): boolean {
  const { state } = editor;
  const { doc } = state;
  const foundMarks: { mark: Mark; from: number; to: number }[] = [];

  // Find all positions with this annotation
  doc.descendants((node, pos) => {
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.attrs._key === key) {
          foundMarks.push({
            mark,
            from: pos,
            to: pos + node.nodeSize,
          });
        }
      }
    }
  });

  if (foundMarks.length === 0) {
    return false;
  }

  // Update the marks
  const { tr } = state;
  const firstMark = foundMarks[0].mark;
  const newAttrs = { ...firstMark.attrs, ...attrs };

  for (const { mark, from, to } of foundMarks) {
    tr.removeMark(from, to, mark.type);
    tr.addMark(from, to, mark.type.create(newAttrs));
  }

  editor.view.dispatch(tr);
  return true;
}

/**
 * Get annotation statistics for the document
 */
export function getAnnotationStats(editor: Editor): {
  total: number;
  byType: Record<string, number>;
  overlapping: number;
} {
  const annotations = getAllAnnotations(editor);
  const overlappingGroups = findOverlappingAnnotations(editor);

  const byType: Record<string, number> = {};
  for (const annotation of annotations) {
    byType[annotation.type] = (byType[annotation.type] || 0) + 1;
  }

  return {
    total: annotations.length,
    byType,
    overlapping: overlappingGroups.length,
  };
}

/**
 * Resolve annotation by key (for comments)
 */
export function resolveAnnotation(editor: Editor, key: string): boolean {
  return updateAnnotationByKey(editor, key, { resolved: true });
}

/**
 * Unresolve annotation by key (for comments)
 */
export function unresolveAnnotation(editor: Editor, key: string): boolean {
  return updateAnnotationByKey(editor, key, { resolved: false });
}

/**
 * Calculate annotation rendering order based on priority
 * Annotations with higher priority are rendered on top (innermost)
 */
export function getAnnotationRenderOrder(types: string[]): string[] {
  const priorities: Record<string, number> = {
    // Comments should be innermost (highest priority)
    comment: 100,
    // Links next
    internalLink: 80,
    // Highlights are outermost (lowest priority)
    highlight: 60,
  };

  return [...types].sort((a, b) => {
    const priorityA = priorities[a] ?? 50;
    const priorityB = priorities[b] ?? 50;
    return priorityB - priorityA;
  });
}

/**
 * Generate CSS classes for overlapping annotations
 */
export function getOverlappingAnnotationClasses(
  annotations: AnnotationRange[]
): string {
  if (annotations.length === 0) return '';
  if (annotations.length === 1) return `annotation-${annotations[0].type}`;

  const classes = ['annotation-overlap'];

  for (const annotation of annotations) {
    classes.push(`has-${annotation.type}`);
  }

  return classes.join(' ');
}
