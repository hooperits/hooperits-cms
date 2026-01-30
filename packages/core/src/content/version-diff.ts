/**
 * HOOPERITS CMS - Version Diff
 * Generate diffs between document versions
 */

import { diff as deepDiff, Diff } from 'deep-diff';
import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();

/**
 * Types for diff output
 */
export type DiffKind = 'N' | 'D' | 'E' | 'A';

export interface TextDiffSegment {
  type: 'unchanged' | 'added' | 'removed';
  text: string;
}

export interface DiffChange {
  kind: DiffKind;
  path: string[];
  lhs?: unknown;
  rhs?: unknown;
  index?: number;
  item?: DiffChange;
  textDiff?: TextDiffSegment[];
}

export interface DiffSummary {
  added: number;
  removed: number;
  modified: number;
}

export interface VersionDiff {
  changes: DiffChange[];
  summary: DiffSummary;
}

/**
 * Check if a value is a string that might benefit from text diff
 */
function isLongText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 50;
}

/**
 * Generate character-level diff for text strings
 */
export function generateTextDiff(oldText: string, newText: string): TextDiffSegment[] {
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  return diffs.map(([operation, text]) => {
    let type: 'unchanged' | 'added' | 'removed';
    switch (operation) {
      case 0:
        type = 'unchanged';
        break;
      case 1:
        type = 'added';
        break;
      case -1:
        type = 'removed';
        break;
      default:
        type = 'unchanged';
    }
    return { type, text };
  });
}

/**
 * Convert deep-diff result to our DiffChange format
 */
function convertDiffToChange(d: Diff<unknown, unknown>): DiffChange {
  const change: DiffChange = {
    kind: d.kind as DiffKind,
    path: d.path?.map(String) ?? [],
  };

  if ('lhs' in d) {
    change.lhs = d.lhs;
  }
  if ('rhs' in d) {
    change.rhs = d.rhs;
  }
  if ('index' in d) {
    change.index = d.index;
  }
  if ('item' in d && d.item) {
    change.item = convertDiffToChange(d.item);
  }

  // Add text diff for long text fields that were edited
  if (d.kind === 'E' && isLongText(d.lhs) && isLongText(d.rhs)) {
    change.textDiff = generateTextDiff(d.lhs, d.rhs);
  }

  return change;
}

/**
 * Generate diff between two JSON objects
 */
export function generateDiff(
  lhs: Record<string, unknown>,
  rhs: Record<string, unknown>
): VersionDiff {
  const differences = deepDiff(lhs, rhs) ?? [];

  const changes: DiffChange[] = differences.map(convertDiffToChange);

  // Calculate summary
  const summary: DiffSummary = {
    added: 0,
    removed: 0,
    modified: 0,
  };

  for (const d of differences) {
    switch (d.kind) {
      case 'N':
        summary.added++;
        break;
      case 'D':
        summary.removed++;
        break;
      case 'E':
        summary.modified++;
        break;
      case 'A':
        // Array changes - count based on item operation
        if (d.item?.kind === 'N') {
          summary.added++;
        } else if (d.item?.kind === 'D') {
          summary.removed++;
        } else {
          summary.modified++;
        }
        break;
    }
  }

  return { changes, summary };
}

/**
 * Format diff for UI display
 * Groups changes by top-level field for easier visualization
 */
export interface FieldDiff {
  field: string;
  changes: DiffChange[];
  hasTextDiff: boolean;
}

export function formatDiffForUI(diff: VersionDiff): FieldDiff[] {
  const fieldMap = new Map<string, DiffChange[]>();

  for (const change of diff.changes) {
    const field = change.path[0] ?? '_root';
    const existing = fieldMap.get(field) ?? [];
    existing.push(change);
    fieldMap.set(field, existing);
  }

  return Array.from(fieldMap.entries()).map(([field, changes]) => ({
    field,
    changes,
    hasTextDiff: changes.some((c) => c.textDiff !== undefined),
  }));
}

/**
 * Create a human-readable summary of changes
 */
export function createChangeSummary(diff: VersionDiff): string {
  const parts: string[] = [];

  if (diff.summary.added > 0) {
    parts.push(`+${diff.summary.added} added`);
  }
  if (diff.summary.removed > 0) {
    parts.push(`-${diff.summary.removed} removed`);
  }
  if (diff.summary.modified > 0) {
    parts.push(`~${diff.summary.modified} modified`);
  }

  if (parts.length === 0) {
    return 'No changes';
  }

  return parts.join(', ');
}
