/**
 * HOOPERITS CMS - HQL Transform Utilities
 * Shared transformation functions for HQL execution
 */

/**
 * Transform a database content record to HQL format
 * Converts internal field names to GROQ-style underscore-prefixed names
 */
export function transformContentToHQL(
  content: Record<string, unknown>
): Record<string, unknown> {
  const type = content.type as Record<string, unknown> | undefined;

  return {
    _id: content.id,
    _type: type?.name,
    ...(content.data as Record<string, unknown>),
    _createdAt: content.createdAt,
    _updatedAt: content.updatedAt,
  };
}
