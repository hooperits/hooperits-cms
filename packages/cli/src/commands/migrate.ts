/**
 * HOOPERITS CMS CLI - Migrate Command
 * Run database migrations
 */

import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

interface MigrateOptions {
  deploy?: boolean;
}

export async function migrate(options: MigrateOptions) {
  console.log(chalk.bold('\n🗃️  Running database migrations\n'));

  const spinner = ora();

  try {
    spinner.start('Running Prisma migrations...');

    const command = options.deploy
      ? 'npx prisma migrate deploy'
      : 'npx prisma migrate dev';

    execSync(command, { stdio: 'inherit' });

    spinner.succeed('Migrations completed');

    // Generate Prisma client
    spinner.start('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'pipe' });
    spinner.succeed('Prisma client generated');

    console.log(chalk.green('\n✅ Database migrations completed!\n'));

  } catch (error) {
    spinner.fail('Migration failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
