/**
 * HOOPERITS CMS - Schema Sync Service
 * Synchronize schema definitions with database ContentType records
 */

import { Prisma } from '@prisma/client';
import { db } from '../db';
import { logger } from '../logger';
import type { SchemaDefinition } from './types';
import { getAllSchemas } from './registry';

export interface SyncResult {
  created: string[];
  updated: string[];
  unchanged: string[];
  orphaned: string[];
}

/**
 * Sync all registered schemas to the database
 */
export async function syncSchemas(schemas?: SchemaDefinition[]): Promise<SyncResult> {
  const schemasToSync = schemas ?? getAllSchemas();

  const result: SyncResult = {
    created: [],
    updated: [],
    unchanged: [],
    orphaned: [],
  };

  // Get existing content types from database
  const existingTypes = await db.contentType.findMany();
  const existingByName = new Map(existingTypes.map((t) => [t.name, t]));

  // Sync each schema
  for (const schema of schemasToSync) {
    const existing = existingByName.get(schema.name);

    if (!existing) {
      // Create new content type
      await db.contentType.create({
        data: {
          name: schema.name,
          label: schema.label,
          labelPlural: schema.labelPlural,
          schema: { fields: schema.fields } as unknown as Prisma.InputJsonValue,
          icon: schema.icon ?? null,
        },
      });
      result.created.push(schema.name);
      logger.info(`Created content type: ${schema.name}`);
    } else {
      // Check if schema changed
      const schemaChanged =
        existing.label !== schema.label ||
        existing.labelPlural !== schema.labelPlural ||
        existing.icon !== (schema.icon ?? null) ||
        JSON.stringify(existing.schema) !== JSON.stringify({ fields: schema.fields });

      if (schemaChanged) {
        await db.contentType.update({
          where: { id: existing.id },
          data: {
            label: schema.label,
            labelPlural: schema.labelPlural,
            schema: { fields: schema.fields } as unknown as Prisma.InputJsonValue,
            icon: schema.icon ?? null,
          },
        });
        result.updated.push(schema.name);
        logger.info(`Updated content type: ${schema.name}`);
      } else {
        result.unchanged.push(schema.name);
      }

      existingByName.delete(schema.name);
    }
  }

  // Remaining types in existingByName are orphaned (in DB but not in code)
  result.orphaned = Array.from(existingByName.keys());
  if (result.orphaned.length > 0) {
    logger.warn(`Orphaned content types found: ${result.orphaned.join(', ')}`);
  }

  return result;
}

/**
 * Get a content type by name from database
 */
export async function getContentType(name: string) {
  return db.contentType.findUnique({
    where: { name },
  });
}

/**
 * Get all content types from database
 */
export async function getAllContentTypes() {
  return db.contentType.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * Delete orphaned content types (use with caution!)
 * This will also delete all content of those types
 */
export async function deleteOrphanedTypes(typeNames: string[]): Promise<number> {
  let deleted = 0;

  for (const name of typeNames) {
    const contentType = await db.contentType.findUnique({
      where: { name },
    });

    if (contentType) {
      // Delete all content of this type first
      await db.content.deleteMany({
        where: { typeId: contentType.id },
      });

      // Delete the content type
      await db.contentType.delete({
        where: { id: contentType.id },
      });

      deleted++;
      logger.info(`Deleted orphaned content type: ${name}`);
    }
  }

  return deleted;
}
