/**
 * HOOPERITS CMS CLI - Generate Command
 * Generate TypeScript types from schemas
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function generate() {
  console.log(chalk.bold('\n📝 Generating TypeScript types\n'));

  const spinner = ora();
  const cwd = process.cwd();

  try {
    spinner.start('Loading schemas...');

    // Try to import schemas
    const cmsIndexPath = path.join(cwd, 'cms', 'index.ts');

    try {
      await fs.access(cmsIndexPath);
    } catch {
      throw new Error('CMS schemas not found. Run "hooperits-cms init" first.');
    }

    // Read schema files
    const schemasDir = path.join(cwd, 'cms', 'schemas');
    const schemaFiles = await fs.readdir(schemasDir);

    spinner.succeed(`Found ${schemaFiles.length} schema file(s)`);

    // Generate types
    spinner.start('Generating types...');

    const types: string[] = [
      '/**',
      ' * HOOPERITS CMS - Generated Types',
      ' * This file is auto-generated. Do not edit manually.',
      ' * Run "npm run cms:generate" to regenerate.',
      ' */',
      '',
      'import type { Content } from "@hooperits/client";',
      '',
    ];

    // Parse each schema file to extract type information
    // This is a simplified version - full implementation would use TypeScript compiler API
    for (const file of schemaFiles) {
      if (!file.endsWith('.ts')) continue;

      const content = await fs.readFile(path.join(schemasDir, file), 'utf-8');

      // Extract schema name from defineSchema call
      const nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);
      const name = nameMatch?.[1];

      if (name) {
        const typeName = name
          .split('-')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join('');

        // Extract fields (simplified parsing)
        const fieldsMatch = content.match(/fields:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
        if (fieldsMatch) {
          types.push(`// ${typeName} content type`);
          types.push(`export interface ${typeName}Data {`);

          // Parse field definitions
          const fields = fieldsMatch[1];
          const fieldLines = fields.split(',\n').filter((l) => l.trim());

          for (const line of fieldLines) {
            const fieldNameMatch = line.match(/^\s*(\w+):/);
            const typeMatch = line.match(/fields\.(\w+)\(/);

            if (fieldNameMatch && typeMatch) {
              const fieldName = fieldNameMatch[1];
              const fieldType = typeMatch[1];

              let tsType = 'unknown';
              switch (fieldType) {
                case 'text':
                case 'richText':
                case 'slug':
                  tsType = 'string';
                  break;
                case 'number':
                  tsType = 'number';
                  break;
                case 'boolean':
                  tsType = 'boolean';
                  break;
                case 'date':
                case 'datetime':
                  tsType = 'string';
                  break;
                case 'image':
                case 'file':
                  tsType = 'string'; // Media ID
                  break;
                case 'reference':
                  tsType = 'string'; // Content ID
                  break;
                case 'array':
                  tsType = 'unknown[]';
                  break;
                case 'select':
                  tsType = 'string';
                  break;
              }

              // Check if required
              const isRequired = line.includes('required: true');
              types.push(`  ${fieldName}${isRequired ? '' : '?'}: ${tsType};`);
            }
          }

          types.push('}');
          types.push('');
          types.push(`export type ${typeName} = Content<${typeName}Data>;`);
          types.push('');
        }
      }
    }

    // Write types file
    const typesPath = path.join(cwd, 'cms', 'types.ts');
    await fs.writeFile(typesPath, types.join('\n'));

    spinner.succeed('Types generated');

    console.log(chalk.green(`\n✅ Types generated at ${typesPath}\n`));

  } catch (error) {
    spinner.fail('Generation failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
