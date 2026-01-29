#!/usr/bin/env node
/**
 * HOOPERITS CMS CLI
 * Command line interface for CMS management
 */

import { program } from 'commander';
import { init } from './commands/init';
import { migrate } from './commands/migrate';
import { generate } from './commands/generate';
import { createAdmin } from './commands/create-admin';

program
  .name('hooperits-cms')
  .description('HOOPERITS CMS - Schema-driven headless CMS for Next.js')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize CMS in a new or existing Next.js project')
  .action(init);

program
  .command('migrate')
  .description('Run database migrations')
  .option('--deploy', 'Run migrations in production mode')
  .action(migrate);

program
  .command('generate')
  .description('Generate TypeScript types from schemas')
  .action(generate);

program
  .command('create-admin')
  .description('Create the first admin user')
  .action(createAdmin);

program.parse();
