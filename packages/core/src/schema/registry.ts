/**
 * HOOPERITS CMS - Schema Registry
 * Global registry for content type schemas
 */

import type { SchemaDefinition } from './types';

class SchemaRegistry {
  private schemas: Map<string, SchemaDefinition> = new Map();

  /**
   * Register a single schema
   */
  register(schema: SchemaDefinition): void {
    if (this.schemas.has(schema.name)) {
      throw new Error(`Schema '${schema.name}' is already registered.`);
    }
    this.schemas.set(schema.name, schema);
  }

  /**
   * Register multiple schemas
   */
  registerAll(schemas: SchemaDefinition[]): void {
    for (const schema of schemas) {
      this.register(schema);
    }
  }

  /**
   * Get a schema by name
   */
  get(name: string): SchemaDefinition | undefined {
    return this.schemas.get(name);
  }

  /**
   * Get all registered schemas
   */
  getAll(): SchemaDefinition[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Check if a schema exists
   */
  has(name: string): boolean {
    return this.schemas.has(name);
  }

  /**
   * Get all schema names
   */
  getNames(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Clear all registered schemas (mainly for testing)
   */
  clear(): void {
    this.schemas.clear();
  }

  /**
   * Get schema count
   */
  get size(): number {
    return this.schemas.size;
  }
}

// Global singleton instance
const globalRegistry = new SchemaRegistry();

/**
 * Register schemas to the global registry
 */
export function registerSchemas(schemas: SchemaDefinition[]): SchemaDefinition[] {
  globalRegistry.registerAll(schemas);
  return schemas;
}

/**
 * Get the global schema registry
 */
export function getSchemaRegistry(): SchemaRegistry {
  return globalRegistry;
}

/**
 * Get a schema from the global registry
 */
export function getSchema(name: string): SchemaDefinition | undefined {
  return globalRegistry.get(name);
}

/**
 * Get all schemas from the global registry
 */
export function getAllSchemas(): SchemaDefinition[] {
  return globalRegistry.getAll();
}

/**
 * Clear the global registry (for testing)
 */
export function clearSchemaRegistry(): void {
  globalRegistry.clear();
}

export { SchemaRegistry };
