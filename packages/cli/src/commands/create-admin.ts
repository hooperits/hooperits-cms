/**
 * HOOPERITS CMS CLI - Create Admin Command
 * Create the first admin user
 */

import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

export async function createAdmin() {
  console.log(chalk.bold('\n👤 Create Admin User\n'));

  const spinner = ora();

  try {
    // Prompt for user details
    const response = await prompts([
      {
        type: 'text',
        name: 'email',
        message: 'Email address:',
        validate: (value) => {
          if (!value.includes('@')) return 'Please enter a valid email';
          return true;
        },
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password (min 8 characters):',
        validate: (value) => {
          if (value.length < 8) return 'Password must be at least 8 characters';
          if (!/\d/.test(value)) return 'Password must contain at least one number';
          return true;
        },
      },
      {
        type: 'text',
        name: 'name',
        message: 'Display name:',
        validate: (value) => {
          if (value.length < 2) return 'Name must be at least 2 characters';
          return true;
        },
      },
    ]);

    // Check if user cancelled
    if (!response.email || !response.password || !response.name) {
      console.log(chalk.yellow('\nOperation cancelled.'));
      return;
    }

    spinner.start('Creating admin user...');

    // Connect to database
    const prisma = new PrismaClient();

    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: response.email.toLowerCase() },
      });

      if (existing) {
        spinner.fail('A user with this email already exists');
        return;
      }

      // Check if this is the first user
      const userCount = await prisma.user.count();

      if (userCount > 0) {
        const confirm = await prompts({
          type: 'confirm',
          name: 'value',
          message: 'Users already exist. Create new admin anyway?',
          initial: false,
        });

        if (!confirm.value) {
          console.log(chalk.yellow('\nOperation cancelled.'));
          return;
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(response.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: response.email.toLowerCase(),
          password: hashedPassword,
          name: response.name,
          role: 'ADMIN',
        },
      });

      spinner.succeed('Admin user created');

      console.log(chalk.green('\n✅ Admin user created successfully!\n'));
      console.log(`  Email: ${chalk.cyan(user.email)}`);
      console.log(`  Name: ${chalk.cyan(user.name)}`);
      console.log(`  Role: ${chalk.cyan('ADMIN')}`);
      console.log('\nYou can now sign in at /admin');
      console.log('');

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    spinner.fail('Failed to create user');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
